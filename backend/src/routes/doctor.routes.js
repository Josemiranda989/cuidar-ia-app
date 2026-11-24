import { Router } from 'express';
import doctorController from '../controllers/doctor.controller.js';

const router = Router();

router.get('/', doctorController.getAll);
router.get('/:id', doctorController.getById);
router.post('/', doctorController.create);
router.patch('/:id', doctorController.update);
router.delete('/:id', doctorController.remove);

export default router;
