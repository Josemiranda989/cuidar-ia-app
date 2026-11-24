import prisma from '../lib/prisma.js';
import {
  formatDate,
  formatDecimal,
  formatTime,
  isUuid,
  nullIfNotFound,
  parseDate,
  parseRaw,
  parseText,
  parseTime,
  toChanges,
  toRow
} from '../lib/serialize.js';

const columns = {
  persona_id: parseRaw,
  medico_id: parseRaw,
  droga: parseText,
  nombre_comercial: parseText,
  concentracion: parseText,
  cantidad_por_toma: parseRaw,
  forma: parseRaw,
  via: parseText,
  motivo: parseText,
  indicaciones: parseText,
  es_sos: parseRaw,
  estado: parseRaw,
  fecha_inicio: parseDate,
  fecha_fin: parseDate,
  motivo_baja: parseText
};

// horario_toma: 1..N por medicación (una SOS no tiene horarios).
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

// Un horario que se quita pero tiene tomas no se puede borrar: toma.horario_id es NOT NULL.
// Se retira dejándolo sin días, algo que la API no permite cargar. Así el historial se conserva.
const isActive = { dias_semana: { isEmpty: false } };

// La API devuelve la medicación con sus horarios y su médico embebidos.
const relations = {
  horarios: { where: isActive, orderBy: { hora: 'asc' } },
  medico: true
};

// La base quita horarios con varias consultas: con latencia alta, 5 s (default) puede no alcanzar.
const transactionOptions = { maxWait: 10_000, timeout: 20_000 };

function serialize({ horarios, medico, ...medication }) {
  return {
    ...medication,
    cantidad_por_toma: formatDecimal(medication.cantidad_por_toma),
    fecha_inicio: formatDate(medication.fecha_inicio),
    fecha_fin: formatDate(medication.fecha_fin),
    horarios: horarios.map(({ id, hora, dias_semana }) => ({
      id,
      hora: formatTime(hora),
      dias_semana
    })),
    medico
  };
}

function toScheduleRow({ hora, dias_semana }) {
  return { hora: parseTime(hora), dias_semana: dias_semana ?? ALL_DAYS };
}

// Reemplaza el set de horarios. Conserva el id de los que mantienen la misma hora,
// así las tomas ya registradas para ese horario no quedan huérfanas.
async function replaceSchedules(tx, medicacionId, horarios) {
  const previous = await tx.horario_toma.findMany({
    where: { medicacion_id: medicacionId, ...isActive }
  });
  const previousByHora = new Map(previous.map((schedule) => [formatTime(schedule.hora), schedule]));
  const added = [];

  for (const horario of horarios) {
    const row = toScheduleRow(horario);
    const kept = previousByHora.get(horario.hora);
    if (kept) {
      previousByHora.delete(horario.hora);
      await tx.horario_toma.update({
        where: { id: kept.id },
        data: { dias_semana: row.dias_semana }
      });
    } else {
      added.push({ ...row, medicacion_id: medicacionId });
    }
  }

  const removedIds = [...previousByHora.values()].map((schedule) => schedule.id);
  if (removedIds.length) {
    await tx.horario_toma.deleteMany({ where: { id: { in: removedIds }, tomas: { none: {} } } });
    await tx.horario_toma.updateMany({
      where: { id: { in: removedIds } },
      data: { dias_semana: [] }
    });
  }
  if (added.length) await tx.horario_toma.createMany({ data: added });
}

async function getAll(personaId) {
  if (personaId && !isUuid(personaId)) return [];
  const medications = await prisma.medicacion.findMany({
    where: personaId ? { persona_id: personaId } : {},
    include: relations,
    orderBy: { id: 'asc' }
  });
  return medications.map(serialize);
}

async function getById(id) {
  if (!isUuid(id)) return null;
  const medication = await prisma.medicacion.findUnique({ where: { id }, include: relations });
  return medication ? serialize(medication) : null;
}

// Busca un horario y la medicación a la que pertenece (para registrar tomas).
async function getSchedule(horarioId) {
  if (!isUuid(horarioId)) return null;
  const found = await prisma.horario_toma.findFirst({
    where: { id: horarioId, ...isActive },
    include: { medicacion: { include: relations } }
  });
  if (!found) return null;

  const { medicacion, ...schedule } = found;
  return {
    schedule: { ...schedule, hora: formatTime(schedule.hora) },
    medication: serialize(medicacion)
  };
}

async function create(data) {
  const esSos = data.es_sos ?? false;
  const horarios = esSos ? [] : data.horarios ?? [];
  const medication = await prisma.medicacion.create({
    data: {
      ...toRow(columns, data),
      estado: data.estado ?? 'activa',
      es_sos: esSos,
      horarios: { create: horarios.map(toScheduleRow) }
    },
    include: relations
  });
  return serialize(medication);
}

async function update(id, data) {
  if (!isUuid(id)) return null;

  const medication = await nullIfNotFound(
    prisma.$transaction(async (tx) => {
      const updated = await tx.medicacion.update({
        where: { id },
        data: toChanges(columns, data),
        include: relations
      });
      if (updated.es_sos) {
        await replaceSchedules(tx, id, []);
      } else if (Object.hasOwn(data, 'horarios')) {
        await replaceSchedules(tx, id, data.horarios);
      } else {
        return updated;
      }
      return tx.medicacion.findUniqueOrThrow({ where: { id }, include: relations });
    }, transactionOptions)
  );
  return medication ? serialize(medication) : null;
}

async function remove(id) {
  if (!isUuid(id)) return null;
  const medication = await nullIfNotFound(
    prisma.medicacion.delete({ where: { id }, include: relations })
  );
  return medication ? { ...serialize(medication), medico: null } : null;
}

// Lo resuelve Postgres (ON DELETE SET NULL desde medico).
async function clearDoctor(medicoId) {}

// Lo resuelve Postgres (ON DELETE CASCADE desde persona_a_cargo): no quedan ids por cascadear.
async function removeByPersona(personaId) {
  return [];
}

export default {
  getAll,
  getById,
  getSchedule,
  create,
  update,
  remove,
  clearDoctor,
  removeByPersona
};
