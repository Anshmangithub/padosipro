import crypto from 'node:crypto';
import { ApiError } from '../../utils/apiError';

export interface OtpRecordState {
  expiresAt: Date;
  consumedAt: Date | null;
  attempts: number;
}

/** Cryptographically random, zero-padded numeric code, e.g. "042817" for length 6. */
export function generateOtpCode(length: number): string {
  const max = 10 ** length;
  const value = crypto.randomInt(0, max);
  return value.toString().padStart(length, '0');
}

/** Throws OTP_RESEND_COOLDOWN if a code was sent too recently. */
export function assertResendAllowed(params: {
  lastSentAt: Date;
  now: Date;
  cooldownSeconds: number;
}): void {
  const elapsedMs = params.now.getTime() - params.lastSentAt.getTime();
  const cooldownMs = params.cooldownSeconds * 1000;
  if (elapsedMs < cooldownMs) {
    const retryAfterSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
    throw new ApiError(
      429,
      'OTP_RESEND_COOLDOWN',
      `Please wait ${retryAfterSeconds}s before requesting another code.`,
      { retryAfterSeconds },
    );
  }
}

/**
 * Throws if the record can't be checked against at all (missing, used, locked,
 * expired). Does NOT check whether the submitted code matches — that requires
 * an async hash comparison and stays in the service layer.
 */
export function assertOtpVerifiable(
  record: OtpRecordState | null,
  params: { now: Date; maxAttempts: number },
): asserts record is OtpRecordState {
  if (!record) {
    throw new ApiError(400, 'OTP_NOT_FOUND', 'No verification code found. Please request a new one.');
  }
  if (record.consumedAt) {
    throw new ApiError(400, 'OTP_ALREADY_USED', 'This code has already been used. Please request a new one.');
  }
  if (record.attempts >= params.maxAttempts) {
    throw new ApiError(
      429,
      'OTP_LOCKED',
      'Too many incorrect attempts. Please request a new code.',
    );
  }
  if (record.expiresAt.getTime() <= params.now.getTime()) {
    throw new ApiError(400, 'OTP_EXPIRED', 'This code has expired. Please request a new one.');
  }
}

/** Builds the error thrown for a wrong (but otherwise still-valid) code. */
export function buildInvalidCodeError(params: { attempts: number; maxAttempts: number }): ApiError {
  const remaining = params.maxAttempts - params.attempts;
  return new ApiError(400, 'OTP_INVALID', `Incorrect code. ${remaining} attempt(s) remaining.`, {
    attemptsRemaining: remaining,
  });
}
