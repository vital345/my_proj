import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";
import AdminHeader from "./components/AdminHeader/AdminHeader";
import EvaluationBot from "./components/EvaluationBot";
import { SETTINGS } from "./conf/settings";
import { ScreenSharingProvider } from "./contexts/ScreenSharingContext";
import { LiveAPIProvider } from "./module/contexts/LiveAPIContext";
import { ScheduleEvaluationPage } from "./pages/AdminDashBoard/ScheduleEvaluation/ScheduleEvaluationPage";
import { ViewScheduledEvaluationPage } from "./pages/AdminDashBoard/ViewScheduledEvaluation/ViewScheduledEvaluationPage";
import { ViewScheduledEvaluations } from "./pages/AdminDashBoard/ViewScheduledEvaluations/ViewScheduledEvaluations";
import NotFoundPage from "./pages/ErrorPages/404Page";
import { EvaluationExecutionPage } from "./pages/EvaluationExecution/EvaluationExecutionPage";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import EvaluationReport from "./pages/ReviewAndPublish/EvaluationReport";
import FinalReportPage from "./pages/ReviewAndPublish/FinalReportPage";
import { UserEvaluationPage } from "./pages/UserEvaluation/UserEvaluationPage";
import VivaPage from "./pages/VivaPage";
import { ProtectedRoute } from "./ProtectedRoute";
import UnauthorizedPage from "./UnauthorizedPage";

const App: React.FC = () => {
  const theme = createTheme({
    typography: {
      fontFamily: "Mulish, sans-serif",
    },
  });

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <ThemeProvider theme={theme}>
        <LiveAPIProvider url={SETTINGS.GEMINI_HOME_URL}>
          <ScreenSharingProvider>
            <main style={{ flexGrow: 1 }}>
              <div style={{}} /> {/* theme.mixins.toolbar */}
              <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                {/* element={<ProtectedRoute/>} */}
                <Route element={<ProtectedRoute />}>
                  {/* <Route path="/admin-dashboard" element={<AdminDashBoardPage />}> */}
                  <Route path="/admin-dashboard" element={<AdminHeader />}>
                    <Route
                      path="/admin-dashboard/"
                      element={<ScheduleEvaluationPage />}
                    />
                    {/* <Route path="/admin-dashboard/monitor-results" element={<MonitorResultsPage />} /> */}
                    <Route
                      path="/admin-dashboard/schedule-evaluation"
                      element={<ScheduleEvaluationPage />}
                    />
                    <Route
                      path="/admin-dashboard/view-scheduled-evaluation"
                      element={<ViewScheduledEvaluations />}
                    />
                    <Route
                      path="/admin-dashboard/view-scheduled-evaluation/:evaluationId"
                      element={<ViewScheduledEvaluationPage />}
                    />
                    <Route
                      path="/admin-dashboard/evaluation-report/:evaluationId/:userId"
                      element={<EvaluationReport />}
                    />
                    <Route
                      path="/admin-dashboard/evaluation-report/:evaluationId/:userId/publish"
                      element={<FinalReportPage />}
                    />
                  </Route>
                </Route>
                <Route
                  path="/user-evaluation/:chatId"
                  element={<UserEvaluationPage />}
                />

                <Route
                  path="/evaluation-bot-v1/:chatId"
                  element={<EvaluationBot />}
                />

                <Route path="/evaluation-bot/:chatId" element={<VivaPage />} />
                <Route
                  path="/evaluation-execution"
                  element={<EvaluationExecutionPage />}
                >
                  <Route
                    path="/evaluation-execution/:token"
                    element={<EvaluationExecutionPage />}
                  />
                </Route>
                <Route path="/not-found" element={<NotFoundPage />} />
              </Routes>
            </main>
          </ScreenSharingProvider>
        </LiveAPIProvider>
      </ThemeProvider>
    </div>
  );
};

export default App;
