import { prisma } from '../../lib/prisma';
import { hashPassword, comparePassword } from '../../lib/hash';
import { signAuthToken } from '../../lib/jwt';
import { ApiError } from '../../utils/apiError';
import { assertCanLogin } from './auth.rules';
import * as otpService from './otp.service';

// A valid bcrypt hash of a value nobody will ever type, compared against when
// the email doesn't exist so login timing doesn't reveal account existence.
const DUMMY_PASSWORD_HASH = '$2a$12$CwTycUXWue0Thq9StjUM0uJ8O/CmZzY8L.YgYd4X3g0e4kXR9G2Nu';

export async function register(email: string, password: string): Promise<{ message: string }> {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing?.isVerified) {
    throw new ApiError(
      409,
      'EMAIL_ALREADY_VERIFIED',
      'An account with this email already exists. Please log in.',
    );
  }

  const passwordHash = await hashPassword(password);
  const user = existing
    ? await prisma.user.update({ where: { id: existing.id }, data: { passwordHash } })
    : await prisma.user.create({ data: { email, passwordHash } });

  await otpService.issueOtp(user.id, user.email);
  return { message: 'Verification code sent. Check your email.' };
}

export async function resendOtp(email: string): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'No account found with this email.');
  }
  if (user.isVerified) {
    throw new ApiError(409, 'EMAIL_ALREADY_VERIFIED', 'This email is already verified. Please log in.');
  }

  await otpService.issueOtp(user.id, user.email);
  return { message: 'Verification code sent. Check your email.' };
}

export async function verifyEmail(email: string, code: string): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'No account found with this email.');
  }
  if (user.isVerified) {
    throw new ApiError(409, 'EMAIL_ALREADY_VERIFIED', 'This email is already verified. Please log in.');
  }

  await otpService.verifyOtp(user.id, code);
  return { message: 'Email verified. You can now log in.' };
}

export interface SessionInfo {
  user: { id: string; email: string };
  hasProfile: boolean;
  hasSelectedTasks: boolean;
}

export interface LoginResult extends SessionInfo {
  token: string;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = await comparePassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

  assertCanLogin({
    userExists: Boolean(user),
    passwordMatches,
    isVerified: user?.isVerified ?? false,
  });

  // assertCanLogin throws for every case where `user` would be null, so this is safe.
  const verifiedUser = user!;
  const session = await buildSessionInfo(verifiedUser.id, verifiedUser.email);
  const token = signAuthToken({ sub: verifiedUser.id, email: verifiedUser.email });

  return { token, ...session };
}

export async function getSessionInfo(userId: string): Promise<SessionInfo> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Session is no longer valid.');
  }
  return buildSessionInfo(user.id, user.email);
}

async function buildSessionInfo(userId: string, email: string): Promise<SessionInfo> {
  const [profile, taskCount] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.userTask.count({ where: { userId } }),
  ]);

  return {
    user: { id: userId, email },
    hasProfile: Boolean(profile),
    hasSelectedTasks: taskCount > 0,
  };
}
