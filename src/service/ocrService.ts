import { createWorker, Worker } from 'tesseract.js';
import { config } from '../config/config';

let worker: Worker | null = null;

export async function initializeWorker(): Promise<void> {
    worker = await createWorker(config.OCR_LANGUAGES);
}

export async function performOCR(imagePath: string): Promise<string | null> {
    try {
        if (!worker) {
            await initializeWorker();
        }
        const { data: { text } } = await worker!.recognize(imagePath);
        return text;
    } catch (error) {
        console.error('Error during OCR:', error);
        return null;
    }
}