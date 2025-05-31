import { useCallback, useEffect, useRef, useState } from "react";
import { SETTINGS } from "../conf/settings";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { audioQuestionActions, requestQuestions } from "../store/questionSlice";
import {
  QuestionFromSocketType,
  QuestionInnerType,
} from "../store/questionSlice.types";
import { PING_SERVER_INTERVAL } from "./constants";

export const useWebsocket = ({ chatId }: { chatId: string }) => {
  const [socketClient, setSocketClient] = useState<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const {
    questions: questionQueue,
    is_complete,
    askedQuestions,
  } = useAppSelector((state) => state.questions);
  const dispatch = useAppDispatch();

  const sendPingMessages = (socketClient: WebSocket) => {
    pingIntervalRef.current = setInterval(() => {
      socketClient.send("PING!");
    }, PING_SERVER_INTERVAL);
  };

  const handleAddingToQueue = useCallback(
    (question: string) => {
      const parsedQuestion: QuestionInnerType = JSON.parse(question);
      if (askedQuestions.includes(parsedQuestion?.question)) {
        console.log("[Question already asked]");
        return;
      }

      dispatch(
        audioQuestionActions.setAddToExistingAudioQuestion({
          questions: [
            {
              question: parsedQuestion.question,
              code_snippet: parsedQuestion.code_snippet || null,
            },
          ],
        })
      );
      dispatch(
        audioQuestionActions.setAskedQuestions([
          ...askedQuestions,
          parsedQuestion?.question,
        ])
      );
    },
    [askedQuestions, dispatch]
  );

  const handleOnServerMessage = useCallback(
    (event: MessageEvent) => {
      console.log("[event from socket]: ", { event });
      const { data }: { data: string } = event;
      const { is_completed, step, question }: QuestionFromSocketType =
        JSON.parse(data);
      console.log("[parsed data]: ", { is_completed, step, question });

      if (step === "domain_specific_qa" && is_completed) {
        console.log("Domain specific completed!");
        const topQuestion = questionQueue?.length
          ? questionQueue.shift()
          : undefined;

        if (topQuestion) {
          dispatch(audioQuestionActions.setQuestionsArray([topQuestion]));
          if (!question) {
            console.log("[no question received when domain specific ended]");
            return;
          }
          handleAddingToQueue(question);
        } else {
          dispatch(requestQuestions(chatId, "1"));
        }
      } else if (step === "project_specific_qa" && is_completed) {
        console.log("[Quiz has been completed!]");
        dispatch(audioQuestionActions.setQuestionsArray([]));
        dispatch(audioQuestionActions.setHasQuizEnded(true));
        socketClient?.close();
      } else if (question) {
        const parsedQuestion: QuestionInnerType = JSON.parse(question);
        console.log("[received through socket]: ", parsedQuestion);
        handleAddingToQueue(question);
      }
    },
    [chatId, dispatch, handleAddingToQueue, questionQueue, socketClient]
  );

  useEffect(() => {
    console.log("[Socket]:", socketClient);
    if (!socketClient) {
      const ws = new WebSocket(
        `${SETTINGS.BE_WEB_SOCKET_URL}/evaluation/ws/${chatId}/`
      );

      setSocketClient(ws);
      sendPingMessages(ws);
    }
  }, [chatId, socketClient]);

  useEffect(() => {
    if (is_complete) {
      console.log("[Viva had ended]");
      if (socketClient) socketClient?.close();
      setSocketClient(null);
      return;
    }

    if (!socketClient) {
      console.log("[No SocketClient was initialized]");
      return;
    }

    socketClient.onopen = () => {
      console.log("[Connected to websocket server]");
    };

    socketClient.onclose = () => {
      console.log("[Disconnected from WebSocket server]");
      setSocketClient(null);
    };
    socketClient.onmessage = handleOnServerMessage;

    return () => {
      clearInterval(pingIntervalRef.current as NodeJS.Timeout);
    };
  }, [handleOnServerMessage, is_complete, socketClient]);

  return {
    socketClient,
  };
};
