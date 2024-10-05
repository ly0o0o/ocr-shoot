import express from 'express';
import { getLatestQuestion, getAllQuestions } from '../service/questionService';

const router = express.Router();

router.get('/realtime-questions', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const intervalId = setInterval(() => {
        const latestQuestion = getLatestQuestion();
        if (latestQuestion) {
            res.write(`data: ${JSON.stringify(latestQuestion)}\n\n`);
        }
    }, 3000);

    req.on('close', () => {
        clearInterval(intervalId);
    });
});

router.get('/latest-question', (req, res) => {
    const latestQuestion = getLatestQuestion();
    if (latestQuestion) {
        res.json(latestQuestion);
    } else {
        res.status(404).json({ message: "No questions available", errorCode: "QUESTION_NOT_FOUND" });
    }
});

router.get('/all-questions', (req, res) => {
    res.json(getAllQuestions());
});

export default router;