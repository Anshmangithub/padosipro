import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { hashOtpCode, compareOtpCode } from '../../lib/hash';
import { sendOtpEmail } from '../../lib/mailer';
import {
  generateOtpCode,
  assertResendAllowed,
  assertOtpVerifiable,
  buildInvalidCodeError,
} from './otp.rules';

/** Generates a fresh code, stores its hash, and emails it. Enforces the resend cooldown. */
export async function issueOtp(userId: string, email: string, now: Date = new Date()): Promise<void> {
  const existing = await prisma.otpCode.findUnique({ where: { userId } });
  if (existing) {
    assertResendAllowed({
      lastSentAt: existing.lastSentAt,
      now,
      cooldownSeconds: env.OTP_RESEND_COOLDOWN_SECONDS,
    });
  }

  const code = generateOtpCode(env.OTP_LENGTH);
  const codeHash = await hashOtpCode(code);
  const expiresAt = new Date(now.getTime() + env.OTP_TTL_MINUTES * 60_000);

  await prisma.otpCode.upsert({
    where: { userId },
    create: { userId, codeHash, expiresAt, attempts: 0, lastSentAt: now },
    update: { codeHash, expiresAt, attempts: 0, lastSentAt: now, consumedAt: null },
  });

  await sendOtpEmail(email, code);
}

/** Checks the submitted code and, on success, marks the user verified. */
export async function verifyOtp(userId: string, submittedCode: string, now: Date = new Date()): Promise<void> {
  const record = await prisma.otpCode.findUnique({ where: { userId } });
  assertOtpVerifiable(record, { now, maxAttempts: env.OTP_MAX_ATTEMPTS });

  const matches = await compareOtpCode(submittedCode, record.codeHash);
  if (!matches) {
    const updated = await prisma.otpCode.update({
      where: { userId },
      data: { attempts: { increment: 1 } },
    });
    throw buildInvalidCodeError({ attempts: updated.attempts, maxAttempts: env.OTP_MAX_ATTEMPTS });
  }

  await prisma.$transaction([
    prisma.otpCode.update({ where: { userId }, data: { consumedAt: now } }),
    prisma.user.update({ where: { id: userId }, data: { isVerified: true } }),
  ]);
}
