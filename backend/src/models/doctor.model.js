import prisma from '../lib/prisma.js';
import { isUuid, nullIfNotFound, parseRaw, parseText, toChanges, toRow } from '../lib/serialize.js';

const columns = {
  persona_id: parseRaw,
  nombre: parseText,
  especialidad: parseText,
  matricula: parseText
};

// Con el mock era sincrónica; con Prisma devuelve una promesa.
async function peek(id) {
  if (!isUuid(id)) return null;
  return prisma.medico.findUnique({ where: { id } });
}

async function getAll(personaId) {
  if (personaId && !isUuid(personaId)) return [];
  return prisma.medico.findMany({
    where: personaId ? { persona_id: personaId } : {},
    orderBy: { id: 'asc' }
  });
}

async function getById(id) {
  return peek(id);
}

async function create(data) {
  return prisma.medico.create({ data: toRow(columns, data) });
}

async function update(id, data) {
  if (!isUuid(id)) return null;
  return nullIfNotFound(prisma.medico.update({ where: { id }, data: toChanges(columns, data) }));
}

async function remove(id) {
  if (!isUuid(id)) return null;
  return nullIfNotFound(prisma.medico.delete({ where: { id } }));
}

// Lo resuelve Postgres (ON DELETE CASCADE desde persona_a_cargo).
async function removeByPersona(personaId) {}

export default { peek, getAll, getById, create, update, remove, removeByPersona };
