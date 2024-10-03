"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chokidar_1 = __importDefault(require("chokidar"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const tesseract_js_1 = require("tesseract.js");
//import clipboardy from 'clipboardy';
const os_1 = __importDefault(require("os"));
const lodash_debounce_1 = __importDefault(require("lodash.debounce"));
const promises_1 = __importDefault(require("fs/promises"));
const dotenv_1 = __importDefault(require("dotenv"));
const LLM_prompt_1 = require("./openai/LLM.prompt");
const node_crypto_1 = require("node:crypto");
dotenv_1.default.config();
const screenshotDir = process.env.SCREENSHOT_DIR || path_1.default.join(os_1.default.homedir(), 'Desktop');
const ocrLanguages = process.env.OCR_LANGUAGES || 'eng+chi_sim+chi_tra';
let latestScreenshotTime = 0;
let worker = null;
const questionQueue = [];
const MAX_QUEUE_SIZE = 50;
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
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
function initializeWorker() {
    return __awaiter(this, void 0, void 0, function* () {
        worker = yield (0, tesseract_js_1.createWorker)(ocrLanguages);
    });
}
function performOCR(imagePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!worker) {
                yield initializeWorker();
            }
            const { data: { text } } = yield worker.recognize(imagePath);
            return text;
        }
        catch (error) {
            console.error('Error during OCR:', error);
            return null;
        }
    });
}
const handleNewScreenshot = (0, lodash_debounce_1.default)((filePath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const text = yield performOCR(filePath);
        if (text) {
            const questionResult = yield (0, LLM_prompt_1.analyzeQuestion)({ questionText: text });
            const formattedResult = {
                id: (0, node_crypto_1.randomUUID)(),
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
            // await clipboardy.write(JSON.stringify(formattedResult, null, 2));
        }
    }
    catch (error) {
        console.error('Error processing screenshot:', error);
    }
}), 1000);
function watchScreenshots() {
    return __awaiter(this, void 0, void 0, function* () {
        const watcher = chokidar_1.default.watch(screenshotDir, {
            ignored: /(^|[\/\\])\../,
            persistent: true
        });
        watcher.on('add', (filePath) => __awaiter(this, void 0, void 0, function* () {
            const fileName = path_1.default.basename(filePath);
            if (path_1.default.extname(filePath).toLowerCase() === '.png') {
                try {
                    const stats = yield promises_1.default.stat(filePath);
                    const fileTime = stats.mtimeMs;
                    if (fileTime > latestScreenshotTime) {
                        latestScreenshotTime = fileTime;
                        yield handleNewScreenshot(filePath);
                    }
                }
                catch (error) {
                    console.error('Error processing file:', filePath, error);
                }
            }
        }));
        watcher.on('error', error => {
            console.error('Error in file watcher:', error);
        });
    });
}
app.get('/api/latest-question', (req, res) => {
    if (questionQueue.length > 0) {
        res.json(questionQueue[0]);
    }
    else {
        res.status(404).json({ message: "No questions available", errorCode: "QUESTION_NOT_FOUND" });
    }
});
app.get('/api/all-questions', (req, res) => {
    res.json(questionQueue);
});
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield initializeWorker();
            yield watchScreenshots();
            app.listen(PORT, () => {
                console.log(`Server is running on http://localhost:${PORT}`);
            });
        }
        catch (error) {
            console.error('Fatal error in main function:', error);
            process.exit(1);
        }
    });
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
