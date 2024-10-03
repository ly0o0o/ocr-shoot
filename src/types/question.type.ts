export interface QuestionPrompt {
    questionText: string;
}

export interface QuestionResult {
    questionType: 'multipleChoice' | 'calculation' | 'fillInTheBlank' | 'essay';
    question: string;
    options?: string[];
    analysis: string;
    answer: string;
}