import express from 'express';
import cors from 'cors';
import indexRoutes from './routes/index.routes.js';

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api', indexRoutes);

export default app;
