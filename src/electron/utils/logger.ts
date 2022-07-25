import { TransformableInfo } from 'logform';
import path from 'path';
import winston from 'winston';

import { logsPath } from './path';

const logger = winston.createLogger();

const timestampFormat = 'YYYY-MM-DD HH:mm:ss';
const printFormat = (info: TransformableInfo) => `[${info.timestamp}] - ${info.level}: ${info.message}`;

const fileTransportOptions: winston.transports.FileTransportOptions = {
    format: winston.format.combine(
        winston.format.timestamp({ format: timestampFormat }),
        winston.format.printf(printFormat),
    ),
    maxsize: 50 * 1024 * 1024, // 50MB
    maxFiles: 5,
    tailable: true,
};

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: timestampFormat }),
            winston.format.printf(printFormat),
        ),
        level: 'debug',
        handleExceptions: true,
    }));
} else {
    logger.add(new winston.transports.File({
        filename: path.join(logsPath, 'error.log'),
        level: 'error',
        handleExceptions: true,
        ...fileTransportOptions,
    }));
    logger.add(new winston.transports.File({
        filename: path.join(logsPath, 'info.log'),
        level: 'info',
        ...fileTransportOptions,
    }));
}

export default logger;
