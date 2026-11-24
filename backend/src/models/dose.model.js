import prisma from '../lib/prisma.js';
import {
  formatDate,
  formatTime,
  formatTimestamp,
  isUuid,
  nullIfNotFound,
  parseDate,
  parseTime
} from '../lib/serialize.js';

// toma: registro de que un horario de un día se administró u omitió.
// Un solo registro por (horario_id, fecha): registrar de nuevo lo reemplaza.
function serialize(dose) {
  return {
    ...dose,
    fecha: formatDate(dose.fecha),
    hora_programada: formatTime(dose.hora_programada),
    registrada_at: formatTimestamp(dose.registrada_at)
  };
}

async function getAll({ medicacionIds, fecha } = {}) {
  const where = {};
  if (medicacionIds) where.medicacion_id = { in: medicacionIds.filter(isUuid) };
  if (fecha) where.fecha = parseDate(fecha);

  const doses = await prisma.toma.findMany({
    where,
    orderBy: [{ registrada_at: 'asc' }, { id: 'asc' }]
  });
  return doses.map(serialize);
}

async function getById(id) {
  if (!isUuid(id)) return null;
  const dose = await prisma.toma.findUnique({ where: { id } });
  return dose ? serialize(dose) : null;
}

// Devuelve { dose, created } para que el controller elija 201 o 200.
async function upsert({ horario_id, medicacion_id, fecha, hora_programada, estado }) {
  const now = new Date();
  const day = parseDate(fecha);

  try {
    const dose = await prisma.toma.create({
      data: {
        horario_id,
        medicacion_id,
        fecha: day,
        hora_programada: parseTime(hora_programada),
        estado,
        registrada_at: now
      }
    });
    return { dose: serialize(dose), created: true };
  } catch (error) {
    // P2002: ya había una toma para ese horario y fecha. El UNIQUE evita duplicados
    // aunque lleguen dos registros a la vez.
    if (error.code !== 'P2002') throw error;
    const dose = await prisma.toma.update({
      where: { horario_id_fecha: { horario_id, fecha: day } },
      data: { estado, registrada_at: now }
    });
    return { dose: serialize(dose), created: false };
  }
}

async function remove(id) {
  if (!isUuid(id)) return null;
  const dose = await nullIfNotFound(prisma.toma.delete({ where: { id } }));
  return dose ? serialize(dose) : null;
}

// Lo resuelve Postgres (ON DELETE CASCADE desde medicacion).
async function removeByMedication(medicacionId) {}

export default { getAll, getById, upsert, remove, removeByMedication };
