import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

// PATCH tiene que respetar los mismos NOT NULL y tipos que POST (docs/modelo-datos.md).
let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(() => new Promise((resolve) => server.close(resolve)));

async function api(method, path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  try {
    return { status: res.status, body: JSON.parse(text) };
  } catch {
    return { status: res.status, body: text };
  }
}

const baseMedication = {
  persona_id: 'elsa-01',
  droga: 'atorvastatina',
  concentracion: '20 mg',
  cantidad_por_toma: 1,
  forma: 'comprimido',
  fecha_inicio: '2025-02-01'
};
const basePerson = { nombre_completo: 'Persona Prueba', fecha_nacimiento: '1950-05-05' };

const invalidMedicationFields = [
  ['droga', null],
  ['droga', '   '],
  ['droga', 5],
  ['concentracion', null],
  ['concentracion', ''],
  ['cantidad_por_toma', null],
  ['cantidad_por_toma', 'abc'],
  ['cantidad_por_toma', '1'],
  ['cantidad_por_toma', 0],
  ['cantidad_por_toma', -1],
  ['cantidad_por_toma', 1000],
  ['cantidad_por_toma', 0.333],
  ['fecha_inicio', null],
  ['fecha_inicio', 'hola'],
  ['fecha_inicio', '2026-02-30'],
  ['fecha_fin', 'hola'],
  ['fecha_fin', ''],
  ['es_sos', null],
  ['es_sos', 'false'],
  ['estado', null],
  ['forma', null]
];

for (const [field, value] of invalidMedicationFields) {
  test(`medications: ${field} = ${JSON.stringify(value)} da 400 en POST y PATCH`, async () => {
    const created = await api('POST', '/medications', { ...baseMedication, [field]: value });
    assert.equal(created.status, 400);

    const original = await api('GET', '/medications/med-elsa-01');
    const patched = await api('PATCH', '/medications/med-elsa-01', { [field]: value });
    assert.equal(patched.status, 400);
    assert.equal(patched.body.status, 'error');
    assert.ok(patched.body.data.message.includes(field));

    // Un PATCH rechazado no modifica nada.
    const current = await api('GET', '/medications/med-elsa-01');
    assert.deepEqual(current.body.data, original.body.data);
  });
}

test('medications: acepta los valores límite de cantidad_por_toma', async () => {
  for (const cantidad_por_toma of [0.01, 0.25, 1.15, 999.99]) {
    const { status, body } = await api('POST', '/medications', { ...baseMedication, cantidad_por_toma });
    assert.equal(status, 201);
    assert.equal(body.data.cantidad_por_toma, cantidad_por_toma);
  }
});

test('medications: discontinuar y reactivar sigue funcionando', async () => {
  const off = await api('PATCH', '/medications/med-elsa-02', {
    estado: 'discontinuada',
    fecha_fin: '2026-11-24'
  });
  assert.equal(off.status, 200);
  assert.equal(off.body.data.fecha_fin, '2026-11-24');

  const on = await api('PATCH', '/medications/med-elsa-02', {
    estado: 'activa',
    fecha_fin: null,
    motivo_baja: null
  });
  assert.equal(on.status, 200);
  assert.equal(on.body.data.fecha_fin, null);
});

test('medications: POST informa todos los obligatorios que faltan', async () => {
  const { status, body } = await api('POST', '/medications', { persona_id: 'elsa-01' });
  assert.equal(status, 400);
  for (const field of ['droga', 'concentracion', 'cantidad_por_toma', 'forma', 'fecha_inicio']) {
    assert.ok(body.data.message.includes(field));
  }
});

const invalidPersonFields = [
  ['nombre_completo', null],
  ['nombre_completo', '   '],
  ['nombre_completo', 5],
  ['fecha_nacimiento', null],
  ['fecha_nacimiento', ''],
  ['fecha_nacimiento', 'hola'],
  ['fecha_nacimiento', '2026-02-30']
];

for (const [field, value] of invalidPersonFields) {
  test(`dependents: ${field} = ${JSON.stringify(value)} da 400 en POST y PATCH`, async () => {
    const created = await api('POST', '/dependents', { ...basePerson, [field]: value });
    assert.equal(created.status, 400);

    const patched = await api('PATCH', '/dependents/otro-99', { [field]: value });
    assert.equal(patched.status, 400);
    assert.ok(patched.body.data.message.includes(field));

    // Antes, una fecha nula dejaba GET /dependents en 500.
    const list = await api('GET', '/dependents');
    assert.equal(list.status, 200);
    const person = list.body.data.find((item) => item.id === 'otro-99');
    assert.equal(person.nombre_completo, 'Otra persona');
    assert.equal(person.fecha_nacimiento, '1955-01-01');
  });
}

test('dependents: PATCH parcial válido y opcionales en null siguen funcionando', async () => {
  const { status, body } = await api('PATCH', '/dependents/otro-99', { dni: null, notas: 'Nota' });
  assert.equal(status, 200);
  assert.equal(body.data.notas, 'Nota');
  assert.equal(body.data.nombre_completo, 'Otra persona');
});
