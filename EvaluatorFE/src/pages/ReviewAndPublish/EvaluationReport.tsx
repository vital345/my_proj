import CodeIcon from "@mui/icons-material/Code";
import ContentPasteSearchIcon from "@mui/icons-material/ContentPasteSearch";
import DescriptionIcon from "@mui/icons-material/Description";
import GitHubIcon from "@mui/icons-material/GitHub";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import {
  Box,
  Button,
  CircularProgress,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CodeQuality from "../../components/ReviewAndPublishComponent/CodeQuality";
import CommitChecks from "../../components/ReviewAndPublishComponent/CommitChecks";
import MilestoneAnalysis from "../../components/ReviewAndPublishComponent/MilestoneAnalysis";
import { ReviewLoader } from "../../components/ReviewAndPublishComponent/ReviewLoader";
import TestcaseAnalysis from "../../components/ReviewAndPublishComponent/TestCaseAnalysis";
import VivaQA from "../../components/ReviewAndPublishComponent/VivaQA";
import conf from "../../conf/conf";
import {
  BackendReportDetails,
  BackendStepReportDetails,
} from "../../interfaces/BackendReportDetails";
import { FrontendReportDetails } from "../../interfaces/FrontendReportDetails";
import {
  MilestoneDetails,
  MilestoneStepReportDetails,
} from "../../interfaces/MilestoneReport";
import {
  ReportDetails,
  StepReportDetails,
} from "../../interfaces/ReportDetails";
import {
  UserDetailsType,
  UserScreenVideoType,
  VivaVoceDetails,
} from "../../interfaces/VivaVoceDetails";
import { useAppSelector } from "../../store/hooks";
import ScreenRecordingComponent from "./ScreenRecordingComponent";
const tabStyles = {
  ".MuiTab-icon": {
    mr: 2,
    mb: 0,
  },
  "&:hover": {
    transform: "scale(1.05)",
    transition: "transform 0.3s",
  },
  flex: 1,
  display: "flex",
  flexDirection: "row",
  minHeight: "3rem",
};

const EvaluationReport: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [commitQR, setCommitQR] = useState<ReportDetails>();
  const [codeQR, setCodeQR] = useState<ReportDetails>();
  const [backendReport, setBackendReport] = useState<BackendReportDetails>();
  const [frontendReport, setFrontendReport] = useState<FrontendReportDetails>();
  const [domainSpecificVivaReport, setDomainSpecificVivaReport] =
    useState<VivaVoceDetails>();
  const [projectSpecificVivaReport, setProjectSpecificVivaReport] =
    useState<VivaVoceDetails>();
  const [milestoneReport, setMilestoneReport] = useState<MilestoneDetails>();
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { evaluationId, userId } = useParams();
  const authToken = useAppSelector((state) => state.auth.token);
  const [user, setUser] = useState<UserDetailsType | null>(null);
  const [userScreenVideos, setUserScreenVideos] = useState<
    UserScreenVideoType[]
  >([]);
  useEffect(() => {
    fetch(`${conf.backendUrl}/create_user/${userId}/`).then(async (response) => {
      const parsedResp = (await response.json()) as UserDetailsType;
      fetch(
        `${conf.backendUrl}/recordings/evaluation/${evaluationId}/?email=${parsedResp.username}`
      ).then(async (resp) => {
        setUserScreenVideos((await resp.json()) as UserScreenVideoType[]);
      });
      setUser(parsedResp);
    });
  }, []);
  const handleTabChange = (newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleNextClick = () => {
    if (selectedTab < 4) {
      setSelectedTab(selectedTab + 1);
    } else {
      navigate(
        `/admin-dashboard/evaluation-report/${evaluationId}/${userId}/publish`
      );
    }
  };

  const handleUpdate = async (
    stepName: string,
    updateDetails:
      | StepReportDetails
      | BackendStepReportDetails
      | MilestoneStepReportDetails
  ) => {
    const config = {
      headers: { Authorization: `Bearer ${authToken}` },
    };
    const response = await axios.put(
      `${conf.backendUrl}/evaluation/${evaluationId}/${userId}/${stepName}/`,
      updateDetails,
      config
    );
    console.log(response);
  };

  const getEvaluationReport = async (evaluationId: string, userId: string) => {
    setLoading(true);
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
            setCommitQR(evaluationStep as ReportDetails);
            break;

          case "code_quality_report":
            setCodeQR(evaluationStep as ReportDetails);
            break;

          case "backend_test_execution_report":
            setBackendReport(evaluationStep as BackendReportDetails);
            break;
          case "frontend_test_execution_report":
            setFrontendReport(evaluationStep as FrontendReportDetails);
            break;
          case "domain_specific_qa":
            setDomainSpecificVivaReport(evaluationStep as VivaVoceDetails);
            break;

          case "project_specific_qa":
            setProjectSpecificVivaReport(evaluationStep as VivaVoceDetails);
            break;

          case "milestone_wise_report":
            console.log(evaluationStep);

            setMilestoneReport(evaluationStep as MilestoneDetails);
            break;

          default:
            break;
        }
      }
    );
    setLoading(false);
  };

  const reloadEvaluationReport = () => {
    if (evaluationId && userId) getEvaluationReport(evaluationId, userId);
  };

  useEffect(() => {
    getEvaluationReport(evaluationId || "", userId || "");
  }, [evaluationId, userId, authToken]);

  return (
    <Box sx={{ width: "70%", mx: "auto" }}>
      <Typography
        variant="h4"
        textAlign="center"
        sx={{ my: 4, color: "#1b849b" }}
      >
        <p>Evaluation Report </p>
        <div>
          <span
            style={{
              color: "#000",
              fontWeight: "800",
              fontSize: "18px",
              textDecoration: "underline",
            }}
          >
            {user?.username}
          </span>
        </div>
      </Typography>
      <Tabs
        value={selectedTab}
        onChange={(_, newValue) => handleTabChange(newValue)}
        centered
        sx={{ backgroundColor: "#e0f7fa", borderRadius: "0.5rem" }}
      >
        <Tab
          icon={<GitHubIcon />}
          label="Commit Checks"
          sx={{ ...tabStyles, alignItems: "center" }}
        />
        <Tab
          icon={<ContentPasteSearchIcon />}
          label="TestCase Analysis"
          sx={tabStyles}
        />
        <Tab icon={<QuestionAnswerIcon />} label="Viva QA" sx={tabStyles} />
        <Tab icon={<CodeIcon />} label="Code Quality" sx={tabStyles} />
        <Tab
          icon={<DescriptionIcon />}
          label="MileStone Report"
          sx={tabStyles}
        />
      </Tabs>
      <Box
        sx={{
          py: 4,
          borderRadius: 2,
          backgroundColor: "#f5f5f5",
          minHeight: "400px",
        }}
      >
        {!loading ? (
          <>
            {selectedTab === 0 &&
              (commitQR ? (
                <CommitChecks report={commitQR} updateHandler={handleUpdate} />
              ) : (
                <ReviewLoader reload={reloadEvaluationReport} />
              ))}
            {selectedTab === 1 &&
              (backendReport || frontendReport ? (
                <TestcaseAnalysis
                  report={backendReport || frontendReport}
                  updateHandler={handleUpdate}
                />
              ) : (
                <ReviewLoader reload={reloadEvaluationReport} />
              ))}
            {selectedTab === 2 && (
              <>
                <ScreenRecordingComponent userScreenVideos={userScreenVideos} />
                {domainSpecificVivaReport &&
                projectSpecificVivaReport &&
                user ? (
                  <VivaQA
                    domain_specific_viva_report={domainSpecificVivaReport}
                    project_specific_viva_report={projectSpecificVivaReport}
                    user={user}
                  />
                ) : (
                  <ReviewLoader reload={reloadEvaluationReport} />
                )}
              </>
            )}
            {selectedTab === 3 &&
              (codeQR ? (
                <CodeQuality report={codeQR} updateHandler={handleUpdate} />
              ) : (
                <ReviewLoader reload={reloadEvaluationReport} />
              ))}
            {selectedTab === 4 &&
              (milestoneReport ? (
                <MilestoneAnalysis
                  report={milestoneReport}
                  updateHandler={handleUpdate}
                />
              ) : (
                <ReviewLoader reload={reloadEvaluationReport} />
              ))}
          </>
        ) : (
          <Box sx={{ display: "flex", mt: 13, justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        )}
      </Box>
      <Box display="flex" justifyContent="center" mt={1}>
        <Button
          variant="contained"
          sx={{
            backgroundColor: "#1b849b",
            mb: "2rem",
            "&:hover": { backgroundColor: "#197184" },
            "&:disabled": { cursor: "not-allowed" },
          }}
          onClick={handleNextClick}
          disabled={
            selectedTab === 4 &&
            !(
              commitQR &&
              (backendReport || frontendReport) &&
              domainSpecificVivaReport &&
              codeQR &&
              milestoneReport
            )
          }
        >
          {selectedTab === 4 ? "Generate Report" : "NEXT"}
        </Button>
      </Box>
    </Box>
  );
};

export default EvaluationReport;
