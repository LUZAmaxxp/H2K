import { z } from 'zod';

export const interventionSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  entrepriseName: z.string().min(1, 'Company name is required'),
  responsable: z.string().min(1, 'Responsible person is required'),
  teamMembers: z.array(z.string().min(1, 'Team member name is required')).min(1, 'At least one team member is required'),
  siteName: z.string().min(1, 'Site name is required'),
  photoUrl: z.string().optional(),
  recipientEmails: z.array(z.string().email('Invalid email format')).min(1, 'At least one recipient email is required'),
});

export type InterventionFormData = z.infer<typeof interventionSchema>;
