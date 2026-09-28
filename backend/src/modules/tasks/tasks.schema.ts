import { z } from 'zod';

export const taskSelectionSchema = z.object({
  taskIds: z.array(z.string().uuid('Invalid task id')).max(200),
});

export type TaskSelectionInput = z.infer<typeof taskSelectionSchema>;
