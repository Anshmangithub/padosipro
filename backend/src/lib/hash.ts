import bcrypt from 'bcryptjs';

// Passwords: higher cost since these protect long-lived accounts.
const PASSWORD_SALT_ROUNDS = 12;
// OTP codes: lower cost is fine — they're short-lived (10 min) and rotated
// on every resend, so the hash just needs to prevent DB-dump replay, not
// resist a long offline attack.
const OTP_SALT_ROUNDS = 8;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, PASSWORD_SALT_ROUNDS);
}

export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function hashOtpCode(plain: string): Promise<string> {
  return bcrypt.hash(plain, OTP_SALT_ROUNDS);
}

export function compareOtpCode(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
