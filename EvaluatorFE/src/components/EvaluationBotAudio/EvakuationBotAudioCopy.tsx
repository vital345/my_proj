import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import WarningIcon from "@mui/icons-material/Warning";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import conf from "../../conf/conf";
import "./QuestionComponent.css"; // Import the CSS file

const QuestionComponent: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [time, setTime] = useState<number>(0);
  const [history, setHistory] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isRecorded, setIsRecorded] = useState<boolean>(false);
  const [audioData, setAudioData] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isTextDialogOpen, setIsTextDialogOpen] = useState<boolean>(false);
  const [textAnswer, setTextAnswer] = useState<string>("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const speechCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const historyContentRef = useRef<HTMLDivElement | null>(null);
  const { chatId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = ""; // Chrome requires returnValue to be set
      toast.error(
        <>
          <WarningIcon /> You cannot refresh the page!
        </>,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        }
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (currentQuestion !== "") {
      const utterance = new SpeechSynthesisUtterance(currentQuestion);
      const simulateSpeechVisualization = () => {
        setHistory((prev) => [...prev, currentQuestion]);
        const canvas = speechCanvasRef.current;
        if (!canvas) return;

        const canvasCtx = canvas.getContext("2d");
        if (!canvasCtx) return;

        let animationFrameId: number;

        const draw = () => {
          canvasCtx.fillStyle = "whitesmoke";
          canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

          canvasCtx.lineWidth = 2;
          canvasCtx.strokeStyle = "#1b849b"; // Blue color for the waveform

          canvasCtx.beginPath();

          const bufferLength = 64;
          const sliceWidth = (canvas.width * 1.0) / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = Math.random() * 0.5 + 0.5; // Simulate random waveform
            const y = (v * canvas.height) / 2;

            if (i === 0) {
              canvasCtx.moveTo(x, y);
            } else {
              canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
          }

          canvasCtx.lineTo(canvas.width, canvas.height / 2);
          canvasCtx.stroke();

          animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        utterance.onend = () => {
          cancelAnimationFrame(animationFrameId);
          canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
          setIsSpeaking(false); // Stop glowing effect
        };
      };

      utterance.onstart = () => {
        simulateSpeechVisualization();
        setIsSpeaking(true); // Start glowing effect
      };

      speechSynthesis.speak(utterance);
    }
    return () => {
      speechSynthesis.cancel();
    };
  }, [currentQuestion]);

  const startRecording = async () => {
    setIsRecording(true);
    timerRef.current = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    audioContextRef.current = new AudioContext();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    analyserRef.current = audioContextRef.current.createAnalyser();
    source.connect(analyserRef.current);
    visualizeRecording();

    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioData(blob);
      setIsRecorded(true);
      chunksRef.current = [];
    };
    mediaRecorderRef.current.start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTime(0);

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  useEffect(() => {
    if (time >= 120) {
      stopRecording();
    }
  }, [time]);

  const visualizeRecording = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const canvasCtx = canvas.getContext("2d");
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      if (canvasCtx) {
        canvasCtx.fillStyle = "whitesmoke";
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = "#1b849b"; // Blue color for the waveform

        canvasCtx.beginPath();

        const sliceWidth = (canvas.width * 1.0) / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            canvasCtx.moveTo(x, y);
          } else {
            canvasCtx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
      }
    };

    draw();
  };

  const sendAudioToBackend = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("answer", audioBlob, "answer.webm");
    try {
      const response = await axios.post(
        `${conf.backendUrl}/evaluation/viva/voice/${chatId}/`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error("Error uploading audio", error);
      return null;
    }
  };

  const sendTextToBackend = async (text: string) => {
    try {
      const response = await axios.post(
        `${conf.backendUrl}/evaluation/viva/text/${chatId}/`,
        { answer: text },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error("Error uploading text answer", error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (audioData !== null) {
      setIsLoading(true);
      const res = await sendAudioToBackend(audioData);
      if (res.is_complete === true) {
        setIsDialogOpen(true);
        setTimeout(() => {
          navigate("/");
        }, 5000);
      } else {
        setCurrentQuestion(res.question);
        setHistory((prev) => [
          ...prev,
          res.previous_answer !== undefined && res.previous_answer.length > 0
            ? res.previous_answer
            : "No answer",
        ]);
      }
      setAudioData(null);
      setIsRecorded(false);
      setIsLoading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (textAnswer) {
      setIsTextDialogOpen(false);
      setIsLoading(true);
      const res = await sendTextToBackend(textAnswer);
      if (res.is_complete === true) {
        setIsDialogOpen(true);
        setTimeout(() => {
          navigate("/");
        }, 5000);
      } else {
        setCurrentQuestion(res.question);
        setHistory((prev) => [
          ...prev,
          res.previous_answer !== undefined && res.previous_answer.length > 0
            ? res.previous_answer
            : "No answer",
        ]);
      }
      setTextAnswer("");
      setIsTextDialogOpen(false);
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setIsRecorded(false);
    setAudioData(null);
    // Allow user to record again
  };

  return (
    <div className="question-component">
      <div className="left-panel">
        <div className="image-container">
          <div>
            <img
              style={{ height: "200px", width: "200px", borderRadius: "50%" }}
              className={`profile-image ${isSpeaking ? "glowing" : ""}`}
              src="https://images.unsplash.com/photo-1592009309602-1dde752490ae?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&w=1000&q=80"
              alt="Profile"
            />
          </div>
          <div
            style={{ width: "90%", display: "flex", justifyContent: "center" }}
          >
            <canvas ref={speechCanvasRef} className="speech-canvas"></canvas>
          </div>
        </div>
        <div className="question-panel">
          <Paper elevation={7} className="question-paper">
            {isLoading ? (
              <Box sx={{ width: "100%" }}>
                <Skeleton width="40%" />
                <Skeleton width="80%" />
                <Skeleton width="60%" />
                <Skeleton width="40%" />
              </Box>
            ) : (
              <div className="question-content">
                <Typography variant="h6">{currentQuestion}</Typography>
                <Typography variant="h5">{`${Math.floor(time / 60)}:${
                  time % 60
                } / 2:00`}</Typography>
                <div className="controls">
                  {isRecording && (
                    <canvas
                      ref={canvasRef}
                      className="recording-canvas"
                    ></canvas>
                  )}
                  {!isRecorded ? (
                    <>
                      <Button
                        variant="contained"
                        style={{ backgroundColor: "#1b849b" }}
                        onClick={isRecording ? stopRecording : startRecording}
                        startIcon={isRecording ? <StopIcon /> : <MicIcon />}
                      >
                        {isRecording ? "Stop" : "Start"}
                      </Button>
                      {history.length > 0 &&
                        audioData == null &&
                        isRecording === false && (
                          <Button
                            variant="text"
                            style={{ marginLeft: "10px" }}
                            onClick={() => setIsTextDialogOpen(true)}
                          >
                            Answer through text
                          </Button>
                        )}
                    </>
                  ) : (
                    <div>
                      <Button
                        variant="contained"
                        style={{
                          backgroundColor: "#1b849b",
                          marginRight: "10px",
                        }}
                        onClick={handleSubmit}
                        disabled={isLoading}
                      >
                        Submit to AI
                      </Button>
                      <Button
                        variant="contained"
                        style={{ backgroundColor: "#f44336" }}
                        onClick={handleRetry}
                        disabled={isLoading}
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Paper>
        </div>
      </div>
      <div className="right-panel">
        <Paper elevation={7} style={{ width: "80%", height: "80vh" }}>
          <div className="history-container" ref={historyContentRef}>
            <div className="history-content">
              <h3 style={{ textAlign: "center" }}>
                You can view questions and answers here
              </h3>
              {history.length > 0
                ? history.map((questionOrAnswer, index) =>
                    index % 2 !== 0 ? (
                      <p
                        className="history-item"
                        style={{ color: "#1b849b" }}
                        key={index}
                      >
                        <small className="ai-interviewer">AI Interviewer</small>
                        <br /> {questionOrAnswer}
                      </p>
                    ) : (
                      <p
                        className="history-item"
                        style={{ textAlign: "right", color: "#333" }}
                        key={index}
                      >
                        <small className="user" style={{ color: "#333" }}>
                          You
                        </small>
                        <br /> {questionOrAnswer}
                      </p>
                    )
                  )
                : null}
            </div>
          </div>
        </Paper>
      </div>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Congratulations!</DialogTitle>
        <DialogContent>
          <Typography variant="h6">
            You have completed your evaluation!
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate("/")}>Go to Home</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isTextDialogOpen}
        onClose={() => setIsTextDialogOpen(false)}
      >
        <DialogTitle>Answer through Text</DialogTitle>
        <DialogContent>
          <Typography variant="h6">{currentQuestion}</Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Your Answer"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setTextAnswer("");
              setIsTextDialogOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleTextSubmit}>Submit</Button>
        </DialogActions>
      </Dialog>
      <ToastContainer />
    </div>
  );
};
export default QuestionComponent;
