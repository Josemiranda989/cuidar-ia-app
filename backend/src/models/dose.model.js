import { randomUUID } from 'node:crypto';

// toma: registro de que un horario de un día se administró u omitió.
// Un solo registro por (horario_id, fecha): registrar de nuevo lo reemplaza.
const doses = [];

async function getAll({ medicacionIds, fecha } = {}) {
  return doses
    .filter((dose) => !medicacionIds || medicacionIds.includes(dose.medicacion_id))
    .filter((dose) => !fecha || dose.fecha === fecha)
    .map((dose) => ({ ...dose }));
}

async function getById(id) {
  const dose = doses.find((item) => item.id === id);
  return dose ? { ...dose } : null;
}

// Devuelve { dose, created } para que el controller elija 201 o 200.
async function upsert({ horario_id, medicacion_id, fecha, hora_programada, estado }) {
  const now = new Date().toISOString();
  const existing = doses.find(
    (dose) => dose.horario_id === horario_id && dose.fecha === fecha
  );

  if (existing) {
    existing.estado = estado;
    existing.registrada_at = now;
    return { dose: { ...existing }, created: false };
  }

  const dose = {
    id: randomUUID(),
    horario_id,
    medicacion_id,
    fecha,
    hora_programada,
    estado,
    registrada_at: now
  };
  doses.push(dose);
  return { dose: { ...dose }, created: true };
}

async function remove(id) {
  const index = doses.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const [dose] = doses.splice(index, 1);
  return { ...dose };
}

// ON DELETE CASCADE desde medicacion.
async function removeByMedication(medicacionId) {
  for (let i = doses.length - 1; i >= 0; i -= 1) {
    if (doses[i].medicacion_id === medicacionId) doses.splice(i, 1);
  }
}

export default { getAll, getById, upsert, remove, removeByMedication };
