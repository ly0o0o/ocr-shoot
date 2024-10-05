import dotenv from 'dotenv';
import path from 'path';
import os from 'os';

dotenv.config();

export const config = {
    PORT: process.env.PORT || 3000,
    SCREENSHOT_DIR: process.env.SCREENSHOT_DIR || path.join(os.homedir(), 'Desktop'),
    OCR_LANGUAGES: process.env.OCR_LANGUAGES || 'eng+chi_sim+chi_tra',
    MAX_QUEUE_SIZE: 50
};