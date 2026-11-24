import { Router } from 'express';
import conditionController from '../controllers/condition.controller.js';

const router = Router();

router.get('/', conditionController.getAll);
router.get('/:id', conditionController.getById);
router.post('/', conditionController.create);
router.patch('/:id', conditionController.update);
router.delete('/:id', conditionController.remove);

export default router;
