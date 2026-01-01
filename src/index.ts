import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/database.js';

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Start server
    const server = app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`API URL: ${env.API_URL}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');
        await prisma.$disconnect();
        logger.info('Database connection closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
