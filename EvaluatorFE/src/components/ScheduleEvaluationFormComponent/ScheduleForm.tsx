import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import {
  Backdrop,
  Card,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TableContainer,
  Tooltip,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import type { UploadProps } from "antd";
import { Upload } from "antd";
import { RcFile } from "antd/lib/upload";
import axios from "axios";
import { Dayjs } from "dayjs";
import { parse, ParseResult } from "papaparse";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import fileUploadIcon from "../../assets/file_upload.svg";
import conf from "../../conf/conf";
import { LinkerDetails } from "../../interfaces/LinkerDetails";
import { QuestionDescription } from "../../interfaces/Question";
import { useAppSelector } from "../../store/hooks";
import trimString from "../../utils/trimString";
import { GenerateQuestions } from "./GenerateQuestions";
import { GeneratedQuestionType } from "./GeneratedQuestion.types";
// import linkerSampleFile from '../../assets/sample-files/Linker.csv'

const { Dragger } = Upload;

interface linkerRow {
  Email: string;
  RepoUrl: string;
  DeployedUrl: string;
  Name: string;
}
interface questionRow {
  Question: string;
}

interface Errors {
  trackName: string | null;
  batchName: string | null;
  projectType: string | null;
  projectRequirements: string | null;
  codeFreezeTime: string | null;
  candidates: string | null;
  questions: {
    upload?: string;
    generate?: string;
  } | null;
  extensions: string | null;
}

export const ScheduleForm: React.FC = () => {
  const [trackName, setTrackName] = useState("");
  const [batchName, setBatchName] = useState("");
  const [projectType, setProjectType] = useState<"frontend" | "backend">();
  const [projectRequirements, setProjectRequirements] = useState("");
  const [codeFreezeTime, setCodeFreezeTime] = React.useState<Dayjs | null>();
  const [candidates, setCandidates] = useState<LinkerDetails[]>([]);
  const [questions, setQuestions] = useState<QuestionDescription[]>([]);
  const [extensions, setExtensions] = useState<string>("");
  const [errors, setErrors] = useState<Errors>({
    trackName: null,
    batchName: null,
    projectType: null,
    projectRequirements: null,
    codeFreezeTime: null,
    candidates: null,
    questions: null,
    extensions: null,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedQuestion, setGeneratedQuestion] = useState<
    GeneratedQuestionType[]
  >([]);

  const navigate = useNavigate();
  const authToken = useAppSelector((state) => state.auth.token);

  const linkerCSV = (file: File) => {
    parse(file, {
      complete: (results: ParseResult<linkerRow>) => {
        const rows = results.data
          .map((data) => ({
            email: data.Email,
            fullName: data.Name,
            repoUrl: data.RepoUrl,
            deployedUrl: data.DeployedUrl,
          }))
          .filter(
            (data) =>
              data.email && data.repoUrl && data.deployedUrl && data.fullName
          );
        setCandidates(rows);
      },
      header: true,
    });
  };

  const questionCSV = (file: File) => {
    parse(file, {
      complete: (results: ParseResult<questionRow>) => {
        const rows = results.data
          .map((data) => ({
            question: data.Question,
          }))
          .filter((data) => !!data.question);
        setQuestions(rows);
      },
      header: true,
    });
  };

  const linkerProps: UploadProps = {
    name: "file",
    multiple: true,
    beforeUpload: (file: RcFile) => {
      const isCSV = file.type === "text/csv";
      if (isCSV) {
        // Handle CSV file
        linkerCSV(file);
      }
      return false;
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };
  const questionProps: UploadProps = {
    name: "file",
    multiple: true,
    beforeUpload: (file: RcFile) => {
      const isCSV = file.type === "text/csv";
      if (isCSV) {
        questionCSV(file);
      }
      return false;
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateInputs()) {
      toast.error("Please enter all the required fields");
      return;
    }

    setLoading(true);
    const selectedQuestions = generatedQuestion?.filter((q) => !!q.isSelected);
    const apiUrl = `${conf.backendUrl}/evaluation/`;
    const postData = {
      track_name: trackName,
      batch_name: batchName,
      project_type: projectType,
      code_freezing_time: codeFreezeTime
        ? codeFreezeTime.toISOString()
        : new Date().toISOString(),
      requirements: projectRequirements,
      users: candidates.map((user) => ({
        email_id: user.email,
        github_url: user.repoUrl,
        deployed_url: user.deployedUrl,
        full_name: user.fullName,
      })),
      questions:
        questions.length > 0
          ? questions.map((question) => question.question)
          : selectedQuestions?.length > 0
          ? selectedQuestions?.map((q) => q.question)
          : null,
      extensions: extensions,
    };

    try {
      const config = {
        headers: { Authorization: `Bearer ${authToken}` },
      };
      const response = await axios.post(apiUrl, postData, config);
      toast.success("Evaluation scheduled successfully!");
      navigate(
        `/admin-dashboard/view-scheduled-evaluation/${response.data.id}`
      );
    } catch (error) {
      console.error("Error posting data:", error);
      setLoading(false);
      toast.error("Failed to schedule evaluation.");
    }
  };

  const handleTrackNameChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | undefined
  ) => {
    if (event === undefined || event.target === undefined) return;
    setTrackName(event.target.value);
  };

  const handleBatchNameChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | undefined
  ) => {
    if (event === undefined || event.target === undefined) return;
    setBatchName(event.target.value);
  };

  const handleProjectRequirementsChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | undefined
  ) => {
    if (event === undefined || event.target === undefined) return;
    setProjectRequirements(event.target.value);
  };

  const clearErrors = () => {
    setErrors({
      trackName: null,
      batchName: null,
      projectType: null,
      projectRequirements: null,
      codeFreezeTime: null,
      candidates: null,
      questions: null,
      extensions: null,
    });
  };

  const validateInputs = (): boolean => {
    let isValid = true;
    const selectedQuestions = generatedQuestion?.filter((q) => !!q.isSelected);

    if (!trackName) {
      isValid = false;
      setErrors((errors) => ({
        ...errors,
        trackName: "Track name is required",
      }));
    }
    if (!batchName) {
      isValid = false;
      setErrors((errors) => ({
        ...errors,
        batchName: "Batch name is required",
      }));
    }
    if (!projectType) {
      isValid = false;
      setErrors((errors) => ({
        ...errors,
        projectType: "Project type is required",
      }));
    }
    if (!codeFreezeTime) {
      isValid = false;
      setErrors((errors) => ({
        ...errors,
        codeFreezeTime: "Code freeze time is required",
      }));
    }
    if (!projectRequirements) {
      isValid = false;
      setErrors((errors) => ({
        ...errors,
        projectRequirements: "Project requirements is required",
      }));
    }
    if (!extensions) {
      isValid = false;
      setErrors((errors) => ({
        ...errors,
        extensions: "Extensions are required",
      }));
    }
    if (candidates.length == 0) {
      isValid = false;
      setErrors((errors) => ({
        ...errors,
        candidates: "Linker list (linker.csv) is required",
      }));
    }
    if (questions?.length <= 5 && !selectedQuestions?.length) {
      isValid = false;
      setErrors((errors) => ({
        ...errors,
        questions: {
          upload: "There must be more than 5 questions uploaded for scheduling",
        },
      }));
    }
    if (selectedQuestions?.length <= 5 && !questions?.length) {
      isValid = false;
      setErrors((errors) => ({
        ...errors,
        questions: {
          generate:
            "There must be more than 5 questions selected for scheduling",
        },
      }));
    }
    return isValid;
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      onFocus={clearErrors}
      noValidate
      autoComplete="off"
      sx={{ marginTop: "3rem" }}
    >
      <Card sx={{ width: 700 }}>
        <Box sx={{ padding: "2rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.125rem" }}>Details</h1>
          <p
            style={{
              margin: "0.25rem 0 0",
              fontWeight: 400,
              fontSize: "0.875rem",
              color: "#637381",
            }}
          >
            Track name, short description, pdf...
          </p>
        </Box>
        <Divider />
        <Box sx={{ padding: "1.5rem" }}>
          <Box sx={{ display: "flex", mb: 3 }}>
            <TextField
              error={!!errors.trackName}
              id="track-name"
              label="Track name"
              variant="outlined"
              // fullWidth
              sx={{ mr: "0.7rem", width: "50%" }}
              onChange={handleTrackNameChange}
              onBlur={() => {
                if (!trackName)
                  setErrors((errors) => ({
                    ...errors,
                    trackName: "Track name is required",
                  }));
              }}
              size="small"
              helperText={errors.trackName}
            />

            <TextField
              id="batch-name"
              label="Batch name"
              variant="outlined"
              // fullWidth
              sx={{ ml: "0.7rem", width: "50%" }}
              onChange={handleBatchNameChange}
              size="small"
              helperText={errors.batchName}
              error={!!errors.batchName}
              onBlur={() => {
                if (!batchName)
                  setErrors((errors) => ({
                    ...errors,
                    batchName: "Batch name is required",
                  }));
              }}
            />
          </Box>
          <Box sx={{ display: "flex", mb: 3 }}>
            <FormControl
              sx={{ mr: "0.7rem", width: "50%" }}
              size="small"
              error={!!errors.projectType}
            >
              <InputLabel id="project-type-label">Project type</InputLabel>
              <Select
                labelId="project-type-label"
                id="project-type"
                value={projectType}
                label="Project Type"
                onChange={(e) =>
                  setProjectType(e.target.value as "frontend" | "backend")
                }
                onBlur={() => {
                  if (!projectType)
                    setErrors((errors) => ({
                      ...errors,
                      projectType: "Project type is required",
                    }));
                }}
              >
                <MenuItem value={"frontend"}>Frontend</MenuItem>
                <MenuItem value={"backend"}>Backend</MenuItem>
              </Select>
              {errors.projectType && (
                <FormHelperText>{errors.projectType}</FormHelperText>
              )}
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                sx={{ ml: "0.7rem", width: "50%" }}
                value={codeFreezeTime}
                onChange={(newValue) => setCodeFreezeTime(newValue)}
                label="Code Freezing Time"
                slotProps={{
                  textField: {
                    size: "small",
                    error: !!errors.codeFreezeTime,
                    helperText: errors.codeFreezeTime,
                    onBlur: () => {
                      if (!codeFreezeTime)
                        setErrors((errors) => ({
                          ...errors,
                          codeFreezeTime: "Code freezing time is required",
                        }));
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </Box>
          <TextField
            id="project-requirements"
            label="Project requirements"
            multiline
            rows={4}
            fullWidth
            onChange={handleProjectRequirementsChange}
            sx={{ mb: 3, borderRadius: "1rem" }}
            size="small"
            error={!!errors.projectRequirements}
            helperText={errors.projectRequirements}
            onBlur={() => {
              if (!projectRequirements)
                setErrors((errors) => ({
                  ...errors,
                  projectRequirements: "Project requirements is required",
                }));
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <TextField
              id="extension"
              label="Extensions"
              fullWidth
              onChange={(e) => {
                setExtensions(e.target.value);
              }}
              sx={{ borderRadius: "1rem" }}
              size="small"
              error={!!errors.extensions}
              helperText={errors.extensions}
              onBlur={() => {
                if (!extensions?.length)
                  setErrors((errors) => ({
                    ...errors,
                    extensions: "extensions are required",
                  }));
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <Tooltip title="Extensions must be comma separated. eg: tsx,ts,js">
                      <InfoOutlinedIcon style={{ marginRight: "10px" }} />
                    </Tooltip>
                  ),
                },
              }}
              placeholder="Enter file extensions to include for question generation."
            />
          </div>

          <Dragger
            {...linkerProps}
            style={{
              borderRadius: "0.3rem",
              border: errors.candidates ? "1.5px solid red" : undefined,
            }}
          >
            <img style={{ height: "6rem" }} src={fileUploadIcon} alt="" />
            <p className="ant-upload-text">
              Click or drag Linker.csv to upload
            </p>
            <p className="ant-upload-hint">
              Drop file here or click to browse through your machine
            </p>
          </Dragger>
          <FormControl sx={{ width: "100%" }} error={!!errors.candidates}>
            {!errors.candidates && (
              <FormHelperText>
                Click{" "}
                <Link
                  href="/assets/sample-files/Linker.csv"
                  download="linkers.csv"
                >
                  here
                </Link>{" "}
                to download sample file
              </FormHelperText>
            )}
            <FormHelperText>{errors.candidates}</FormHelperText>
          </FormControl>

          {candidates.length > 0 && (
            <>
              <Box sx={{ my: "1.5rem" }}>
                <h1 style={{ margin: 0, fontSize: "1.125rem" }}>
                  Linkers Details
                </h1>
                <p
                  style={{
                    margin: "0.25rem 0 0",
                    fontWeight: 400,
                    fontSize: "0.875rem",
                    color: "#637381",
                  }}
                >
                  Email id, Github Repo URL, Deployed URL...
                </p>
              </Box>
              <TableContainer>
                <Table
                  stickyHeader
                  sx={{ minWidth: 650, border: "1px solid #ccc" }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell style={{ minWidth: "200px" }}>
                        Email Id
                      </TableCell>
                      <TableCell style={{ minWidth: "200px" }}>Name</TableCell>
                      <TableCell style={{ minWidth: "300px" }} align="left">
                        Repo URL
                      </TableCell>
                      <TableCell style={{ minWidth: "300px" }} align="left">
                        Deployed URL
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {candidates.map((row) => (
                      <TableRow
                        key={row.email}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell component="th" scope="row">
                          {row.email}
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {row.fullName}
                        </TableCell>
                        <TableCell align="left">
                          {trimString(row.repoUrl, 25)}
                        </TableCell>
                        <TableCell align="left">
                          <Link href={row.deployedUrl}>
                            {trimString(row.deployedUrl, 25)}
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
          <Box
            sx={{
              border: "1px dashed #c9c9c9",
              padding: "10px",
              borderRadius: "5px",
              marginTop: "10px",
            }}
          >
            <Dragger
              {...questionProps}
              style={{
                borderRadius: "0.3rem",
                marginTop: "24px",
                border: errors.questions ? "1.5px solid red" : undefined,
              }}
            >
              <img style={{ height: "6rem" }} src={fileUploadIcon} alt="" />
              <p className="ant-upload-text">
                Click or drag Question.csv upload{" "}
              </p>
              <p className="ant-upload-hint">
                Drop file here or click to browse through your machine
              </p>
            </Dragger>

            <FormControl
              sx={{ width: "100%" }}
              error={!!errors.questions?.upload}
            >
              {!errors.questions?.upload && (
                <FormHelperText>
                  Click{" "}
                  <Link
                    href="/assets/sample-files/Question.csv"
                    download="questions.csv"
                  >
                    here
                  </Link>{" "}
                  to download sample file
                </FormHelperText>
              )}
              <FormHelperText>{errors.questions?.upload}</FormHelperText>
            </FormControl>
            <Divider>OR</Divider>

            <FormControl
              sx={{ width: "100%" }}
              error={!!errors.questions?.generate}
            >
              <GenerateQuestions
                generatedQuestion={generatedQuestion}
                setGeneratedQuestion={setGeneratedQuestion}
              />
              <FormHelperText>{errors.questions?.generate}</FormHelperText>
            </FormControl>
          </Box>

          {questions.length > 0 && (
            <>
              <Box sx={{ my: "1.5rem" }}>
                <h1 style={{ margin: 0, fontSize: "1.125rem" }}>
                  Question Details
                </h1>
                <p
                  style={{
                    margin: "0.25rem 0 0",
                    fontWeight: 400,
                    fontSize: "0.875rem",
                    color: "#637381",
                  }}
                >
                  Here comes the question you uploaded.
                </p>
              </Box>
              <Divider />

              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableBody>
                  {questions.map((row, index) => (
                    <TableRow
                      key={row.question}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {`${index + 1}. ${row.question}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", mt: "1.5rem" }}
          >
            <Button
              variant="contained"
              startIcon={<TaskAltIcon />}
              sx={{
                backgroundColor: "#1b849b",
                padding: "0.5rem 1rem",
                "&:hover": {
                  backgroundColor: "#5f5379",
                },
              }}
              type="submit"
              disabled={loading}
            >
              Schedule
            </Button>
          </Box>
        </Box>
      </Card>
      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};
