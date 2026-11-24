import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ids, prisma, resetDb } from './test-db.js';
import app from '../src/app.js';

// Los models con Prisma conservan la forma de respuesta que tenían los mocks.
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

const baseMedication = {
  persona_id: ids.elsa,
  droga: 'atorvastatina',
  concentracion: '20 mg',
  cantidad_por_toma: 1,
  forma: 'comprimido',
  fecha_inicio: '2025-02-01'
};

test('GET /medications/:id mantiene la forma exacta', async () => {
  const { body } = await api('GET', `/medications/${ids.enalapril}`);
  assert.deepEqual(body.data, {
    id: ids.enalapril,
    persona_id: ids.elsa,
    medico_id: ids.medico,
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
    motivo_baja: null,
    horarios: [{ id: ids.horarioEnalapril, hora: '08:00', dias_semana: [0, 1, 2, 3, 4, 5, 6] }],
    medico: {
      id: ids.medico,
      persona_id: ids.elsa,
      nombre: 'Dra. Pérez',
      especialidad: 'Clínica médica',
      matricula: null
    }
  });
});

test('GET /dependents/:id mantiene la forma exacta, con edad', async () => {
  const { body } = await api('GET', `/dependents/${ids.elsa}`);
  const { edad, ...rest } = body.data;
  assert.equal(edad, new Date().getUTCFullYear() - 1948);
  assert.deepEqual(rest, {
    id: ids.elsa,
    cuidador_id: '00000000-0000-4000-8000-000000000001',
    nombre_completo: 'Elsa',
    fecha_nacimiento: '1948-01-01',
    dni: null,
    parentesco: null,
    obra_social: null,
    numero_afiliado: null,
    notas: null,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  });
});

for (const id of ['elsa-01', ids.inexistente]) {
  test(`id ${id}: 404 en GET, PATCH y DELETE de cada recurso`, async () => {
    for (const resource of ['dependents', 'medications', 'doctors', 'conditions']) {
      assert.equal((await api('GET', `/${resource}/${id}`)).status, 404, resource);
      assert.equal((await api('PATCH', `/${resource}/${id}`, {})).status, 404, resource);
      assert.equal((await api('DELETE', `/${resource}/${id}`)).status, 404, resource);
    }
    assert.equal((await api('DELETE', `/doses/${id}`)).status, 404);
  });

  test(`id ${id}: como filtro o referencia no rompe`, async () => {
    for (const resource of ['medications', 'doctors', 'conditions', 'doses']) {
      const list = await api('GET', `/${resource}?personaId=${id}`);
      assert.equal(list.status, 200);
      assert.deepEqual(list.body.data, []);
    }
    const refs = [
      ['/medications', { ...baseMedication, persona_id: id }],
      ['/medications', { ...baseMedication, medico_id: id }],
      ['/doctors', { persona_id: id, nombre: 'Dr. X' }],
      ['/doses', { horario_id: id, fecha: '2026-11-20', estado: 'tomada' }]
    ];
    for (const [path, payload] of refs) {
      assert.equal((await api('POST', path, payload)).status, 400, path);
    }
  });
}

test('quitar un horario con tomas no falla y conserva el historial', async () => {
  const med = await api('POST', '/medications', { ...baseMedication, horarios: [{ hora: '08:00' }] });
  const horarioId = med.body.data.horarios[0].id;
  const payload = { horario_id: horarioId, fecha: '2026-11-20', estado: 'tomada' };
  const dose = await api('POST', '/doses', payload);

  const patched = await api('PATCH', `/medications/${med.body.data.id}`, {
    horarios: [{ hora: '09:00' }]
  });
  assert.equal(patched.status, 200);
  assert.deepEqual(
    patched.body.data.horarios.map((h) => h.hora),
    ['09:00']
  );

  const day = await api('GET', `/doses?personaId=${ids.elsa}&fecha=2026-11-20`);
  assert.deepEqual(
    day.body.data.find((d) => d.id === dose.body.data.id),
    dose.body.data
  );
  // El horario quitado deja de existir para la API.
  assert.equal((await api('POST', '/doses', payload)).status, 400);

  // Volver a la misma hora crea otro horario, como con los mocks.
  const back = await api('PATCH', `/medications/${med.body.data.id}`, {
    horarios: [{ hora: '08:00' }]
  });
  assert.equal(back.body.data.horarios.length, 1);
  assert.notEqual(back.body.data.horarios[0].id, horarioId);

  // Borrar la medicación se lleva también los horarios retirados y las tomas.
  const removed = await api('DELETE', `/medications/${med.body.data.id}`);
  assert.equal(removed.status, 200);
  assert.equal(removed.body.data.medico, null);
  assert.equal(removed.body.data.horarios.length, 1);
  const where = { medicacion_id: med.body.data.id };
  assert.equal(await prisma.horario_toma.count({ where }), 0);
  assert.equal(await prisma.toma.count({ where }), 0);
});

test('quitar un horario sin tomas lo borra de la base', async () => {
  const med = await api('POST', '/medications', {
    ...baseMedication,
    horarios: [{ hora: '08:00' }, { hora: '20:00', dias_semana: [1] }]
  });
  const { body } = await api('PATCH', `/medications/${med.body.data.id}`, {
    horarios: [{ hora: '20:00', dias_semana: [2, 4] }]
  });
  assert.deepEqual(body.data.horarios, [
    { id: med.body.data.horarios[1].id, hora: '20:00', dias_semana: [2, 4] }
  ]);
  assert.equal(await prisma.horario_toma.count({ where: { medicacion_id: med.body.data.id } }), 1);
});

test('registrar la misma toma a la vez no duplica ni falla', async () => {
  const payload = { horario_id: ids.horarioEnalapril, fecha: '2026-10-10', estado: 'tomada' };
  const results = await Promise.all(Array.from({ length: 5 }, () => api('POST', '/doses', payload)));
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 200, 200, 200, 201]);
  assert.equal(new Set(results.map((r) => r.body.data.id)).size, 1);
});

test('decimales, fechas y textos numéricos van y vuelven bien', async () => {
  const med = await api('POST', '/medications', {
    ...baseMedication,
    cantidad_por_toma: 0.25,
    fecha_inicio: '2024-02-29'
  });
  assert.strictEqual(med.body.data.cantidad_por_toma, 0.25);
  assert.equal(med.body.data.fecha_inicio, '2024-02-29');

  const person = await api('POST', '/dependents', {
    nombre_completo: 'Persona DNI',
    fecha_nacimiento: '1950-12-31',
    dni: 12345678
  });
  assert.equal(person.status, 201);
  assert.equal(person.body.data.dni, '12345678');
  assert.equal(person.body.data.fecha_nacimiento, '1950-12-31');
});
