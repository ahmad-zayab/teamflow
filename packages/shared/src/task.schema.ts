import { z } from 'zod';

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  projectId: z.string().uuid(),
  columnId: z.string().uuid(),
});

export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
});

export type UpdateTaskDto = z.infer<typeof UpdateTaskSchema>;

export const MoveTaskSchema = z.object({
  newColumnId: z.string().uuid(),
  newPosition: z.number().int().min(1),
});

export type MoveTaskDto = z.infer<typeof MoveTaskSchema>;
