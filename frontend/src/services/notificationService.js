import { apiRequest } from './apiClient';

export function fetchNotifications(token) {
  return apiRequest('/api/notifications', { token });
}

export function markNotificationRead(token, id) {
  return apiRequest(`/api/notifications/${id}/read`, { method: 'PUT', token });
}

export function createTestNotification(token) {
  return apiRequest('/api/notifications/test', { method: 'POST', token });
}
