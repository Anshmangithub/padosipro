import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/apiError';

export function listCatalogue() {
  return prisma.task.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
}

export async function getSelection(userId: string) {
  const rows = await prisma.userTask.findMany({
    where: { userId },
    include: { task: true },
    orderBy: { task: { category: 'asc' } },
  });
  return rows.map((row) => row.task);
}

export async function saveSelection(userId: string, taskIds: string[]) {
  const uniqueIds = Array.from(new Set(taskIds));

  if (uniqueIds.length > 0) {
    const matchCount = await prisma.task.count({ where: { id: { in: uniqueIds } } });
    if (matchCount !== uniqueIds.length) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'One or more selected tasks do not exist.');
    }
  }

  await prisma.$transaction([
    prisma.userTask.deleteMany({ where: { userId } }),
    ...(uniqueIds.length > 0
      ? [prisma.userTask.createMany({ data: uniqueIds.map((taskId) => ({ userId, taskId })) })]
      : []),
  ]);

  return getSelection(userId);
}
