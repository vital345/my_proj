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
import {
  BackendReportDetails,
  BackendStepReportDetails,
  TestcaseDetails,
} from "../../interfaces/BackendReportDetails";
import { TestCase } from "../../interfaces/DialogRow";

interface Props {
  report: BackendReportDetails;
  updateHandler?: (
    stepName: string,
    updateDetails: BackendStepReportDetails
  ) => Promise<void>;
}

const BackendTestCaseAnalysis: React.FC<Props> = ({
  report,
  updateHandler,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<TestCase>({
    id: -1,
    request_body: "",
    remarks: "",
    response_body: "",
    request_method: "",
    request_url: "",
    response_status_code: -1,
  });

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [testCases, setTestCases] = useState<TestcaseDetails[]>(
    report.step_report.list_of_testcases
  );
  const [originalTestCases, setOriginalTestCases] = useState(
    report.step_report.list_of_testcases
  );

  const handleRowClick = (params: GridRowParams) => {
    if (!isEditing) {
      setSelectedRow({
        id: params.row.id,
        request_body: params.row.request_body,
        response_body: params.row.response_body,
        remarks: params.row.remarks,
        request_method: params.row.request_method,
        request_url: params.row.request_url,
        response_status_code: params.row.response_status_code,
      });
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedRow({
      id: -1,
      request_method: "",
      response_body: "",
      request_body: "",
      remarks: "",
      request_url: "",
      response_status_code: -1,
    });
  };

  const formatJson = (jsonString: string) => {
    try {
      const jsonObject = JSON.parse(jsonString);
      return JSON.stringify(jsonObject, null, 2);
    } catch (error: unknown) {
      console.log(error);
      return jsonString; // Return the original string if it's not valid JSON
    }
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
    const updatedDetails: BackendStepReportDetails = {
      list_of_testcases: testCases,
      total_number_of_failed_testcases: testCases.filter(
        (testcase) => testcase.remarks === "failure"
      ).length,
      total_number_of_passes_testcases: testCases.filter(
        (testcase) => testcase.remarks === "success"
      ).length,
      total_number_of_testcases: testCases.length,
    };
    if (updateHandler)
      updateHandler("backend_test_execution_report", updatedDetails)
        .then((res) => console.log(res))
        .catch((err) => console.error(err));
    setOriginalTestCases(testCases);
  };

  const handleDeleteRow = (row: TestCase) => {
    const updatedTestCases = testCases.filter(
      (_, index) => index + 1 !== row.id
    );
    setTestCases(updatedTestCases);
  };

  const columns: GridColDef[] = [
    { field: "request_method", headerName: "Method", width: 120 },
    { field: "request_url", headerName: "API Endpoint", flex: 1 },
    { field: "response_status_code", headerName: "Status Code", width: 130 },
    { field: "remarks", headerName: "Remarks", flex: 1 },
    ...(isEditing
      ? [
          {
            field: "actions",
            headerName: "Actions",
            width: 100,
            sortable: false,
            renderCell: (params: any) => (
              <IconButton
                onClick={() => handleDeleteRow(params.row)}
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
          Backend API Test Suite Summary
        </Typography>
        <Typography sx={{ color: "#666" }}>
          Total: {testCases.length}
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
            testCases.filter((testcase) => testcase.remarks === "success")
              .length
          }
        </Typography>
        <Typography sx={{ color: "#000", fontWeight: "bold" }}>
          ❌ Failed:{" "}
          {
            testCases.filter((testcase) => testcase.remarks === "failure")
              .length
          }
        </Typography>
        <Typography sx={{ color: "#000", fontWeight: "bold" }}>
          📋 Total: {testCases.length}
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
          {selectedRow && (
            <Box display={"flex"} flexDirection={"column"} gap={"0.5rem"}>
              <Typography>
                <span style={{ fontSize: "1rem", fontWeight: 800 }}>
                  Request Type:
                </span>{" "}
                {selectedRow.request_method}
              </Typography>
              {selectedRow.request_body && (
                <Typography>
                  <span style={{ fontSize: "1rem", fontWeight: 800 }}>
                    Request Body:
                  </span>
                  <pre
                    style={{
                      backgroundColor: "#f0f0f0",
                      padding: "10px",
                      borderRadius: "4px",
                      whiteSpace: "pre-wrap",
                      wordWrap: "break-word",
                    }}
                  >
                    {formatJson(selectedRow.request_body)}
                  </pre>
                </Typography>
              )}
              {selectedRow.response_body && (
                <Typography>
                  <span style={{ fontSize: "1rem", fontWeight: 800 }}>
                    Response Body:
                  </span>
                  <pre
                    style={{
                      backgroundColor: "#f0f0f0",
                      padding: "10px",
                      borderRadius: "4px",
                      whiteSpace: "pre-wrap",
                      wordWrap: "break-word",
                    }}
                  >
                    {formatJson(selectedRow.response_body)}
                  </pre>
                </Typography>
              )}
              {selectedRow.remarks && (
                <Typography>
                  <span style={{ fontSize: "1rem", fontWeight: 800 }}>
                    Response Status:
                  </span>{" "}
                  <span
                    style={{
                      textTransform: "capitalize",
                      color:
                        selectedRow.remarks === "failure" ? "red" : "green",
                    }}
                  >
                    {selectedRow.remarks}
                  </span>
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default BackendTestCaseAnalysis;
