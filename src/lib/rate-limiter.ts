import { Appointment } from './models';

export async function checkRateLimit(userId: string): Promise<boolean> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // Check daily appointment limit (12 per day for therapists)
  const appointmentCount = await Appointment.countDocuments({
    therapistId: userId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: 'cancelled' }
  });

  return appointmentCount < 12;
}
