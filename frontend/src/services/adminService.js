import { apiRequest } from './apiClient';

export function fetchAdminDashboard(token) {
  return apiRequest('/api/admin/dashboard', { token });
}

export function fetchUsers(token, role = '') {
  const suffix = role ? `?role=${encodeURIComponent(role)}` : '';
  return apiRequest(`/api/admin/users${suffix}`, { token });
}

export function createUser(token, payload) {
  return apiRequest('/api/admin/users', { method: 'POST', body: payload, token });
}

export function updateUser(token, id, payload) {
  return apiRequest(`/api/admin/users/${id}`, { method: 'PUT', body: payload, token });
}

export function deleteUser(token, id) {
  return apiRequest(`/api/admin/users/${id}`, { method: 'DELETE', token });
}

export function toggleUser(token, id) {
  return apiRequest(`/api/admin/users/${id}/toggle`, { method: 'PATCH', token });
}

export function fetchDepartments(token) {
  return apiRequest('/api/admin/departments', { token });
}

export function createDepartment(token, payload) {
  return apiRequest('/api/admin/departments', { method: 'POST', body: payload, token });
}

export function assignTeacherToDepartment(token, payload) {
  return apiRequest('/api/admin/departments/assign-teacher', {
    method: 'POST',
    body: payload,
    token,
  });
}

export function fetchSections(token) {
  return apiRequest('/api/admin/sections', { token });
}

export function createSection(token, payload) {
  return apiRequest('/api/admin/sections', { method: 'POST', body: payload, token });
}

export function assignTeacherToSection(token, payload) {
  return apiRequest('/api/admin/sections/assign-teacher', {
    method: 'POST',
    body: payload,
    token,
  });
}

export function assignStudentToSection(token, payload) {
  return apiRequest('/api/admin/sections/assign-student', {
    method: 'POST',
    body: payload,
    token,
  });
}

export function fetchCourses(token) {
  return apiRequest('/api/admin/courses', { token });
}

export function createCourse(token, payload) {
  return apiRequest('/api/admin/courses', { method: 'POST', body: payload, token });
}

export function fetchExams(token) {
  return apiRequest('/api/admin/exams', { token });
}

export function createExam(token, payload) {
  return apiRequest('/api/exams', { method: 'POST', body: payload, token });
}

export function fetchStudentRequests(token, status = 'pending') {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest(`/api/student-requests${suffix}`, { token });
}

export function approveStudent(token, payload) {
  return apiRequest('/api/enrollment/approve', { method: 'POST', body: payload, token });
}

export function rejectStudentRequest(token, payload) {
  return apiRequest('/api/enrollment/reject', { method: 'POST', body: payload, token });
}

export function fetchLeaves(token, status = '') {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest(`/api/admin/leaves${suffix}`, { token });
}

export function reviewLeave(token, id, payload) {
  return apiRequest(`/api/admin/leaves/${id}/review`, {
    method: 'PATCH',
    body: payload,
    token,
  });
}
