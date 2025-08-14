import { useCallback } from 'react';
import { useToast } from '../components/ui/Toast';
import { FiExternalLink } from 'react-icons/fi';

/**
 * Hook for showing toast notifications throughout the app
 * @returns {Object} Methods for showing different types of toasts
 */
export const useToastNotification = () => {
  const { addToast, removeToast } = useToast();

  /**
   * Show a success toast
   * @param {string} message - The message to display
   * @param {Object} [options] - Additional options
   * @param {string} [options.title] - Optional title
   * @param {number} [options.duration=5000] - Duration in ms (false to disable auto-close)
   * @param {React.ReactNode} [options.action] - Optional action component
   * @param {string} [options.className] - Additional CSS class
   * @returns {string} The toast ID
   */
  const showSuccess = useCallback((message, { 
    title, 
    duration = 5000, 
    action, 
    className = '' 
  } = {}) => {
    return addToast({
      message,
      type: 'success',
      title,
      duration,
      action,
      className,
      disableAutoClose: duration === false
    });
  }, [addToast]);

  /**
   * Show an error toast
   * @param {string|Error} error - The error message or Error object
   * @param {Object} [options] - Additional options
   * @param {string} [options.title] - Optional title
   * @param {number} [options.duration=10000] - Duration in ms (false to disable auto-close)
   * @param {React.ReactNode} [options.action] - Optional action component
   * @param {boolean} [options.showReportLink=false] - Whether to show a report link
   * @param {string} [options.className] - Additional CSS class
   * @returns {string} The toast ID
   */
  const showError = useCallback((error, { 
    title, 
    duration = 10000, 
    action, 
    showReportLink = false,
    className = '' 
  } = {}) => {
    const errorMessage = error?.message || String(error) || 'An unexpected error occurred';
    
    const reportAction = showReportLink ? (
      <button 
        className="inline-flex items-center text-sm font-medium text-red-700 hover:underline"
        onClick={() => {
          // TODO: Implement error reporting
          window.open('mailto:support@zedquiz.com?subject=Error%20Report&body=' + 
            encodeURIComponent(`Error details:\n${errorMessage}\n\n` +
            `Stack trace: ${error?.stack || 'Not available'}`));
        }}
      >
        Report issue <FiExternalLink className="ml-1" size={14} />
      </button>
    ) : undefined;

    return addToast({
      message: errorMessage,
      type: 'error',
      title: title || 'Something went wrong',
      duration,
      action: action || reportAction,
      className,
      disableAutoClose: duration === false
    });
  }, [addToast]);

  /**
   * Show an info toast
   * @param {string} message - The message to display
   * @param {Object} [options] - Additional options
   * @param {string} [options.title] - Optional title
   * @param {number} [options.duration=5000] - Duration in ms (false to disable auto-close)
   * @param {React.ReactNode} [options.action] - Optional action component
   * @param {string} [options.className] - Additional CSS class
   * @returns {string} The toast ID
   */
  const showInfo = useCallback((message, { 
    title, 
    duration = 5000, 
    action, 
    className = '' 
  } = {}) => {
    return addToast({
      message,
      type: 'info',
      title,
      duration,
      action,
      className,
      disableAutoClose: duration === false
    });
  }, [addToast]);

  /**
   * Show a warning toast
   * @param {string} message - The message to display
   * @param {Object} [options] - Additional options
   * @param {string} [options.title] - Optional title
   * @param {number} [options.duration=8000] - Duration in ms (false to disable auto-close)
   * @param {React.ReactNode} [options.action] - Optional action component
   * @param {string} [options.className] - Additional CSS class
   * @returns {string} The toast ID
   */
  const showWarning = useCallback((message, { 
    title, 
    duration = 8000, 
    action, 
    className = '' 
  } = {}) => {
    return addToast({
      message,
      type: 'warning',
      title,
      duration,
      action,
      className,
      disableAutoClose: duration === false
    });
  }, [addToast]);

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    dismissToast: removeToast,
    dismissAllToasts: () => {
      // Get all toast IDs and remove them
      // This is a real app, you might want to track IDs
      const toasts = document.querySelectorAll('[data-toast-id]');
      toasts.forEach(toast => {
        const id = toast.getAttribute('data-toast-id');
        if (id) removeToast(id);
      });
    }
  };
};

export default useToastNotification;
