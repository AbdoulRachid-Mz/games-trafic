//@/lib/api/client.ts
import axios, { AxiosRequestConfig, AxiosError, AxiosInstance } from 'axios';
import { getAppUrlEnv } from '@/utils/app-url';
import { authClient } from '@/lib/auth-client';

export interface ApiClientConfig {
  baseURL?: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class ApiClient {
  private static instance: ApiClient;
  private client: AxiosInstance;
  private config: Required<ApiClientConfig>;

  private constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseURL: config.baseURL || getAppUrlEnv(),
      apiKey: config.apiKey || '',
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  static getInstance(config?: ApiClientConfig): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient(config);
    }
    return ApiClient.instance;
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // API Key (prioritaire)
        if (this.config.apiKey) {
          config.headers['x-api-key'] = this.config.apiKey;
        }

        // Token de session (si pas d'API Key)
        if (!this.config.apiKey) {
          const session = await authClient.getSession();
          if (session?.data?.session?.token) {
            config.headers['Authorization'] = `Bearer ${session.data.session.token}`;
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor avec retry
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as any;
        
        // Ne pas retry si déjà essayé ou si erreur 4xx (sauf 429)
        if (!config || 
            config.__retryCount >= this.config.retries ||
            (error.response?.status && error.response.status < 500 && error.response.status !== 429)) {
          return Promise.reject(this.handleError(error));
        }

        config.__retryCount = config.__retryCount || 0;
        config.__retryCount += 1;

        // Attente exponentielle
        const delay = this.config.retryDelay * Math.pow(2, config.__retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delay));

        return this.client(config);
      }
    );
  }

  private handleError(error: AxiosError): Error {
    if (error.response) {
      const data = error.response.data as any;
      const message = data?.error?.message || data?.message || error.message;
      const code = data?.error?.code || 'API_ERROR';
      
      const err = new Error(message);
      (err as any).code = code;
      (err as any).status = error.response.status;
      (err as any).data = data;
      
      return err;
    }
    
    if (error.request) {
      return new Error('Impossible de contacter le serveur');
    }
    
    return error;
  }

  async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(path, config);
    return response.data;
  }

  async post<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(path, data, config);
    return response.data;
  }

  async put<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(path, data, config);
    return response.data;
  }

  async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(path, config);
    return response.data;
  }

  async patch<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch(path, data, config);
    return response.data;
  }
}

// Export singleton
export const apiClient = ApiClient.getInstance();