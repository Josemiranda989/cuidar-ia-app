import { Router } from 'express';
import doseController from '../controllers/dose.controller.js';

const router = Router();

router.get('/', doseController.getAll);
router.post('/', doseController.register);
router.delete('/:id', doseController.remove);

export default router;
