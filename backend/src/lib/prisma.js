import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.ts';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Falta DATABASE_URL en el entorno (ver backend/.env)');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

export default prisma;
