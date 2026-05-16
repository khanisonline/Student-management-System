import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { STORAGE_KEYS } from '../utils/constants';
import { clearSession, readSession, writeSession } from '../utils/storage';

const StateContext = createContext(null);
const DispatchContext = createContext(null);

const initialState = {
  auth: {
    token: null,
    user: null,
    status: 'idle',
  },
  ui: {
    ready: false,
    toasts: [],
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'bootstrap':
      return {
        ...state,
        auth: {
          token: action.payload?.token || null,
          user: action.payload?.user || null,
          status: action.payload?.token ? 'authenticated' : 'idle',
        },
        ui: {
          ...state.ui,
          ready: true,
        },
      };
    case 'auth/request':
      return {
        ...state,
        auth: {
          ...state.auth,
          status: 'loading',
        },
      };
    case 'auth/success':
      return {
        ...state,
        auth: {
          token: action.payload.token,
          user: action.payload.user,
          status: 'authenticated',
        },
      };
    case 'auth/logout':
      return {
        ...state,
        auth: {
          token: null,
          user: null,
          status: 'idle',
        },
      };
    case 'toast/push':
      return {
        ...state,
        ui: {
          ...state.ui,
          toasts: [...state.ui.toasts, action.payload],
        },
      };
    case 'toast/remove':
      return {
        ...state,
        ui: {
          ...state.ui,
          toasts: state.ui.toasts.filter((toast) => toast.id !== action.payload),
        },
      };
    default:
      return state;
  }
}

export function AppStoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const session = readSession(STORAGE_KEYS.session, null);
    dispatch({ type: 'bootstrap', payload: session });
  }, []);

  useEffect(() => {
    if (state.auth.token && state.auth.user) {
      writeSession(STORAGE_KEYS.session, {
        token: state.auth.token,
        user: state.auth.user,
      });
    } else {
      clearSession(STORAGE_KEYS.session);
    }
  }, [state.auth.token, state.auth.user]);

  const memoizedState = useMemo(() => state, [state]);

  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={memoizedState}>{children}</StateContext.Provider>
    </DispatchContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(StateContext);
  if (!context) throw new Error('useAppState must be used inside AppStoreProvider');
  return context;
}

export function useAppDispatch() {
  const context = useContext(DispatchContext);
  if (!context) throw new Error('useAppDispatch must be used inside AppStoreProvider');
  return context;
}
