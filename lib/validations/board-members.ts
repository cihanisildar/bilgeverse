import { z } from 'zod';

export const createBoardMemberSchema = z.object({
  userId: z.string().min(1, 'Kullanıcı seçilmelidir'),
  title: z.string().min(1, 'Ünvan gereklidir'),
});

export const updateBoardMemberSchema = z.object({
  title: z.string().min(1, 'Ünvan gereklidir').optional(),
  isActive: z.boolean().optional(),
});

export type CreateBoardMemberInput = z.infer<typeof createBoardMemberSchema>;
export type UpdateBoardMemberInput = z.infer<typeof updateBoardMemberSchema>;
