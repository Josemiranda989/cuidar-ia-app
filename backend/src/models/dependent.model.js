import { randomUUID } from 'node:crypto';

const caregiverId = 'cuidador-123';
const editableFields = [
  'nombre_completo',
  'fecha_nacimiento',
  'dni',
  'parentesco',
  'obra_social',
  'numero_afiliado',
  'notas'
];

const dependents = [
  {
    id: 'elsa-01',
    cuidador_id: caregiverId,
    nombre_completo: 'Elsa',
    fecha_nacimiento: '1948-01-01',
    dni: null,
    parentesco: null,
    obra_social: null,
    numero_afiliado: null,
    notas: null,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'otro-99',
    cuidador_id: caregiverId,
    nombre_completo: 'Otra persona',
    fecha_nacimiento: '1955-01-01',
    dni: null,
    parentesco: null,
    obra_social: null,
    numero_afiliado: null,
    notas: null,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  }
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
  return { ...dependent, edad: calculateAge(dependent.fecha_nacimiento) };
}

async function getAll() {
  return dependents.map(serialize);
}

async function getById(id) {
  const dependent = dependents.find((item) => item.id === id);
  return dependent ? serialize(dependent) : null;
}

async function create(data) {
  const now = new Date().toISOString();
  const dependent = Object.fromEntries(
    editableFields.map((field) => [field, data[field] ?? null])
  );

  Object.assign(dependent, {
    id: randomUUID(),
    cuidador_id: caregiverId,
    created_at: now,
    updated_at: now
  });
  dependents.push(dependent);

  return serialize(dependent);
}

async function update(id, data) {
  const dependent = dependents.find((item) => item.id === id);
  if (!dependent) return null;

  for (const field of editableFields) {
    if (Object.hasOwn(data, field)) dependent[field] = data[field];
  }
  dependent.updated_at = new Date().toISOString();

  return serialize(dependent);
}

async function remove(id) {
  const index = dependents.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const [dependent] = dependents.splice(index, 1);
  return serialize(dependent);
}

export default { getAll, getById, create, update, remove };
