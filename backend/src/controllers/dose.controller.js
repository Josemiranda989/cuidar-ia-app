import doseModel from '../models/dose.model.js';
import medicationModel from '../models/medication.model.js';
import { isNonEmptyString, isValidDate } from '../utils/validators.js';

const validStates = ['tomada', 'omitida'];

function sendBadRequest(res, message) {
  return res.status(400).json({ status: 'error', data: { message } });
}

// GET /doses?personaId=...&fecha=YYYY-MM-DD
async function getAll(req, res) {
  const { personaId, fecha } = req.query;
  if (fecha !== undefined && !isValidDate(fecha)) {
    return sendBadRequest(res, 'fecha debe tener formato YYYY-MM-DD');
  }

  let medicacionIds;
  if (personaId) {
    const medications = await medicationModel.getAll(personaId);
    medicacionIds = medications.map((medication) => medication.id);
  }

  const doses = await doseModel.getAll({ medicacionIds, fecha });
  return res.status(200).json({ status: 'success', data: doses });
}

// POST /doses { horario_id, fecha, estado } — registra (o corrige) la toma de ese horario ese día.
async function register(req, res) {
  const body = req.body ?? {};
  if (!isNonEmptyString(body.horario_id)) {
    return sendBadRequest(res, 'horario_id es obligatorio');
  }
  if (!isValidDate(body.fecha)) {
    return sendBadRequest(res, 'fecha es obligatoria con formato YYYY-MM-DD');
  }
  if (!validStates.includes(body.estado)) {
    return sendBadRequest(res, 'estado debe ser uno de: tomada, omitida');
  }

  const found = await medicationModel.getSchedule(body.horario_id);
  if (!found) {
    return sendBadRequest(res, 'horario_id debe corresponder a un horario existente');
  }

  const { dose, created } = await doseModel.upsert({
    horario_id: found.schedule.id,
    medicacion_id: found.medication.id,
    fecha: body.fecha,
    hora_programada: found.schedule.hora,
    estado: body.estado
  });
  return res.status(created ? 201 : 200).json({ status: 'success', data: dose });
}

// DELETE /doses/:id — deshacer un registro.
async function remove(req, res) {
  const dose = await doseModel.remove(req.params.id);
  if (!dose) {
    return res.status(404).json({
      status: 'error',
      data: { message: 'Toma no encontrada' }
    });
  }

  return res.status(200).json({ status: 'success', data: dose });
}

export default { getAll, register, remove };
