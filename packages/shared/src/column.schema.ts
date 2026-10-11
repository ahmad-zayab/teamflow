import { z } from 'zod';

export const CreateColumnSchema = z.object({
  name: z.string().min(1, 'Column name is required'),
  projectId: z.string().uuid(),
});

export type CreateColumnDto = z.infer<typeof CreateColumnSchema>;

export const UpdateColumnSchema = z.object({
  name: z.string().min(1).optional(),
  position: z.number().int().optional(),
});

export type UpdateColumnDto = z.infer<typeof UpdateColumnSchema>;
