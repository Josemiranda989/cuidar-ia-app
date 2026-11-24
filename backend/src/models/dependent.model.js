import prisma from '../lib/prisma.js';
import {
  formatDate,
  formatTimestamp,
  isUuid,
  nullIfNotFound,
  parseDate
} from '../lib/serialize.js';

// Cuidador fijo: lo crea prisma/seed.js.
const caregiverId = '00000000-0000-4000-8000-000000000001';
const editableFields = [
  'nombre_completo',
  'fecha_nacimiento',
  'dni',
  'parentesco',
  'obra_social',
  'numero_afiliado',
  'notas'
];

function calculateAge(fechaNacimiento) {
  // La edad se deriva de la fecha de nacimiento y nunca se persiste.
  const [year, month, day] = fechaNacimiento.split('-').map(Number);
  const today = new Date();
  let age = today.getUTCFullYear() - year;
  const birthdayHasPassed =
    today.getUTCMonth() + 1 > month ||
    (today.getUTCMonth() + 1 === month && today.getUTCDate() >= day);

  if (!birthdayHasPassed) age -= 1;
  return age;
}

function serialize(dependent) {
  const fechaNacimiento = formatDate(dependent.fecha_nacimiento);
  return {
    ...dependent,
    fecha_nacimiento: fechaNacimiento,
    created_at: formatTimestamp(dependent.created_at),
    updated_at: formatTimestamp(dependent.updated_at),
    edad: calculateAge(fechaNacimiento)
  };
}

function toColumn(field, value) {
  return field === 'fecha_nacimiento' ? parseDate(value) : value;
}

async function getAll() {
  const dependents = await prisma.persona_a_cargo.findMany({
    orderBy: [{ created_at: 'asc' }, { id: 'asc' }]
  });
  return dependents.map(serialize);
}

async function getById(id) {
  if (!isUuid(id)) return null;
  const dependent = await prisma.persona_a_cargo.findUnique({ where: { id } });
  return dependent ? serialize(dependent) : null;
}

async function create(data) {
  const now = new Date();
  const dependent = await prisma.persona_a_cargo.create({
    data: {
      ...Object.fromEntries(
        editableFields.map((field) => [field, toColumn(field, data[field] ?? null)])
      ),
      cuidador_id: caregiverId,
      created_at: now,
      updated_at: now
    }
  });
  return serialize(dependent);
}

async function update(id, data) {
  if (!isUuid(id)) return null;
  const changes = Object.fromEntries(
    editableFields
      .filter((field) => Object.hasOwn(data, field))
      .map((field) => [field, toColumn(field, data[field])])
  );
  const dependent = await nullIfNotFound(
    prisma.persona_a_cargo.update({
      where: { id },
      data: { ...changes, updated_at: new Date() }
    })
  );
  return dependent ? serialize(dependent) : null;
}

async function remove(id) {
  if (!isUuid(id)) return null;
  const dependent = await nullIfNotFound(prisma.persona_a_cargo.delete({ where: { id } }));
  return dependent ? serialize(dependent) : null;
}

export default { getAll, getById, create, update, remove };
