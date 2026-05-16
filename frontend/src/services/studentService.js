import { apiRequest } from './apiClient';

export function fetchStudentDashboard(token) {
  return apiRequest('/api/student/dashboard', { token });
}

export function fetchStudentFullDashboard(token) {
  return apiRequest('/api/student/full-dashboard', { token });
}

export function fetchStudentInsights(token) {
  return apiRequest('/api/student/insights', { token });
}

export function analyzeStudentInsights(token, payload) {
  return apiRequest('/api/student/insights/analyze', { method: 'POST', body: payload, token });
}

export function fetchStudentAttendance(token) {
  return apiRequest('/api/student/attendance', { token });
}

export function fetchStudentMarks(token) {
  return apiRequest('/api/student/marks', { token });
}

export function fetchStudentAssignments(token) {
  return apiRequest('/api/assignments', { token });
}

export function submitStudentAssignment(token, payload) {
  return apiRequest('/api/assignments/submit', { method: 'POST', body: payload, token });
}

export function fetchStudentLeaves(token) {
  return apiRequest('/api/student/leave', { token });
}

export function applyLeave(token, payload) {
  return apiRequest('/api/student/leave', { method: 'POST', body: payload, token });
}

export function fetchDatesheet(token) {
  return apiRequest('/api/student/datesheet', { token });
}

export function fetchEnrollment(token) {
  return apiRequest('/api/enrollment/me', { token });
}
