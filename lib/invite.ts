import { TZ, TZ_LABEL } from './config';
import { buildIcs } from './ics';
import { formatInviteWhen, formatRfc3339Local } from './time';

export type BookingInviteInput = {
  roomLabel: string;
  roomLocation: string;
  start: Date;
  end: Date;
  name: string;
  email: string;
  purpose: string;
  peopleCount?: string;
  meetingLink?: string;
  attendeeEmails: string[];
  uid?: string;
};

function uidFor(input: BookingInviteInput) {
  if (input.uid) return input.uid;
  const stamp = formatRfc3339Local(input.start).replace(/[-:]/g, '');
  return `treve-${stamp}@reservaciones-salas-treve`;
}

export function meetingLocation(roomLocation: string, meetingLink?: string) {
  const link = meetingLink?.trim();
  return link ? `${roomLocation} | ${link}` : roomLocation;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function inviteDescription(input: BookingInviteInput) {
  const when = formatInviteWhen(input.start, input.end);
  const link = input.meetingLink?.trim();
  const lines = [
    'Reservación creada automáticamente.',
    '',
    `Horario: ${when}`,
    `Zona: ${TZ} (${TZ_LABEL})`,
    '',
    `Solicitante: ${input.name} <${input.email}>`,
  ];
  if (input.peopleCount) lines.push(`Personas: ${input.peopleCount}`);
  lines.push(`Motivo: ${input.purpose}`);
  if (link) lines.push(`Enlace de reunión: ${link}`);
  return lines.join('\n');
}

export function googleEventTimes(start: Date, end: Date) {
  return {
    start: { dateTime: formatRfc3339Local(start), timeZone: TZ },
    end: { dateTime: formatRfc3339Local(end), timeZone: TZ },
  };
}

export function buildInviteEmail(input: BookingInviteInput) {
  const when = formatInviteWhen(input.start, input.end);
  const link = input.meetingLink?.trim();
  const subject = `Reservación: ${input.roomLabel} — ${when}`;
  const textLines = [
    `Hola ${input.name},`,
    '',
    `Tu reservación de ${input.roomLabel} quedó confirmada.`,
    '',
    `Cuándo: ${when}`,
    `Dónde: ${input.roomLocation}`,
    `Motivo: ${input.purpose}`,
    input.peopleCount ? `Personas: ${input.peopleCount}` : '',
    link ? `Enlace de reunión: ${link}` : '',
    '',
    `Los horarios están en ${TZ} (${TZ_LABEL}).`,
  ].filter((line) => line !== '');
  const htmlLink = link
    ? `<p><strong>Enlace de reunión:</strong> <a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p>`
    : '';
  const html = `<!DOCTYPE html>
<html lang="es">
<body>
  <p>Hola ${escapeHtml(input.name)},</p>
  <p>Tu reservación de <strong>${escapeHtml(input.roomLabel)}</strong> quedó confirmada.</p>
  <p><strong>Cuándo:</strong> ${escapeHtml(when)}</p>
  <p><strong>Dónde:</strong> ${escapeHtml(input.roomLocation)}</p>
  <p><strong>Motivo:</strong> ${escapeHtml(input.purpose)}</p>
  ${input.peopleCount ? `<p><strong>Personas:</strong> ${escapeHtml(input.peopleCount)}</p>` : ''}
  ${htmlLink}
  <p>La invitación de calendario usa <strong>${TZ}</strong> (${TZ_LABEL}).</p>
</body>
</html>`;
  return { subject, text: textLines.join('\n'), html, when };
}

export function buildBookingInvite(input: BookingInviteInput) {
  const link = input.meetingLink?.trim() || undefined;
  const location = meetingLocation(input.roomLocation, link);
  const description = inviteDescription({ ...input, meetingLink: link });
  const times = googleEventTimes(input.start, input.end);
  const email = buildInviteEmail({ ...input, meetingLink: link });
  const ics = buildIcs({
    uid: uidFor(input),
    summary: `${input.roomLabel} - ${input.purpose}`,
    description,
    location,
    url: link,
    start: input.start,
    end: input.end,
    organizerName: input.name,
    organizerEmail: input.email,
    attendeeEmails: input.attendeeEmails,
  });
  return { location, description, times, email, ics, when: email.when };
}
