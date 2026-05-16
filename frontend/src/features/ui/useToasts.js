import { useAppDispatch, useAppState } from '../../store/AppStore';

export function useToasts() {
  const dispatch = useAppDispatch();
  const toasts = useAppState().ui.toasts;

  function removeToast(id) {
    dispatch({ type: 'toast/remove', payload: id });
  }

  return { toasts, removeToast };
}
