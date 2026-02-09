import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { BackendConfig } from './types';

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
    const baseURL = `${config.baseUrl || process.env.API_URL || 'http://staging-api.piofin.ai'}/api`;
    
    this.onAuthError = config.onAuthError;

    // Create axios instance
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Enable sending cookies with requests
    });

    // Response interceptor to handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If error is 401 and we haven't retried yet, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          // Check if this is the refresh endpoint itself failing
          if (originalRequest.url?.includes('/auth/refresh')) {
            // Refresh token is expired or invalid - trigger auth error
            if (this.onAuthError) {
              this.onAuthError();
            }
            throw new ApiClientError(
              401,
              'Session expired. Please login again.',
              'REFRESH_TOKEN_EXPIRED'
            );
          }

          // Mark this request as retried
          originalRequest._retry = true;

          try {
            // If already refreshing, wait for that to complete
            if (this.isRefreshing && this.refreshPromise) {
              await this.refreshPromise;
            } else {
              // Start refresh process
              this.isRefreshing = true;
              this.refreshPromise = this.refreshAccessToken();
              await this.refreshPromise;
            }

            // Retry the original request with the new access token (cookie)
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed - trigger auth error
            if (this.onAuthError) {
              this.onAuthError();
            }
            throw refreshError;
          } finally {
            this.isRefreshing = false;
            this.refreshPromise = null;
          }
        }

        // For other errors or after retry, throw the error
        const errorData = error.response?.data as any;
        throw new ApiClientError(
          error.response?.status || 500,
          errorData?.message || error.message,
          errorData?.error
        );
      }
    );
  }

  /**
   * Refresh the access token using the refresh token cookie
   */
  private async refreshAccessToken(): Promise<void> {
    try {
      // Call the refresh endpoint - it will read refresh token from cookie
      // and set new access token in cookie
      await this.client.post('/auth/refresh');
    } catch (error) {
      // Refresh failed
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