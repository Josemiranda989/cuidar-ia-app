import express from 'express';
import cors from 'cors';
import endpoints from './routes/endpoints.js';
import indexRoutes from './routes/index.routes.js';

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas
app.get('/', (req, res) => {
  res.status(200).json({ status: 'success', data: endpoints });
});
app.use('/api', indexRoutes);

export default app;
