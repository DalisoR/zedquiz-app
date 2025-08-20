import { useCallback } from 'react';
import logger from '../utils/logger';
import { useAuth } from '../contexts/AuthContext';

export const useErrorHandler = () => {
  const { user } = useAuth();

  const handleError = useCallback(
    (error, context = {}) => {
      // Add user context if available
      const errorContext = {
        ...context,
        userId: user?.id,
        timestamp: new Date().toISOString()
      };

      // Determine if this is an API error or a standard error
      if (error?.response) {
        // Handle API errors
        logger.error(`API Error: ${error.response.status} ${error.response.statusText}`, error, {
          ...errorContext,
          endpoint: error.config?.url,
          method: error.config?.method
        });
      } else {
        // Handle standard errors
        logger.error(error.message || 'An unexpected error occurred', error, errorContext);
      }

      // You could add additional error handling here, like showing a toast notification
      return error;
    },
    [user]
  );

  return handleError;
};

export default useErrorHandler;
