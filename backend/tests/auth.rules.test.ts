import { assertCanLogin } from '../src/modules/auth/auth.rules';
import { ApiError } from '../src/utils/apiError';

describe('assertCanLogin', () => {
  it('allows a verified user with a matching password', () => {
    expect(() =>
      assertCanLogin({ userExists: true, passwordMatches: true, isVerified: true }),
    ).not.toThrow();
  });

  it('rejects an unknown email with a generic INVALID_CREDENTIALS error', () => {
    expect(() => assertCanLogin({ userExists: false, passwordMatches: false, isVerified: false })).toThrow(
      expect.objectContaining({ code: 'INVALID_CREDENTIALS', statusCode: 401 }),
    );
  });

  it('rejects a known email with the wrong password using the same generic error', () => {
    let unknownErr: unknown;
    let wrongPasswordErr: unknown;
    try {
      assertCanLogin({ userExists: false, passwordMatches: false, isVerified: false });
    } catch (err) {
      unknownErr = err;
    }
    try {
      assertCanLogin({ userExists: true, passwordMatches: false, isVerified: true });
    } catch (err) {
      wrongPasswordErr = err;
    }

    expect((unknownErr as ApiError).code).toBe((wrongPasswordErr as ApiError).code);
    expect((unknownErr as ApiError).message).toBe((wrongPasswordErr as ApiError).message);
  });

  it('rejects a correct password on an unverified account with EMAIL_NOT_VERIFIED', () => {
    expect(() => assertCanLogin({ userExists: true, passwordMatches: true, isVerified: false })).toThrow(
      expect.objectContaining({ code: 'EMAIL_NOT_VERIFIED', statusCode: 403 }),
    );
  });

  it('never leaks verification status for a wrong password (checks credentials before verification)', () => {
    try {
      assertCanLogin({ userExists: true, passwordMatches: false, isVerified: false });
      throw new Error('expected assertCanLogin to throw');
    } catch (err) {
      expect((err as ApiError).code).toBe('INVALID_CREDENTIALS');
    }
  });
});
