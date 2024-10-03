import { openai, openaiShort } from './openConfig';
import { QuestionPrompt, QuestionResult } from '../types/question.type';

export const analyzeQuestion = async (questionPrompt: QuestionPrompt): Promise<QuestionResult> => {
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
            role: 'system' as const,
            content: systemPrompt,
        },
        {
            role: 'user' as const,
            content: `Analyze the following question and provide the appropriate response based on its type: ${questionPrompt.questionText}`,
        },
    ];

    const maxRetries = 3; // 最大重试次数
    let attempt = 0; // 当前尝试次数
    let result: any; // 存储请求结果

    while (attempt < maxRetries) {
        try {
            // 调用 OpenAI API
            result = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages,
                max_tokens: 2000,
                response_format: {
                    type: 'json_object',
                },
            });

            // 请求成功，跳出重试循环
            break;
        } catch (error) {
            attempt++; // 增加尝试次数
            console.error(`Attempt ${attempt} failed:`, error);

            // 如果达到最大重试次数，抛出错误
            if (attempt === maxRetries) {
                throw new Error('Max retries reached. Unable to complete the request.');
            }
        }
    }

    // 解析生成的 JSON 内容
    const response = JSON.parse(result.choices[0].message.content!);

    // 根据问题类型返回适当的结果
    if (response.questionType === 'multipleChoice') {
        return {
            questionType: 'multipleChoice',
            question: response.question,
            options: response.options,
            analysis: response.analysis,
            answer: response.answer,
        } as QuestionResult;
    } else {
        return {
            questionType: response.questionType,
            question: response.question,
            analysis: response.analysis,
            answer: response.answer,
        } as QuestionResult;
    }
};