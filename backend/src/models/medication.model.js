import { randomUUID } from 'node:crypto';
import doctorModel from './doctor.model.js';

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

const medications = [
  {
    id: 'med-elsa-01',
    persona_id: 'elsa-01',
    medico_id: 'medico-elsa-01',
    droga: 'enalapril',
    nombre_comercial: 'Enalapril',
    concentracion: '10 mg',
    cantidad_por_toma: 1,
    forma: 'comprimido',
    via: 'oral',
    motivo: 'Hipertensión',
    indicaciones: 'Una toma por día',
    es_sos: false,
    estado: 'activa',
    fecha_inicio: '2025-01-01',
    fecha_fin: null,
    motivo_baja: null
  },
  {
    id: 'med-elsa-02',
    persona_id: 'elsa-01',
    medico_id: null,
    droga: 'levotiroxina',
    nombre_comercial: 'Levotiroxina',
    concentracion: '50 mcg',
    cantidad_por_toma: 1,
    forma: 'comprimido',
    via: 'oral',
    motivo: 'Hipotiroidismo',
    indicaciones: 'Una toma por día en ayunas',
    es_sos: false,
    estado: 'activa',
    fecha_inicio: '2025-01-01',
    fecha_fin: null,
    motivo_baja: null
  },
  {
    id: 'med-elsa-03',
    persona_id: 'elsa-01',
    medico_id: null,
    droga: 'paracetamol',
    nombre_comercial: 'Paracetamol',
    concentracion: '500 mg',
    cantidad_por_toma: 1,
    forma: 'comprimido',
    via: 'oral',
    motivo: 'Dolor',
    indicaciones: null,
    es_sos: true,
    estado: 'activa',
    fecha_inicio: '2025-01-01',
    fecha_fin: null,
    motivo_baja: null
  }
];

// horario_toma: 1..N por medicación (una SOS no tiene horarios).
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const schedules = [
  { id: 'hor-elsa-01', medicacion_id: 'med-elsa-01', hora: '08:00', dias_semana: [...ALL_DAYS] },
  { id: 'hor-elsa-02', medicacion_id: 'med-elsa-02', hora: '07:30', dias_semana: [...ALL_DAYS] }
];

function schedulesOf(medicacionId) {
  return schedules
    .filter((schedule) => schedule.medicacion_id === medicacionId)
    .sort((a, b) => a.hora.localeCompare(b.hora))
    .map(({ id, hora, dias_semana }) => ({ id, hora, dias_semana: [...dias_semana] }));
}

// La API devuelve la medicación con sus horarios y su médico embebidos.
function serialize(medication) {
  return {
    ...medication,
    horarios: schedulesOf(medication.id),
    medico: medication.medico_id ? doctorModel.peek(medication.medico_id) : null
  };
}

// Reemplaza el set de horarios. Conserva el id de los que mantienen la misma hora,
// así las tomas ya registradas para ese horario no quedan huérfanas.
function replaceSchedules(medicacionId, horarios) {
  const previous = schedules.filter((schedule) => schedule.medicacion_id === medicacionId);
  for (let i = schedules.length - 1; i >= 0; i -= 1) {
    if (schedules[i].medicacion_id === medicacionId) schedules.splice(i, 1);
  }
  for (const { hora, dias_semana } of horarios) {
    const kept = previous.find((schedule) => schedule.hora === hora);
    schedules.push({
      id: kept?.id ?? randomUUID(),
      medicacion_id: medicacionId,
      hora,
      dias_semana: dias_semana ? [...dias_semana] : [...ALL_DAYS]
    });
  }
}

async function getAll(personaId) {
  const result = personaId
    ? medications.filter((medication) => medication.persona_id === personaId)
    : medications;
  return result.map(serialize);
}

async function getById(id) {
  const medication = medications.find((item) => item.id === id);
  return medication ? serialize(medication) : null;
}

// Busca un horario y la medicación a la que pertenece (para registrar tomas).
async function getSchedule(horarioId) {
  const schedule = schedules.find((item) => item.id === horarioId);
  if (!schedule) return null;
  const medication = medications.find((item) => item.id === schedule.medicacion_id);
  return medication ? { schedule: { ...schedule }, medication: serialize(medication) } : null;
}

async function create(data) {
  const medication = Object.fromEntries(
    editableFields.map((field) => [field, data[field] ?? null])
  );
  Object.assign(medication, {
    id: randomUUID(),
    estado: data.estado ?? 'activa',
    es_sos: data.es_sos ?? false
  });
  medications.push(medication);
  replaceSchedules(medication.id, medication.es_sos ? [] : data.horarios ?? []);

  return serialize(medication);
}

async function update(id, data) {
  const medication = medications.find((item) => item.id === id);
  if (!medication) return null;

  for (const field of editableFields) {
    if (Object.hasOwn(data, field)) medication[field] = data[field];
  }
  if (medication.es_sos) {
    replaceSchedules(medication.id, []);
  } else if (Object.hasOwn(data, 'horarios')) {
    replaceSchedules(medication.id, data.horarios);
  }

  return serialize(medication);
}

async function remove(id) {
  const index = medications.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const [medication] = medications.splice(index, 1);
  const serialized = { ...medication, horarios: schedulesOf(medication.id), medico: null };
  replaceSchedules(medication.id, []);
  return serialized;
}

// ON DELETE SET NULL desde medico.
async function clearDoctor(medicoId) {
  for (const medication of medications) {
    if (medication.medico_id === medicoId) medication.medico_id = null;
  }
}

// ON DELETE CASCADE desde persona_a_cargo. Devuelve los ids borrados para cascadear tomas.
async function removeByPersona(personaId) {
  const removedIds = [];
  for (let i = medications.length - 1; i >= 0; i -= 1) {
    if (medications[i].persona_id === personaId) {
      removedIds.push(medications[i].id);
      replaceSchedules(medications[i].id, []);
      medications.splice(i, 1);
    }
  }
  return removedIds;
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
