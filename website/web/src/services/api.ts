import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Porta do seu backend
});

// Intercepta toda requisição para adicionar o Token se o usuário estiver logado
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@TruAcess:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;