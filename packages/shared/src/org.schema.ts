import { z } from 'zod';

export const CreateOrganizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  slug: z.string().min(2, 'Slug must be at least 2 characters long').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and dashes'),
});

export type CreateOrganizationDto = z.infer<typeof CreateOrganizationSchema>;

export const UpdateOrganizationSchema = CreateOrganizationSchema.partial();

export type UpdateOrganizationDto = z.infer<typeof UpdateOrganizationSchema>;
