import {
  LoginRequest,
  LoginResponse,
  LoginResponseSchema,
  LogoutResponse,
  LogoutResponseSchema,
  User,
  UserSchema,
} from '@toy-monorepo/types';
import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', data);
    return LoginResponseSchema.parse(response.data);
  },

  logout: async (): Promise<LogoutResponse> => {
    const response = await api.post('/auth/logout');
    return LogoutResponseSchema.parse(response.data);
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return UserSchema.parse(response.data);
  },
};
