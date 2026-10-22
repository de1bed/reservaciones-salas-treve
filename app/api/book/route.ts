import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ROOMS, type RoomId, BUFFER_MINUTES, TZ } from '../../../lib/config';
import { addMinutes, assertBookingWindow, formatLabel, overlaps, validateWorkHours } from '../../../lib/time';
import { getCalendarClient } from '../../../lib/google';
import { buildBookingInvite } from '../../../lib/invite';

const email = z.string().email();
const Schema = z.object({
  roomId: z.enum(['sala_principal', 'salita_2']),
  startIso: z.string(),
  endIso: z.string(),
  name: z.string().trim().min(1).max(120),
  email,
  purpose: z.string().trim().min(1).max(500),
  peopleCount: z.string().max(30).optional().default(''),
  guests: z.string().max(1000).optional().default(''),
  meetingLink: z
    .string()
    .trim()
    .max(500)
    .optional()
    .default('')
    .refine((s) => !s || /^https?:\/\/\S+$/i.test(s), 'El enlace de reunión no es una URL válida.'),
});

function parseGuests(s: string) {
  return s
    .split(/[;,\n]/)
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)
    .map((x) => email.parse(x));
}

export async function POST(req: Request) {
  try {
    const input = Schema.parse(await req.json());
    const start = new Date(input.startIso);
    const end = new Date(input.endIso);
    if (isNaN(+start) || isNaN(+end) || end <= start) throw new Error('Horario inválido.');
    const date = new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(start);
    assertBookingWindow(date);
    validateWorkHours(start, end);
    const room = ROOMS[input.roomId as RoomId];
    const cal = getCalendarClient();
    const events = await cal.events.list({
      calendarId: room.calendarId,
      timeMin: addMinutes(start, -BUFFER_MINUTES).toISOString(),
      timeMax: addMinutes(end, BUFFER_MINUTES).toISOString(),
      singleEvents: true,
    });
    const conflict = (events.data.items || []).some(
      (e) =>
        e.start?.dateTime &&
        e.end?.dateTime &&
        overlaps(start, end, new Date(e.start.dateTime), new Date(e.end.dateTime)),
    );
    if (conflict) throw new Error('Ese horario se acaba de ocupar. Por favor elige otro.');
    const attendees = Array.from(new Set([input.email.toLowerCase(), ...parseGuests(input.guests)])).map((e) => ({
      email: e,
    }));
    const invite = buildBookingInvite({
      roomLabel: room.label,
      roomLocation: room.location,
      start,
      end,
      name: input.name,
      email: input.email,
      purpose: input.purpose,
      peopleCount: input.peopleCount,
      meetingLink: input.meetingLink,
      attendeeEmails: attendees.map((a) => a.email),
    });
    // Google Calendar builds the attendee email + ICS from these fields.
    // dateTime is local wall time (no Z) so ICS gets TZID=America/Tijuana.
    const created = await cal.events.insert({
      calendarId: room.calendarId,
      sendUpdates: 'all',
      requestBody: {
        summary: `${room.label} - ${input.purpose}`,
        location: invite.location,
        ...invite.times,
        attendees,
        transparency: 'opaque',
        description: invite.description,
      },
    });
    return NextResponse.json({
      ok: true,
      eventId: created.data.id,
      htmlLink: created.data.htmlLink,
      room: room.label,
      startLabel: formatLabel(start, end),
      when: invite.when,
      timeZone: TZ,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error' }, { status: 400 });
  }
}
