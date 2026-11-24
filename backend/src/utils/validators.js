const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

export function isValidTime(value) {
  return typeof value === 'string' && TIME_PATTERN.test(value);
}

export function isValidDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

// numeric(5,2) mayor que cero: hasta 999.99, con dos decimales como máximo.
export function isValidAmount(value) {
  return (
    typeof value === 'number' &&
    value > 0 &&
    value <= 999.99 &&
    Math.round(value * 100) / 100 === value
  );
}

/**
 * Valida horarios: [{ hora: 'HH:MM', dias_semana?: [0..6] }].
 * Devuelve { error } o { value } normalizado (ordenado por hora, sin horas repetidas).
 */
export function parseHorarios(horarios) {
  if (!Array.isArray(horarios)) {
    return { error: 'horarios debe ser un array de { hora, dias_semana }' };
  }

  const seen = new Set();
  const value = [];
  for (const item of horarios) {
    if (!item || !isValidTime(item.hora)) {
      return { error: 'cada horario necesita hora con formato HH:MM' };
    }
    if (seen.has(item.hora)) {
      return { error: `la hora ${item.hora} está repetida` };
    }
    seen.add(item.hora);

    let dias;
    if (item.dias_semana !== undefined) {
      const valid =
        Array.isArray(item.dias_semana) &&
        item.dias_semana.length > 0 &&
        item.dias_semana.every((day) => Number.isInteger(day) && day >= 0 && day <= 6);
      if (!valid) {
        return { error: 'dias_semana debe ser un array no vacío de enteros 0-6 (0 = domingo)' };
      }
      dias = [...new Set(item.dias_semana)].sort((a, b) => a - b);
    }
    value.push({ hora: item.hora, dias_semana: dias });
  }

  value.sort((a, b) => a.hora.localeCompare(b.hora));
  return { value };
}
