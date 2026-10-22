import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TZ, TZ_LABEL } from './config';
import { buildBookingInvite } from './invite';
import { localDateTimeToDate } from './time';

const SAMPLE_LINK = 'https://meet.google.com/abc-defg-hij';

function sampleInvite() {
  const start = localDateTimeToDate('2026-10-22', '11:00');
  const end = localDateTimeToDate('2026-10-22', '12:00');
  return buildBookingInvite({
    roomLabel: 'Sala principal',
    roomLocation: 'Treve - Sala principal',
    start,
    end,
    name: 'Sample Booker',
    email: 'sample.booker@example.com',
    purpose: 'Reunión de prueba',
    peopleCount: '4',
    meetingLink: SAMPLE_LINK,
    attendeeEmails: ['sample.booker@example.com', 'guest.sample@example.com'],
    uid: 'sample-20261022T110000@reservaciones-salas-treve',
  });
}

test('11:00 Tijuana is stored as 18:00 UTC (not Mexico City noon)', () => {
  const start = localDateTimeToDate('2026-10-22', '11:00');
  assert.equal(start.toISOString(), '2026-10-22T18:00:00.000Z');
});

test('Google event uses local wall time + America/Tijuana TZID, not UTC Z', () => {
  const invite = sampleInvite();
  assert.equal(invite.times.start.timeZone, 'America/Tijuana');
  assert.equal(invite.times.end.timeZone, 'America/Tijuana');
  assert.equal(invite.times.start.dateTime, '2026-10-22T11:00:00');
  assert.equal(invite.times.end.dateTime, '2026-10-22T12:00:00');
  assert.equal(invite.times.start.dateTime.includes('Z'), false);
});

test('ICS carries TZID America/Tijuana and 11:00 local, not Mexico City 12:00', () => {
  const ics = sampleInvite().ics;
  assert.match(ics, /TZID:America\/Tijuana/);
  assert.match(ics, /DTSTART;TZID=America\/Tijuana:20261022T110000/);
  assert.match(ics, /DTEND;TZID=America\/Tijuana:20261022T120000/);
  assert.equal(ics.includes('America/Mexico_City'), false);
  assert.equal(ics.includes('hora del centro de México'), false);
  assert.equal(/DTSTART:20261022T180000Z/.test(ics), false);
});

test('meeting link is in ICS LOCATION, URL, and DESCRIPTION', () => {
  const invite = sampleInvite();
  assert.match(invite.ics, new RegExp(`URL:${SAMPLE_LINK}`));
  assert.equal(invite.location.includes(SAMPLE_LINK), true);
  assert.equal(invite.description.includes(`Enlace de reunión: ${SAMPLE_LINK}`), true);
  assert.match(invite.ics, /LOCATION:Treve - Sala principal/);
  assert.match(invite.ics, /DESCRIPTION:[\s\S]*Enlace de reunión/);
});

test('email body uses Tijuana local time and includes the meeting link', () => {
  const { email, when } = sampleInvite();
  assert.equal(when.includes(TZ_LABEL), true);
  assert.equal(when.toLowerCase().includes('11:00'), true);
  assert.equal(email.text.includes(SAMPLE_LINK), true);
  assert.equal(email.html.includes(SAMPLE_LINK), true);
  assert.equal(email.text.includes(TZ), true);
  assert.equal(email.html.includes('hora del centro de México'), false);
  assert.equal(email.text.includes('hora del centro de México'), false);
});

test('optional meeting link can be omitted', () => {
  const start = localDateTimeToDate('2026-10-22', '11:00');
  const end = localDateTimeToDate('2026-10-22', '12:00');
  const invite = buildBookingInvite({
    roomLabel: 'Salita 2',
    roomLocation: 'Treve - Salita 2',
    start,
    end,
    name: 'Sample Booker',
    email: 'sample.booker@example.com',
    purpose: 'Standup',
    attendeeEmails: ['sample.booker@example.com'],
  });
  assert.equal(invite.location, 'Treve - Salita 2');
  assert.equal(invite.ics.includes('\r\nURL:'), false);
  assert.equal(invite.description.includes('Enlace de reunión'), false);
});
