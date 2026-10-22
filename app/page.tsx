'use client';
import { useEffect, useState } from 'react';

const rooms = { sala_principal: 'Sala principal', salita_2: 'Salita 2' };
type Slot = { startIso: string; endIso: string; label: string };

export default function Page() {
  const [room, setRoom] = useState('sala_principal');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState(60);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ t: string; k: 'ok' | 'err' } | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [purpose, setPurpose] = useState('');
  const [people, setPeople] = useState('');
  const [guests, setGuests] = useState('');
  const [meetingLink, setMeetingLink] = useState('');

  useEffect(() => {
    const d = new Date();
    setDate(d.toISOString().slice(0, 10));
  }, []);

  async function check() {
    setLoading(true);
    setMsg(null);
    setSlots([]);
    setSlot(null);
    try {
      const r = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ roomId: room, date, durationMinutes: duration }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Error');
      setSlots(j.slots);
      if (!j.slots.length) setMsg({ k: 'err', t: 'No hay horarios disponibles para esa fecha/duración.' });
    } catch (e: any) {
      setMsg({ k: 'err', t: e.message });
    } finally {
      setLoading(false);
    }
  }

  async function book() {
    if (!slot) return;
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetch('/api/book', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          roomId: room,
          startIso: slot.startIso,
          endIso: slot.endIso,
          name,
          email,
          purpose,
          peopleCount: people,
          guests,
          meetingLink,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Error');
      setMsg({
        k: 'ok',
        t: `Reservación confirmada: ${j.room}, ${j.when || j.startLabel}. Se envió invitación al correo indicado.`,
      });
      setSlots([]);
      setSlot(null);
    } catch (e: any) {
      setMsg({ k: 'err', t: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="wrap">
      <div className="card">
        <h1>Reservar sala de juntas</h1>
        <p>Selecciona sala, fecha y duración. Sólo se mostrarán horarios disponibles.</p>
        <div className="row">
          <div>
            <label htmlFor="room">Sala</label>
            <select id="room" value={room} onChange={(e) => setRoom(e.target.value)}>
              {Object.entries(rooms).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="duration">Duración</label>
            <select id="duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              {[30, 60, 90, 120, 180, 240].map((m) => (
                <option key={m} value={m}>
                  {m < 60
                    ? `${m} minutos`
                    : `${m / 60} hora${m > 60 ? 's' : ''}${m % 60 ? ' 30 minutos' : ''}`}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label htmlFor="date">Fecha</label>
        <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button onClick={check} disabled={loading || !date}>
          {loading ? 'Consultando...' : 'Ver horarios disponibles'}
        </button>
        <div className="slots">
          {slots.map((s) => (
            <button
              type="button"
              key={s.startIso}
              onClick={() => setSlot(s)}
              className={'slot ' + (slot?.startIso === s.startIso ? 'selected' : '')}
            >
              {s.label}
            </button>
          ))}
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '24px 0' }} />
        <div className="row">
          <div>
            <label htmlFor="name">Nombre</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
          </div>
          <div>
            <label htmlFor="email">Correo</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@empresa.com"
            />
          </div>
        </div>
        <label htmlFor="purpose">Motivo</label>
        <textarea
          id="purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="Ej. Reunión con cliente, capacitación, entrevista..."
        />
        <div className="row">
          <div>
            <label htmlFor="people">Número de personas</label>
            <input id="people" value={people} onChange={(e) => setPeople(e.target.value)} placeholder="Ej. 6" />
          </div>
          <div>
            <label htmlFor="guests">Invitados adicionales</label>
            <input
              id="guests"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              placeholder="correos separados por coma"
            />
          </div>
        </div>
        <label htmlFor="meetingLink">Enlace de reunión (opcional)</label>
        <input
          id="meetingLink"
          type="url"
          value={meetingLink}
          onChange={(e) => setMeetingLink(e.target.value)}
          placeholder="https://meet.google.com/… o https://zoom.us/j/…"
        />
        <button onClick={book} disabled={loading || !slot}>
          Confirmar reservación
        </button>
        {msg && <div className={`msg ${msg.k}`}>{msg.t}</div>}
        <p className="small">Horario base: lunes a viernes de 7:00 a.m. a 5:00 p.m. Zona: America/Tijuana.</p>
      </div>
    </main>
  );
}
