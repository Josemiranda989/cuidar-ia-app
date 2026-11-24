// Fechas de la API: 'YYYY-MM-DD' (date) y 'HH:MM' (time), siempre en hora local.
// Ojo: new Date().toISOString() da la fecha en UTC — en Argentina, después de las 21 hs
// devuelve el día siguiente. Por eso armamos la fecha local a mano.

const pad = (value) => String(value).padStart(2, '0');

export function toLocalISODate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// 'YYYY-MM-DD' → Date a medianoche local (new Date('YYYY-MM-DD') la interpreta en UTC).
export function parseISODate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(iso, days) {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toLocalISODate(date);
}

// 0 = domingo, igual que horario_toma.dias_semana.
export function weekdayOf(iso) {
  return parseISODate(iso).getDay();
}

// '2025-01-31' → '31/01/2025'
export function formatDate(iso) {
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

// '2026-11-20' → 'viernes, 20 de noviembre de 2026'
export function formatLongDate(iso) {
  return parseISODate(iso).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// '2025-01-31' → 'ene 2025'
export function formatMonthYear(iso) {
  if (!iso) return '';
  return parseISODate(iso)
    .toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })
    .replace('.', '');
}

// Date ISO completo (timestamptz) → 'HH:MM' local.
export function formatTimeOfDay(isoDateTime) {
  const date = new Date(isoDateTime);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function currentTimeHHMM(date = new Date()) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// [1,3,5] → 'Lun, Mié, Vie' · todos → 'Todos los días'
export function formatDias(dias = []) {
  if (dias.length === 7) return 'Todos los días';
  return dias.map((day) => DAY_SHORT[day]).join(', ');
}

export const DAY_OPTIONS = DAY_SHORT.map((label, value) => ({ value, label }));
