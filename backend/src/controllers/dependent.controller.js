import dependentModel from '../models/dependent.model.js';

function sendNotFound(res) {
  return res.status(404).json({
    status: 'error',
    data: { message: 'Persona a cargo no encontrada' }
  });
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
  if (
    typeof body.nombre_completo !== 'string' ||
    !body.nombre_completo.trim() ||
    typeof body.fecha_nacimiento !== 'string' ||
    !body.fecha_nacimiento.trim()
  ) {
    return res.status(400).json({
      status: 'error',
      data: { message: 'nombre_completo y fecha_nacimiento son obligatorios' }
    });
  }

  const dependent = await dependentModel.create(body);
  return res.status(201).json({ status: 'success', data: dependent });
}

async function update(req, res) {
  const body = req.body ?? {};
  const dependent = await dependentModel.update(req.params.id, body);
  if (!dependent) return sendNotFound(res);

  return res.status(200).json({ status: 'success', data: dependent });
}

async function remove(req, res) {
  const dependent = await dependentModel.remove(req.params.id);
  if (!dependent) return sendNotFound(res);

  return res.status(200).json({ status: 'success', data: dependent });
}

export default { getAll, getById, create, update, remove };
