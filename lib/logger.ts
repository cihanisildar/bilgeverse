const logger = {
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    } : '');
  },
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '');
  }
};

export default logger; 