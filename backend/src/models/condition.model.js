import prisma from '../lib/prisma.js';
import { isUuid, nullIfNotFound } from '../lib/serialize.js';

const editableFields = ['persona_id', 'tipo', 'descripcion'];

async function getAll(personaId) {
  if (personaId && !isUuid(personaId)) return [];
  return prisma.condicion.findMany({
    where: personaId ? { persona_id: personaId } : {},
    orderBy: [{ descripcion: 'asc' }, { id: 'asc' }]
  });
}

async function getById(id) {
  if (!isUuid(id)) return null;
  return prisma.condicion.findUnique({ where: { id } });
}

async function create(data) {
  return prisma.condicion.create({
    data: Object.fromEntries(editableFields.map((field) => [field, data[field] ?? null]))
  });
}

async function update(id, data) {
  if (!isUuid(id)) return null;
  const changes = Object.fromEntries(
    editableFields
      .filter((field) => Object.hasOwn(data, field))
      .map((field) => [field, data[field]])
  );
  return nullIfNotFound(prisma.condicion.update({ where: { id }, data: changes }));
}

async function remove(id) {
  if (!isUuid(id)) return null;
  return nullIfNotFound(prisma.condicion.delete({ where: { id } }));
}

// Lo resuelve Postgres (ON DELETE CASCADE desde persona_a_cargo).
async function removeByPersona(personaId) {}

export default { getAll, getById, create, update, remove, removeByPersona };
