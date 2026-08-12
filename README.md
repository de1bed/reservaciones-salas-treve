# Reservaciones salas Treve

App Next.js para Vercel que reserva automáticamente salas usando Google Calendar.

## Variables Vercel requeridas

- `GOOGLE_CLIENT_EMAIL`: client_email de service account Google Cloud.
- `GOOGLE_PRIVATE_KEY`: private_key de service account, con saltos `\n` escapados.
- Opcionales: `CALENDAR_SALA_PRINCIPAL`, `CALENDAR_SALITA_2`, `SLOT_MINUTES`, `BUFFER_MINUTES`, `BOOKING_DAYS_AHEAD`, `WORK_START`, `WORK_END`.

## Calendarios

- Sala principal: `693f020ff342203f534f466ab4b1bd38443c05125ff10c4a68d1e71164f761a5@group.calendar.google.com`
- Salita 2: `02210b596246b2ad631e204a0bdeb90e11464d4ad13b9adc793a117cf26238e9@group.calendar.google.com`

Comparte ambos calendarios con el service account como `Make changes to events`.
