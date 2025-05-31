import React, { useState, useRef, useEffect } from "react";
import { Box, Typography, TextField, IconButton, Paper, Grid, List, ListItem, Divider } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import SendIcon from "@mui/icons-material/Send";
import SettingsIcon from "@mui/icons-material/Settings";
import { useParams } from "react-router-dom";
import axios from "axios";
import Skeleton from '@mui/material/Skeleton';
import conf from "../conf/conf";


// Define types for conversation entries
type ConversationEntry = {
  type: "question" | "answer";
  text: string;
};

const EvaluationBot: React.FC = () => {

  const { chatId } = useParams()

  console.log(chatId)

  const fetchQuestion = async(chatId:string,answer:string = "") => {
    
      const result = await axios
      .post(`${conf.backendUrl}/evaluation/domain_specific_qa/${chatId}/`,{
       "answer":answer
      })
      console.log(result.data)
      return result.data
  }

  useEffect(() => {
    
       fetchQuestion(chatId as string)
       .then(res => {
        if(res.is_complete){
          setCurrentQuestion("Your evaluation is now complete. You can close this window.")
          setIsEvaluationComplete(true)
          return
        }
        setCurrentQuestion(res.question)
       })
       .catch(err => {
        console.log(err)
       })
  },[chatId])


  const [isEvaluationComplete,setIsEvaluationComplete] = useState<boolean>(false)

  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [currentInput, setCurrentInput] = useState<string>("");
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Handle sending input
  const handleSend = async() => {
    if (currentInput.trim()) {
      const userResponse = currentInput.trim();
      setConversation((prev) => [
        ...prev,
        { type: "question", text: currentQuestion },
        { type: "answer", text: userResponse },
      ]);
      setCurrentInput("");
      setCurrentQuestion("")
      const { question,is_complete } = await fetchQuestion(chatId as string,userResponse)
      if(is_complete){
        setCurrentQuestion("Your evaluation is now complete. You can close this window.")
        setIsEvaluationComplete(true)
        return
      }
      setCurrentQuestion(question)
    }
  };

  // Scroll to bottom when conversation updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversation]);


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if(isEvaluationComplete) return;
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const getMaxWidth = (text: string) => {
    if (text.length > 300) return "90%";
    if (text.length > 200) return "80%";
    if (text.length > 100) return "70%";
    return "60%";
  };

  return (
    <Box sx={{ display: "flex", height: "90vh" }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: "20%",
          margin: "auto",
          height: "95vh",
          mt: 2,
          ml: 2,
          mr: 1,
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid #ccc",
          color: "#878787",
          backgroundColor: "#F6F8F9",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, pl: 2, pt: 1 }}>
          <Typography variant="h6">HU SPARK</Typography>
          <SettingsIcon sx={{ mr: 1 }} />
        </Box>
        <List sx={{ width: "100%" }}>
          <ListItem>
            <Typography variant="body1">General Question</Typography>
          </ListItem>
          <Divider />
          <ListItem>
            <Typography variant="body1">Code Related</Typography>
          </ListItem>
          <Divider />
          <ListItem>
            <Typography variant="body1">Miscellaneous</Typography>
          </ListItem>
        </List>
      </Box>

      {/* Evaluation Bot */}
      <Box
        sx={{
          width: "80%",
          margin: "auto",
          height: "95vh",
            mt: 2,
            ml: 2,
            mr: 2,
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid #ccc",
          backgroundColor: "#e0f7fa",
          // backgroundColor: "#1b849b",
        }}
      >
        <Paper 
        elevation={3} 
        sx={{
           p: 2, 
           borderBottom: "1px solid #ccc", 
          //  backgroundColor: "#00acc1",
           backgroundColor: "#1b849b",
           color: "#fff",
           }}>
          <Typography variant="h6" align="center">
            Evaluation Bot
          </Typography>
        </Paper>
        <Box
          ref={chatContainerRef}
          sx={{ p: 2, height: "65vh", overflowY: "scroll", scrollbarWidth: "none",backgroundColor: "#ffffff" }}
        >
          <List>
            {conversation.map((entry, index) => (
              <ListItem key={index} sx={{ justifyContent: entry.type === "answer" ? "flex-end" : "flex-start" }}>
                <Paper
                  elevation={1}
                  sx={{
                    px: 2,
                    py: 1,
                    borderBottomRightRadius: "8px",
                    borderBottomLeftRadius: "8px",
                    borderTopLeftRadius: entry.type === "answer" ? "8px" : "0px",
                    borderTopRightRadius: entry.type !== "answer" ? "8px" : "0px",
                    // maxWidth: "75%",
                    backgroundColor: entry.type === "answer" ? "#b2ebf2" : "#e0f2f1",
                    maxWidth: getMaxWidth(entry.text),
                    wordWrap: "break-word",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <Typography variant="body1">{entry.text}</Typography>
                </Paper>
              </ListItem>
            ))}

            {currentQuestion ? 
            
              <ListItem sx={{ justifyContent: "flex-start" }}>
                <Paper
                  elevation={1}
                  sx={{
                    px: 2,
                    py: 1,
                    borderBottomRightRadius: "8px",
                    borderBottomLeftRadius: "8px",
                    borderTopLeftRadius: "0px",
                    maxWidth: "75%",
                    backgroundColor: "#e0f2f1",
                  }}
                >
                   <Typography variant="body1">{currentQuestion}</Typography> 
                </Paper>
              </ListItem> :  <Skeleton variant="text" width={100} height={40} />
                  }
            
          </List>
        </Box>
        <Grid container sx={{ p: 2, borderTop: "1px solid #ccc", backgroundColor: "#ffffff" }} alignItems="center">
          <Grid item xs={10}>
            <TextField
              fullWidth
              variant="outlined"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your answer here..."
              InputProps={{
                style: { borderRadius: 25 },
                endAdornment: (
                  <IconButton>
                    <MicIcon />
                  </IconButton>
                ),
              }}
            />
          </Grid>
          <Grid item xs={2} textAlign="right">
            <IconButton
              color="primary"
              onClick={handleSend}
              sx={{ borderRadius: "50%", backgroundColor: "#00acc1", color: "#fff", "&:hover": { backgroundColor: "#00838f" } }}
            disabled={isEvaluationComplete}>
              <SendIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default EvaluationBot;
