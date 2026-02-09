import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { BackendConfig } from './types';
import Cookies from 'js-cookie';

export class ApiClientError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public error?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export class Backend {
  protected client: AxiosInstance;
  protected onAuthError?: () => void;
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

  constructor(config: BackendConfig = {}) {
    const baseURL = `${process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_API_URL : 'http://localhost:4000'}/api`;
    
    this.onAuthError = config.onAuthError;

    // Create axios instance
    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, // Enable credentials for CORS
    });
        // Request interceptor: Read tokens from cookies and add to Authorization header
    this.client.interceptors.request.use(
      (request: InternalAxiosRequestConfig) => {
        console.log('Request made to:', request.url);
        const accessToken = Cookies.get('accessToken');
        const refreshToken = Cookies.get('refreshToken');

        // Determine which token to use based on endpoint
        if (request.url?.includes('/auth/refresh')) {
          // Refresh endpoint: use refresh token
          if (refreshToken) {
            request.headers.set('Authorization', `Bearer ${refreshToken}`);
          }
        } else if (request.url?.includes('/auth/login') || 
                   request.url?.includes('/auth/register') || 
                   request.url?.includes('/auth/otp')) {
          // Public auth endpoints: no token needed
          return request;
        } else {
          // Protected endpoints: use access token
          if (accessToken) {
            request.headers.set('Authorization', `Bearer ${accessToken}`);
          }
        }

        return request;
      }
    );

    // Response interceptor: Auto-refresh token on 401
    this.client.interceptors.response.use(
      (response) => {
        console.log("Response received:", response.status, response.config.url);
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401 && !originalRequest._retry) {
          // Don't retry if refresh endpoint itself failed
          if (originalRequest.url?.includes("/auth/refresh")) {
            if (this.onAuthError) {
              this.onAuthError();
            }
            throw new ApiClientError(
              401,
              "Session expired. Please login again.",
              "REFRESH_TOKEN_EXPIRED",
            );
          }

          // Mark request as retried to prevent infinite loops
          originalRequest._retry = true;

          try {
            // Use singleton refresh promise to prevent concurrent refresh calls
            if (this.isRefreshing && this.refreshPromise) {
              await this.refreshPromise;
            } else {
              this.isRefreshing = true;
              this.refreshPromise = this.refreshAccessToken();
              await this.refreshPromise;
            }

            // Retry original request with new access token
            return this.client(originalRequest);
          } catch (refreshError) {
            if (this.onAuthError) {
              this.onAuthError();
            }
            throw refreshError;
          } finally {
            this.isRefreshing = false;
            this.refreshPromise = null;
          }
        }

        // Transform other errors
        const errorData = error.response?.data as any;
        throw new ApiClientError(
          error.response?.status || 500,
          errorData?.message || error.message,
          errorData?.error,
        );
      },
    );
  }

  /**
   * Refresh access token using refresh token from browser cookies
   * Called automatically by response interceptor on 401 errors
   */
  private async refreshAccessToken(): Promise<void> {
    try {
      // POST to refresh endpoint
      // Request interceptor will read refresh token from cookie and add to Authorization header
      // Backend returns new access token, tRPC layer sets it in cookie
      await this.client.post('/auth/refresh');
    } catch (error) {
      throw new ApiClientError(
        401,
        'Failed to refresh session',
        'REFRESH_FAILED'
      );
    }
  }

  /**
   * Make a GET request
   */
  protected async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    console.log('GET', endpoint, 'response:');
    const response = await this.client.get<T>(endpoint, config);
    return response.data;
  }

  /**
   * Make a POST request
   */
  protected async post<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(endpoint, data, config);
    return response.data;
  }

  /**
   * Make a POST request with FormData (for file uploads)
   */
  protected async postFormData<T>(endpoint: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(endpoint, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
    return response.data;
  }

  /**
   * Make a PATCH request
   */
  protected async patch<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(endpoint, data, config);
    return response.data;
  }

  /**
   * Make a DELETE request
   */
  protected async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(endpoint, config);
    return response.data;
  }
}