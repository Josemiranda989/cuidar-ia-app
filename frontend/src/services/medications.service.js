import axios from 'axios';

const BASE_URL = '/api/medications';

export const getAll = async (personaId) => {
  const config = personaId ? { params: { personaId } } : {};
  const res = await axios.get(BASE_URL, config);
  return res.data.data;
};

export const getById = async (id) => {
  const res = await axios.get(`${BASE_URL}/${id}`);
  return res.data.data;
};

export const create = async (payload) => {
  const res = await axios.post(BASE_URL, payload);
  return res.data.data;
};

export const update = async (id, payload) => {
  const res = await axios.patch(`${BASE_URL}/${id}`, payload);
  return res.data.data;
};

export const remove = async (id) => {
  const res = await axios.delete(`${BASE_URL}/${id}`);
  return res.data.data;
};

export default {
  getAll,
  getById,
  create,
  update,
  remove,
};

