// Importar antes que app.js: los tests crean y borran datos, nunca tienen que usar la base real.
import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const url = process.env.TEST_DATABASE_URL;
if (!url) {
  throw new Error('Falta TEST_DATABASE_URL: una base Postgres local, ya migrada, para los tests.');
}
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname)) {
  throw new Error('TEST_DATABASE_URL tiene que apuntar a una base local.');
}
process.env.DATABASE_URL = url;

const { default: prisma } = await import('../src/lib/prisma.js');
const backendDir = fileURLToPath(new URL('..', import.meta.url));

export { prisma };

export const ids = {
  elsa: '00000000-0000-4000-8000-000000000101',
  otra: '00000000-0000-4000-8000-000000000102',
  medico: '00000000-0000-4000-8000-000000000301',
  enalapril: '00000000-0000-4000-8000-000000000401',
  levotiroxina: '00000000-0000-4000-8000-000000000402',
  horarioEnalapril: '00000000-0000-4000-8000-000000000501',
  inexistente: '00000000-0000-4000-8000-00000000ffff'
};

// Deja la base solo con los datos del seed.
export async function resetDb() {
  await prisma.persona_a_cargo.deleteMany();
  execFileSync(process.execPath, ['prisma/seed.js'], { cwd: backendDir, stdio: 'pipe' });
}
