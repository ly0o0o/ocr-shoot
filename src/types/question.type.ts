export interface QuestionPrompt {
    questionText: string;
}

export interface QuestionResult {
    id:string,
    questionType: 'multipleChoice' | 'calculation' | 'fillInTheBlank' | 'essay';
    question: string;
    options?: string[];
    status: 'unanswered' | 'answered';
    analysis: string;
    answer: string;
}

