import { z } from 'zod';

export const createMeetingSchema = z.object({
  title: z.string({ required_error: 'Başlık gereklidir', invalid_type_error: 'Başlık metin olmalıdır' })
    .min(1, 'Başlık gereklidir')
    .max(200, 'Başlık çok uzun'),
  description: z.string({ invalid_type_error: 'Açıklama metin olmalıdır' })
    .max(2000, 'Açıklama çok uzun')
    .optional()
    .nullable(),
  meetingDate: z.string({ required_error: 'Tarih gereklidir', invalid_type_error: 'Tarih metin olmalıdır' })
    .refine(
      (date) => !isNaN(Date.parse(date)),
      'Geçerli bir tarih seçin'
    ),
  location: z.string({ required_error: 'Konum gereklidir', invalid_type_error: 'Konum metin olmalıdır' })
    .min(1, 'Konum gereklidir')
    .max(200, 'Konum çok uzun'),
});

export const updateMeetingSchema = z.object({
  title: z.string({ invalid_type_error: 'Başlık metin olmalıdır' })
    .min(1, 'Başlık gereklidir')
    .max(200, 'Başlık çok uzun')
    .optional()
    .nullable(),
  description: z.string({ invalid_type_error: 'Açıklama metin olmalıdır' })
    .max(2000, 'Açıklama çok uzun')
    .optional()
    .nullable(),
  meetingDate: z.string({ invalid_type_error: 'Tarih metin olmalıdır' })
    .refine(
      (date) => !date || !isNaN(Date.parse(date)),
      'Geçerli bir tarih seçin'
    )
    .optional()
    .nullable(),
  location: z.string({ invalid_type_error: 'Konum metin olmalıdır' })
    .min(1, 'Konum gereklidir')
    .max(200, 'Konum çok uzun')
    .optional()
    .nullable(),
  status: z.enum(['PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED'], {
    errorMap: () => ({ message: 'Durum PLANNED, ONGOING, COMPLETED veya CANCELLED olmalıdır' })
  }).optional(),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;

