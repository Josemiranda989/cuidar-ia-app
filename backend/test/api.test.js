import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ids, prisma, resetDb } from './test-db.js';
import app from '../src/app.js';

// La base se comparte entre los tests: van en orden.
let server;
let baseUrl;

before(async () => {
  await resetDb();
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});

async function api(method, path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  return { status: res.status, body: await res.json() };
}

const basePayload = {
  persona_id: ids.elsa,
  droga: 'atorvastatina',
  concentracion: '20 mg',
  cantidad_por_toma: 1,
  forma: 'comprimido',
  fecha_inicio: '2025-02-01'
};

test('GET /medications embebe horarios y médico', async () => {
  const { status, body } = await api('GET', `/medications/${ids.enalapril}`);
  assert.equal(status, 200);
  assert.deepEqual(
    body.data.horarios.map((h) => h.hora),
    ['08:00']
  );
  assert.equal(body.data.medico.id, ids.medico);
});

test('POST /medications guarda horarios ordenados y medico_id', async () => {
  const { status, body } = await api('POST', '/medications', {
    ...basePayload,
    medico_id: ids.medico,
    horarios: [{ hora: '21:30' }, { hora: '09:00', dias_semana: [1, 3, 5] }]
  });
  assert.equal(status, 201);
  assert.deepEqual(
    body.data.horarios.map((h) => [h.hora, h.dias_semana]),
    [
      ['09:00', [1, 3, 5]],
      ['21:30', [0, 1, 2, 3, 4, 5, 6]]
    ]
  );
  assert.equal(body.data.medico_id, ids.medico);
});

test('POST /medications rechaza hora inválida, horas repetidas y SOS con horarios', async () => {
  const badTime = await api('POST', '/medications', { ...basePayload, horarios: [{ hora: '25:00' }] });
  assert.equal(badTime.status, 400);

  const repeated = await api('POST', '/medications', {
    ...basePayload,
    horarios: [{ hora: '08:00' }, { hora: '08:00' }]
  });
  assert.equal(repeated.status, 400);

  const sos = await api('POST', '/medications', {
    ...basePayload,
    es_sos: true,
    horarios: [{ hora: '08:00' }]
  });
  assert.equal(sos.status, 400);
});

test('POST /medications rechaza un médico de otra persona', async () => {
  const doctor = await api('POST', '/doctors', { persona_id: ids.otra, nombre: 'Dr. Ajeno' });
  assert.equal(doctor.status, 201);

  const { status } = await api('POST', '/medications', {
    ...basePayload,
    medico_id: doctor.body.data.id
  });
  assert.equal(status, 400);
});

test('PATCH /medications conserva medico_id (antes se pisaba con null)', async () => {
  const { status, body } = await api('PATCH', `/medications/${ids.enalapril}`, { estado: 'activa' });
  assert.equal(status, 200);
  assert.equal(body.data.medico_id, ids.medico);
});

test('PATCH /medications conserva el id del horario que mantiene la hora', async () => {
  const before = await api('GET', `/medications/${ids.enalapril}`);
  const originalId = before.body.data.horarios[0].id;

  const { body } = await api('PATCH', `/medications/${ids.enalapril}`, {
    horarios: [{ hora: '08:00' }, { hora: '20:00' }]
  });
  assert.equal(body.data.horarios.find((h) => h.hora === '08:00').id, originalId);
  assert.equal(body.data.horarios.length, 2);

  // dejamos el seed como estaba
  await api('PATCH', `/medications/${ids.enalapril}`, { horarios: [{ hora: '08:00' }] });
});

test('PATCH /medications a SOS borra los horarios', async () => {
  const created = await api('POST', '/medications', { ...basePayload, horarios: [{ hora: '10:00' }] });
  const { body } = await api('PATCH', `/medications/${created.body.data.id}`, { es_sos: true });
  assert.deepEqual(body.data.horarios, []);
});

test('doctors: CRUD y DELETE deja medico_id en null', async () => {
  const created = await api('POST', '/doctors', {
    persona_id: ids.elsa,
    nombre: 'Dr. Temporal',
    especialidad: 'Cardiología'
  });
  assert.equal(created.status, 201);
  const doctorId = created.body.data.id;

  const list = await api('GET', `/doctors?personaId=${ids.elsa}`);
  assert.ok(list.body.data.some((d) => d.id === doctorId));

  const med = await api('POST', '/medications', { ...basePayload, medico_id: doctorId });
  await api('DELETE', `/doctors/${doctorId}`);

  const after = await api('GET', `/medications/${med.body.data.id}`);
  assert.equal(after.body.data.medico_id, null);
  assert.equal(after.body.data.medico, null);
});

test('doctors: valida obligatorios y no permite mover de persona', async () => {
  assert.equal((await api('POST', '/doctors', { persona_id: ids.elsa })).status, 400);
  assert.equal(
    (await api('PATCH', `/doctors/${ids.medico}`, { persona_id: ids.otra })).status,
    400
  );
});

test('conditions: crea diagnóstico y alergia, valida tipo', async () => {
  const allergy = await api('POST', '/conditions', {
    persona_id: ids.elsa,
    tipo: 'alergia',
    descripcion: '  Penicilina  '
  });
  assert.equal(allergy.status, 201);
  assert.equal(allergy.body.data.descripcion, 'Penicilina');

  const badType = await api('POST', '/conditions', {
    persona_id: ids.elsa,
    tipo: 'sintoma',
    descripcion: 'Tos'
  });
  assert.equal(badType.status, 400);

  const list = await api('GET', `/conditions?personaId=${ids.elsa}`);
  assert.ok(list.body.data.some((c) => c.tipo === 'alergia'));

  const removed = await api('DELETE', `/conditions/${allergy.body.data.id}`);
  assert.equal(removed.status, 200);
});

test('doses: registrar, corregir (upsert), listar por día y deshacer', async () => {
  const first = await api('POST', '/doses', {
    horario_id: ids.horarioEnalapril,
    fecha: '2026-11-20',
    estado: 'tomada'
  });
  assert.equal(first.status, 201);
  assert.equal(first.body.data.hora_programada, '08:00');
  assert.equal(first.body.data.medicacion_id, ids.enalapril);

  const corrected = await api('POST', '/doses', {
    horario_id: ids.horarioEnalapril,
    fecha: '2026-11-20',
    estado: 'omitida'
  });
  assert.equal(corrected.status, 200);
  assert.equal(corrected.body.data.id, first.body.data.id);
  assert.equal(corrected.body.data.estado, 'omitida');

  const day = await api('GET', `/doses?personaId=${ids.elsa}&fecha=2026-11-20`);
  assert.equal(day.body.data.length, 1);

  const otherPerson = await api('GET', `/doses?personaId=${ids.otra}&fecha=2026-11-20`);
  assert.equal(otherPerson.body.data.length, 0);

  const undone = await api('DELETE', `/doses/${first.body.data.id}`);
  assert.equal(undone.status, 200);
  assert.equal((await api('GET', '/doses?fecha=2026-11-20')).body.data.length, 0);
});

test('doses: valida horario, fecha y estado', async () => {
  const base = { horario_id: ids.horarioEnalapril, fecha: '2026-11-20', estado: 'tomada' };
  assert.equal((await api('POST', '/doses', { ...base, horario_id: 'nope' })).status, 400);
  assert.equal((await api('POST', '/doses', { ...base, fecha: '2026-02-30' })).status, 400);
  assert.equal((await api('POST', '/doses', { ...base, estado: 'pospuesta' })).status, 400);
  assert.equal((await api('GET', '/doses?fecha=20-11-2026')).status, 400);
});

test('DELETE /dependents cascadea medicaciones, tomas, médicos y condiciones', async () => {
  const persona = await api('POST', '/dependents', {
    nombre_completo: 'Persona Cascada',
    fecha_nacimiento: '1950-05-05'
  });
  const personaId = persona.body.data.id;

  const doctor = await api('POST', '/doctors', { persona_id: personaId, nombre: 'Dr. X' });
  await api('POST', '/conditions', { persona_id: personaId, tipo: 'diagnostico', descripcion: 'HTA' });
  const med = await api('POST', '/medications', {
    ...basePayload,
    persona_id: personaId,
    medico_id: doctor.body.data.id,
    horarios: [{ hora: '08:00' }]
  });
  await api('POST', '/doses', {
    horario_id: med.body.data.horarios[0].id,
    fecha: '2026-11-20',
    estado: 'tomada'
  });

  assert.equal((await api('DELETE', `/dependents/${personaId}`)).status, 200);

  assert.equal((await api('GET', `/medications?personaId=${personaId}`)).body.data.length, 0);
  assert.equal((await api('GET', `/doctors?personaId=${personaId}`)).body.data.length, 0);
  assert.equal((await api('GET', `/conditions?personaId=${personaId}`)).body.data.length, 0);
  const doses = await api('GET', '/doses?fecha=2026-11-20');
  assert.ok(doses.body.data.every((d) => d.medicacion_id !== med.body.data.id));
});
