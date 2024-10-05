import { randomUUID } from "node:crypto";
import { analyzeQuestion } from "../openai/LLM.prompt";
import { QuestionResult } from "../types/question.type";
import { config } from "../config/config";

const questionQueue: QuestionResult[] = [];

export async function processQuestion(text: string): Promise<void> {
    const questionResult = await analyzeQuestion({ questionText: text });
    const formattedResult: QuestionResult = {
        id: questionResult.id || randomUUID(),
        questionType: questionResult.questionType,
        question: questionResult.question,
        options: questionResult.options,
        analysis: questionResult.analysis,
        answer: questionResult.answer,
        status: 'answered'
    };

    questionQueue.unshift(formattedResult);
    if (questionQueue.length > config.MAX_QUEUE_SIZE) {
        questionQueue.pop();
    }
}

export function getLatestQuestion(): QuestionResult | null {
    return questionQueue.length > 0 ? questionQueue[0] : null;
}

export function getAllQuestions(): QuestionResult[] {
    return questionQueue;
}