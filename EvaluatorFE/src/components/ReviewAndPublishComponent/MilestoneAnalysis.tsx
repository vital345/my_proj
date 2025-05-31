import CancelIcon from "@mui/icons-material/Cancel";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormHelperText,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef, GridRowParams } from "@mui/x-data-grid";
import React, { useState } from "react";
import {
  MilestoneDetails,
  MilestoneReport,
  MilestoneStepReportDetails,
} from "../../interfaces/MilestoneReport";
import { ScoreComponent } from "./components/ScoreComponent";

interface Props {
  report: MilestoneDetails;
  updateHandler?: (
    stepName: string,
    updateDetails: MilestoneStepReportDetails
  ) => Promise<void>;
}

const MilestoneAnalysis: React.FC<Props> = ({ report, updateHandler }) => {
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<MilestoneReport | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const { step_report } = report;
  const { milestone_reports } = step_report;
  const [milestones, setMilestones] =
    useState<MilestoneReport[]>(milestone_reports);
  const [originalMilestones, setOriginalMilestones] =
    useState<MilestoneReport[]>(milestone_reports);
  const initialWeights =
    report.step_report.weights ||
    Array(milestones.length).fill(100 / milestones.length);
  const [weights, setWeights] = useState(initialWeights);
  const initialWeightedScores = milestone_reports.map(
    (milestone, index) => (milestone.score * weights[index]) / 100
  );
  const [weightedScores, setWeightedScores] = useState(initialWeightedScores);
  const [totalWeightedScore, setTotalWeightedScore] = useState<number>(
    weightedScores.reduce(
      (totalWeightedScore, score) => totalWeightedScore + score,
      0
    )
  );
  const [editedScore, setEditedScore] = useState<number>(
    weightedScores.reduce(
      (totalWeightedScore, score) => totalWeightedScore + score,
      0
    )
  );
  const [scoreError, setScoreError] = useState<string>("");
  const [weightageError, setWeightageError] = useState<string>(""); // Add state for weightage error message
  const rows = milestone_reports.map((milestone, index) => ({
    id: index + 1,
    ...milestone,
    weightage: weights[index].toFixed(2), // Add weightage data
    weightedScore: weightedScores[index].toFixed(2), // Add weightedScore data
  }));

  const handleRowClick = (params: GridRowParams) => {
    if (!isEditing) {
      setSelectedRow(params.row as MilestoneReport);
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedRow(null);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setTotalWeightedScore(editedScore);
    setOriginalMilestones(milestones);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setEditedScore(totalWeightedScore);
    setMilestones(originalMilestones);
  };

  const handleSaveClick = () => {
    setIsEditing(false);
    const updatedMilestones: MilestoneStepReportDetails = {
      milestone_reports: milestones,
      weights: weights,
    };

    if (updateHandler)
      updateHandler("milestone_wise_report", updatedMilestones)
        .then((res) => console.log(res))
        .catch((err) => console.error(err));
    setOriginalMilestones(milestones);
  };

  const handleWeightageChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number
  ) => {
    const newWeights = [...weights];
    newWeights[index] = parseFloat(event.target.value); // Ensure the value is a number
    setWeights(newWeights);

    const updatedWeightedScores = milestone_reports.map(
      (milestone, idx) => (milestone.score * newWeights[idx]) / 100
    );
    setWeightedScores(updatedWeightedScores);

    const newTotalWeightage = newWeights.reduce(
      (score, weight) => score + weight,
      0
    );
    if (newTotalWeightage !== 100) {
      setWeightageError("Total weightage must be 100");
    } else {
      setWeightageError("");
    }
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (value > 10) {
      setScoreError("Score cannot be more than 10");
    } else if (value < 0) {
      setScoreError("Score cannot be less than 0");
    } else {
      setScoreError("");
    }
    setEditedScore(value);
  };

  const columns: GridColDef[] = [
    { field: "title", headerName: "Title", flex: 1.5 },
    { field: "status", headerName: "Status", flex: 1 },
    { field: "score", headerName: "Score", flex: 1 },
    {
      field: "weightage",
      headerName: "Weightage",
      flex: 1,
      renderCell: (params) =>
        isEditing ? (
          <TextField
            value={params.value}
            onChange={(e) => handleWeightageChange(e, params.row.id - 1)}
            type="number"
            inputProps={{
              min: 0,
              max: 100,
              style: { display: "flex", alignItems: "center", padding: 8 },
            }}
          />
        ) : (
          <Typography>{params.value}</Typography>
        ),
    },
    { field: "weightedScore", headerName: "Weighted Score", flex: 1 },
  ];

  return (
    <Box
      sx={{
        maxWidth: "800px",
        margin: "auto",
        padding: 2,
        backgroundColor: "#f9f9f9",
        borderRadius: 2,
      }}
    >
      <Box>
        {/* Summary Section */}
        <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h5">Milestone Summary</Typography>
          <Typography>
            Total:{" "}
            {isEditing ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                }}
              >
                <ScoreComponent
                  editedScore={editedScore}
                  handleScoreChange={handleScoreChange}
                  scoreError={scoreError}
                />
                {scoreError && (
                  <FormHelperText error sx={{ fontSize: "0.875rem" }}>
                    {scoreError}
                  </FormHelperText>
                )}
              </Box>
            ) : (
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", color: "#000" }}
              >
                {editedScore.toFixed(2)}/10
              </Typography>
            )}
          </Typography>
        </Box>

        {/* DataGrid Section */}
        <DataGrid
          rows={rows}
          columns={columns}
          disableColumnMenu
          onRowClick={handleRowClick}
          sx={{
            "& .MuiDataGrid-root": {
              backgroundColor: "#fff",
            },
            "& .MuiDataGrid-cell": {
              color: "#333",
              display: "flex",
              alignItems: "center",
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#e0e0e0",
              color: "#000",
              fontWeight: "bold",
              fontSize: "1rem",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              textAlign: "center",
              width: "100%",
            },
            "& .MuiDataGrid-row:nth-of-type(odd)": {
              backgroundColor: "#f5f5f5",
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: "#e0e0e0",
              cursor: "pointer",
            },
            borderRadius: 2,
          }}
        />

        {weightageError && (
          <FormHelperText error sx={{ fontSize: "0.875rem" }}>
            {weightageError}
          </FormHelperText>
        )}

        {updateHandler && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            {isEditing ? (
              <>
                <Button
                  variant="contained"
                  startIcon={<CancelIcon />}
                  onClick={handleCancelClick}
                  sx={{
                    backgroundColor: "#ff6666", // Default lighter red
                    "&:hover": {
                      backgroundColor: "#cc0000", // Deeper red on hover
                    },
                    mr: 1,
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveClick}
                  sx={{
                    mr: 1,
                    boxShadow: "0",
                    backgroundColor: "#44a3b8",
                    "&:hover": { backgroundColor: "#1b849b" },
                  }}
                  disabled={!!scoreError || !!weightageError}
                >
                  Save
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
                onClick={handleEditClick}
                sx={{
                  mr: 1,
                  backgroundColor: "#44a3b8",
                  boxShadow: "0",
                  "&:hover": { backgroundColor: "#1b849b" },
                }}
              >
                Edit
              </Button>
            )}
          </Box>
        )}

        {/* Dialog Section */}
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="sm"
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              width: "30rem", // Adjust the width here
              height: "15rem", // Adjust the height here
            },
          }}
        >
          <DialogTitle>
            Milestone Details
            <IconButton
              aria-label="close"
              onClick={handleClose}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {selectedRow && (
              <Box>
                <Typography>Feedback: {selectedRow.feedback}</Typography>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  );
};

export default MilestoneAnalysis;
