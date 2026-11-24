import conditionModel from '../models/condition.model.js';
import dependentModel from '../models/dependent.model.js';
import { isNonEmptyString } from '../utils/validators.js';

const validTypes = ['diagnostico', 'alergia'];

function sendNotFound(res) {
  return res.status(404).json({
    status: 'error',
    data: { message: 'Condición no encontrada' }
  });
}

function sendBadRequest(res, message) {
  return res.status(400).json({ status: 'error', data: { message } });
}

function validateFields(body, { partial }) {
  if ((!partial || Object.hasOwn(body, 'tipo')) && !validTypes.includes(body.tipo)) {
    return 'tipo debe ser uno de: diagnostico, alergia';
  }
  if ((!partial || Object.hasOwn(body, 'descripcion')) && !isNonEmptyString(body.descripcion)) {
    return 'descripcion es obligatoria';
  }
  return null;
}

async function getAll(req, res) {
  const conditions = await conditionModel.getAll(req.query.personaId);
  return res.status(200).json({ status: 'success', data: conditions });
}

async function getById(req, res) {
  const condition = await conditionModel.getById(req.params.id);
  if (!condition) return sendNotFound(res);

  return res.status(200).json({ status: 'success', data: condition });
}

async function create(req, res) {
  const body = req.body ?? {};
  if (!isNonEmptyString(body.persona_id)) {
    return sendBadRequest(res, 'persona_id es obligatorio');
  }
  const fieldError = validateFields(body, { partial: false });
  if (fieldError) return sendBadRequest(res, fieldError);
  if (!(await dependentModel.getById(body.persona_id))) {
    return sendBadRequest(res, 'persona_id debe corresponder a una persona a cargo existente');
  }

  const condition = await conditionModel.create({
    ...body,
    descripcion: body.descripcion.trim()
  });
  return res.status(201).json({ status: 'success', data: condition });
}

async function update(req, res) {
  const body = req.body ?? {};
  if (Object.hasOwn(body, 'persona_id')) {
    return sendBadRequest(res, 'persona_id no se puede modificar');
  }
  const fieldError = validateFields(body, { partial: true });
  if (fieldError) return sendBadRequest(res, fieldError);

  const condition = await conditionModel.update(req.params.id, body);
  if (!condition) return sendNotFound(res);

  return res.status(200).json({ status: 'success', data: condition });
}

async function remove(req, res) {
  const condition = await conditionModel.remove(req.params.id);
  if (!condition) return sendNotFound(res);

  return res.status(200).json({ status: 'success', data: condition });
}

export default { getAll, getById, create, update, remove };
