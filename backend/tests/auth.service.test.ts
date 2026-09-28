import bcrypt from 'bcryptjs';

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
    otpCode: { findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn() },
    profile: { findUnique: jest.fn() },
    userTask: { count: jest.fn() },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}));

jest.mock('../src/lib/mailer', () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(undefined),
}));

import { prisma } from '../src/lib/prisma';
import { sendOtpEmail } from '../src/lib/mailer';
import * as authService from '../src/modules/auth/auth.service';

const mockedPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock; update: jest.Mock; create: jest.Mock };
  otpCode: { findUnique: jest.Mock; upsert: jest.Mock; update: jest.Mock };
  profile: { findUnique: jest.Mock };
  userTask: { count: jest.Mock };
};

describe('auth.service.login', () => {
  it('logs in a verified user with the correct password and reports onboarding state', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 8);
    mockedPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'jane@example.com',
      passwordHash,
      isVerified: true,
    });
    mockedPrisma.profile.findUnique.mockResolvedValueOnce({ id: 'profile-1' });
    mockedPrisma.userTask.count.mockResolvedValueOnce(2);

    const result = await authService.login('jane@example.com', 'correct-password');

    expect(result.token).toEqual(expect.any(String));
    expect(result.hasProfile).toBe(true);
    expect(result.hasSelectedTasks).toBe(true);
  });

  it('reports no profile / no tasks yet for a freshly verified user', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 8);
    mockedPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'jane@example.com',
      passwordHash,
      isVerified: true,
    });
    mockedPrisma.profile.findUnique.mockResolvedValueOnce(null);
    mockedPrisma.userTask.count.mockResolvedValueOnce(0);

    const result = await authService.login('jane@example.com', 'correct-password');

    expect(result.hasProfile).toBe(false);
    expect(result.hasSelectedTasks).toBe(false);
  });

  it('rejects an unknown email with a generic error (no user-existence leak)', async () => {
    mockedPrisma.user.findUnique.mockResolvedValueOnce(null);

    await expect(authService.login('ghost@example.com', 'whatever123')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      statusCode: 401,
    });
  });

  it('rejects the wrong password with the same generic error', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 8);
    mockedPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'jane@example.com',
      passwordHash,
      isVerified: true,
    });

    await expect(authService.login('jane@example.com', 'wrong-password')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      statusCode: 401,
    });
  });

  it('blocks login for an unverified account even with the correct password', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 8);
    mockedPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'jane@example.com',
      passwordHash,
      isVerified: false,
    });

    await expect(authService.login('jane@example.com', 'correct-password')).rejects.toMatchObject({
      code: 'EMAIL_NOT_VERIFIED',
      statusCode: 403,
    });
  });
});

describe('auth.service.register', () => {
  it('creates a new unverified user and emails a fresh OTP', async () => {
    mockedPrisma.user.findUnique.mockResolvedValueOnce(null);
    mockedPrisma.user.create.mockResolvedValueOnce({ id: 'user-2', email: 'new@example.com' });
    mockedPrisma.otpCode.findUnique.mockResolvedValueOnce(null);
    mockedPrisma.otpCode.upsert.mockResolvedValueOnce({});

    await authService.register('new@example.com', 'password123');

    expect(mockedPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ email: 'new@example.com' }) }),
    );
    expect(sendOtpEmail).toHaveBeenCalledWith('new@example.com', expect.stringMatching(/^\d{6}$/));
  });

  it('rejects registering an email that is already verified', async () => {
    mockedPrisma.user.findUnique.mockResolvedValueOnce({ id: 'user-3', isVerified: true });

    await expect(authService.register('taken@example.com', 'password123')).rejects.toMatchObject({
      code: 'EMAIL_ALREADY_VERIFIED',
    });
  });

  it('resends a fresh OTP instead of erroring when re-registering an unverified email', async () => {
    mockedPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-4',
      email: 'pending@example.com',
      isVerified: false,
    });
    mockedPrisma.user.update.mockResolvedValueOnce({ id: 'user-4', email: 'pending@example.com' });
    mockedPrisma.otpCode.findUnique.mockResolvedValueOnce(null);
    mockedPrisma.otpCode.upsert.mockResolvedValueOnce({});

    await authService.register('pending@example.com', 'newpassword123');

    expect(mockedPrisma.user.create).not.toHaveBeenCalled();
    expect(mockedPrisma.user.update).toHaveBeenCalled();
    expect(sendOtpEmail).toHaveBeenCalled();
  });
});
