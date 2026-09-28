import {
  generateOtpCode,
  assertResendAllowed,
  assertOtpVerifiable,
  buildInvalidCodeError,
  type OtpRecordState,
} from '../src/modules/auth/otp.rules';
import { ApiError } from '../src/utils/apiError';

describe('generateOtpCode', () => {
  it('produces a zero-padded numeric string of the requested length', () => {
    for (let i = 0; i < 50; i += 1) {
      const code = generateOtpCode(6);
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it('is capable of producing a code with a leading zero', () => {
    // Not flaky: with a large enough sample, at least one code must start with "0".
    const codes = Array.from({ length: 500 }, () => generateOtpCode(6));
    expect(codes.some((code) => code.startsWith('0'))).toBe(true);
  });
});

describe('assertResendAllowed', () => {
  const now = new Date('2026-01-01T00:00:30.000Z');

  it('throws OTP_RESEND_COOLDOWN when called before the cooldown elapses', () => {
    const lastSentAt = new Date('2026-01-01T00:00:10.000Z'); // 20s ago, cooldown is 30s
    expect(() => assertResendAllowed({ lastSentAt, now, cooldownSeconds: 30 })).toThrow(ApiError);
    try {
      assertResendAllowed({ lastSentAt, now, cooldownSeconds: 30 });
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe('OTP_RESEND_COOLDOWN');
      expect((err as ApiError).details).toEqual({ retryAfterSeconds: 10 });
    }
  });

  it('allows resending once the cooldown has fully elapsed', () => {
    const lastSentAt = new Date('2026-01-01T00:00:00.000Z'); // exactly 30s ago
    expect(() => assertResendAllowed({ lastSentAt, now, cooldownSeconds: 30 })).not.toThrow();
  });
});

describe('assertOtpVerifiable', () => {
  const now = new Date('2026-01-01T00:10:00.000Z');
  const maxAttempts = 5;

  function record(overrides: Partial<OtpRecordState> = {}): OtpRecordState {
    return {
      expiresAt: new Date('2026-01-01T00:20:00.000Z'),
      consumedAt: null,
      attempts: 0,
      ...overrides,
    };
  }

  it('throws OTP_NOT_FOUND when there is no record', () => {
    expect(() => assertOtpVerifiable(null, { now, maxAttempts })).toThrow(
      expect.objectContaining({ code: 'OTP_NOT_FOUND' }),
    );
  });

  it('throws OTP_ALREADY_USED for a consumed code', () => {
    expect(() => assertOtpVerifiable(record({ consumedAt: now }), { now, maxAttempts })).toThrow(
      expect.objectContaining({ code: 'OTP_ALREADY_USED' }),
    );
  });

  it('throws OTP_LOCKED once attempts reach the max', () => {
    expect(() => assertOtpVerifiable(record({ attempts: 5 }), { now, maxAttempts })).toThrow(
      expect.objectContaining({ code: 'OTP_LOCKED' }),
    );
  });

  it('throws OTP_EXPIRED once the expiry time has passed', () => {
    const expired = record({ expiresAt: new Date('2026-01-01T00:09:59.000Z') });
    expect(() => assertOtpVerifiable(expired, { now, maxAttempts })).toThrow(
      expect.objectContaining({ code: 'OTP_EXPIRED' }),
    );
  });

  it('treats the exact expiry instant as expired (10-minute TTL is not inclusive)', () => {
    const boundary = record({ expiresAt: now });
    expect(() => assertOtpVerifiable(boundary, { now, maxAttempts })).toThrow(
      expect.objectContaining({ code: 'OTP_EXPIRED' }),
    );
  });

  it('passes for a fresh, unexpired, unused, under-limit record', () => {
    expect(() => assertOtpVerifiable(record(), { now, maxAttempts })).not.toThrow();
  });
});

describe('buildInvalidCodeError', () => {
  it('reports how many attempts remain', () => {
    const err = buildInvalidCodeError({ attempts: 2, maxAttempts: 5 });
    expect(err.code).toBe('OTP_INVALID');
    expect(err.details).toEqual({ attemptsRemaining: 3 });
  });

  it('reports zero attempts remaining on the final allowed try', () => {
    const err = buildInvalidCodeError({ attempts: 5, maxAttempts: 5 });
    expect(err.details).toEqual({ attemptsRemaining: 0 });
  });
});
