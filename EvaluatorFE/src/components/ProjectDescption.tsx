import {
  Button,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Papa from "papaparse";
import React, { ChangeEvent, useEffect, useState } from "react";
// Use pdfParse as shown previously
import { MdCheckCircle, MdClose } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import "./ProjectDescription.css";

export interface LinkersData {
  id?: number;
  email?: string;
  github_url?: string;
  deployed_url?: string;
  status?: string;
  is_complete?: string;
  email_id?: string;
  full_name: string | null;
}

export interface BookEvaluation {
  track_name: string;
  batch_name: string;
  code_freezing_time: string;
  requirements: File | null;
  users: LinkersData[];
}

export interface ScheduledEvaluation {
  track_name: string;
  batch_name: string;
  code_freezing_time: string;
  requirements: string;
  users: LinkersData[];
}

export const ProjectDescription: React.FC = () => {
  const [tableData, setTableData] = useState<LinkersData[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState<string>("");
  const [csvFileName, setCsvFileName] = useState<string>("");
  const [pdfFileName, setPdfFileName] = useState<string>("");
  const [codeFreezeTime, setCodeFreezeTime] = useState<string>("");
  const [firstSelect, setFirstSelect] = useState<string>("frontend");
  const [secondSelect, setSecondSelect] = useState<string>("React");
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [batchName, setBatchName] = useState<string>("");
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const nav = useNavigate();

  useEffect(() => {
    handleFirstSelectChange(firstSelect);
  }, []);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFileName(file.name);
      Papa.parse(file, {
        complete: (result) => {
          const parsedData = result.data as string[][];
          const validData = parsedData.filter(
            (row: string[]) => validateEmail(row[0]) && row[1]
          );
          const data = validData.map((row: string[]) => ({
            email_id: row[0],
            full_name: row[1],
            github_url: row[2],
            deployed_url: row[3],
          }));
          setTableData([...tableData, ...data]);
        },
      });
    }
  };

  const handlePdfUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setPdfFileName(file.name);
      setPdfError("");
    } else {
      setPdfFile(null);
      setPdfFileName("");
      setPdfError("Please upload a PDF file.");
    }
  };

  const handlePdfSubmit = () => {
    if (tableData.length === 0) {
      alert("There should be at least one Linker's data");
      return;
    }

    if (codeFreezeTime === "") {
      alert("Choose code freeze time.");
      return;
    }

    if (secondSelect === "") {
      alert("Track Name should not be empty");
      return;
    }
    if (batchName === "") {
      alert("Batch name should not be empty");
      return;
    }
    const bookEvaluation: BookEvaluation = {
      track_name: secondSelect,
      batch_name: batchName,
      code_freezing_time: codeFreezeTime,
      requirements: pdfFile,
      users: tableData,
    };

    for (const [k, v] of Object.entries(bookEvaluation)) {
      console.log(k + "----" + v);
    }

    // Simulate a successful submission
    setOpenSnackbar(true);
    setTimeout(() => {
      setOpenSnackbar(false);
      nav("/admin-dashboard/view-scheduled-evaluation", {
        state: { batchName, secondSelect },
      });
    }, 1000);
  };

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const getTomorrowDateInIST = (): string => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const offset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
    const istTime = new Date(tomorrow.getTime() + offset);
    return istTime.toISOString().slice(0, 16);
  };

  const handleFirstSelectChange = (value: string) => {
    setFirstSelect(value);
    if (value === "frontend") {
      setCategoryOptions(["React", "Angular", "Basics"]);
      setSecondSelect("React"); // Default selection
    } else if (value === "backend") {
      setCategoryOptions([
        "Python (FastAPI)",
        "Java (Spring Boot)",
        "C# (DotNet)",
      ]);
      setSecondSelect("Python (FastAPI)"); // Default selection
    }
  };

  const handleSecondSelectChange = (e: any) => {
    setSecondSelect(e.target.value as string);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Paper elevation={7}>
      <div className="project-description" style={{ padding: 20 }}>
        <Typography
          variant="h4"
          className="title"
          style={{ textAlign: "center", marginBottom: 20 }}
        >
          Upload Details
        </Typography>
        <Paper style={{ padding: 20, marginBottom: 20 }}>
          <Grid
            container
            spacing={3}
            justifyContent="center"
            alignItems="flex-start"
          >
            <Grid item xs={12} md={6}>
              <Typography variant="h6" className="section-title">
                Drop CSV file with email and git repo link of Linkers
              </Typography>
              <div className="file-upload-container">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden-file-input"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="custom-file-upload">
                  Choose File
                </label>
                {csvFileName && (
                  <span className="file-name">{csvFileName}</span>
                )}
              </div>
            </Grid>
          </Grid>
          <div className="table-container" style={{ marginTop: 20 }}>
            {tableData.length > 0 ? (
              <Table className="data-table">
                <TableHead>
                  <TableRow>
                    <TableCell style={{ textAlign: "center" }}>
                      Number
                    </TableCell>
                    <TableCell style={{ textAlign: "center" }}>Email</TableCell>
                    <TableCell style={{ textAlign: "center" }}>
                      Git-Repo Link
                    </TableCell>
                    <TableCell style={{ textAlign: "center" }}>
                      Deployed Link
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell style={{ textAlign: "center" }}>
                        {index + 1}
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        {row?.email_id}
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        {row.github_url}
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        {row.deployed_url}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p style={{ textAlign: "center", color: "#333", width: "100%" }}>
                ------No details of Linkers are added------
              </p>
            )}
          </div>
        </Paper>

        <Paper style={{ padding: 20, marginBottom: 20 }}>
          <Grid
            container
            spacing={3}
            justifyContent="center"
            alignItems="center"
          >
            <Grid
              item
              xs={12}
              md={6}
              style={{ display: "flex", alignItems: "center" }}
            >
              <Typography
                variant="h6"
                className="section-title"
                style={{ marginRight: "16px" }}
              >
                Upload the project details in PDF
              </Typography>
              <div className="file-upload-container">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  className="hidden-file-input"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="custom-file-upload">
                  Choose File
                </label>
                <div
                  style={{
                    width: "200px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {pdfFileName && (
                    <span className="file-name">{pdfFileName}</span>
                  )}
                  {pdfError && <span style={{ color: "red" }}>{pdfError}</span>}
                </div>
              </div>
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
              style={{ display: "flex", alignItems: "center" }}
            >
              <Typography
                variant="h6"
                className="section-title"
                style={{ marginRight: "16px" }}
              >
                Pick date and time for code freeze
              </Typography>
              <div className="datetime-picker">
                <input
                  type="datetime-local"
                  value={codeFreezeTime}
                  onChange={(e) => setCodeFreezeTime(e.target.value)}
                  min={getTomorrowDateInIST()}
                  className="datetime-input"
                  id="code-freeze-time"
                />
              </div>
            </Grid>
          </Grid>
        </Paper>

        <Paper style={{ padding: 20, marginBottom: 20 }}>
          <Grid container justifyContent="center" alignItems="center">
            <Grid item>
              <Typography>Batch name & Track details</Typography>
            </Grid>
          </Grid>
          <Grid
            container
            spacing={3}
            justifyContent="center"
            alignItems="center"
          >
            <Grid item xs={12} md={6}>
              <TextField
                label="Batch Name"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                fullWidth
                margin="normal"
                variant="outlined"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel style={{ marginTop: 10 }}>Technology</InputLabel>
                <Select
                  value={firstSelect}
                  onChange={(e) =>
                    handleFirstSelectChange(e.target.value as string)
                  }
                >
                  <MenuItem value="frontend">Frontend</MenuItem>
                  <MenuItem value="backend">Backend</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel style={{ marginTop: 10 }}>Category</InputLabel>
                <Select
                  value={secondSelect}
                  onChange={handleSecondSelectChange}
                >
                  {categoryOptions.map((option, index) => (
                    <MenuItem key={index} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        <div className="center-button">
          <Button
            onClick={handlePdfSubmit}
            variant="contained"
            style={{ background: "#1b849b" }}
            className="book-evaluation-button"
            startIcon={<MdCheckCircle />}
          >
            Book Evaluation
          </Button>
        </div>

        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          message={
            <span style={{ display: "flex", alignItems: "center" }}>
              <MdCheckCircle style={{ marginRight: "8px", color: "green" }} />
              Evaluation booked successfully!
            </span>
          }
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={handleCloseSnackbar}
            >
              <MdClose />
            </IconButton>
          }
        />
      </div>
    </Paper>
  );
};
