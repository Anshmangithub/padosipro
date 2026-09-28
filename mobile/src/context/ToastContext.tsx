import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Toast } from '../components/Toast';
import type { ToastType } from '../components/Toast';

interface ToastState {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    nextId.current += 1;
    setToast({ id: nextId.current, message, type });
  }, []);

  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const showError = useCallback((message: string) => showToast(message, 'error'), [showToast]);

  const value = useMemo(() => ({ showToast, showSuccess, showError }), [showToast, showSuccess, showError]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Toast key={toast.id} message={toast.message} type={toast.type} onHide={() => setToast(null)} />
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
