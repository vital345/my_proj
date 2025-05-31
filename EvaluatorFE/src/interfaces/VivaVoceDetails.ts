export interface QuestionDetails {
  // id: number | null,
  // name: string | null,
  type: "human" | "ai";
  content: string;
  ai_score: number;
  ai_explanation: string;
  // example: boolean,
  // tool_calls?: [],
  // usage_metadata?: string | null,
  // additional_kwargs: Record<string, unknown>,
  // response_metadata: Record<string, unknown>,
  // invalid_tool_calls: [],
}

export interface VivaVoceDetails {
  userevaluation_id: number;
  id: number;
  step_report: {
    score: number;
    explanation: string;
    questions: QuestionDetails[];
  };
  step_name: string;
}

export type UserDetailsType = {
  id: number;
  password: string;
  role: string;
  username: string;
};

export type UserScreenVideoType = {
  url: string;
  timestamp: string;
  filename: string;
};
