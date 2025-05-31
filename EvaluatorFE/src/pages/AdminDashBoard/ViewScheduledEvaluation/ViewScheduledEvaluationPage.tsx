import {
  Box,
  Button,
  Divider,
  Modal,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
// import { SearchComponent } from '../../../components/SearchComponents';
import axios from "axios";
import { ScheduledEvaluation } from "../../../components/ProjectDescption";
import conf from "../../../conf/conf";
import { useAppSelector } from "../../../store/hooks";
import "./ViewScheduledEvaluationPage.css";

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

const extensionKeyPrefix = "extension-evaluation-id";

export const ViewScheduledEvaluationPage: React.FC = () => {
  const repoUrlTruncateStyle = {
    maxWidth: "300px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: "block",
  };

  const { evaluationId } = useParams();
  const [data, setData] = useState<ScheduledEvaluation>({
    track_name: "Full Stack Development",
    batch_name: "Batch 2023",
    code_freezing_time: "2023-12-31T23:59",
    requirements: "Project requirements and descriptions go here.",
    users: [
      {
        id: 101,
        email: "student1@example.com",
        github_url: "https://github.com/student1/project",
        deployed_url: "https://student1-project.com",
        status: "completed",
        full_name: "student",
      },
      {
        id: 102,
        email: "student2@example.com",
        github_url: "https://github.com/student2/project",
        deployed_url: "https://student2-project.com",
        status: "pending",
        full_name: "student2",
      },
      {
        id: 103,
        email: "student3@example.com",
        github_url: "https://github.com/student3/project",
        deployed_url: "https://student3-project.com",
        status: "progress",
        full_name: "student3",
      },
    ],
  });
  const [buttonState, setButtonState] = useState<{
    [key: number]: boolean;
  } | null>(null);
  const [retriggerModal, setRetriggerModal] = useState<null | number>(null);
  const [extension, setExtension] = useState<string>(
    localStorage.getItem(`${extensionKeyPrefix}-${evaluationId}`) || ""
  );
  const navigate = useNavigate();
  const authToken = useAppSelector((state) => state.auth.token);

  useEffect(() => {
    const getEvaluationById = async (id: string | undefined) => {
      const config = {
        headers: { Authorization: `Bearer ${authToken}` },
      };
      const response = await axios.get(
        `${conf.backendUrl}/evaluation/${id}/`,
        config
      );
      setData(response.data);
      console.log(response.data);
    };
    getEvaluationById(evaluationId);
  }, [evaluationId, authToken]);

  const handleCompleteClick = (userId: number) => {
    navigate(`/admin-dashboard/evaluation-report/${evaluationId}/${userId}`);
  };

  const handleRetrigger = (index: number) => {
    localStorage.setItem(`${extensionKeyPrefix}-${evaluationId}`, extension);
    setButtonState((prev) => ({
      ...prev,
      [index]: true,
    }));
    fetch(`${conf.backendUrl}/evaluation/start-single/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        evaluation_id: evaluationId,
        email: data?.users[index]?.email,
        extensions: extension,
      }),
    });
    setRetriggerModal(null);
  };

  return (
    <Box sx={{ padding: 4, minHeight: "100vh", width: "75%", mx: "auto" }}>
      {/* <SearchComponent onSearchForScheduledEvaluations={handleSearch} batch={batchName} track={trackName} /> */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          // flexWrap: 'wrap',
          alignItems: "center",
          gap: 3,
          mb: 3,
        }}
      >
        {[
          { label: "Track Name", value: data.track_name },
          { label: "Batch", value: data.batch_name },
          {
            label: "Code Freeze Time",
            value: new Date(data.code_freezing_time).toLocaleString(),
          },
        ].map((item, index) => (
          <Paper
            key={index}
            sx={{
              padding: 3,
              width: { xs: "100%", sm: "30%" },
              // boxShadow: 3,
              boxShadow:
                "rgba(145, 158, 171, 0.2) 0px 0px 2px 0px, rgba(145, 158, 171, 0.12) 0px 12px 24px -4px",
              zIndex: 0,
              transition: "box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)",
              borderRadius: 2,
              textAlign: "center",
              backgroundColor: "#f9f9f9",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ color: "#555", fontWeight: 600, mb: 1 }}
            >
              {item.label}
            </Typography>
            <Divider
              sx={{
                mb: 2,
                backgroundColor: "#e0e0e0",
                height: "1px",
                width: "50%",
                margin: "0 auto",
              }}
            />
            <Typography
              variant="body1"
              sx={{ color: "#333", fontWeight: "bold", fontSize: "1.1rem" }}
            >
              {item.value}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Paper
        sx={{
          padding: 3,
          mb: 3,
          boxShadow:
            "rgba(145, 158, 171, 0.2) 0px 0px 2px 0px, rgba(145, 158, 171, 0.12) 0px 12px 24px -4px",
          zIndex: 0,
          transition: "box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" sx={{ color: "#444", mb: 2 }}>
          {" "}
          {/* Slightly darker grey */}
          Project Details (PDF):
        </Typography>
        <Box
          sx={{
            height: "6rem",
            overflowY: "scroll",
            // scrollbarWidth: 'none',
            // '& :: webkit-scrollbar': {display: 'none'},
          }}
        >
          {" "}
          {/* Reduced height */}
          <Typography sx={{ color: "#555" }}>
            {" "}
            {/* Light grey for description */}
            {data.requirements}
          </Typography>
        </Box>
      </Paper>

      <Paper
        sx={{
          boxShadow:
            "rgba(145, 158, 171, 0.2) 0px 0px 2px 0px, rgba(145, 158, 171, 0.12) 0px 12px 24px -4px",
          zIndex: 0,
          transition: "box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" sx={{ color: "#444", p: "1rem" }}>
          Students' Details
        </Typography>
        <TableContainer
          component={Paper}
          sx={{
            boxShadow:
              "rgba(145, 158, 171, 0.2) 0px 0px 2px 0px, rgba(145, 158, 171, 0.12) 0px 12px 24px -4px",
            zIndex: 0,
            transition: "box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            borderRadius: 2,
            overflow: "auto",
            maxWidth: "100%",
            padding: "24px",
          }}
        >
          <Table>
            <TableHead sx={{ backgroundColor: "#f0f0f0" }}>
              {" "}
              {/* Light grey background */}
              <TableRow>
                <TableCell align="center" sx={{ color: "#333" }}>
                  Number
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ color: "#333", minWidth: "200px" }}
                >
                  Email
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ color: "#333", minWidth: "200px" }}
                >
                  Full Name
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ color: "#333", minWidth: "300px" }}
                >
                  Git Repo Link
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ color: "#333", minWidth: "300px" }}
                >
                  Deployed Link
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ color: "#333", minWidth: "300px" }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody
              sx={{
                boxShadow:
                  "rgba(145, 158, 171, 0.2) 0px 0px 2px 0px, rgba(145, 158, 171, 0.12) 0px 12px 24px -4px",
                zIndex: 0,
                transition: "box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                borderRadius: 2,
              }}
            >
              {data.users.map((user, index) => (
                <TableRow
                  key={index}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f0f0f0" }, // Optional hover effect
                  }}
                >
                  <TableCell align="center">{index + 1}</TableCell>
                  <TableCell
                    align="center"
                    sx={{ color: "#555" }}
                    onClick={() => handleCompleteClick(user.id as number)}
                  >
                    {user.email}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ color: "#555" }}
                    onClick={() => handleCompleteClick(user.id as number)}
                  >
                    {user.full_name || "-"}
                  </TableCell>
                  <TableCell align="center">
                    <a
                      href={user.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#555",
                        textDecoration: "none",
                        textAlign: "center",
                        ...repoUrlTruncateStyle,
                      }}
                    >
                      {user.github_url}
                    </a>
                  </TableCell>
                  <TableCell align="center">
                    <a
                      href={user.deployed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#555",
                        textDecoration: "none",
                        ...repoUrlTruncateStyle,
                      }}
                    >
                      {user.deployed_url}
                    </a>
                  </TableCell>
                  <TableCell
                    align="center"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      maxWidth: "300px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        sx={{
                          backgroundColor:
                            user.status === "completed"
                              ? "#e0f7e9"
                              : user.status === "pending"
                              ? "#fdf8e4"
                              : "#e3f2fd",
                          color: "#444",
                          borderRadius: "8px",
                          padding: "7px 6px",
                          fontWeight: "600",
                        }}
                        variant="body1"
                      >
                        {user.is_complete}
                      </Typography>
                    </div>
                    <div>
                      <Button
                        variant="contained"
                        onClick={() => setRetriggerModal(index)}
                        disabled={buttonState?.[index]}
                      >
                        ReTrigger
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      {retriggerModal !== null && (
        <Modal
          open={retriggerModal !== null}
          onClose={() => setRetriggerModal(null)}
          className="retrigger-modal"
        >
          <Box sx={style}>
            <Typography variant="h6" component="h2">
              Retrigger for the Trainee
            </Typography>
            <Typography
              id="modal-modal-description"
              sx={{ mt: 2 }}
              style={{ display: "flex", alignItems: "center" }}
            >
              <span style={{ marginRight: "10px" }}>
                Please enter the extension:
              </span>
              <TextField
                id="outlined-basic"
                label="Extension"
                variant="outlined"
                onChange={(e) => {
                  setExtension(e.target.value);
                }}
                defaultValue={extension}
              />
            </Typography>
            <Button
              variant="contained"
              className="submit-button"
              onClick={() => handleRetrigger(retriggerModal)}
            >
              Submit
            </Button>
          </Box>
        </Modal>
      )}
    </Box>
  );
};
