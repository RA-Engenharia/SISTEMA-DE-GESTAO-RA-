import winston from 'winston';
import { env } from './env.js';

const { combine, timestamp, printf, colorize, json } = winston.format;

const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  return `${timestamp} [${level}]: ${message} ${metaStr}`;
});

const formats = {
  dev: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), devFormat),
  combined: combine(timestamp(), devFormat),
  json: combine(timestamp(), json()),
};

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: formats[env.LOG_FORMAT],
  transports: [
    new winston.transports.Console(),
  ],
});

// Add file transport in production
if (env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
  );
  logger.add(
    new winston.transports.File({ filename: 'logs/combined.log' })
  );
}
