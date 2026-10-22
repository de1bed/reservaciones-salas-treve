import { BOOKING_DAYS_AHEAD, TZ, TZ_LABEL, WORK_END, WORK_START } from './config';
export { BUFFER_MINUTES, SLOT_MINUTES, WORK_START, WORK_END } from './config';

export function partsInTz(d: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hour12: false,
  }).formatToParts(d);
  const o = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  if (o.hour === '24') o.hour = '00';
  return o as Record<string, string>;
}

export function localDateTimeToDate(date: string, hhmm: string) {
  const [y, m, dd] = date.split('-').map(Number);
  const [hh, mm] = hhmm.split(':').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, dd, hh + 8, mm));
  for (let i = 0; i < 3; i++) {
    const p = partsInTz(utc);
    const got = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
    const want = Date.UTC(y, m - 1, dd, hh, mm);
    utc.setTime(utc.getTime() + (want - got));
  }
  return utc;
}

export function addMinutes(d: Date, m: number) {
  return new Date(d.getTime() + m * 60000);
}

export function overlaps(aS: Date, aE: Date, bS: Date, bE: Date) {
  return aS < bE && aE > bS;
}

export function isWeekday(date: string) {
  const d = localDateTimeToDate(date, '12:00');
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(d);
  return !['Sat', 'Sun'].includes(wd);
}

export function assertBookingWindow(date: string) {
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const req = localDateTimeToDate(date, '00:00').getTime();
  const today = localDateTimeToDate(todayStr, '00:00').getTime();
  const max = today + BOOKING_DAYS_AHEAD * 24 * 60 * 60000;
  if (req < today || req > max) {
    throw new Error(`Sólo se permiten reservaciones dentro de los próximos ${BOOKING_DAYS_AHEAD} días.`);
  }
}

export function validateWorkHours(start: Date, end: Date) {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(start);
  if (!isWeekday(date)) throw new Error('Sólo se permiten reservaciones de lunes a viernes.');
  if (start < localDateTimeToDate(date, WORK_START) || end > localDateTimeToDate(date, WORK_END)) {
    throw new Error(`Horario fuera de disponibilidad: lunes a viernes de ${WORK_START} a ${WORK_END}.`);
  }
}

export function formatLabel(s: Date, e: Date) {
  const f = new Intl.DateTimeFormat('es-MX', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${f.format(s)} - ${f.format(e)}`;
}

/** Local wall-clock RFC3339 without offset, for Google Calendar + IANA TZID. */
export function formatRfc3339Local(d: Date) {
  const p = partsInTz(d);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second || '00'}`;
}

/** Compact local datetime for ICS DTSTART/DTEND with TZID. */
export function formatIcsLocal(d: Date) {
  const p = partsInTz(d);
  return `${p.year}${p.month}${p.day}T${p.hour}${p.minute}${p.second || '00'}`;
}

export function formatIcsUtc(d: Date) {
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
  const da = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  const s = String(d.getUTCSeconds()).padStart(2, '0');
  return `${y}${mo}${da}T${h}${mi}${s}Z`;
}

export function formatTime12(d: Date) {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

export function formatDateLong(d: Date) {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/** Invitation copy: wall-clock times in Treve's zone, never Mexico City. */
export function formatInviteWhen(start: Date, end: Date) {
  return `${formatDateLong(start)}, ${formatTime12(start)} – ${formatTime12(end)} (${TZ_LABEL})`;
}
