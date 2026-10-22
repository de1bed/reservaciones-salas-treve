/** Treve office zone (Tijuana / US Pacific, not Mexico City). */
export const TZ = 'America/Tijuana';
export const TZ_LABEL = 'hora de Tijuana';
export const SLOT_MINUTES = Number(process.env.SLOT_MINUTES || 30);
export const MIN_DURATION_MINUTES = 30;
export const MAX_DURATION_MINUTES = 240;
export const BUFFER_MINUTES = Number(process.env.BUFFER_MINUTES || 0);
export const BOOKING_DAYS_AHEAD = Number(process.env.BOOKING_DAYS_AHEAD || 30);
export const WORK_START = process.env.WORK_START || '07:00';
export const WORK_END = process.env.WORK_END || '17:00';
export const ROOMS = {
  sala_principal: { label: 'Sala principal', calendarId: process.env.CALENDAR_SALA_PRINCIPAL || '693f020ff342203f534f466ab4b1bd38443c05125ff10c4a68d1e71164f761a5@group.calendar.google.com', location: 'Treve - Sala principal' },
  salita_2: { label: 'Salita 2', calendarId: process.env.CALENDAR_SALITA_2 || '02210b596246b2ad631e204a0bdeb90e11464d4ad13b9adc793a117cf26238e9@group.calendar.google.com', location: 'Treve - Salita 2' },
} as const;
export type RoomId = keyof typeof ROOMS;
