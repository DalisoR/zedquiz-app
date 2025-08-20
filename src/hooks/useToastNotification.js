import { useState, useCallback } from 'react';

// Simple toast notification hook
export function useToastNotification() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };

    setToasts(prev => [...prev, toast]);

    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const showSuccess = useCallback(
    (message, duration) => {
      return showToast(message, 'success', duration);
    },
    [showToast]
  );

  const showError = useCallback(
    (message, duration) => {
      return showToast(message, 'error', duration);
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message, duration) => {
      return showToast(message, 'warning', duration);
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message, duration) => {
      return showToast(message, 'info', duration);
    },
    [showToast]
  );

  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearAll
  };
}
