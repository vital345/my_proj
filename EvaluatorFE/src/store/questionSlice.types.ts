export type QuestionType = {
  question: string;
  code_snippet: string | null;
};

export type ChathistoryType = {
  chat_history: {
    content: string;
    type: "human" | "ai";
  }[];
  viva_type?: string;
  is_complete?: boolean;
};

export type AudioQueueType = {
  questions: QuestionType[];
  loading: boolean;
  vivaType?: string | null;
  chatHistory: string[];
  is_complete: boolean;
  hasQuizEnded: boolean;
  askedQuestions: string[];
  isScreenSharing: boolean;
};

export type QuestionInnerType = {
  question: string;
  code_snippet?: string | null;
};

export type SubmitQuestionType = {
  question: QuestionInnerType;
  clean_session: boolean;
};

export type QuestionFromSocketType = {
  question: string;
  step: "project_specific_qa" | "domain_specific_qa";
  is_completed: boolean;
};
