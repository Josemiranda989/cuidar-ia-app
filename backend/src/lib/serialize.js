import { isValidDate, isValidTime } from '../utils/validators.js';

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

// API → base. Un valor inválido da Invalid Date y Prisma lo rechaza
// (sin esto, '2025-02-30' se guardaría como 2 de marzo).
export function parseDate(value) {
  if (value === null || value === undefined || value === '') return null;
  return new Date(isValidDate(value) ? `${value}T00:00:00.000Z` : NaN);
}

export function parseTime(value) {
  return new Date(isValidTime(value) ? `1970-01-01T${value}:00.000Z` : NaN);
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
