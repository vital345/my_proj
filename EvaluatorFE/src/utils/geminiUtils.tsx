import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { SETTINGS } from "../conf/settings";
import { LiveConfig } from "../module/multimodal-live-types";
import { GEMINI_PROMPT } from "../prompts/GeminiPrompt";
import { SUBMIT_FUNCTION } from "../prompts/constants";

export const moveOnToNextFunction: FunctionDeclaration = {
  name: SUBMIT_FUNCTION,
  description: `
      argument summary: Submits a concise summary of the user's responses during the viva session. 
                        This summary should encapsulate the user's understanding based on their conversation with the viva bot, without including every detail.
                        Mention where user is lagging behind in context of asked question.

      return: This function also provides the next question to be asked in the return value (sent in the tool call response).
    `,
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      summary: {
        type: SchemaType.STRING,
      },
    },
    required: ["summary"],
  },
};

export const GEMINI_CONFIG: LiveConfig = {
  response_modalities: ["AUDIO"],
  speech_config: {
    voice_config: {
      prebuilt_voice_config: { voice_name: SETTINGS.GEMINI_VOICE_MODEL },
    },
    language_code: "en-GB",
  },
  system_instruction: {
    parts: [
      {
        text: JSON.stringify(GEMINI_PROMPT),
      },
    ],
  },
  tools: [{ function_declarations: [moveOnToNextFunction] }],
  session_resumption: {},
  context_window_compression: {
    sliding_window: { target_tokens: 5000 },
  },
};
