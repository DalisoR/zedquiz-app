import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiInfo, FiAlertCircle, FiX } from 'react-icons/fi';

const ToastContext = createContext(null);

export const ToastProvider = ({ children, position = 'bottom-right', limit = 5, autoClose = 5000 }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id)
    );
  }, []);

  const addToast = useCallback((message, options = {}) => {
    const {
      type = 'info',
      duration = autoClose,
      title = '',
      icon = null,
      action = null,
      className = '',
      id = `toast-${Date.now()}`,
    } = options;

    // Remove any existing toast with the same ID
    if (options.id) {
      removeToast(options.id);
    }

    // Limit the number of toasts
    if (toasts.length >= limit) {
      removeToast(toasts[0].id);
    }

    setToasts((currentToasts) => {
      const newToasts = [...currentToasts, { 
        id, 
        message, 
        type, 
        title,
        action,
        icon,
        className
      }];
      
      // Limit the number of toasts
      return newToasts.slice(-limit);
    });

    if (duration) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [limit, autoClose]);



  const toastTypes = useMemo(() => ({
    success: {
      icon: <FiCheckCircle className="text-green-500" />,
      className: 'toast-success',
      defaultTitle: 'Success!'
    },
    error: {
      icon: <FiXCircle className="text-red-500" />,
      className: 'toast-error',
      defaultTitle: 'Error!'
    },
    info: {
      icon: <FiInfo className="text-blue-500" />,
      className: 'toast-info',
      defaultTitle: 'Info'
    },
    warning: {
      icon: <FiAlertCircle className="text-yellow-500" />,
      className: 'toast-warning',
      defaultTitle: 'Warning!'
    },
  }), []);

  // Position is now handled by CSS classes

  const contextValue = useMemo(() => ({
    addToast,
    removeToast,
  }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className={`toast-container toast-${position}`}>
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const typeConfig = toastTypes[toast.type] || toastTypes.info;
            const icon = toast.icon || typeConfig.icon;
            const title = toast.title || typeConfig.defaultTitle;
            
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.95,
                  transition: { duration: 0.15 }
                }}
                transition={{ 
                  type: 'spring',
                  damping: 25,
                  stiffness: 300
                }}
                className={`toast ${typeConfig.className} ${toast.className || ''}`}
                role="alert"
                aria-live="assertive"
                data-toast-id={toast.id}
                style={{
                  '--toast-duration': `${toast.duration}ms`,
                  '--toast-progress': '100%'
                }}
              >
                <div className="toast-icon">
                  {icon}
                </div>
                <div className="toast-content">
                  {title && <h4 className="toast-title">{title}</h4>}
                  <p className="toast-message">{toast.message}</p>
                  {toast.action && (
                    <div className="mt-2">
                      {toast.action}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    removeToast(toast.id);
                  }}
                  className="toast-close"
                  aria-label="Close notification"
                >
                  <FiX size={18} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastProvider;
