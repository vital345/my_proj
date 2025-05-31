import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import docco from "react-syntax-highlighter/dist/esm/styles/hljs/docco";
import { toast } from "react-toastify";
import {
  AUTO_SUBMIT_TIME,
  SESSION_STORAGE_KEYS,
} from "../../components/EvaluationBotAudio/EvaluationBotAudio.constants";
import { setIfPageReloaded } from "../../components/EvaluationBotAudio/EvaluationBotAudio.helpers";
import { ShowResumeEvaluationDialog } from "../../components/EvaluationBotAudio/ResumeEvaluation";
import CameraFeed from "../../components/VideoSream";
import conf from "../../conf/conf";
import { useGeminiRealTime } from "../../hooks/useGeminiRealTime";
import { useWebsocket } from "../../hooks/useWebsockets";
import { ToolCall } from "../../module/multimodal-live-types";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  audioQuestionActions,
  requestQuestions,
  submitQuestion,
} from "../../store/questionSlice";
import { GEMINI_CONFIG, moveOnToNextFunction } from "../../utils/geminiUtils";
import { SyntaxhighlighterCustom } from "../../utils/helpers";
import BoxWithLabel from "./BoxWithLabel";
import IdleOrb from "./IdleOrb";
import { SpeakingOrb } from "./SpeakingOrb";
import "./Viva.css";

const VivaPage = () => {
  const { chatId } = useParams();
  const dispatch = useAppDispatch();
  const { questions, is_complete, hasQuizEnded } = useAppSelector(
    (state) => state.questions
  );

  const [time, setTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isReloaded, setIsReloaded] = useState(
    !!sessionStorage.getItem(SESSION_STORAGE_KEYS.IS_RELOADED) && !isDialogOpen
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const handleRef = useRef<string | null>(null);
  const currentQuestionRef = useRef<{
    question: string;
    codeSnippet: string | null;
  }>({
    question: questions?.[0]?.question,
    codeSnippet: questions?.[0]?.code_snippet,
  });

  useWebsocket({ chatId: chatId as string });
  const {
    client,
    setConfig,
    connected,
    setConnected,
    config,
    renderMuteUnmuteButton,
    volume,
  } = useGeminiRealTime();

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);
  }, []);

  const clearTimerInterval = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const submitTextToBE = useCallback(
    async (answerText: string, chatId: string) => {
      const response = await axios.post(
        `${conf.backendUrl}/evaluation/viva/submit_answer/text/${chatId}/`,
        { answer: answerText },
        { headers: { "Content-Type": "application/json" } }
      );
      return response.data;
    },
    []
  );

  useEffect(() => {
    const key = `/evaluation-bot/${chatId}`;
    const isScreenSharing = !!sessionStorage.getItem(key);

    if (!isScreenSharing) {
      toast.info("You must share screen to give viva");
      window.close();
      setIsLoading(true);
    }

    sessionStorage.removeItem(key);

    if (window.opener) {
      window.onbeforeunload = function () {
        window.opener.postMessage("childClosed", window.origin);
      };
    }
  }, []);

  useEffect(() => {
    if (!questions?.[0]?.question) return;

    setConfig(GEMINI_CONFIG);
  }, [questions, setConfig]);

  useEffect(() => {
    const handleConnect = () => {
      if (
        !connected &&
        config?.system_instruction &&
        !isReloaded &&
        !isDialogOpen
      ) {
        client.connect(config);
        client.on("setupcomplete", () => {
          const newMessage = `
            Don't provide any acknowledgement to this message. 
            Just start by asking the question below and the code snippet is for your context only dont read it out loud.
            "inputs": {
              "question": "${currentQuestionRef.current.question}",
              "code_snippet": "${
                currentQuestionRef.current.codeSnippet || "null"
              }"
            }
          `;
          setConnected(true);
          console.log("sending init message gemini.");
          client.sendText({
            message: newMessage,
          });
          setIsLoading(false);
          startTimer();
        });
      }
    };

    handleConnect();
  }, [config?.system_instruction, connected, setConnected, isReloaded]);

  const functionMapping = useMemo(
    () => ({
      [moveOnToNextFunction.name]: async ({ summary }: { summary: string }) => {
        console.log("submitting func called");
        setIsLoading(true);
        setTime(0);
        clearTimerInterval();
        if (!hasQuizEnded) {
          await dispatch(
            submitQuestion(
              chatId as string,
              {
                question: {
                  question: questions?.[0]?.question,
                  code_snippet: questions?.[0]?.code_snippet,
                },
                clean_session: false,
              },
              async () => await submitTextToBE(summary, chatId as string)
            )
          );
        }

        if (hasQuizEnded) {
          dispatch(audioQuestionActions.setIsComplete(true));
          setIsDialogOpen(true);
          if (connected) {
            client.disconnect();
          }
          return "null";
        }

        if (questions?.length <= 1 && !hasQuizEnded) {
          console.log("[size is less than threshold]");
          await dispatch(requestQuestions(chatId as string, "1"));
        }

        return `
          Next question to be asked is as below:
          "question": "${currentQuestionRef.current?.question}",
          "code_snippet": "${currentQuestionRef.current?.codeSnippet || "null"}"
        `;
      },
    }),
    [
      chatId,
      connected,
      dispatch,
      hasQuizEnded,
      questions,
      setConfig,
      setConnected,
    ]
  );

  useEffect(() => {
    const onToolCall = async (toolCall: ToolCall) => {
      const fc = toolCall.function_calls.find((fc) =>
        Object.keys(functionMapping).includes(fc.name)
      );

      if (fc && fc.name in functionMapping) {
        const resp = await functionMapping[fc.name](fc.args as any);
        client.sendToolResponse({
          tool: [
            {
              response: { result: true },
              id: fc.id,
              name: fc.name,
            },
          ],
        });
        if (resp !== "null") {
          setIsLoading(false);
          handleReConnect();
        }
      }
    };

    client.on("functioncall", onToolCall);

    client.on("sessionResumptionUpdate", (data: any) => {
      if (!data?.resumable) {
        return;
      }
      handleRef.current = data.new_handle;
    });

    return () => {
      client.off("functioncall", onToolCall);
    };
  }, [connected, functionMapping]);

  const handleReConnect = useCallback(() => {
    setIsLoading(true);
    const newConfig = {
      ...config,
      ...(handleRef.current && {
        session_resumption: { handle: handleRef.current },
      }),
    };
    setConfig({});
    client.off("setupcomplete");
    client.disconnect();
    setConnected(false);
    setConfig(newConfig);
  }, [config]);

  // Format time display
  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes < 10 ? "0" + minutes : minutes}:${
      remainingSeconds < 10 ? "0" + remainingSeconds : remainingSeconds
    } / 2:00`;
  }, []);

  useEffect(() => {
    if (!is_complete) {
      currentQuestionRef.current = {
        question:
          questions?.[0]?.question ||
          currentQuestionRef?.current?.question ||
          "",
        codeSnippet:
          questions?.[0]?.code_snippet ||
          currentQuestionRef?.current?.codeSnippet ||
          "",
      };
    } else {
      setIsDialogOpen(true);
      if (connected) {
        client.disconnect();
        setConnected(false);
      }
    }
  }, [connected, is_complete, questions]);

  useEffect(() => {
    window.addEventListener("beforeunload", setIfPageReloaded);
    const handleLoad = async () => {
      if (isReloaded) {
        setIsLoading(true);
      }
    };

    handleLoad();

    return () => {
      window.removeEventListener("beforeunload", setIfPageReloaded);
    };
  }, [isReloaded]);

  useEffect(() => {
    if (
      hasQuizEnded &&
      !currentQuestionRef.current?.question?.length &&
      isLoading
    ) {
      dispatch(audioQuestionActions.setIsComplete(true));
    }
  }, [
    hasQuizEnded,
    dispatch,
    currentQuestionRef.current?.question?.length,
    isLoading,
  ]);

  useEffect(() => {
    if (time > AUTO_SUBMIT_TIME) {
      clearTimerInterval();
      if (connected) {
        client.sendText({
          message: '{"SYSTEM": "TIMES_UP"}',
        });
      }
      toast.info("answer auto submitted due to timeout");
    }
  }, [connected, time, clearTimerInterval]);

  // Render question and code snippet
  const renderQuestionContent = () => {
    if (isLoading || isDialogOpen || isReloaded) {
      return (
        <div className="glass-background" style={{ padding: "20px" }}>
          <Skeleton width="80%" />
          <Skeleton width="60%" />
          <Skeleton width="40%" />
        </div>
      );
    }

    return (
      <div className="box box-question">
        <BoxWithLabel
          label={"Question"}
          containerClass={"glass-background question-text"}
        >
          {currentQuestionRef.current?.question}
        </BoxWithLabel>
      </div>
    );
  };

  const renderCodeSnippet = () => {
    if (
      !currentQuestionRef.current?.codeSnippet?.length ||
      isLoading ||
      isDialogOpen ||
      isReloaded
    ) {
      return null;
    }

    return (
      <div className="box syntax-highlighter-container">
        <BoxWithLabel label={"Code Snippet"} containerClass="glass-background">
          <SyntaxhighlighterCustom
            customStyle={{ padding: "1rem", borderRadius: "0.3rem" }}
            style={docco}
            showLineNumbers
            language={"javascript"}
            wrapLines
            wrapLongLines
          >
            {currentQuestionRef.current?.codeSnippet}
          </SyntaxhighlighterCustom>
        </BoxWithLabel>
      </div>
    );
  };

  return (
    <Grid container spacing={2} className="viva-page-container">
      <Grid size={5}>
        <div
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <div style={{ flex: 1, width: "100%" }}>
            {volume ? <SpeakingOrb /> : <IdleOrb />}
          </div>
          <div className="camera-container">
            <CameraFeed />
          </div>
        </div>
      </Grid>
      <Grid size={7} className="right-panel-conatiner">
        <div className="glass-background timer-container">
          {formatTime(time)}
        </div>
        <div>{renderQuestionContent()}</div>
        {renderCodeSnippet()}
        <div className="glass-background controls-container">
          {renderMuteUnmuteButton()}
        </div>
      </Grid>
      <Dialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          window.close();
        }}
      >
        <DialogTitle>Congratulations!</DialogTitle>
        <DialogContent>
          <Typography variant="h6">
            You have completed your evaluation!
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => window.close()}>Finish</Button>
        </DialogActions>
      </Dialog>
      {isReloaded && !isDialogOpen && (
        <ShowResumeEvaluationDialog
          isReloaded={isReloaded}
          setIsReloaded={setIsReloaded}
        />
      )}
    </Grid>
  );
};

export default VivaPage;
