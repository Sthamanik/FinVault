import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

const logger = pino(
  {
    level: isProduction ? 'info' : 'debug',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label.toUpperCase() };
      },
    },
    base: {
      pid: process.pid,
      env: process.env.NODE_ENV || 'development',
    },
  },
  isProduction
    ? undefined
    : pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      })
);

export default logger;