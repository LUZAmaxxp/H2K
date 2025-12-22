import { z } from 'zod';

export const reclamationSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  stationName: z.string().min(1, 'Station name is required'),
  reclamationType: z.enum(['hydraulic', 'electric', 'mechanic'], {
    errorMap: () => ({ message: 'Please select a valid reclamation type' }),
  }),
  description: z.string().min(1, 'Description is required'),
  photoUrl: z.string().optional(),
  recipientEmails: z.array(z.string().email('Invalid email format')).min(1, 'At least one recipient email is required'),
});

export type ReclamationFormData = z.infer<typeof reclamationSchema>;
