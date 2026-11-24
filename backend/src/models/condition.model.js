import prisma from '../lib/prisma.js';
import { isUuid, nullIfNotFound, parseRaw, parseText, toChanges, toRow } from '../lib/serialize.js';

const columns = {
  persona_id: parseRaw,
  tipo: parseRaw,
  descripcion: parseText
};

async function getAll(personaId) {
  if (personaId && !isUuid(personaId)) return [];
  return prisma.condicion.findMany({
    where: personaId ? { persona_id: personaId } : {},
    orderBy: { id: 'asc' }
  });
}

async function getById(id) {
  if (!isUuid(id)) return null;
  return prisma.condicion.findUnique({ where: { id } });
}

async function create(data) {
  return prisma.condicion.create({ data: toRow(columns, data) });
}

async function update(id, data) {
  if (!isUuid(id)) return null;
  return nullIfNotFound(prisma.condicion.update({ where: { id }, data: toChanges(columns, data) }));
}

async function remove(id) {
  if (!isUuid(id)) return null;
  return nullIfNotFound(prisma.condicion.delete({ where: { id } }));
}

// Lo resuelve Postgres (ON DELETE CASCADE desde persona_a_cargo).
async function removeByPersona(personaId) {}

export default { getAll, getById, create, update, remove, removeByPersona };
