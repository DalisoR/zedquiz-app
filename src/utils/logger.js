import { supabase } from '../supabaseClient';

// Log levels
export const LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

// Environment check
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Format the error message with additional context
 */
const formatError = error => {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name
    };
  }
  return error;
};

/**
 * Log to Supabase error_logs table if in production
 */
const logToDatabase = async (level, message, error = null, context = {}) => {
  try {
    await supabase.from('error_logs').insert([
      {
        level,
        message,
        error: error ? formatError(error) : null,
        context,
        timestamp: new Date().toISOString()
      }
    ]);
  } catch (err) {
    // Fallback to console if database logging fails
    console.error('Failed to log to database:', err);
  }
};

/**
 * Main logger function with different severity levels
 */
const logger = {
  error: (message, error = null, context = {}) => {
    if (isDevelopment) {
      console.error(message, error, context);
    }
    logToDatabase(LogLevel.ERROR, message, error, context);
  },

  warn: (message, context = {}) => {
    if (isDevelopment) {
      console.warn(message, context);
    }
    logToDatabase(LogLevel.WARN, message, null, context);
  },

  info: (message, context = {}) => {
    if (isDevelopment) {
      console.info(message, context);
    }
    logToDatabase(LogLevel.INFO, message, null, context);
  },

  debug: (message, context = {}) => {
    if (isDevelopment) {
      console.debug(message, context);
    }
    // Don't log debug messages to database
  }
};

export default logger;
