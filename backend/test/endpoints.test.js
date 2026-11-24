import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import conditionRoutes from '../src/routes/condition.routes.js';
import dependentRoutes from '../src/routes/dependent.routes.js';
import doctorRoutes from '../src/routes/doctor.routes.js';
import doseRoutes from '../src/routes/dose.routes.js';
import indexRoutes from '../src/routes/index.routes.js';
import medicationRoutes from '../src/routes/medication.routes.js';

// Prefijo con el que se monta cada router.
const mountedRouters = [
  ['/api', indexRoutes],
  ['/api/dependents', dependentRoutes],
  ['/api/medications', medicationRoutes],
  ['/api/doctors', doctorRoutes],
  ['/api/conditions', conditionRoutes],
  ['/api/doses', doseRoutes]
];

function realEndpoints() {
  return mountedRouters.flatMap(([prefix, router]) =>
    router.stack
      .filter((layer) => layer.route)
      .flatMap(({ route }) =>
        Object.keys(route.methods).map(
          (method) => `${method.toUpperCase()} ${prefix}${route.path === '/' ? '' : route.path}`
        )
      )
  );
}

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

async function getIndex() {
  const res = await fetch(`${baseUrl}/`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /application\/json/);
  return res.json();
}

test('GET / devuelve nombre, endpoint y detalle de cada endpoint', async () => {
  const body = await getIndex();
  assert.equal(body.status, 'success');
  assert.ok(body.data.length > 0);
  for (const item of body.data) {
    assert.deepEqual(Object.keys(item), ['nombre', 'endpoint', 'detalle']);
    for (const value of Object.values(item)) {
      assert.ok(typeof value === 'string' && value.trim() !== '');
    }
  }
});

test('GET / lista exactamente los endpoints que existen', async () => {
  const { data } = await getIndex();
  assert.deepEqual(data.map((item) => item.endpoint).sort(), realEndpoints().sort());
});

test('cada router está montado en el prefijo que anuncia el índice', async () => {
  const { data } = await getIndex();
  const collections = data.filter(
    ({ endpoint }) => endpoint.startsWith('GET ') && !endpoint.includes(':')
  );
  for (const { endpoint } of collections) {
    const res = await fetch(`${baseUrl}${endpoint.replace('GET ', '')}`);
    assert.equal(res.status, 200, endpoint);
  }
});
