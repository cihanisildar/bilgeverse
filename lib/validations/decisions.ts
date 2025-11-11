import { z } from 'zod';

export const createDecisionSchema = z.object({
  title: z.string({ required_error: 'Başlık gereklidir', invalid_type_error: 'Başlık metin olmalıdır' })
    .min(1, 'Başlık gereklidir')
    .max(200, 'Başlık çok uzun'),
  description: z.string({ invalid_type_error: 'Açıklama metin olmalıdır' })
    .max(2000, 'Açıklama çok uzun')
    .optional()
    .nullable(),
  responsibleUserId: z.string({ invalid_type_error: 'Sorumlu kullanıcı ID metin olmalıdır' })
    .optional()
    .nullable(),
  targetDate: z.string({ invalid_type_error: 'Hedef tarih metin olmalıdır' })
    .refine(
      (date) => !date || !isNaN(Date.parse(date)),
      'Geçerli bir tarih seçin'
    )
    .optional()
    .nullable(),
});

export const updateDecisionSchema = z.object({
  title: z.string({ invalid_type_error: 'Başlık metin olmalıdır' })
    .min(1, 'Başlık gereklidir')
    .max(200, 'Başlık çok uzun')
    .optional()
    .nullable(),
  description: z.string({ invalid_type_error: 'Açıklama metin olmalıdır' })
    .max(2000, 'Açıklama çok uzun')
    .optional()
    .nullable(),
  responsibleUserId: z.string({ invalid_type_error: 'Sorumlu kullanıcı ID metin olmalıdır' })
    .optional()
    .nullable(),
  targetDate: z.string({ invalid_type_error: 'Hedef tarih metin olmalıdır' })
    .refine(
      (date) => !date || !isNaN(Date.parse(date)),
      'Geçerli bir tarih seçin'
    )
    .optional()
    .nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE'], {
    errorMap: () => ({ message: 'Durum TODO, IN_PROGRESS veya DONE olmalıdır' })
  }).optional(),
});

export type CreateDecisionInput = z.infer<typeof createDecisionSchema>;
export type UpdateDecisionInput = z.infer<typeof updateDecisionSchema>;

