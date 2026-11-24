import conditionModel from '../models/condition.model.js';
import dependentModel from '../models/dependent.model.js';
import doctorModel from '../models/doctor.model.js';
import doseModel from '../models/dose.model.js';
import medicationModel from '../models/medication.model.js';
import { isNonEmptyString, isValidDate } from '../utils/validators.js';

function sendNotFound(res) {
  return res.status(404).json({
    status: 'error',
    data: { message: 'Persona a cargo no encontrada' }
  });
}

function sendBadRequest(res, message) {
  return res.status(400).json({ status: 'error', data: { message } });
}

// Valida los campos presentes en el body, igual para POST y PATCH.
function validateFields(body) {
  if (Object.hasOwn(body, 'nombre_completo') && !isNonEmptyString(body.nombre_completo)) {
    return 'nombre_completo debe ser un texto no vacío';
  }
  if (Object.hasOwn(body, 'fecha_nacimiento') && !isValidDate(body.fecha_nacimiento)) {
    return 'fecha_nacimiento debe ser una fecha válida con formato YYYY-MM-DD';
  }
  return null;
}

async function getAll(req, res) {
  const dependents = await dependentModel.getAll();
  return res.status(200).json({ status: 'success', data: dependents });
}

async function getById(req, res) {
  const dependent = await dependentModel.getById(req.params.id);
  if (!dependent) return sendNotFound(res);

  return res.status(200).json({ status: 'success', data: dependent });
}

async function create(req, res) {
  const body = req.body ?? {};
  // El modelo solo recibe solicitudes con los dos campos obligatorios.
  if (!isNonEmptyString(body.nombre_completo) || !isNonEmptyString(body.fecha_nacimiento)) {
    return sendBadRequest(res, 'nombre_completo y fecha_nacimiento son obligatorios');
  }
  const fieldError = validateFields(body);
  if (fieldError) return sendBadRequest(res, fieldError);

  const dependent = await dependentModel.create(body);
  return res.status(201).json({ status: 'success', data: dependent });
}

async function update(req, res) {
  const body = req.body ?? {};
  const fieldError = validateFields(body);
  if (fieldError) return sendBadRequest(res, fieldError);

  const dependent = await dependentModel.update(req.params.id, body);
  if (!dependent) return sendNotFound(res);

  return res.status(200).json({ status: 'success', data: dependent });
}

async function remove(req, res) {
  const dependent = await dependentModel.remove(req.params.id);
  if (!dependent) return sendNotFound(res);

  // ON DELETE CASCADE: medicaciones (con sus horarios y tomas), médicos y condiciones.
  const medicationIds = await medicationModel.removeByPersona(dependent.id);
  await Promise.all(medicationIds.map((id) => doseModel.removeByMedication(id)));
  await doctorModel.removeByPersona(dependent.id);
  await conditionModel.removeByPersona(dependent.id);

  return res.status(200).json({ status: 'success', data: dependent });
}

export default { getAll, getById, create, update, remove };
