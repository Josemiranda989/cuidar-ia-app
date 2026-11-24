import { randomUUID } from 'node:crypto';

const editableFields = ['persona_id', 'nombre', 'especialidad', 'matricula'];

const doctors = [
  {
    id: 'medico-elsa-01',
    persona_id: 'elsa-01',
    nombre: 'Dra. Pérez',
    especialidad: 'Clínica médica',
    matricula: null
  }
];

// Lectura sincrónica para que otros modelos puedan embeber el médico al serializar.
function peek(id) {
  const doctor = doctors.find((item) => item.id === id);
  return doctor ? { ...doctor } : null;
}

async function getAll(personaId) {
  const result = personaId
    ? doctors.filter((doctor) => doctor.persona_id === personaId)
    : doctors;
  return result.map((doctor) => ({ ...doctor }));
}

async function getById(id) {
  return peek(id);
}

async function create(data) {
  const doctor = Object.fromEntries(
    editableFields.map((field) => [field, data[field] ?? null])
  );
  doctor.id = randomUUID();
  doctors.push(doctor);
  return { ...doctor };
}

async function update(id, data) {
  const doctor = doctors.find((item) => item.id === id);
  if (!doctor) return null;

  for (const field of editableFields) {
    if (Object.hasOwn(data, field)) doctor[field] = data[field];
  }
  return { ...doctor };
}

async function remove(id) {
  const index = doctors.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const [doctor] = doctors.splice(index, 1);
  return { ...doctor };
}

// ON DELETE CASCADE desde persona_a_cargo.
async function removeByPersona(personaId) {
  for (let i = doctors.length - 1; i >= 0; i -= 1) {
    if (doctors[i].persona_id === personaId) doctors.splice(i, 1);
  }
}

export default { peek, getAll, getById, create, update, remove, removeByPersona };
