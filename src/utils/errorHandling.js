/**
 * Error handling utilities for consistent user feedback
 */

// Common error messages
const ERROR_MESSAGES = {
  // Authentication errors
  'auth/email-already-in-use': 'This email is already registered. Please use a different email or try logging in.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password should be at least 6 characters long.',
  'auth/user-not-found': 'No account found with this email. Please check your email or sign up.',
  'auth/wrong-password': 'Incorrect password. Please try again or reset your password.',
  'auth/too-many-requests': 'Too many failed login attempts. Please try again later or reset your password.',
  'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
  
  // Form validation
  'validation/required': 'This field is required.',
  'validation/email': 'Please enter a valid email address.',
  'validation/password-length': 'Password must be at least 8 characters long.',
  'validation/password-match': 'Passwords do not match.',
  'validation/phone': 'Please enter a valid phone number.',
  'validation/file-size': 'File size must be less than 5MB.',
  'validation/file-type': 'Only PDF files are allowed.',
  
  // API errors
  'api/network-error': 'Unable to connect to the server. Please check your internet connection.',
  'api/timeout': 'Request timed out. Please try again.',
  'api/unauthorized': 'You need to be logged in to perform this action.',
  'api/forbidden': 'You do not have permission to perform this action.',
  'api/not-found': 'The requested resource was not found.',
  'api/server-error': 'An unexpected server error occurred. Please try again later.',
  
  // Default
  'default': 'Something went wrong. Please try again later.'
};

/**
 * Get a user-friendly error message from an error object
 * @param {Error|string|object} error - The error object or error code
 * @param {string} [context] - Additional context for the error
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error, context) => {
  if (!error) return ERROR_MESSAGES['default'];
  
  // Handle string error codes
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error || ERROR_MESSAGES['default'];
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    // Check for Supabase errors
    if (error.code && ERROR_MESSAGES[error.code]) {
      return ERROR_MESSAGES[error.code];
    }
    
    // Check for network errors
    if (error.message && error.message.includes('Network Error')) {
      return ERROR_MESSAGES['api/network-error'];
    }
    
    return error.message || ERROR_MESSAGES['default'];
  }
  
  // Handle API response errors
  if (error.error_description) {
    return error.error_description;
  }
  
  if (error.message) {
    return error.message;
  }
  
  // Add context if available
  if (context) {
    return `${context}: ${ERROR_MESSAGES['default']}`;
  }
  
  return ERROR_MESSAGES['default'];
};

/**
 * Display an error message to the user
 * @param {Error|string} error - The error to display
 * @param {string} [context] - Additional context for the error
 * @param {function} [setError] - Optional state setter for form errors
 * @param {string} [field] - Field name for form errors
 */
export const showError = (error, context, setError, field) => {
  const message = getErrorMessage(error, context);
  
  // Log the full error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error);
  }
  
  // Set form field error if setError function is provided
  if (setError && field) {
    setError(field, { type: 'manual', message });
    return;
  }
  
  // Otherwise show a toast/alert
  // You can replace this with your preferred notification system
  alert(message);
};

/**
 * Create a validation function that sets form errors
 * @param {function} setError - The form's setError function
 * @returns {function} A validation function that can be used with react-hook-form
 */
export const createValidationHandler = (setError) => {
  return (field, error) => {
    showError(error, null, setError, field);
  };
};
