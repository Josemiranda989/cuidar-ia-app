import dependentModel from '../models/dependent.model.js';
import doctorModel from '../models/doctor.model.js';
import doseModel from '../models/dose.model.js';
import medicationModel from '../models/medication.model.js';
import { parseHorarios } from '../utils/validators.js';

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

// medico_id es opcional, pero si viene tiene que ser un médico de la misma persona.
async function validateDoctor(medicoId, personaId) {
  if (medicoId === null || medicoId === undefined || medicoId === '') return null;
  const doctor = typeof medicoId === 'string' ? await doctorModel.getById(medicoId) : null;
  if (!doctor || doctor.persona_id !== personaId) {
    return 'medico_id debe corresponder a un médico de la misma persona a cargo';
  }
  return null;
}

// Normaliza horarios y medico_id del body. Devuelve { error } o { data }.
async function prepareRelations(body, personaId, esSos) {
  const data = { ...body };

  if (Object.hasOwn(body, 'horarios')) {
    const parsed = parseHorarios(body.horarios);
    if (parsed.error) return { error: parsed.error };
    if (esSos && parsed.value.length > 0) {
      return { error: 'una medicación SOS no tiene horarios' };
    }
    data.horarios = parsed.value;
  }

  if (Object.hasOwn(body, 'medico_id')) {
    const doctorError = await validateDoctor(body.medico_id, personaId);
    if (doctorError) return { error: doctorError };
    data.medico_id = body.medico_id || null;
  }

  return { data };
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

  const relations = await prepareRelations(body, body.persona_id, Boolean(body.es_sos));
  if (relations.error) {
    return res.status(400).json({ status: 'error', data: { message: relations.error } });
  }

  const medication = await medicationModel.create(relations.data);
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

  const current = await medicationModel.getById(req.params.id);
  if (!current) return sendNotFound(res);

  const personaId = body.persona_id ?? current.persona_id;
  const esSos = Object.hasOwn(body, 'es_sos') ? Boolean(body.es_sos) : current.es_sos;
  // Si cambia la persona y no se manda medico_id, el médico anterior ya no corresponde.
  const relationsBody =
    personaId !== current.persona_id && !Object.hasOwn(body, 'medico_id')
      ? { ...body, medico_id: null }
      : body;
  const relations = await prepareRelations(relationsBody, personaId, esSos);
  if (relations.error) {
    return res.status(400).json({ status: 'error', data: { message: relations.error } });
  }

  const medication = await medicationModel.update(req.params.id, relations.data);
  return res.status(200).json({ status: 'success', data: medication });
}

async function remove(req, res) {
  const medication = await medicationModel.remove(req.params.id);
  if (!medication) return sendNotFound(res);
  await doseModel.removeByMedication(medication.id);

  return res.status(200).json({ status: 'success', data: medication });
}

export default { getAll, getById, create, update, remove };
