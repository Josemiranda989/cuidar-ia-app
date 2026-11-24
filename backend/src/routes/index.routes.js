import { Router } from 'express';
import dependentRoutes from './dependent.routes.js';
import medicationRoutes from './medication.routes.js';
import doctorRoutes from './doctor.routes.js';
import conditionRoutes from './condition.routes.js';
import doseRoutes from './dose.routes.js';

const router = Router();

router.use('/dependents', dependentRoutes);
router.use('/medications', medicationRoutes);
router.use('/doctors', doctorRoutes);
router.use('/conditions', conditionRoutes);
router.use('/doses', doseRoutes);

router.get('/health', async (req, res) => {
  res.status(200).json({
    status: 'ok'
  });
});

export default router;
