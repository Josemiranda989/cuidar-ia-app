import dependentModel from '../models/dependent.model.js';
import medicationModel from '../models/medication.model.js';

const validForms = ['comprimido', 'gota', 'ml', 'aplicacion'];
const validStates = ['activa', 'discontinuada'];
const requiredFields = [
  'persona_id',
  'droga',
  'concentracion',
  'cantidad_por_toma',
  'forma',
  'fecha_inicio'
];

function sendNotFound(res) {
  return res.status(404).json({
    status: 'error',
    data: { message: 'Medicación no encontrada' }
  });
}

function validateEnums(body) {
  if (
    Object.hasOwn(body, 'forma') &&
    (typeof body.forma !== 'string' || !validForms.includes(body.forma))
  ) {
    return 'forma debe ser uno de: comprimido, gota, ml, aplicacion';
  }
  if (
    Object.hasOwn(body, 'estado') &&
    (typeof body.estado !== 'string' || !validStates.includes(body.estado))
  ) {
    return 'estado debe ser uno de: activa, discontinuada';
  }
  return null;
}

async function validatePerson(personaId) {
  return typeof personaId === 'string' && (await dependentModel.getById(personaId));
}

async function getAll(req, res) {
  const medications = await medicationModel.getAll(req.query.personaId);
  return res.status(200).json({ status: 'success', data: medications });
}

async function getById(req, res) {
  const medication = await medicationModel.getById(req.params.id);
  if (!medication) return sendNotFound(res);

  return res.status(200).json({ status: 'success', data: medication });
}

async function create(req, res) {
  const body = req.body ?? {};
  const missingFields = requiredFields.filter(
    (field) => body[field] === undefined || body[field] === null || body[field] === ''
  );
  if (missingFields.length) {
    return res.status(400).json({
      status: 'error',
      data: { message: `Campos obligatorios: ${missingFields.join(', ')}` }
    });
  }

  const enumError = validateEnums(body);
  if (enumError) {
    return res.status(400).json({ status: 'error', data: { message: enumError } });
  }
  if (!(await validatePerson(body.persona_id))) {
    return res.status(400).json({
      status: 'error',
      data: { message: 'persona_id debe corresponder a una persona a cargo existente' }
    });
  }

  const medication = await medicationModel.create(body);
  return res.status(201).json({ status: 'success', data: medication });
}

async function update(req, res) {
  const body = req.body ?? {};
  const enumError = validateEnums(body);
  if (enumError) {
    return res.status(400).json({ status: 'error', data: { message: enumError } });
  }
  if (Object.hasOwn(body, 'persona_id') && !(await validatePerson(body.persona_id))) {
    return res.status(400).json({
      status: 'error',
      data: { message: 'persona_id debe corresponder a una persona a cargo existente' }
    });
  }

  const medication = await medicationModel.update(req.params.id, body);
  if (!medication) return sendNotFound(res);

  return res.status(200).json({ status: 'success', data: medication });
}

async function remove(req, res) {
  const medication = await medicationModel.remove(req.params.id);
  if (!medication) return sendNotFound(res);

  return res.status(200).json({ status: 'success', data: medication });
}

export default { getAll, getById, create, update, remove };
