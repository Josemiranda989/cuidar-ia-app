import axios from 'axios';

const BASE_URL = '/api/doses';

export const getAll = async ({ personaId, fecha } = {}) => {
  const params = {};
  if (personaId) params.personaId = personaId;
  if (fecha) params.fecha = fecha;
  const res = await axios.get(BASE_URL, { params });
  return res.data.data;
};

// Registra (o corrige) la toma de un horario en una fecha: estado 'tomada' | 'omitida'.
export const register = async (payload) => {
  const res = await axios.post(BASE_URL, payload);
  return res.data.data;
};

export const remove = async (id) => {
  const res = await axios.delete(`${BASE_URL}/${id}`);
  return res.data.data;
};

export default {
  getAll,
  register,
  remove,
};
