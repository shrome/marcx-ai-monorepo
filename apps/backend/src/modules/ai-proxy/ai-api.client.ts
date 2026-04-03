import {
  Injectable,
  Logger,
  BadGatewayException,
  InternalServerErrorException,
} from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import FormData from 'form-data';

interface AiApiHeaders {
  tenantId?: string;
  userId?: string;
}

@Injectable()
export class AiApiClient {
  private readonly logger = new Logger(AiApiClient.name);
  private readonly http: AxiosInstance;

  constructor() {
    const baseURL = process.env.AI_API_BASE_URL || 'http://localhost:8000';

    this.http = axios.create({
      baseURL,
      timeout: 30_000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.logger.log(`AiApiClient initialised — base URL: ${baseURL}`);
  }

  private buildHeaders(ctx: AiApiHeaders): Record<string, string> {
    const headers: Record<string, string> = {};
    if (ctx.tenantId) headers['x-tenant-id'] = ctx.tenantId;
    if (ctx.userId) headers['x-user-id'] = ctx.userId;
    return headers;
  }

  private handleError(error: unknown, label: string): never {
    if (axios.isAxiosError(error)) {
      const axiosErr = error as AxiosError;
      const status = axiosErr.response?.status;
      const message = (axiosErr.response?.data as any)?.detail
        || (axiosErr.response?.data as any)?.error
        || axiosErr.message;

      this.logger.error(`AI-API [${label}] failed — status ${status}: ${message}`);

      if (status && status >= 400 && status < 500) {
        throw new BadGatewayException(`AI service rejected the request: ${message}`);
      }

      throw new BadGatewayException('AI service is unavailable. Please try again later.');
    }

    this.logger.error(`AI-API [${label}] unexpected error`, error);
    throw new InternalServerErrorException('An unexpected error occurred while contacting the AI service.');
  }

  async get<T>(path: string, ctx: AiApiHeaders, params?: Record<string, unknown>): Promise<T> {
    try {
      const config: AxiosRequestConfig = {
        headers: this.buildHeaders(ctx),
        params,
      };
      const res = await this.http.get<T>(path, config);
      return res.data;
    } catch (error) {
      this.handleError(error, `GET ${path}`);
    }
  }

  async post<T>(path: string, ctx: AiApiHeaders, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const res = await this.http.post<T>(path, body, {
        ...config,
        headers: { ...this.buildHeaders(ctx), ...config?.headers },
      });
      return res.data;
    } catch (error) {
      this.handleError(error, `POST ${path}`);
    }
  }

  async put<T>(path: string, ctx: AiApiHeaders, body?: unknown): Promise<T> {
    try {
      const res = await this.http.put<T>(path, body, {
        headers: this.buildHeaders(ctx),
      });
      return res.data;
    } catch (error) {
      this.handleError(error, `PUT ${path}`);
    }
  }

  async delete<T>(path: string, ctx: AiApiHeaders): Promise<T> {
    try {
      const res = await this.http.delete<T>(path, {
        headers: this.buildHeaders(ctx),
      });
      return res.data;
    } catch (error) {
      this.handleError(error, `DELETE ${path}`);
    }
  }

  async postMultipartBuffer<T>(
    path: string,
    ctx: AiApiHeaders,
    fields: Record<string, string>,
    file: { buffer: Buffer; filename: string; mimeType: string; fieldName?: string },
  ): Promise<T> {
    try {
      const form = new FormData();
      Object.entries(fields).forEach(([k, v]) => form.append(k, v));
      form.append(file.fieldName ?? 'file', file.buffer, {
        filename: file.filename,
        contentType: file.mimeType,
      });
      const res = await this.http.post<T>(path, form, {
        headers: {
          ...this.buildHeaders(ctx),
          ...form.getHeaders(),
        },
      });
      return res.data;
    } catch (error) {
      this.handleError(error, `POST ${path} (multipart)`);
    }
  }

  // Returns the raw Axios instance for special cases (e.g. multipart, streaming)
  getRawInstance(): AxiosInstance {
    return this.http;
  }
}
