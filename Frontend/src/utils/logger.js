export const logger = {
  info: (message, ...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  
  success: (message, ...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SUCCESS] ${message}`, ...args);
    }
  },
  
  error: (message, error) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[ERROR] ${message}`, error);
    }
    
    // You could also send errors to an error tracking service here
    // e.g., Sentry, LogRocket, etc.
  },
  
  warn: (message, ...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }
};
