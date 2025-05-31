import type {
  Content,
  FunctionCall,
  FunctionDeclaration,
  GenerationConfig,
  GenerativeContentBlob,
  Part,
  Tool,
} from "@google/generative-ai";

/**
 * the config to initiate the session
 */
export interface LiveConfig extends Partial<LiveGenerationConfig> {
  system_instruction?: { parts: Part[] };
  tools?: Array<
    | Tool
    | { function_declarations: FunctionDeclaration[] }
    | { googleSearch: {} }
    | { codeExecution: {} }
  >;
  input_audio_transcription?: {};
  output_audio_transcription?: {};
  session_resumption?: {
    handle?: string;
  };
  context_window_compression?: {
    sliding_window?: {
      target_tokens: number;
    };
  };
  top_k?: number;
  top_p?: number;
}

export type SessionResumption = {
  new_handle: string;
  resumable: boolean;
};

export type GoAway = {
  time_left: string;
};
export const isGoAway = (a: any): a is GoAway =>
  typeof a.time_left === "string";

export const isSessionResumptionMessage = (a: any): a is SessionResumption => {
  return typeof a.new_handle === "string" && typeof a.resumable === "boolean";
};

export type LiveGenerationConfig = GenerationConfig & {
  response_modalities: ["TEXT" | "AUDIO" | "IMAGE"];
  speech_config?: {
    voice_config?: {
      prebuilt_voice_config?: {
        voice_name: "Puck" | "Charon" | "Kore" | "Fenrir" | "Aoede" | string;
      };
    };
    language_code: string;
  };
  seed: number;
};

export type LiveOutgoingMessage =
  | SetupMessage
  | ClientContentMessage
  | RealtimeInputMessage
  | ToolResponseMessage;

export type SetupMessage = {
  setup: LiveConfig;
};

export type ClientContentMessage = {
  clientContent: {
    turns: Content[];
    turn_complete: boolean;
  };
};

export type FunctionResponseType = {
  tool: {
    response: any;
    id: string;
    name: string;
  }[];
};

export type SendTextType = {
  message: string;
  turn_complete?: boolean;
  role?: "model" | "user";
};

export type RealtimeInputMessage = {
  realtimeInput: {
    mediaChunks: GenerativeContentBlob[];
  };
};

export type ToolResponseMessage = {
  toolResponse: {
    functionResponses: LiveFunctionResponse[];
  };
};

export type ToolResponse = ToolResponseMessage["toolResponse"];

export type LiveFunctionResponse = {
  response: object;
  id: string;
};

/** Incoming types */

export type LiveIncomingMessage =
  | ToolCallCancellationMessage
  | ToolCallMessage
  | ServerContentMessage
  | SetupCompleteMessage;

export type SetupCompleteMessage = { setupComplete: {} };

export type ServerContentMessage = {
  server_content: ServerContent;
};

export type ServerContent =
  | ModelTurn
  | TurnComplete
  | Interrupted
  | ToolCall
  | GoAway
  | SessionResumption;

export type ModelTurn = {
  model_turn: {
    parts: Part[];
  };
};

export type TurnComplete = { turn_complete: boolean };
export type OutputTranscription = {
  output_transcription: {
    text: string;
  };
};

export type Interrupted = { interrupted: true };

export type ToolCallCancellationMessage = {
  toolCallCancellation: {
    ids: string[];
  };
};

export type ToolCallCancellation =
  ToolCallCancellationMessage["toolCallCancellation"];

export type ToolCallMessage = {
  toolCall: ToolCall;
};
export type FunctionCallMessage = {
  function_calls: ToolCall;
};

export type LiveFunctionCall = FunctionCall & {
  id: string;
};

/**
 * A `toolCall` message
 */
export type ToolCall = {
  function_calls: LiveFunctionCall[];
};

/** log types */
export type StreamingLog = {
  date: Date;
  type: string;
  count?: number;
  message: string | LiveOutgoingMessage | LiveIncomingMessage;
};

// Type-Guards

const prop = (a: any, prop: string) =>
  typeof a === "object" && typeof a[prop] === "object";

// outgoing messages
export const isSetupMessage = (a: unknown): a is SetupMessage =>
  prop(a, "setup");

export const isClientContentMessage = (a: unknown): a is ClientContentMessage =>
  prop(a, "clientContent");

export const isRealtimeInputMessage = (a: unknown): a is RealtimeInputMessage =>
  prop(a, "realtimeInput");

export const isToolResponseMessage = (a: unknown): a is ToolResponseMessage =>
  prop(a, "toolResponse");

// incoming messages
export const isSetupCompleteMessage = (a: unknown): a is SetupCompleteMessage =>
  prop(a, "setupComplete");

export const isServerContentMessage = (a: any): a is ServerContentMessage =>
  prop(a, "server_content");

export const isToolCallMessage = (a: any): a is ToolCallMessage =>
  prop(a, "toolCall");

export const isFunctionCall = (a: any): a is FunctionCallMessage =>
  prop(a, "function_calls");

export const isToolCallCancellationMessage = (
  a: unknown
): a is ToolCallCancellationMessage =>
  prop(a, "toolCallCancellation") &&
  isToolCallCancellation((a as any).toolCallCancellation);

export const isModelTurn = (a: any): a is ModelTurn =>
  typeof (a as ModelTurn).model_turn === "object";

export const isTurnComplete = (a: any): a is TurnComplete =>
  typeof (a as TurnComplete).turn_complete === "boolean";

export const isOutputTranscription = (a: any): a is OutputTranscription =>
  typeof (a as OutputTranscription).output_transcription !== null;

export const isInterrupted = (a: any): a is Interrupted =>
  (a as Interrupted).interrupted;

export function isToolCall(value: unknown): value is ToolCall {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;

  return (
    Array.isArray(candidate.functionCalls) &&
    candidate.functionCalls.every((call) => isLiveFunctionCall(call))
  );
}

export function isToolResponse(value: unknown): value is ToolResponse {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;

  return (
    Array.isArray(candidate.functionResponses) &&
    candidate.functionResponses.every((resp) => isLiveFunctionResponse(resp))
  );
}

export function isLiveFunctionCall(value: unknown): value is LiveFunctionCall {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.name === "string" &&
    typeof candidate.id === "string" &&
    typeof candidate.args === "object" &&
    candidate.args !== null
  );
}

export function isLiveFunctionResponse(
  value: unknown
): value is LiveFunctionResponse {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.response === "object" && typeof candidate.id === "string"
  );
}

export const isToolCallCancellation = (
  a: unknown
): a is ToolCallCancellationMessage["toolCallCancellation"] =>
  typeof a === "object" && Array.isArray((a as any).ids);
