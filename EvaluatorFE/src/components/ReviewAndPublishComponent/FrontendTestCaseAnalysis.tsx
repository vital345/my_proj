import CancelIcon from "@mui/icons-material/Cancel";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef, GridRowParams } from "@mui/x-data-grid";
import React, { useState } from "react";
// import { TestCase } from '../../interfaces/DialogRow';
import {
  FrontendReportDetails,
  FrontendStepReportDetails,
  TestcaseDetails,
} from "../../interfaces/FrontendReportDetails";

interface Props {
  report: FrontendReportDetails;
  updateHandler?: (
    stepName: string,
    updateDetails: FrontendStepReportDetails
  ) => Promise<void>;
}

const FrontendTestCaseAnalysis: React.FC<Props> = ({
  report,
  updateHandler,
}) => {
  const [open, setOpen] = useState(false);
  const [dialogText, setDialogText] = useState<string>();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [testCases, setTestCases] = useState<TestcaseDetails[]>(
    report.step_report.list_of_testcases
  );
  const [originalTestCases, setOriginalTestCases] = useState(
    report.step_report.list_of_testcases
  );
  //   const [totalNumberOfTestCases,setTotalNumberOfTestCases] = useState<number>(report.step_report.total_number_of_testcases)
  //   const [passedTestCases,setPassedTestCases] = useState<number>(report.step_report.total_number_of_passes_testcases)
  //   const [failedTestCases,setFailedTestCases] = useState<number>(report.step_report.total_number_of_failed_testcases)

  const handleRowClick = (params: GridRowParams) => {
    if (!isEditing) {
      setDialogText(params.row.conclusion);
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setDialogText("");
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setOriginalTestCases(testCases);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setTestCases(originalTestCases);
  };

  const handleSaveClick = () => {
    setIsEditing(false);
    const updatedDetails: FrontendStepReportDetails = {
      list_of_testcases: testCases,
      total_number_of_failed_testcases: testCases.filter(
        (testcase) => testcase.test_status === "failure"
      ).length,
      total_number_of_passes_testcases: testCases.filter(
        (testcase) => testcase.test_status === "success"
      ).length,
      total_number_of_testcases: testCases.length,
    };
    if (updateHandler)
      updateHandler("frontend_test_execution_report", updatedDetails)
        .then((res) => console.log(res))
        .catch((err) => console.error(err));
    setOriginalTestCases(testCases);
  };

  interface TestcaseDetailsWithId extends TestcaseDetails {
    id: number;
  }
  const handleDeleteRow = (row: TestcaseDetailsWithId) => {
    const updatedTestCases = testCases.filter(
      (_, index) => index + 1 !== row.id
    );
    setTestCases(updatedTestCases);
  };

  const columns: GridColDef[] = [
    { field: "test_name", headerName: "Title", width: 120 },
    { field: "total_steps", headerName: "Total Steps", flex: 1 },
    { field: "successful_steps", headerName: "Successful Steps", width: 130 },
    { field: "test_status", headerName: "Status", flex: 1 },
    ...(isEditing
      ? [
          {
            field: "actions",
            headerName: "Actions",
            width: 100,
            sortable: false,
            renderCell: (params: any) => (
              <IconButton
                onClick={() => {
                  handleDeleteRow(params.row);
                }}
                sx={{ zIndex: 4 }}
              >
                <DeleteIcon />
              </IconButton>
            ),
          },
        ]
      : []),
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
      {/* Summary Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 2,
        }}
      >
        <Typography variant="h6" sx={{ color: "#333", fontWeight: "bold" }}>
          Frontend Test Suite Summary
        </Typography>
        <Typography sx={{ color: "#666" }}>
          Total: {report.step_report.total_number_of_failed_testcases}
        </Typography>
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-around",
          backgroundColor: "#e0e0e0",
          borderRadius: 1,
          padding: 1,
        }}
      >
        <Typography sx={{ color: "#000", fontWeight: "bold" }}>
          ✅ Passed:{" "}
          {
            report.step_report.list_of_testcases.filter(
              (t) => t.test_status == "success"
            ).length
          }
        </Typography>
        <Typography sx={{ color: "#000", fontWeight: "bold" }}>
          ❌ Failed:{" "}
          {
            report.step_report.list_of_testcases.filter(
              (t) => t.test_status == "failure"
            ).length
          }
        </Typography>
        <Typography sx={{ color: "#000", fontWeight: "bold" }}>
          ❓ Partially Passed:{" "}
          {
            report.step_report.list_of_testcases.filter(
              (t) => t.test_status == "partial success"
            ).length
          }
        </Typography>
        <Typography sx={{ color: "#000", fontWeight: "bold" }}>
          📋 Total: {report.step_report.list_of_testcases.length}
        </Typography>
      </Box>

      {/* DataGrid Section */}
      <Box
        sx={{
          marginTop: 2,
          display: !updateHandler ? "flex" : "block",
          flexDirection: "column",
        }}
      >
        {/* <div style={{ display: 'flex', flexDirection: 'column' }}> */}
        <DataGrid
          rows={testCases.map((testcase, index) => ({
            id: index + 1,
            ...testcase,
          }))}
          columns={columns}
          disableColumnMenu
          onRowClick={handleRowClick}
          sx={{
            "& .MuiDataGrid-root": {
              backgroundColor: "#fff",
            },
            "& .MuiDataGrid-cell": {
              color: "#333",
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
          initialState={
            updateHandler
              ? undefined
              : {
                  pagination: {
                    paginationModel: { pageSize: -1, page: 0 },
                  },
                }
          }
        />
        {/* </div> */}
      </Box>

      {/* Edit/Save/Cancel Buttons */}
      {updateHandler && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
          {isEditing ? (
            <>
              <Button
                variant="contained"
                startIcon={<CancelIcon />}
                onClick={handleCancelClick}
                sx={{ marginRight: 1 }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveClick}
              >
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEditClick}
            >
              Edit
            </Button>
          )}
        </Box>
      )}

      {/* Dialog Section */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Test Case Details
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
            <CloseIcon sx={{ color: "red" }} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography>{dialogText}</Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default FrontendTestCaseAnalysis;
