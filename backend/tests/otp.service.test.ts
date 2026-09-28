import bcrypt from 'bcryptjs';

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    otpCode: { findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn() },
    user: { update: jest.fn() },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}));

jest.mock('../src/lib/mailer', () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(undefined),
}));

import { prisma } from '../src/lib/prisma';
import { sendOtpEmail } from '../src/lib/mailer';
import { issueOtp, verifyOtp } from '../src/modules/auth/otp.service';

const mockedPrisma = prisma as unknown as {
  otpCode: { findUnique: jest.Mock; upsert: jest.Mock; update: jest.Mock };
  user: { update: jest.Mock };
  $transaction: jest.Mock;
};

describe('otp.service issueOtp', () => {
  it('emails a 6-digit code while persisting only its hash', async () => {
    mockedPrisma.otpCode.findUnique.mockResolvedValueOnce(null); // first send, no existing record
    mockedPrisma.otpCode.upsert.mockResolvedValueOnce({});

    await issueOtp('user-1', 'jane@example.com');

    const [, sentCode] = (sendOtpEmail as jest.Mock).mock.calls[0];
    expect(sentCode).toMatch(/^\d{6}$/);

    const upsertArgs = mockedPrisma.otpCode.upsert.mock.calls[0][0];
    expect(upsertArgs.create.codeHash).not.toBe(sentCode);
    expect(upsertArgs.create.codeHash.length).toBeGreaterThan(20); // a bcrypt hash, not the plaintext code
  });

  it('refuses to resend within the 30s cooldown and never touches the mailer', async () => {
    mockedPrisma.otpCode.findUnique.mockResolvedValueOnce({ lastSentAt: new Date() });

    await expect(issueOtp('user-1', 'jane@example.com')).rejects.toMatchObject({
      code: 'OTP_RESEND_COOLDOWN',
    });
    expect(mockedPrisma.otpCode.upsert).not.toHaveBeenCalled();
    expect(sendOtpEmail).not.toHaveBeenCalled();
  });
});

describe('otp.service verifyOtp', () => {
  it('marks the user verified in a single transaction when the code matches', async () => {
    const codeHash = await bcrypt.hash('123456', 8);
    mockedPrisma.otpCode.findUnique.mockResolvedValueOnce({
      codeHash,
      attempts: 0,
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    mockedPrisma.otpCode.update.mockResolvedValueOnce({});
    mockedPrisma.user.update.mockResolvedValueOnce({});

    await expect(verifyOtp('user-1', '123456')).resolves.toBeUndefined();
    expect(mockedPrisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('increments attempts and reports remaining tries on a wrong code', async () => {
    const codeHash = await bcrypt.hash('123456', 8);
    mockedPrisma.otpCode.findUnique.mockResolvedValueOnce({
      codeHash,
      attempts: 1,
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    mockedPrisma.otpCode.update.mockResolvedValueOnce({ attempts: 2 });

    await expect(verifyOtp('user-1', '000000')).rejects.toMatchObject({
      code: 'OTP_INVALID',
      details: { attemptsRemaining: 3 }, // default OTP_MAX_ATTEMPTS is 5
    });
  });

  it('rejects an expired code without ever comparing hashes or writing to the DB', async () => {
    mockedPrisma.otpCode.findUnique.mockResolvedValueOnce({
      codeHash: 'irrelevant-since-it-should-never-be-compared',
      attempts: 0,
      consumedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(verifyOtp('user-1', '123456')).rejects.toMatchObject({ code: 'OTP_EXPIRED' });
    expect(mockedPrisma.otpCode.update).not.toHaveBeenCalled();
    expect(mockedPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects further attempts once the record is locked, even with the correct code', async () => {
    const codeHash = await bcrypt.hash('123456', 8);
    mockedPrisma.otpCode.findUnique.mockResolvedValueOnce({
      codeHash,
      attempts: 5,
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(verifyOtp('user-1', '123456')).rejects.toMatchObject({ code: 'OTP_LOCKED' });
  });
});
