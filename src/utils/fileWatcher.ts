import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs/promises';
import debounce from 'lodash.debounce';
import { config } from '../config/config';
import { performOCR } from '../service/ocrService';
import { processQuestion } from '../service/questionService';

let latestScreenshotTime = 0;

const handleNewScreenshot = debounce(async (filePath: string): Promise<void> => {
    try {
        const text = await performOCR(filePath);
        if (text) {
            await processQuestion(text);
            // 删除截图文件
            await fs.unlink(filePath);
        }
    } catch (error) {
        console.error('Error processing screenshot:', error);
    }
}, 1000);

export async function watchScreenshots(): Promise<void> {
    const watcher = chokidar.watch(config.SCREENSHOT_DIR, {
        ignored: /(^|[\/\\])\../,
        persistent: true
    });

    watcher.on('add', async (filePath: string) => {
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