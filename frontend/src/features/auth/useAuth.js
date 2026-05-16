import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword, getProfile, login, signup } from '../../services/authService';
import { useAppDispatch, useAppState } from '../../store/AppStore';

export function useAuth() {
  const auth = useAppState().auth;

  return useMemo(
    () => ({
      ...auth,
      isAuthenticated: Boolean(auth.token),
    }),
    [auth],
  );
}

export function useAuthActions() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  function pushToast(message, tone = 'info') {
    dispatch({
      type: 'toast/push',
      payload: {
        id: `toast_${Date.now()}_${Math.random()}`,
        message,
        tone,
      },
    });
  }

  async function loginUser(payload) {
    dispatch({ type: 'auth/request' });

    try {
      const result = await login(payload);
      dispatch({
        type: 'auth/success',
        payload: {
          token: result.token,
          user: result.user,
        },
      });
      pushToast(`Welcome back, ${result.user.fullName}.`, 'success');
      return { ok: true, data: result };
    } catch (error) {
      pushToast(error.message, 'danger');
      return { ok: false, error: error.message };
    }
  }

  async function signupStudent(payload) {
    try {
      const result = await signup(payload);
      pushToast(result.message || 'Signup successful. You can log in now.', 'success');
      return { ok: true };
    } catch (error) {
      pushToast(error.message, 'danger');
      return { ok: false, error: error.message };
    }
  }

  async function refreshProfile(token) {
    const result = await getProfile(token);
    dispatch({
      type: 'auth/success',
      payload: {
        token,
        user: result.user,
      },
    });
  }

  async function updatePassword(token, payload) {
    try {
      const result = await changePassword(token, payload);
      pushToast(result.message || 'Password updated.', 'success');
      return { ok: true };
    } catch (error) {
      pushToast(error.message, 'danger');
      return { ok: false, error: error.message };
    }
  }

  function logoutUser() {
    dispatch({ type: 'auth/logout' });
    pushToast('Signed out successfully.', 'info');
    navigate('/login');
  }

  return {
    loginUser,
    signupStudent,
    refreshProfile,
    updatePassword,
    logoutUser,
    pushToast,
  };
}
