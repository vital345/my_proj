import {
  Avatar,
  Box,
  Card,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React from "react";
import ImageAvatar from "../../assets/evaluation-report-avater.webp";
import { BackendReportDetails } from "../../interfaces/BackendReportDetails";
import { FrontendReportDetails } from "../../interfaces/FrontendReportDetails";
import { MilestoneDetails } from "../../interfaces/MilestoneReport";
import { ReportDetails } from "../../interfaces/ReportDetails";
import { VivaVoceDetails } from "../../interfaces/VivaVoceDetails";
import ScreenRecordingComponent from "../../pages/ReviewAndPublish/ScreenRecordingComponent";
import { ScheduledEvaluation } from "../ProjectDescption";
import CodeQuality from "./CodeQuality";
import CommitChecks from "./CommitChecks";
import MilestoneAnalysis from "./MilestoneAnalysis";
import TestcaseAnalysis from "./TestCaseAnalysis";
import VivaQA from "./VivaQA";
interface ReportRow {
  name: string;
  score: number;
  weightage: number;
  weightedScore: number;
}

interface Props {
  // evaluationId: string | undefined;
  // userId: string | undefined;
  evaluationData: ScheduledEvaluation;
  rows: ReportRow[];
  totalScore: number;
  commitQR: ReportDetails;
  testReport: BackendReportDetails | FrontendReportDetails | undefined;
  domainSpecificVivaReport: VivaVoceDetails;
  projectSpecificVivaReport: VivaVoceDetails;
  codeQR: ReportDetails;
  milestoneReport: MilestoneDetails;
  emailId: string;
}

const FinalReportPrint: React.FC<Props> = ({
  evaluationData,
  rows,
  totalScore,
  commitQR,
  testReport,
  domainSpecificVivaReport,
  projectSpecificVivaReport,
  codeQR,
  milestoneReport,
  emailId,
}) => {
  return (
    <Box
      sx={{
        width: "800px",
        margin: "auto",
        padding: 2,
        backgroundColor: "#f9f9f9",
        borderRadius: 2,
      }}
    >
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
                transition: "box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)",
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
                sx={{ color: "#333", fontWeight: "bold", fontSize: "1.1rem" }}
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
            alt="User Image"
            src={ImageAvatar}
            sx={{
              position: "absolute",
              bottom: 8,
              left: 16,
              width: 90,
              height: 90,
            }}
          />
          <Box
            sx={{ position: "absolute", bottom: 38, left: 122, color: "white" }}
          >
            {/* <Typography variant="h6" sx={{ color: "White" }}>
              Sagnik Jana
            </Typography> */}
            <Typography variant="h6" sx={{ color: "White", opacity: "0.75" }}>
              {emailId}
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
                  <TableCell>{row.weightage}</TableCell>
                  <TableCell>{row.weightedScore.toFixed(2)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Total Score */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">
          Total Score: {totalScore.toFixed(0)}
        </Typography>
      </Box>

      {/* Error Message */}

      <Box sx={{ mt: 4 }}>{commitQR && <CommitChecks report={commitQR} />}</Box>
      <Box sx={{ mt: 4 }}>
        {testReport && <TestcaseAnalysis report={testReport} />}
      </Box>
      <Box sx={{ mt: 4 }}>
        {domainSpecificVivaReport && projectSpecificVivaReport && (
          <>
            <ScreenRecordingComponent userScreenVideos={[]} />
            <VivaQA
              domain_specific_viva_report={domainSpecificVivaReport}
              project_specific_viva_report={projectSpecificVivaReport}
              user={{ username: emailId, id: 0, password: "", role: "" }}
            />
          </>
        )}
      </Box>
      <Box sx={{ mt: 4 }}>{codeQR && <CodeQuality report={codeQR} />}</Box>
      <Box sx={{ mt: 4 }}>
        {milestoneReport && <MilestoneAnalysis report={milestoneReport} />}
      </Box>
    </Box>
  );
};

export default FinalReportPrint;
