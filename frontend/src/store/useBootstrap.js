import { useEffect } from 'react';
import { useAppDispatch, useAppState } from './AppStore';
import { getProfile } from '../services/authService';

export function useBootstrap() {
  const dispatch = useAppDispatch();
  const { ready } = useAppState().ui;
  const { token, user } = useAppState().auth;

  useEffect(() => {
    let ignore = false;

    async function hydrate() {
      if (!ready || !token || user) {
        return;
      }

      try {
        const result = await getProfile(token);
        if (!ignore) {
          dispatch({
            type: 'auth/success',
            payload: {
              token,
              user: result.user,
            },
          });
        }
      } catch {
        if (!ignore) {
          dispatch({ type: 'auth/logout' });
        }
      }
    }

    hydrate();

    return () => {
      ignore = true;
    };
  }, [dispatch, ready, token, user]);

  return { ready };
}
