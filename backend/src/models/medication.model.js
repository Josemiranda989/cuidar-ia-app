import prisma from '../lib/prisma.js';
import {
  formatDate,
  formatDecimal,
  formatTime,
  isUuid,
  nullIfNotFound,
  parseDate,
  parseTime
} from '../lib/serialize.js';

const editableFields = [
  'persona_id',
  'medico_id',
  'droga',
  'nombre_comercial',
  'concentracion',
  'cantidad_por_toma',
  'forma',
  'via',
  'motivo',
  'indicaciones',
  'es_sos',
  'estado',
  'fecha_inicio',
  'fecha_fin',
  'motivo_baja'
];
const dateFields = ['fecha_inicio', 'fecha_fin'];

// horario_toma: 1..N por medicación (una SOS no tiene horarios).
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

// La API devuelve la medicación con sus horarios y su médico embebidos.
const relations = { horarios: { orderBy: { hora: 'asc' } }, medico: true };

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

function toColumn(field, value) {
  return dateFields.includes(field) ? parseDate(value) : value;
}

function toScheduleRow({ hora, dias_semana }) {
  return { hora: parseTime(hora), dias_semana: dias_semana ?? ALL_DAYS };
}

// Reemplaza el set de horarios. Conserva el id de los que mantienen la misma hora,
// así las tomas ya registradas siguen vinculadas. En las demás, horario_id queda en NULL.
function replaceSchedules(medicacionId, horarios) {
  const rows = horarios.map(toScheduleRow);
  return {
    deleteMany: { hora: { notIn: rows.map((row) => row.hora) } },
    upsert: rows.map((row) => ({
      where: { medicacion_id_hora: { medicacion_id: medicacionId, hora: row.hora } },
      create: row,
      update: { dias_semana: row.dias_semana }
    }))
  };
}

async function getAll(personaId) {
  if (personaId && !isUuid(personaId)) return [];
  const medications = await prisma.medicacion.findMany({
    where: personaId ? { persona_id: personaId } : {},
    include: relations,
    orderBy: [{ fecha_inicio: 'asc' }, { id: 'asc' }]
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
  const found = await prisma.horario_toma.findUnique({
    where: { id: horarioId },
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
      ...Object.fromEntries(
        editableFields.map((field) => [field, toColumn(field, data[field] ?? null)])
      ),
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
  const current = await prisma.medicacion.findUnique({ where: { id }, select: { es_sos: true } });
  if (!current) return null;

  const changes = Object.fromEntries(
    editableFields
      .filter((field) => Object.hasOwn(data, field))
      .map((field) => [field, toColumn(field, data[field])])
  );
  const esSos = Object.hasOwn(data, 'es_sos') ? data.es_sos : current.es_sos;
  if (esSos) {
    changes.horarios = { deleteMany: {} };
  } else if (Object.hasOwn(data, 'horarios')) {
    changes.horarios = replaceSchedules(id, data.horarios);
  }

  const medication = await nullIfNotFound(
    prisma.medicacion.update({ where: { id }, data: changes, include: relations })
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
