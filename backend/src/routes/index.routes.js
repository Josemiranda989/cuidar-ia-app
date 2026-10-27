import { Router } from 'express';
import dependentRoutes from './dependent.routes.js';
import medicationRoutes from './medication.routes.js';

const router = Router();

router.use('/dependents', dependentRoutes);
router.use('/medications', medicationRoutes);

router.get('/health', async (req, res) => {
  res.status(200).json({
    status: 'ok'
  });
});

export default router;
