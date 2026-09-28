import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/apiError';
import type { ProfileInput } from './profile.schema';

export async function getProfile(userId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    throw new ApiError(404, 'NOT_FOUND', 'Profile not found. Complete your profile first.');
  }
  return profile;
}

export function saveProfile(userId: string, input: ProfileInput) {
  return prisma.profile.upsert({
    where: { userId },
    create: { userId, ...input },
    update: { ...input },
  });
}
