import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

const formats = {
  dev: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `[${timestamp}] ${level}: ${message}${metaStr}`;
    })
  ),
  prod: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
};

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: isProduction ? formats.prod : formats.dev,
    silent: process.env.NODE_ENV === 'test',
  }),
];

if (isProduction) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: formats.prod,
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: formats.prod,
      maxsize: 20 * 1024 * 1024, // 20 MB
      maxFiles: 5,
    })
  );
}

export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  transports,
});
