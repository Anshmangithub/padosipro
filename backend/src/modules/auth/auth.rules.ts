import { ApiError } from '../../utils/apiError';

/**
 * Encodes the login gate: unknown email and wrong password both collapse to
 * the same generic error (no user-existence leak); only once the password is
 * confirmed correct do we distinguish "not verified yet".
 */
export function assertCanLogin(params: {
  userExists: boolean;
  passwordMatches: boolean;
  isVerified: boolean;
}): void {
  if (!params.userExists || !params.passwordMatches) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.');
  }
  if (!params.isVerified) {
    throw new ApiError(403, 'EMAIL_NOT_VERIFIED', 'Please verify your email before logging in.');
  }
}
