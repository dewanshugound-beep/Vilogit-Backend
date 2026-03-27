import app from './src/app.js';
import { logger } from './src/config/logger.js';

// Export the app for Vercel's serverless environment
export default app;

// Only run the server locally or in non-production environments
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
}
