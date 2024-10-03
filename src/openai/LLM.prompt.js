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
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeQuestion = void 0;
const openConfig_1 = require("./openConfig");
const analyzeQuestion = (questionPrompt) => __awaiter(void 0, void 0, void 0, function* () {
    const systemPrompt = `
    You are an expert problem solver, capable of analyzing and solving various types of questions accurately and efficiently. Your task is to identify the question type, provide a detailed analysis, and give the correct answer.

    Guidelines:
    1. First, determine the question type (multiple choice, calculation, fill-in-the-blank, or essay/open-ended).
    2. For multiple choice questions, provide the question, options, a step-by-step analysis of each option, and the correct answer.
    3. For other question types, provide the question, a detailed explanation, and the answer.
    4. Your analysis should be clear, logical, and easy to understand.
    5. If the question is a calculation problem, show all necessary steps.
    6. For essay questions, provide key points that should be included in the answer.
    7.answer the question in Chinese.

    Question Text:
    ${questionPrompt.questionText}

    Output the analysis in JSON format based on the question type:

    For multiple choice questions:
    {
      "questionType": "multipleChoice",
      "question": "<question text>",
      "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
      "analysis": "<detailed analysis of each option>",
      "answer": "<correct answer>"
    }

    For other question types:
    {
      "questionType": "<calculationORfillInTheBlankORessay>",
      "question": "<question text>",
      "analysis": "<detailed explanation>",
      "answer": "<correct answer>"
    }
  `;
    const messages = [
        {
            role: 'system',
            content: systemPrompt,
        },
        {
            role: 'user',
            content: `Analyze the following question and provide the appropriate response based on its type: ${questionPrompt.questionText}`,
        },
    ];
    const result = yield openConfig_1.openai.chat.completions.create({
        // model: 'gpt-3.5-turbo',
        model: 'gpt-4o',
        messages,
        max_tokens: 2000,
        response_format: {
            type: 'json_object',
        },
    });
    // 解析生成的 JSON 内容
    const response = JSON.parse(result.choices[0].message.content);
    // 根据问题类型返回适当的结果
    if (response.questionType === 'multipleChoice') {
        return {
            questionType: 'multipleChoice',
            question: response.question,
            options: response.options,
            analysis: response.analysis,
            answer: response.answer,
        };
    }
    else {
        return {
            questionType: response.questionType,
            question: response.question,
            analysis: response.analysis,
            answer: response.answer,
        };
    }
});
exports.analyzeQuestion = analyzeQuestion;
