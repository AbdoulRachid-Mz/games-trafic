// lib/api.ts
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000" ||
  "http://localhost:3001";

class ApiService {
  private static instance: ApiService;
  private token: string | null = null;

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  public setToken(token: string): void {
    this.token = token;
  }

  public clearToken(): void {
    this.token = null;
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...config.headers,
      };

      const response: AxiosResponse<T> = await axios({
        baseURL: API_BASE_URL,
        ...config,
        headers,
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          error.response.data?.error || error.message || "API request failed"
        );
      }
      throw error;
    }
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: "GET", url, ...config });
  }

  public async post<T>(
    path: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({
      method: "POST",
      url: path,
      data,
      ...config,
    });
  }

  public async put<T>(
    url: string,
    data?: object,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({ method: "PUT", url, data, ...config });
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: "DELETE", url, ...config });
  }

  public async patch<T>(
    url: string,
    data?: object,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({ method: "PATCH", url, data, ...config });
  }
}

export const api = ApiService.getInstance();
