import api from './api';
import type { Place, User } from '../types';
export const authService = {
  login: (email: string, password: string, role: string) => 
    api.post<{ token: string; user: User }>('/auth/login', { email, password, expected_role: role }),
};

export const placeService = {
  getAll: () => api.get<Place[]>('/places'),
};