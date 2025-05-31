import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { AppDispatch, RootState } from ".";
import conf from "../conf/conf";
import {
  AudioQueueType,
  ChathistoryType,
  QuestionFromSocketType,
  QuestionType,
  SubmitQuestionType,
} from "./questionSlice.types";

const initialState: AudioQueueType = {
  questions: [],
  loading: false,
  chatHistory: [],
  is_complete: false,
  hasQuizEnded: false,
  askedQuestions: [],
  isScreenSharing: false,
};

const audioQuestionSlice = createSlice({
  initialState,
  name: "audioQuestion",
  reducers: {
    setAddToExistingAudioQuestion: (
      state: AudioQueueType,
      action: PayloadAction<{ questions: QuestionType[] }>
    ) => {
      const { questions } = action.payload;
      const formattedQuestions = questions.map((q: QuestionType) => ({
        question: q.question,
        code_snippet: q.code_snippet,
      }));
      state.questions = [...state.questions, ...formattedQuestions];
    },
    setAudioQuestionByPopping: (state) => {
      const questions = state.questions;
      questions.shift(); // pop first question
      if (questions.length) {
        const formattedQuestions = questions?.map((q: QuestionType) => ({
          question: q.question,
          code_snippet: q.code_snippet,
        }));
        state.questions = formattedQuestions;
      } else {
        state.questions = [];
      }
    },
    setQuestionFromSocket: (
      state,
      action: PayloadAction<QuestionFromSocketType>
    ) => {
      const { is_completed, step } = action.payload;

      if (step === "domain_specific_qa" && is_completed) {
        const topQuestion = state.questions.shift();
        if (topQuestion) {
          state.questions = [topQuestion];
        }
      } else if (step === "project_specific_qa" && is_completed) {
        state.questions = [];
        state.is_complete = true;
      }
    },
    setQuestionsArray: (state, action: PayloadAction<QuestionType[]>) => {
      state.questions = action.payload;
    },
    setIsComplete: (state, action: PayloadAction<boolean>) => {
      state.is_complete = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setChatHistory: (state, action: PayloadAction<ChathistoryType>) => {
      state.chatHistory = action.payload.chat_history.map((chat) => {
        return chat.content;
      });
    },
    setHasQuizEnded: (state, action: PayloadAction<boolean>) => {
      state.hasQuizEnded = action.payload;
    },
    setAskedQuestions: (state, action: PayloadAction<string[]>) => {
      state.askedQuestions = action.payload;
    },
    setIsScreenSharing: (state, action: PayloadAction<boolean>) => {
      state.isScreenSharing = action.payload;
    },
  },
});

const getIdFromUrl = () => {
  const currentPath = window.location.pathname;
  const match = currentPath.match(
    /^\/(user-evaluation|evaluation-bot)\/(\d+)$/
  );
  if (match) {
    const urlParts = currentPath.split("/");
    return `-${urlParts[urlParts.length - 1]}`; // Assuming the ID is at the end of the URL
  }

  return "";
};

const persistConfig = {
  key: `root${getIdFromUrl()}`,
  storage,
};

export default persistReducer(persistConfig, audioQuestionSlice.reducer);
export const audioQuestionActions = audioQuestionSlice.actions;

export const requestQuestions = (
  chatId: string | number,
  noOfQuestion: string
) => {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(audioQuestionActions.setLoading(true));
    try {
      const response = await axios.get(
        `${conf.backendUrl}/evaluation/viva/questions/${chatId}/${noOfQuestion}/`
      );
      if (
        response.data.is_complete &&
        response.data.viva_type === "project_specific_qa"
      ) {
        dispatch(audioQuestionActions.setIsComplete(true));
        dispatch(audioQuestionActions.setQuestionsArray([]));
      } else {
        const filteredQuestions: QuestionType[] = [];
        (response.data?.question as QuestionType[]).forEach((response) => {
          if (getState().questions.askedQuestions.includes(response.question)) {
            return;
          }
          filteredQuestions.push(response);
          return;
        });
        dispatch(
          audioQuestionActions.setAddToExistingAudioQuestion({
            questions: filteredQuestions,
          })
        );
      }
    } catch (err) {
      console.error("Error uploading audio", err);
    }
    dispatch(audioQuestionActions.setLoading(false));
  };
};

export const submitQuestion = (
  chatId: string | number,
  payload: SubmitQuestionType,
  callback: () => Promise<ChathistoryType>
) => {
  return async (dispatch: AppDispatch) => {
    dispatch(audioQuestionActions.setLoading(true));
    try {
      await axios.post(
        `${conf.backendUrl}/evaluation/viva/submit_question/text/${chatId}/`,
        payload
      );
      const data = await callback();
      dispatch(audioQuestionActions.setChatHistory(data as ChathistoryType));
      if (data.viva_type === "project_specific_qa" && data.is_complete) {
        dispatch(audioQuestionActions.setIsComplete(true));
      }
      dispatch(audioQuestionActions.setAudioQuestionByPopping());
    } catch (err) {
      console.error("Error:", err);
    }
    dispatch(audioQuestionActions.setLoading(false));
  };
};
