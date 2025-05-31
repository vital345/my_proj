import CancelIcon from "@mui/icons-material/Cancel";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import EmailIcon from "@mui/icons-material/Email";
import ErrorIcon from "@mui/icons-material/Error";
import SaveIcon from "@mui/icons-material/Save";
import {
  Avatar,
  Box,
  Button,
  Card,
  CircularProgress,
  Divider,
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
import axios from "axios";
import html2PDF from "jspdf-html2canvas";
import React, { useEffect, useRef, useState } from "react";
import conf from "../../conf/conf";
import { BackendReportDetails } from "../../interfaces/BackendReportDetails";
import { FrontendReportDetails } from "../../interfaces/FrontendReportDetails";
import { MilestoneDetails } from "../../interfaces/MilestoneReport";
import { ReportDetails } from "../../interfaces/ReportDetails";
import { VivaVoceDetails } from "../../interfaces/VivaVoceDetails";
import { useAppSelector } from "../../store/hooks";
import { ScheduledEvaluation } from "../ProjectDescption";
import FinalReportPrint from "./FInalReportPrint";

interface ReportRow {
  name: string;
  score: number;
  weightage: number;
  weightedScore: number;
}

interface Props {
  evaluationId: string | undefined;
  userId: string | undefined;
}

const FinalReport: React.FC<Props> = ({ evaluationId, userId }) => {
  // const [rows, setRows] = useState<ReportRow[]>([
  //   { name: 'Commit Checks', score: 7, weightage: 20, weightedScore: 7/20},
  //   { name: 'Code Quality', score: 5, weightage: 45, weightedScore: 5/45},
  //   { name: 'TestCase Analysis', score: 9, weightage:  35, weightedScore: 9/35},
  // ]);
  const [evaluationData, setEvaluationData] = useState<ScheduledEvaluation>();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [originalRows, setOriginalRows] = useState<ReportRow[]>([...rows]);
  const [isEditing, setIsEditing] = useState(false);
  const [totalWeightage, setTotalWeightage] = useState(100);
  const [totalScore, setTotalScore] = useState(0);
  const authToken = useAppSelector((state) => state.auth.token);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isDataFetched, setIsDataFetched] = useState<boolean>(false);
  const [email, setEmail] = useState<string>();
  const [commitQR, setCommitQR] = useState<ReportDetails>();
  const [backendReport, setBackendReport] = useState<BackendReportDetails>();
  const [frontendReport, setFrontendReport] = useState<FrontendReportDetails>();
  const [domainSpecificVivaReport, setDomainSpecificVivaReport] =
    useState<VivaVoceDetails>();
  const [projectSpecificVivaReport, setProjectSpecificVivaReport] =
    useState<VivaVoceDetails>();
  const [codeQR, setCodeQR] = useState<ReportDetails>();
  const [milestoneReport, setMilestoneReport] = useState<MilestoneDetails>();

  useEffect(() => {
    const totalWeight = rows.reduce((acc, row) => acc + row.weightage, 0);
    setTotalWeightage(totalWeight);

    const total = rows.reduce(
      (acc, row) => acc + (row.score * row.weightage) / 100,
      0
    );
    setTotalScore(total);
  }, [rows]);

  const handleWeightageChange = (index: number, value: number) => {
    const newRows = [...rows];

    newRows[index].weightage = value;
    newRows[index].weightedScore = newRows[index].score * (value / 100) * 10;
    setRows(newRows);
  };

  useEffect(() => {
    const getEvaluationById = async (id: string | undefined) => {
      const config = {
        headers: { Authorization: `Bearer ${authToken}` },
      };
      const response = await axios.get(
        `${conf.backendUrl}/evaluation/${id}/`,
        config
      );
      setEvaluationData(response.data);
      console.log(response.data);
    };
    getEvaluationById(evaluationId);
  }, [evaluationId, authToken]);

  useEffect(() => {
    const getEvaluationReport = async (
      evaluationId: string,
      userId: string
    ) => {
      const config = {
        headers: { Authorization: `Bearer ${authToken}` },
      };
      const response = await axios.get(
        `${conf.backendUrl}/evaluation/${evaluationId}/${userId}/`,
        config
      );
      console.log(response.data);
      response.data.forEach(
        (
          evaluationStep:
            | ReportDetails
            | BackendReportDetails
            | VivaVoceDetails
            | MilestoneDetails
            | FrontendReportDetails
        ) => {
          const { step_name } = evaluationStep;
          switch (step_name) {
            case "commit_message_evaluation_report":
              setRows((prevRows) => [
                ...prevRows,
                {
                  name: "Commit Checks",
                  score: (evaluationStep as ReportDetails).step_report
                    .overall_score,
                  weightage: 3,
                  weightedScore:
                    (evaluationStep as ReportDetails).step_report
                      .overall_score * 0.03,
                },
              ]);
              setCommitQR(evaluationStep as ReportDetails);
              break;

            case "code_quality_report":
              setRows((prevRows) => [
                ...prevRows,
                {
                  name: "Code quality",
                  score: (evaluationStep as ReportDetails).step_report
                    .overall_score,
                  weightage: 2,
                  weightedScore:
                    (evaluationStep as ReportDetails).step_report
                      .overall_score * 0.02,
                },
              ]);
              setCodeQR(evaluationStep as ReportDetails);
              break;

            case "backend_test_execution_report": {
              const stepReportBackend = (evaluationStep as BackendReportDetails)
                .step_report;

              const scoreBackend =
                (stepReportBackend.list_of_testcases.reduce(
                  (acc, t) => acc + (t.remarks == "success" ? 1 : 0),
                  0
                ) /
                  stepReportBackend.list_of_testcases.length) *
                10;

              setRows((prevRows) => [
                ...prevRows,
                {
                  name: "Test case analysis",
                  score: scoreBackend,
                  weightage: 5,
                  weightedScore: scoreBackend * 0.05,
                },
              ]);
              setBackendReport(evaluationStep as BackendReportDetails);
              break;
            }

            case "frontend_test_execution_report": {
              const stepReport = (evaluationStep as FrontendReportDetails)
                .step_report;

              const score =
                (stepReport.list_of_testcases.reduce(
                  (acc, t) => acc + t.successful_steps / t.total_steps,
                  0
                ) /
                  stepReport.list_of_testcases.length) *
                10;

              setRows((prevRows) => [
                ...prevRows,
                {
                  name: "Test case analysis",
                  score: score,
                  weightage: 5,
                  weightedScore: score * 0.05,
                },
              ]);
              setFrontendReport(evaluationStep as FrontendReportDetails);
              break;
            }

            case "domain_specific_qa":
              setRows((prevRows) => [
                ...prevRows,
                {
                  name: "Domain Specific QA",
                  score: (evaluationStep as VivaVoceDetails).step_report.score,
                  weightage: 5,
                  weightedScore:
                    (evaluationStep as VivaVoceDetails).step_report.score *
                    0.05,
                },
              ]);
              setDomainSpecificVivaReport(evaluationStep as VivaVoceDetails);
              break;

            case "project_specific_qa":
              setRows((prevRows) => [
                ...prevRows,
                {
                  name: "Project Specific QA",
                  score: (evaluationStep as VivaVoceDetails).step_report.score,
                  weightage: 5,
                  weightedScore:
                    (evaluationStep as VivaVoceDetails).step_report.score *
                    0.05,
                },
              ]);
              setProjectSpecificVivaReport(evaluationStep as VivaVoceDetails);
              break;

            case "milestone_wise_report": {
              const milestones = (evaluationStep as MilestoneDetails)
                .step_report.milestone_reports;

              const initialWeights =
                (evaluationStep as MilestoneDetails).step_report.weights ||
                Array(milestones.length).fill(100 / milestones.length);

              setRows((prevRows) => [
                ...prevRows,
                {
                  name: "Milestone Wise Report",
                  score: (
                    evaluationStep as MilestoneDetails
                  ).step_report.milestone_reports.reduce(
                    (finalScore, milestone, idx) =>
                      finalScore +
                      milestone.score * (initialWeights[idx] / 100),
                    0
                  ),
                  weightage: 80,
                  weightedScore:
                    ((
                      evaluationStep as MilestoneDetails
                    ).step_report.milestone_reports.reduce(
                      (finalScore, milestone) => finalScore + milestone.score,
                      0
                    ) /
                      10) *
                    0.8,
                },
              ]);
              setMilestoneReport(evaluationStep as MilestoneDetails);

              break;
            }

            default:
              break;
          }
        }
      );

      const userRes = await axios.get(
        `${conf.backendUrl}/create_user/${userId}/`
      );
      // console.log(user)
      setEmail(userRes.data.username);

      setIsDataFetched(true);
    };
    getEvaluationReport(evaluationId || "", userId || "");
  }, [evaluationId, userId, authToken]);

  const handleEditClick = () => {
    setIsEditing(true);
    setOriginalRows([...rows]);
  };

  const handleSaveClick = () => {
    const roundedRows = rows.map((row) => ({
      ...row,
      weightage: Math.round(row.weightage),
    }));
    setRows(roundedRows);
    setIsEditing(false);
  };

  const handleCancelClick = () => {
    setRows(originalRows);
    setIsEditing(false);
  };

  const handlePublishClick = async () => {
    if (!contentRef.current) return;
    const pdf = await html2PDF(contentRef.current);
    const pdfBlob = pdf.output("blob");
    const formData = new FormData();
    formData.append("file", pdfBlob, "report.pdf");

    await axios.post(
      `${conf.backendUrl}/evaluation/report/${evaluationId}/${userId}/`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  };

  const handleDownloadClick = async () => {
    if (!contentRef.current) return;
    const pdf = await html2PDF(contentRef.current);
    pdf.save();
  };

  return (
    <>
      {isDataFetched ? (
        <>
          <Typography
            variant="h4"
            textAlign="center"
            sx={{ my: 2, color: "#1b849b" }}
          >
            Final Result
          </Typography>
          <Box
            sx={{
              maxWidth: "800px",
              margin: "auto",
              padding: 2,
              backgroundColor: "#f9f9f9",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Box ref={contentRef} sx={{ position: "fixed", left: "1000%" }}>
              {evaluationData &&
                commitQR &&
                (backendReport || frontendReport) &&
                domainSpecificVivaReport &&
                projectSpecificVivaReport &&
                codeQR &&
                milestoneReport &&
                email && (
                  <FinalReportPrint
                    evaluationData={evaluationData}
                    rows={rows}
                    totalScore={totalScore}
                    commitQR={commitQR}
                    testReport={backendReport || frontendReport}
                    domainSpecificVivaReport={domainSpecificVivaReport}
                    projectSpecificVivaReport={projectSpecificVivaReport}
                    codeQR={codeQR}
                    milestoneReport={milestoneReport}
                    emailId={email}
                  ></FinalReportPrint>
                )}
            </Box>
            {/* Student Details */}
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 3,
                  mb: 3,
                }}
              >
                {[
                  { label: "Track Name", value: evaluationData?.track_name },
                  { label: "Batch", value: evaluationData?.batch_name },
                  {
                    label: "Code Freeze Time",
                    value: new Date(
                      evaluationData && evaluationData.code_freezing_time
                        ? evaluationData.code_freezing_time
                        : "2002-12-24T10:00"
                    ).toLocaleString(),
                  },
                ].map((item, index) => (
                  <Paper
                    key={index}
                    sx={{
                      padding: 3,
                      width: { xs: "100%", sm: "30%" },
                      height: "8rem",
                      boxShadow:
                        "rgba(145, 158, 171, 0.2) 0px 0px 2px 0px, rgba(145, 158, 171, 0.12) 0px 12px 24px -4px",
                      zIndex: 0,
                      transition:
                        "box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                      borderRadius: 2,
                      textAlign: "center",
                      backgroundColor: "#f9f9f9",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
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
                      sx={{
                        color: "#333",
                        fontWeight: "bold",
                        fontSize: "1.1rem",
                      }}
                    >
                      {item.value}
                    </Typography>
                  </Paper>
                ))}
              </Box>
              <Box
                sx={{
                  position: "relative",
                  height: "10rem", // Increased height of the box
                  borderRadius: 2,
                  overflow: "hidden",
                  backgroundColor: "#ffffff",
                  boxShadow: "0px 0px 1px 0px",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "80%", // Background image takes 80% height
                    backgroundImage:
                      "linear-gradient(0deg, rgba(0, 75, 80, 0.8), rgba(0, 75, 80, 0.8)), url(https://assets.minimals.cc/public/assets/images/mock/cover/cover-4.webp)",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center center",
                  }}
                />
                <Avatar
                  alt="Jaydon Frankie"
                  src="https://assets.minimals.cc/public/assets/images/mock/avatar/avatar-25.webp"
                  sx={{
                    position: "absolute",
                    bottom: 8,
                    left: 16,
                    width: 90,
                    height: 90,
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 38,
                    left: 122,
                    color: "white",
                  }}
                >
                  {/* <Typography variant="h6" sx={{ color: "White" }}>
                  Sagnik Jana
                </Typography> */}
                  <Typography
                    variant="body2"
                    sx={{ color: "White", opacity: "0.78" }}
                  >
                    {email}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Report Table */}
            <TableContainer component={Card}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Report Name</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Weightage (%)</TableCell>
                    <TableCell>Weighted Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length > 0 &&
                    rows.map((row, index) => (
                      <TableRow
                        key={index}
                        sx={{
                          height: "4rem",
                        }}
                      >
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.score.toFixed(2)}</TableCell>
                        <TableCell>
                          {isEditing ? (
                            <TextField
                              type="number"
                              value={row.weightage}
                              onChange={(e) =>
                                handleWeightageChange(
                                  index,
                                  parseFloat(e.target.value)
                                )
                              }
                              inputProps={{
                                min: 0,
                                max: 100,
                                step: 1,
                                style: { textAlign: "center", padding: 0 },
                              }}
                              sx={{ width: "40px" }}
                            />
                          ) : (
                            row.weightage
                          )}
                        </TableCell>
                        <TableCell>{row.weightedScore.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Total Score */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: "800" }}>
                Overall Score: {totalScore.toFixed(1)}
              </Typography>
            </Box>

            {/* Error Message */}
            {totalWeightage !== 100 && (
              <Box
                sx={{
                  mt: 1,
                  display: "flex",
                  alignItems: "center",
                  color: "red",
                }}
              >
                <ErrorIcon sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Total weightage must add up to 100%.
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-start" }}>
              {isEditing ? (
                <>
                  <Button
                    variant="contained"
                    startIcon={<CancelIcon />}
                    onClick={handleCancelClick}
                    sx={{ marginRight: 1, backgroundColor: "#ff6666" }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveClick}
                    sx={{ marginRight: 1, backgroundColor: "#1b849b" }}
                    disabled={totalWeightage !== 100}
                  >
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={handleEditClick}
                    sx={{ marginRight: 1, backgroundColor: "#1b849b" }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadClick}
                    disabled={totalWeightage !== 100}
                    sx={{ marginRight: 1, backgroundColor: "#1b849b" }}
                  >
                    Download
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<EmailIcon />}
                    onClick={handlePublishClick}
                    disabled={totalWeightage !== 100}
                    sx={{ backgroundColor: "#1b849b" }}
                  >
                    Email to linker
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </>
      ) : (
        <Box sx={{ display: "flex", justifyContent: "center", mt: "14rem" }}>
          <CircularProgress />
        </Box>
      )}
    </>
  );
};

export default FinalReport;
