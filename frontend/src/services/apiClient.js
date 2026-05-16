import { API_BASE_URL } from '../utils/constants';

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  const options = {
    method,
    headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body instanceof FormData) {
    options.body = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong while talking to the server.');
  }

  return data;
}
