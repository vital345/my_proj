import { Box } from "@mui/material";
import React from "react";
import { useParams } from "react-router-dom";
import FinalReport from "../../components/ReviewAndPublishComponent/FinalReport";

const FinalReportPage: React.FC = () => {
  const { evaluationId, userId } = useParams();

  return (
    <Box sx={{ width: "70%", mx: "auto" }}>
      <FinalReport evaluationId={evaluationId} userId={userId} />
    </Box>
  );
};

export default FinalReportPage;
