import { apiRequest } from './apiClient';

export function login(payload) {
  return apiRequest('/api/auth/login', { method: 'POST', body: payload });
}

export function signup(payload) {
  return apiRequest('/api/auth/signup', { method: 'POST', body: payload });
}

export function forgotPassword(payload) {
  return apiRequest('/api/auth/forgot-password', { method: 'POST', body: payload });
}

export function resetPassword(token, payload) {
  return apiRequest(`/api/auth/reset-password/${token}`, { method: 'POST', body: payload });
}

export function getProfile(token) {
  return apiRequest('/api/auth/profile', { token });
}

export function changePassword(token, payload) {
  return apiRequest('/api/auth/change-password', { method: 'PUT', body: payload, token });
}
