export interface Task {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface Profile {
  id: string;
  userId: string;
  name: string;
  mobileNumber: string;
  address: string;
  businessName: string | null;
}

export interface ProfileInput {
  name: string;
  mobileNumber: string;
  address: string;
  businessName?: string;
}

export interface SessionInfo {
  user: { id: string; email: string };
  hasProfile: boolean;
  hasSelectedTasks: boolean;
}

export interface LoginResult extends SessionInfo {
  token: string;
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'EMAIL_ALREADY_VERIFIED'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_VERIFIED'
  | 'USER_NOT_FOUND'
  | 'OTP_NOT_FOUND'
  | 'OTP_EXPIRED'
  | 'OTP_ALREADY_USED'
  | 'OTP_INVALID'
  | 'OTP_LOCKED'
  | 'OTP_RESEND_COOLDOWN'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR';

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}
