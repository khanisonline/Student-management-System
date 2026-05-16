export function readSession(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function writeSession(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function clearSession(key) {
  localStorage.removeItem(key);
}
