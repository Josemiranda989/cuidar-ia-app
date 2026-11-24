import prisma from '../src/lib/prisma.js';

// Datos de muestra, copiados de los mocks de src/models/.
// Los ids son fijos: correrlo de nuevo no duplica, pero restaura estos valores.
const uuid = (suffix) => `00000000-0000-4000-8000-00000000${suffix}`;
const date = (iso) => new Date(`${iso}T00:00:00.000Z`);
const time = (hhmm) => new Date(`1970-01-01T${hhmm}:00.000Z`);

const CUIDADOR = uuid('0001'); // cuidador-123
const PERSONA_ELSA = uuid('0101'); // elsa-01
const PERSONA_OTRA = uuid('0102'); // otro-99
const CONDICION_HIPERTENSION = uuid('0201'); // cond-elsa-01
const CONDICION_HIPOTIROIDISMO = uuid('0202'); // cond-elsa-02
const MEDICO_ELSA = uuid('0301'); // medico-elsa-01
const MED_ENALAPRIL = uuid('0401'); // med-elsa-01
const MED_LEVOTIROXINA = uuid('0402'); // med-elsa-02
const MED_PARACETAMOL = uuid('0403'); // med-elsa-03
const HORARIO_ENALAPRIL = uuid('0501'); // hor-elsa-01
const HORARIO_LEVOTIROXINA = uuid('0502'); // hor-elsa-02

const TODOS_LOS_DIAS = [0, 1, 2, 3, 4, 5, 6]; // 0 = domingo

// Los mocks solo tienen el id del cuidador; el nombre es el de docs/design.
const cuidadores = [{ id: CUIDADOR, nombre: 'Marina', telefono: null }];

const personas = [
  {
    id: PERSONA_ELSA,
    cuidador_id: CUIDADOR,
    nombre_completo: 'Elsa',
    fecha_nacimiento: date('1948-01-01'),
    dni: null,
    parentesco: null,
    obra_social: null,
    numero_afiliado: null,
    notas: null,
    created_at: date('2025-01-01'),
    updated_at: date('2025-01-01')
  },
  {
    id: PERSONA_OTRA,
    cuidador_id: CUIDADOR,
    nombre_completo: 'Otra persona',
    fecha_nacimiento: date('1955-01-01'),
    dni: null,
    parentesco: null,
    obra_social: null,
    numero_afiliado: null,
    notas: null,
    created_at: date('2025-01-01'),
    updated_at: date('2025-01-01')
  }
];

const condiciones = [
  {
    id: CONDICION_HIPERTENSION,
    persona_id: PERSONA_ELSA,
    tipo: 'diagnostico',
    descripcion: 'Hipertensión'
  },
  {
    id: CONDICION_HIPOTIROIDISMO,
    persona_id: PERSONA_ELSA,
    tipo: 'diagnostico',
    descripcion: 'Hipotiroidismo'
  }
];

const medicos = [
  {
    id: MEDICO_ELSA,
    persona_id: PERSONA_ELSA,
    nombre: 'Dra. Pérez',
    especialidad: 'Clínica médica',
    matricula: null
  }
];

const medicaciones = [
  {
    id: MED_ENALAPRIL,
    persona_id: PERSONA_ELSA,
    medico_id: MEDICO_ELSA,
    droga: 'enalapril',
    nombre_comercial: 'Enalapril',
    concentracion: '10 mg',
    cantidad_por_toma: '1.00',
    forma: 'comprimido',
    via: 'oral',
    motivo: 'Hipertensión',
    indicaciones: 'Una toma por día',
    es_sos: false,
    estado: 'activa',
    fecha_inicio: date('2025-01-01'),
    fecha_fin: null,
    motivo_baja: null
  },
  {
    id: MED_LEVOTIROXINA,
    persona_id: PERSONA_ELSA,
    medico_id: null,
    droga: 'levotiroxina',
    nombre_comercial: 'Levotiroxina',
    concentracion: '50 mcg',
    cantidad_por_toma: '1.00',
    forma: 'comprimido',
    via: 'oral',
    motivo: 'Hipotiroidismo',
    indicaciones: 'Una toma por día en ayunas',
    es_sos: false,
    estado: 'activa',
    fecha_inicio: date('2025-01-01'),
    fecha_fin: null,
    motivo_baja: null
  },
  {
    id: MED_PARACETAMOL,
    persona_id: PERSONA_ELSA,
    medico_id: null,
    droga: 'paracetamol',
    nombre_comercial: 'Paracetamol',
    concentracion: '500 mg',
    cantidad_por_toma: '1.00',
    forma: 'comprimido',
    via: 'oral',
    motivo: 'Dolor',
    indicaciones: null,
    es_sos: true,
    estado: 'activa',
    fecha_inicio: date('2025-01-01'),
    fecha_fin: null,
    motivo_baja: null
  }
];

// La SOS (paracetamol) no tiene horarios. El mock de tomas está vacío: no se siembran.
const horarios = [
  {
    id: HORARIO_ENALAPRIL,
    medicacion_id: MED_ENALAPRIL,
    hora: time('08:00'),
    dias_semana: TODOS_LOS_DIAS
  },
  {
    id: HORARIO_LEVOTIROXINA,
    medicacion_id: MED_LEVOTIROXINA,
    hora: time('07:30'),
    dias_semana: TODOS_LOS_DIAS
  }
];

const upsertArgs = ({ id, ...data }) => ({
  where: { id },
  create: { id, ...data },
  update: data
});

try {
  // El orden respeta las FK. Si algo falla, no se guarda nada.
  const saved = await prisma.$transaction([
    ...cuidadores.map((row) => prisma.cuidador.upsert(upsertArgs(row))),
    ...personas.map((row) => prisma.persona_a_cargo.upsert(upsertArgs(row))),
    ...condiciones.map((row) => prisma.condicion.upsert(upsertArgs(row))),
    ...medicos.map((row) => prisma.medico.upsert(upsertArgs(row))),
    ...medicaciones.map((row) => prisma.medicacion.upsert(upsertArgs(row))),
    ...horarios.map((row) => prisma.horario_toma.upsert(upsertArgs(row)))
  ]);
  console.log(`Seed listo: ${saved.length} registros.`);
} catch (error) {
  console.error('El seed falló:', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
