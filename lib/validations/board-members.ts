import { z } from 'zod';

export const createBoardMemberSchema = z.object({
  userId: z.string().optional(),
  title: z.string().min(1, 'Ünvan gereklidir'),
  // New user fields
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email('Geçersiz e-posta adresi').optional(),
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalıdır').optional(),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır').optional(),
}).refine((data) => {
  if (data.userId) return true;
  return !!(data.firstName && data.lastName && data.username && data.password);
}, {
  message: "Ya mevcut bir kullanıcı seçilmeli ya da yeni kullanıcı bilgileri tam doldurulmalıdır",
  path: ["userId"]
});

export const updateBoardMemberSchema = z.object({
  title: z.string().min(1, 'Ünvan gereklidir').optional(),
  isActive: z.boolean().optional(),
});

export type CreateBoardMemberInput = z.infer<typeof createBoardMemberSchema>;
export type UpdateBoardMemberInput = z.infer<typeof updateBoardMemberSchema>;
