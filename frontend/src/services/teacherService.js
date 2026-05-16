import { apiRequest } from './apiClient';

export function fetchTeacherDashboard(token) {
  return apiRequest('/api/teacher/dashboard', { token });
}

export function fetchTeacherSections(token) {
  return apiRequest('/api/teacher/sections', { token });
}

export function fetchTeacherCourses(token) {
  return apiRequest('/api/teacher/courses', { token });
}

export function fetchSectionStudents(token, sectionId) {
  return apiRequest(`/api/teacher/sections/${sectionId}/students`, { token });
}

export function markAttendance(token, payload) {
  return apiRequest('/api/teacher/attendance', { method: 'POST', body: payload, token });
}

export function fetchAttendance(token, sectionId, courseId) {
  return apiRequest(`/api/teacher/attendance/${sectionId}/${courseId}`, { token });
}

export function addMarks(token, payload) {
  return apiRequest('/api/teacher/marks', { method: 'POST', body: payload, token });
}

export function updateMarks(token, id, payload) {
  return apiRequest(`/api/teacher/marks/${id}`, { method: 'PATCH', body: payload, token });
}

export function fetchMarks(token, courseId) {
  return apiRequest(`/api/teacher/marks/${courseId}`, { token });
}

export function createAssignment(token, payload) {
  return apiRequest('/api/teacher/assignments', { method: 'POST', body: payload, token });
}

export function fetchTeacherAssignments(token) {
  return apiRequest('/api/teacher/assignments', { token });
}
