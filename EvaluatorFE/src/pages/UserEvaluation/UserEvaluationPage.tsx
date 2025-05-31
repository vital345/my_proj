import {
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ScreenShareContext } from "../../contexts/ScreenSharingContext.provider";
import { useScreenShare } from "../../hooks/useScreenShare";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { requestQuestions } from "../../store/questionSlice";
import "./UserEvaluationPage.css";

export const UserEvaluationPage: React.FC = () => {
  const { chatId } = useParams();
  const { loading, questions, is_complete } = useAppSelector(
    (state) => state.questions
  );
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(
    "Permission denied for mic/cam. Please allow access to continue."
  );
  const windowRef = useRef<WindowProxy | null>(null);
  const [showButtonLoading, setButtonLoading] = useState(true);
  const [showPageLoading, setShowPageLoading] = useState<boolean>(
    JSON.parse(
      sessionStorage.getItem(`show-evaluation-loader-${chatId}`) || "false"
    )
  );

  useScreenShare({
    evaluationId: chatId as string,
  });
  const {
    isScreenSharing,
    isPageReloaded,
    setIsPageReloaded,
    setStartScreenSharing,
  } = useContext(ScreenShareContext);

  useEffect(() => {
    function requestPermissions() {
      try {
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .then(() => {
            setError(null);
          })
          .finally(() => {
            setButtonLoading(false);
          });
      } catch (err) {
        console.log({ err });
      }
    }
    requestPermissions();

    if (is_complete) {
      sessionStorage.setItem(`show-evaluation-loader-${chatId}`, "false");
      if (showPageLoading) {
        toast.info(
          "your viva is being submitted, please be patient till the page has finished loading."
        );
      }
      setTimeout(() => {
        setShowPageLoading(false);
      }, 6000);
    }

    window.addEventListener("message", (event) => {
      if (event.data === "childClosed") {
        sessionStorage.setItem(`show-evaluation-loader-${chatId}`, "true");
        window.location.reload();
      }
    });

    return () => {
      if (windowRef.current) {
        windowRef.current.close();
        windowRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!chatId) return;
    if (questions.length) return;
    dispatch(requestQuestions(chatId, "2"));
  }, [chatId]);

  const handleButtonClick = () => {
    if (error) {
      toast.error(error);
      return;
    }
    sessionStorage.setItem(`/evaluation-bot/${chatId}`, "true");
    windowRef.current = window.open(
      `/evaluation-bot/${chatId}`,
      "popupWindow",
      "type=fullscreen"
    );
  };

  useEffect(() => {
    if (windowRef.current && !isScreenSharing) {
      windowRef.current.close();
      windowRef.current = null;
    }
  }, [isScreenSharing]);

  const renderPreparingQuestions = () => {
    return (
      <Dialog open={loading}>
        <DialogTitle>Preparing questions for you</DialogTitle>
        <DialogContent>
          <LinearProgress />
        </DialogContent>
      </Dialog>
    );
  };

  if (showPageLoading && is_complete) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </div>
    );
  }

  return loading ? (
    renderPreparingQuestions()
  ) : (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        paddingBlock: "1.5rem",
      }}
    >
      <Paper
        style={{
          width: "clamp(25rem, 65%, 40rem)",
          maxHeight: "80vh",
          overflowY: "auto",
          borderRadius: "1rem",
          paddingBottom: "2.5rem",
          paddingLeft: "1.5rem",
          boxSizing: "border-box",
          position: "relative",
          scrollbarWidth: "none" /* For Firefox */,
        }}
      >
        {/* Hide scrollbar for Chrome, Safari, and Opera */}
        <style>
          {`
            ::-webkit-scrollbar {
              display: none;
            }
          `}
        </style>

        <Container
          sx={{
            width: "100%",
            textAlign: "center",
            color: "#333",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            padding: "1rem", // Space for the button
          }}
        >
          <Typography variant="h4" component="div" gutterBottom>
            Your Evaluation Begins Here
          </Typography>
          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{ fontSize: "0.9rem" }}
          >
            Read the instructions with attention.
          </Typography>
          <Box
            sx={{
              textAlign: "justify",
              marginBlock: "1rem",
              fontSize: "0.85rem",
            }}
          >
            <Typography
              variant="body2"
              component="div"
              sx={{ marginBottom: "0.5rem" }}
            >
              <strong>Instructions:</strong>
            </Typography>
            <ol style={{ paddingLeft: "1.2rem", margin: 0 }}>
              <li>Ensure a stable internet connection.</li>
              <li>Do not refresh the page or open new tabs.</li>
              <li>Do not close the window under any circumstance.</li>
              <li>Expect project-specific and domain-specific questions.</li>
            </ol>
          </Box>
        </Container>

        {/* Fixed Button at the Bottom-Right */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Button
            variant="contained"
            onClick={handleButtonClick}
            loading={showButtonLoading || (!isScreenSharing && !is_complete)}
            disabled={is_complete}
            sx={{
              backgroundColor: "#1b849b",
              borderRadius: "8px",
              "&:hover": {
                backgroundColor: "#0056b3",
              },
              fontSize: "0.85rem",
              padding: "0.5rem 1.5rem",
            }}
          >
            Start Now
          </Button>
        </Box>
      </Paper>
      <Dialog
        open={isPageReloaded}
        onClose={() => {
          setIsPageReloaded(false);
          setStartScreenSharing(true);
        }}
      >
        <DialogTitle>Resume the evaluation</DialogTitle>
        <DialogActions>
          <Button
            onClick={() => {
              setIsPageReloaded(false);
              setStartScreenSharing(true);
            }}
          >
            Finish
          </Button>
        </DialogActions>
      </Dialog>
      <Outlet />
    </div>
  );
};
