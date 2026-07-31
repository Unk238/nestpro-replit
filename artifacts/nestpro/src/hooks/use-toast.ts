import * as React from 'react';

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;

type ToastVariant = 'default' | 'destructive' | 'success';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  open?: boolean;
}

type ToastInput = Omit<Toast, 'id' | 'open'>;

let toastCount = 0;
const listeners: Array<(toasts: Toast[]) => void> = [];
let memoryToasts: Toast[] = [];

function dispatch(toasts: Toast[]) {
  memoryToasts = toasts;
  listeners.forEach((l) => l(toasts));
}

export function toast(input: ToastInput) {
  const id = String(++toastCount);
  const t: Toast = { ...input, id, open: true };
  dispatch([...memoryToasts, t].slice(-TOAST_LIMIT));
  setTimeout(() => {
    dispatch(memoryToasts.map((x) => (x.id === id ? { ...x, open: false } : x)));
    setTimeout(() => dispatch(memoryToasts.filter((x) => x.id !== id)), 300);
  }, TOAST_REMOVE_DELAY);
}

export function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>(memoryToasts);
  React.useEffect(() => {
    listeners.push(setToasts);
    return () => { const i = listeners.indexOf(setToasts); if (i > -1) listeners.splice(i, 1); };
  }, []);
  return { toasts, toast };
}
