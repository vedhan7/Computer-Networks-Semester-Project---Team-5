// ──────────────────────────────────────────────────────────────────────
// Structured logger — Winston transport with JSON formatting.
// ──────────────────────────────────────────────────────────────────────

import winston from 'winston';
import config from '../config';

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'sdn-backend-engine' },
  transports: [
    new winston.transports.Console({
      format:
        config.nodeEnv === 'development'
          ? winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(
                ({ timestamp, level, message, ...rest }) =>
                  `${timestamp} [${level}] ${message} ${
                    Object.keys(rest).length > 1
                      ? JSON.stringify(rest, null, 2)
                      : ''
                  }`,
              ),
            )
          : winston.format.json(),
    }),
  ],
});

export default logger;
