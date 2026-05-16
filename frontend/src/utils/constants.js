export const STORAGE_KEYS = {
  session: 'sms_frontend_session',
};

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const ROLE_LABELS = {
  admin: 'Administrator',
  teacher: 'Teacher',
  student: 'Student',
};

export const LEAVE_STATUSES = ['pending', 'approved', 'rejected'];
