import express from 'express';
import chokidar from 'chokidar';
import path from 'path';
import cors from 'cors';
import { createWorker, Worker } from 'tesseract.js';
import os from 'os';
import debounce from 'lodash.debounce';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import { analyzeQuestion } from "./openai/LLM.prompt";
import { randomUUID } from "node:crypto";

dotenv.config();


const screenshotDir: string = process.env.SCREENSHOT_DIR || path.join(os.homedir(), 'Desktop');
const ocrLanguages: string = process.env.OCR_LANGUAGES || 'eng+chi_sim+chi_tra';

let latestScreenshotTime = 0;
let worker: Worker | null = null;
const questionQueue: any[] = [];
const MAX_QUEUE_SIZE = 50;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// SSE for real-time question updates
app.get('/api/realtime-questions', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const intervalId = setInterval(() => {
        if (questionQueue.length > 0) {
            res.write(`data: ${JSON.stringify(questionQueue[0])}\n\n`);
        }
    }, 3000); // 每3秒推送一次

    req.on('close', () => {
        clearInterval(intervalId);
    });
});

async function initializeWorker(): Promise<void> {
    worker = await createWorker(ocrLanguages);
}

async function performOCR(imagePath: string): Promise<string | null> {
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

const handleNewScreenshot = debounce(async (filePath: string): Promise<void> => {
    try {
        const text = await performOCR(filePath);
        if (text) {
            const questionResult = await analyzeQuestion({ questionText: text });
            const formattedResult = {
                id: randomUUID(),
                question: questionResult.question,
                options: questionResult.options,
                analysis: questionResult.analysis,
                answer: questionResult.answer,
                status: 'unanswered',
                timestamp: new Date().toISOString()
            };

            questionQueue.unshift(formattedResult);
            if (questionQueue.length > MAX_QUEUE_SIZE) {
                questionQueue.pop();
            }
            // 删除截图文件
            await fs.unlink(filePath);

           // await clipboardy.write(JSON.stringify(formattedResult, null, 2));
        }
    } catch (error) {
        console.error('Error processing screenshot:', error);
    }
}, 1000);

async function watchScreenshots(): Promise<void> {
    const watcher = chokidar.watch(screenshotDir, {
        ignored: /(^|[\/\\])\../,
        persistent: true
    });

    watcher.on('add', async (filePath: string) => {
        const fileName = path.basename(filePath);
        if (path.extname(filePath).toLowerCase() === '.png') {
            try {
                const stats = await fs.stat(filePath);
                const fileTime = stats.mtimeMs;

                if (fileTime > latestScreenshotTime) {
                    latestScreenshotTime = fileTime;
                    await handleNewScreenshot(filePath);
                }
            } catch (error) {
                console.error('Error processing file:', filePath, error);
            }
        }
    });

    watcher.on('error', error => {
        console.error('Error in file watcher:', error);
    });
}

app.get('/api/latest-question', (req, res) => {
    if (questionQueue.length > 0) {
        res.json(questionQueue[0]);
    } else {
        res.status(404).json({ message: "No questions available", errorCode: "QUESTION_NOT_FOUND" });
    }
});

app.get('/api/all-questions', (req, res) => {
    res.json(questionQueue);
});

async function main(): Promise<void> {
    try {
        await initializeWorker();
        await watchScreenshots();

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Fatal error in main function:', error);
        process.exit(1);
    }
}

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

main();