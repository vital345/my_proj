import {
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Modal,
  Paper,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import {
  Light as SyntaxHighlighter,
  SyntaxHighlighterProps,
} from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";
import conf from "../../conf/conf";
import {
  UserDetailsType,
  VivaVoceDetails,
} from "../../interfaces/VivaVoceDetails";
import "./VivaQA.css";

interface Props {
  domain_specific_viva_report: VivaVoceDetails;
  project_specific_viva_report: VivaVoceDetails;
  user: UserDetailsType;
}

const SyntaxhighlighterCustom =
  SyntaxHighlighter as unknown as React.FC<SyntaxHighlighterProps>;

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

const VivaQA: React.FC<Props> = ({
  domain_specific_viva_report,
  project_specific_viva_report,
  user,
}) => {
  const [modalContent, setModalContents] = useState<string>("");
  const [showButtonLoading, setShowButtonLoading] = useState<boolean>(false);
  const domain_specific_qa = domain_specific_viva_report.step_report.questions;
  const project_specific_qa =
    project_specific_viva_report.step_report.questions;

  const domain_specific_qa_items: React.JSX.Element[] = [];
  const project_specific_qa_items: React.JSX.Element[] = [];

  for (let i = 0; i < domain_specific_qa.length; i += 2) {
    domain_specific_qa_items.push(
      <ListItem key={i} divider>
        <ListItemText
          primary={
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <p>{JSON.parse(domain_specific_qa[i]?.content)?.question}</p>
              {typeof domain_specific_qa[i]?.ai_score === "number" && (
                <p
                  onClick={() => {
                    setModalContents("");
                    setModalContents(domain_specific_qa[i]?.ai_explanation);
                  }}
                  style={{
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                  title="Click to view justification"
                >
                  Score : {domain_specific_qa[i]?.ai_score}
                </p>
              )}
            </div>
          }
          secondary={domain_specific_qa[i + 1]?.content}
          primaryTypographyProps={{ fontWeight: "bold" }}
        />
      </ListItem>
    );
  }

  for (let i = 0; i < project_specific_qa.length; i += 2) {
    try {
      const parsed_content = JSON.parse(project_specific_qa[i]?.content);
      project_specific_qa_items.push(
        <ListItem
          key={i}
          sx={{ display: "flex", flexDirection: "column" }}
          divider
        >
          {parsed_content?.code_snippet && (
            <Box sx={{ width: "100%", overflowX: "auto" }}>
              <SyntaxhighlighterCustom
                customStyle={{
                  padding: "1rem",
                  borderRadius: "0.3rem",
                  minWidth: "100%",
                }}
                language="javascript"
                style={docco}
                wrapLines
                wrapLongLines
              >
                {String(parsed_content?.code_snippet)}
              </SyntaxhighlighterCustom>
            </Box>
          )}

          <ListItemText
            primary={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <p>{parsed_content?.question}</p>
                {typeof project_specific_qa[i]?.ai_score === "number" && (
                  <p
                    onClick={() => {
                      setModalContents("");
                      setModalContents(project_specific_qa[i]?.ai_explanation);
                    }}
                    style={{
                      cursor: "pointer",
                      textDecoration: "underline",
                      minWidth: "70px",
                    }}
                    title="Click to view justification"
                  >
                    Score : {project_specific_qa[i]?.ai_score}
                  </p>
                )}
              </div>
            }
            secondary={project_specific_qa[i + 1]?.content}
            primaryTypographyProps={{ fontWeight: "bold" }}
          />
        </ListItem>
      );
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <>
      <Box
        sx={{
          // width: "70%",
          margin: "auto",
        }}
      >
        <Paper sx={{ padding: 2, boxShadow: 1 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: "bold", color: "#333", flex: 1 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginRight: "20px",
                }}
              >
                <p>Domain Specific QA </p>
                <Button
                  type="button"
                  variant="contained"
                  onClick={() => {
                    setShowButtonLoading(true);
                    fetch(
                      `${conf.backendUrl}/evaluation/reopen/${domain_specific_viva_report.userevaluation_id}/?email=${user.username}&send_viva_link=true`
                    )
                      .then(() => {
                        window.location.reload();
                      })
                      .finally(() => {
                        setShowButtonLoading(false);
                      });
                  }}
                  loading={showButtonLoading}
                >
                  Re-Open
                </Button>
              </div>
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#000" }}>
              {domain_specific_viva_report.step_report.score}/10
            </Typography>
          </Box>
          <Box sx={{ px: 2, pb: 2 }}>
            <Typography variant="h6" mb={0.3}>
              Feedback
            </Typography>
            <Typography variant="body2">
              {domain_specific_viva_report.step_report.explanation}
            </Typography>
          </Box>
          <Divider />
          <List>{domain_specific_qa_items}</List>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#333" }}>
              Project Specific QA
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#000" }}>
              {project_specific_viva_report.step_report.score}/10
            </Typography>
          </Box>
          <Box sx={{ px: 2 }}>
            <Typography variant="h6" mb={0.3}>
              Feedback
            </Typography>
            <Typography variant="body2">
              {project_specific_viva_report.step_report.explanation}
            </Typography>
          </Box>
          <List>{project_specific_qa_items}</List>
        </Paper>
      </Box>
      {!!modalContent?.length && (
        <Modal
          open={!!modalContent?.length}
          onClose={() => {
            setModalContents("");
          }}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={style}>
            <Typography variant="h6" component="h2">
              Score Explaination
            </Typography>
            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
              {modalContent}
            </Typography>
          </Box>
        </Modal>
      )}
    </>
  );
};

export default VivaQA;
