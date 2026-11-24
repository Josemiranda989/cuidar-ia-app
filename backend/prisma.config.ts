import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js'
  },
  datasource: {
    // Solo para el CLI. En Supabase, las migraciones van por el puerto 5432 (session pooler
    // o conexión directa): el 6543 (transaction pooler) las deja colgadas.
    // process.env y no env(): así generate y validate funcionan sin la variable.
    url: process.env.DIRECT_URL
  }
});
