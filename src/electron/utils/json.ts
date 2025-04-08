import fs from 'fs';

import logger from './logger';

export const readJsonFile = <T>(filePath: string): T | null => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
};

export const updateJsonFile = <T>(filePath: string, data: Partial<T>): void => {
    try {
        const existingData = readJsonFile<T>(filePath) || {};
        const updatedData = { ...existingData, ...data };
        fs.writeFileSync(filePath, JSON.stringify(updatedData), 'utf8');
    } catch (error) {
        logger.error(`Error updating JSON file at ${filePath}:`, error);
    }
};
