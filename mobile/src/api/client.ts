import axios, { AxiosError } from 'axios';
import type { ApiErrorBody, ApiErrorCode } from '../types';
import { getToken } from './tokenStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:4000/api';

export class ApiClientError extends Error {
  readonly code: ApiErrorCode | 'NETWORK_ERROR';
  readonly details?: unknown;
  readonly statusCode?: number;

  constructor(message: string, code: ApiErrorCode | 'NETWORK_ERROR', statusCode?: number, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response) {
      const body = error.response.data;
      const code = body?.error?.code ?? 'INTERNAL_ERROR';
      const message = body?.error?.message ?? 'Something went wrong. Please try again.';
      return Promise.reject(new ApiClientError(message, code, error.response.status, body?.error?.details));
    }
    return Promise.reject(
      new ApiClientError('Could not reach the server. Check your connection and try again.', 'NETWORK_ERROR'),
    );
  },
);
