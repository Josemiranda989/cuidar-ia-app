import { randomUUID } from 'node:crypto';

const editableFields = ['persona_id', 'tipo', 'descripcion'];

const conditions = [
  {
    id: 'cond-elsa-01',
    persona_id: 'elsa-01',
    tipo: 'diagnostico',
    descripcion: 'Hipertensión'
  },
  {
    id: 'cond-elsa-02',
    persona_id: 'elsa-01',
    tipo: 'diagnostico',
    descripcion: 'Hipotiroidismo'
  }
];

async function getAll(personaId) {
  const result = personaId
    ? conditions.filter((condition) => condition.persona_id === personaId)
    : conditions;
  return result.map((condition) => ({ ...condition }));
}

async function getById(id) {
  const condition = conditions.find((item) => item.id === id);
  return condition ? { ...condition } : null;
}

async function create(data) {
  const condition = Object.fromEntries(
    editableFields.map((field) => [field, data[field] ?? null])
  );
  condition.id = randomUUID();
  conditions.push(condition);
  return { ...condition };
}

async function update(id, data) {
  const condition = conditions.find((item) => item.id === id);
  if (!condition) return null;

  for (const field of editableFields) {
    if (Object.hasOwn(data, field)) condition[field] = data[field];
  }
  return { ...condition };
}

async function remove(id) {
  const index = conditions.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const [condition] = conditions.splice(index, 1);
  return { ...condition };
}

// ON DELETE CASCADE desde persona_a_cargo.
async function removeByPersona(personaId) {
  for (let i = conditions.length - 1; i >= 0; i -= 1) {
    if (conditions[i].persona_id === personaId) conditions.splice(i, 1);
  }
}

export default { getAll, getById, create, update, remove, removeByPersona };
