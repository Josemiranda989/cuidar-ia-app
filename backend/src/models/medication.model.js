import { randomUUID } from 'node:crypto';

const editableFields = [
  'persona_id',
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
    medico_id: null,
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

async function getAll(personaId) {
  const result = personaId
    ? medications.filter((medication) => medication.persona_id === personaId)
    : medications;
  return result.map((medication) => ({ ...medication }));
}

async function getById(id) {
  const medication = medications.find((item) => item.id === id);
  return medication ? { ...medication } : null;
}

async function create(data) {
  const medication = Object.fromEntries(
    editableFields.map((field) => [field, data[field] ?? null])
  );
  Object.assign(medication, {
    id: randomUUID(),
    medico_id: null,
    estado: data.estado ?? 'activa',
    es_sos: data.es_sos ?? false
  });
  medications.push(medication);

  return { ...medication };
}

async function update(id, data) {
  const medication = medications.find((item) => item.id === id);
  if (!medication) return null;

  for (const field of editableFields) {
    if (Object.hasOwn(data, field)) medication[field] = data[field];
  }
  medication.medico_id = null;

  return { ...medication };
}

async function remove(id) {
  const index = medications.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const [medication] = medications.splice(index, 1);
  return { ...medication };
}

export default { getAll, getById, create, update, remove };
