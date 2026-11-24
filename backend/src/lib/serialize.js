// Conversión entre los tipos de Prisma y el formato de la API.
// date y time no tienen zona horaria: se leen y escriben siempre en UTC.

const UUID_PATTERN = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

// Base → API
export function formatDate(value) {
  return value ? value.toISOString().slice(0, 10) : null;
}

export function formatTime(value) {
  return value ? value.toISOString().slice(11, 16) : null;
}

export function formatTimestamp(value) {
  return value ? value.toISOString() : null;
}

export function formatDecimal(value) {
  return value === null ? null : Number(value);
}

// API → base. El formato ya lo validaron los controllers.
export function parseDate(value) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

export function parseTime(value) {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

// Los textos opcionales no se validan en los controllers: un dni numérico se guarda como texto.
export function parseText(value) {
  return value === null || value === undefined ? null : String(value);
}

export function parseRaw(value) {
  return value;
}

// columns: { campo editable: conversión }. El resto del body se ignora.
export function toRow(columns, data) {
  return Object.fromEntries(
    Object.entries(columns).map(([field, parse]) => [field, parse(data[field] ?? null)])
  );
}

// Como toRow, pero solo con los campos que vienen en el body (PATCH).
export function toChanges(columns, data) {
  return Object.fromEntries(
    Object.entries(columns)
      .filter(([field]) => Object.hasOwn(data, field))
      .map(([field, parse]) => [field, parse(data[field])])
  );
}

// P2025: el registro no existe. Los models devuelven null y el controller responde 404.
export async function nullIfNotFound(promise) {
  try {
    return await promise;
  } catch (error) {
    if (error.code === 'P2025') return null;
    throw error;
  }
}
