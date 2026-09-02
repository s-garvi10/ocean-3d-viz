import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 5000,
});

export const fetchTimesteps = async () => {
  const res = await api.get('/timesteps');
  return res.data;
};

export const fetchSlice = async (params: {
  variable: string;
  depth: number;
  time: string;
  bbox?: string;
}) => {
  const res = await api.get('/slice', { params });
  return res.data;
};

export const fetchComparison = async (floatId: string, variable: string, time: string) => {
  const res = await api.post('/compare', null, { params: { float_id: floatId, variable, time } });
  return res.data;
};

export const fetchThermocline = async (lat: number, lon: number, time: string) => {
  const res = await api.get('/thermocline', { params: { lat, lon, time } });
  return res.data;
};
