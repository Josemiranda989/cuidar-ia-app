import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.js'
  },
  datasource: {
    // Solo para el CLI. DIRECT_URL tiene prioridad: en Supabase las migraciones
    // no van por el transaction pooler (puerto 6543).
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL
  }
});
