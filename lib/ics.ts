import { TZ } from './config';
import { formatIcsLocal, formatIcsUtc } from './time';

export type IcsEvent = {
  uid: string;
  summary: string;
  description: string;
  location: string;
  url?: string;
  start: Date;
  end: Date;
  organizerName: string;
  organizerEmail: string;
  attendeeEmails: string[];
};

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\n|\r/g, '\\n');
}

function foldIcsLine(line: string) {
  const chunks: string[] = [];
  let remaining = line;
  while (remaining.length > 75) {
    chunks.push(remaining.slice(0, 75));
    remaining = ' ' + remaining.slice(75);
  }
  chunks.push(remaining);
  return chunks.join('\r\n');
}

/**
 * America/Tijuana follows US Pacific DST (border exception after Mexico
 * abolished DST in 2022). Outlook needs this VTIMEZONE or it may assume
 * Mexico City (UTC-6) and shift the meeting by an hour.
 */
function vtimeZoneAmericaTijuana() {
  return [
    'BEGIN:VTIMEZONE',
    `TZID:${TZ}`,
    `X-LIC-LOCATION:${TZ}`,
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:-0800',
    'TZOFFSETTO:-0700',
    'TZNAME:PDT',
    'DTSTART:19700308T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:-0700',
    'TZOFFSETTO:-0800',
    'TZNAME:PST',
    'DTSTART:19701101T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
  ];
}

export function buildIcs(event: IcsEvent, now = new Date()) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Treve//Reservaciones salas//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    `X-WR-TIMEZONE:${TZ}`,
    ...vtimeZoneAmericaTijuana(),
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${formatIcsUtc(now)}`,
    `DTSTART;TZID=${TZ}:${formatIcsLocal(event.start)}`,
    `DTEND;TZID=${TZ}:${formatIcsLocal(event.end)}`,
    `SUMMARY:${escapeIcsText(event.summary)}`,
    `LOCATION:${escapeIcsText(event.location)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
  ];
  if (event.url) lines.push(`URL:${event.url}`);
  lines.push(
    `ORGANIZER;CN=${escapeIcsText(event.organizerName)}:MAILTO:${event.organizerEmail}`,
  );
  for (const email of event.attendeeEmails) {
    lines.push(`ATTENDEE;RSVP=TRUE;CN=${escapeIcsText(email)}:MAILTO:${email}`);
  }
  lines.push('STATUS:CONFIRMED', 'SEQUENCE:0', 'END:VEVENT', 'END:VCALENDAR');
  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}
