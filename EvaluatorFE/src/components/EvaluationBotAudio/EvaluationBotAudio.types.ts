export type ChatHistoryType = {
  content: string;
  additional_kwargs: any;
  response_metadata: any;
  type: "ai" | "human";
  name?: string;
  id?: string | number;
  example: boolean;
  tool_calls: any[];
  invalid_tool_calls: any[];
  usage_metadata?: any;
};

export type ChatResponse = {
  audio?: string;
  question: string;
  previous_answer: string;
  chat_history: ChatHistoryType[];
  is_complete: boolean;
  errors: any[];
  viva_type: string;
  code_snippet: string | null;
};

export type VivaReponseType = "audio" | "text";
