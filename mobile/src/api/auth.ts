import { apiClient } from './client';
import type { LoginResult, SessionInfo } from '../types';

export function register(email: string, password: string) {
  return apiClient.post<{ message: string }>('/auth/register', { email, password }).then((r) => r.data);
}

export function login(email: string, password: string) {
  return apiClient.post<LoginResult>('/auth/login', { email, password }).then((r) => r.data);
}

export function verifyOtp(email: string, code: string) {
  return apiClient.post<{ message: string }>('/auth/verify-otp', { email, code }).then((r) => r.data);
}

export function resendOtp(email: string) {
  return apiClient.post<{ message: string }>('/auth/resend-otp', { email }).then((r) => r.data);
}

export function me() {
  return apiClient.get<SessionInfo>('/me').then((r) => r.data);
}
