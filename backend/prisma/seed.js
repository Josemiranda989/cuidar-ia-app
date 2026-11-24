import prisma from '../src/lib/prisma.js';

// Datos de muestra. Los ids son fijos para que el seed sea idempotente (upsert por id).
const uuid = (suffix) => `00000000-0000-4000-8000-000000000${suffix}`;
const date = (iso) => new Date(`${iso}T00:00:00.000Z`);
const time = (hhmm) => new Date(`1970-01-01T${hhmm}:00.000Z`);

const CUIDADOR_MARINA = uuid('001');
const PERSONA_ELSA = uuid('101');
const PERSONA_OTRA = uuid('102');
const MEDICO_ELSA = uuid('301');
const MED_ENALAPRIL = uuid('401');
const MED_LEVOTIROXINA = uuid('402');
const MED_PARACETAMOL = uuid('403');
const HORARIO_ENALAPRIL = uuid('501');
const HORARIO_LEVOTIROXINA = uuid('502');

const TODOS_LOS_DIAS = [0, 1, 2, 3, 4, 5, 6]; // 0 = domingo

const personaBase = {
  cuidador_id: CUIDADOR_MARINA,
  dni: null,
  parentesco: null,
  obra_social: null,
  numero_afiliado: null,
  notas: null,
  created_at: new Date('2025-01-01T00:00:00.000Z'),
  updated_at: new Date('2025-01-01T00:00:00.000Z')
};

const medicacionBase = {
  persona_id: PERSONA_ELSA,
  cantidad_por_toma: '1.00',
  forma: 'comprimido',
  via: 'oral',
  estado: 'activa',
  fecha_inicio: date('2025-01-01'),
  fecha_fin: null,
  motivo_baja: null
};

const tomaBase = {
  fecha: date('2026-11-01'),
  registrada_at: new Date('2026-11-01T12:00:00.000Z')
};

// El orden respeta las FK.
const seed = [
  [
    'cuidador',
    [{ id: CUIDADOR_MARINA, nombre: 'Marina', telefono: null }]
  ],
  [
    'persona_a_cargo',
    [
      {
        ...personaBase,
        id: PERSONA_ELSA,
        nombre_completo: 'Elsa',
        fecha_nacimiento: date('1948-01-01')
      },
      {
        ...personaBase,
        id: PERSONA_OTRA,
        nombre_completo: 'Otra persona',
        fecha_nacimiento: date('1955-01-01')
      }
    ]
  ],
  [
    'condicion',
    [
      {
        id: uuid('201'),
        persona_id: PERSONA_ELSA,
        tipo: 'diagnostico',
        descripcion: 'Hipertensión'
      },
      {
        id: uuid('202'),
        persona_id: PERSONA_ELSA,
        tipo: 'diagnostico',
        descripcion: 'Hipotiroidismo'
      }
    ]
  ],
  [
    'medico',
    [
      {
        id: MEDICO_ELSA,
        persona_id: PERSONA_ELSA,
        nombre: 'Dra. Pérez',
        especialidad: 'Clínica médica',
        matricula: null
      }
    ]
  ],
  [
    'medicacion',
    [
      {
        ...medicacionBase,
        id: MED_ENALAPRIL,
        medico_id: MEDICO_ELSA,
        droga: 'enalapril',
        nombre_comercial: 'Enalapril',
        concentracion: '10 mg',
        motivo: 'Hipertensión',
        indicaciones: 'Una toma por día',
        es_sos: false
      },
      {
        ...medicacionBase,
        id: MED_LEVOTIROXINA,
        medico_id: null,
        droga: 'levotiroxina',
        nombre_comercial: 'Levotiroxina',
        concentracion: '50 mcg',
        motivo: 'Hipotiroidismo',
        indicaciones: 'Una toma por día en ayunas',
        es_sos: false
      },
      {
        ...medicacionBase,
        id: MED_PARACETAMOL,
        medico_id: null,
        droga: 'paracetamol',
        nombre_comercial: 'Paracetamol',
        concentracion: '500 mg',
        motivo: 'Dolor',
        indicaciones: null,
        es_sos: true
      }
    ]
  ],
  [
    'horario_toma',
    [
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
    ]
  ],
  [
    'toma',
    [
      {
        ...tomaBase,
        id: uuid('601'),
        horario_id: HORARIO_ENALAPRIL,
        medicacion_id: MED_ENALAPRIL,
        hora_programada: time('08:00'),
        estado: 'tomada'
      },
      {
        ...tomaBase,
        id: uuid('602'),
        horario_id: HORARIO_LEVOTIROXINA,
        medicacion_id: MED_LEVOTIROXINA,
        hora_programada: time('07:30'),
        estado: 'omitida'
      }
    ]
  ]
];

function upsert(model, { id, ...data }) {
  return prisma[model].upsert({ where: { id }, create: { id, ...data }, update: data });
}

try {
  await prisma.$transaction(
    seed.flatMap(([model, rows]) => rows.map((row) => upsert(model, row)))
  );
  console.table(seed.map(([tabla, rows]) => ({ tabla, registros: rows.length })));
} catch (error) {
  console.error('El seed falló:', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
