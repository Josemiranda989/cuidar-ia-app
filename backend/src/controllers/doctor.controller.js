import dependentModel from '../models/dependent.model.js';
import doctorModel from '../models/doctor.model.js';
import medicationModel from '../models/medication.model.js';
import { isNonEmptyString } from '../utils/validators.js';

function sendNotFound(res) {
  return res.status(404).json({
    status: 'error',
    data: { message: 'Médico no encontrado' }
  });
}

function sendBadRequest(res, message) {
  return res.status(400).json({ status: 'error', data: { message } });
}

async function getAll(req, res) {
  const doctors = await doctorModel.getAll(req.query.personaId);
  return res.status(200).json({ status: 'success', data: doctors });
}

async function getById(req, res) {
  const doctor = await doctorModel.getById(req.params.id);
  if (!doctor) return sendNotFound(res);

  return res.status(200).json({ status: 'success', data: doctor });
}

async function create(req, res) {
  const body = req.body ?? {};
  if (!isNonEmptyString(body.persona_id) || !isNonEmptyString(body.nombre)) {
    return sendBadRequest(res, 'persona_id y nombre son obligatorios');
  }
  if (!(await dependentModel.getById(body.persona_id))) {
    return sendBadRequest(res, 'persona_id debe corresponder a una persona a cargo existente');
  }

  const doctor = await doctorModel.create(body);
  return res.status(201).json({ status: 'success', data: doctor });
}

async function update(req, res) {
  const body = req.body ?? {};
  if (Object.hasOwn(body, 'nombre') && !isNonEmptyString(body.nombre)) {
    return sendBadRequest(res, 'nombre no puede quedar vacío');
  }
  // Mover un médico de persona rompería las medicaciones que lo referencian.
  if (Object.hasOwn(body, 'persona_id')) {
    return sendBadRequest(res, 'persona_id no se puede modificar');
  }

  const doctor = await doctorModel.update(req.params.id, body);
  if (!doctor) return sendNotFound(res);

  return res.status(200).json({ status: 'success', data: doctor });
}

async function remove(req, res) {
  const doctor = await doctorModel.remove(req.params.id);
  if (!doctor) return sendNotFound(res);
  await medicationModel.clearDoctor(doctor.id);

  return res.status(200).json({ status: 'success', data: doctor });
}

export default { getAll, getById, create, update, remove };
