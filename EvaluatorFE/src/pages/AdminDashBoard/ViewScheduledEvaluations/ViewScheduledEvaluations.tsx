import {
  Box,
  Card,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import axios, { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import NoDataFound from "../../../components/NoData";
import conf from "../../../conf/conf";
import { Evaluation } from "../../../interfaces/Evaluation";
import { logOut } from "../../../store/authSlice";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import GenericErrorComponent from "../../ErrorPages/GeneriErrorComponent";
import "./ViewScheduledEvaluations.css";

export const ViewScheduledEvaluations: React.FC = () => {
  const [data, setData] = useState<Evaluation[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<boolean>(false);
  const navigate = useNavigate();
  const authToken = useAppSelector((state) => state.auth.token);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const getEvaluations = async () => {
      const config = {
        headers: { Authorization: `Bearer ${authToken}` },
      };
      try {
        console.log("Fetching data");
        console.log(`${conf.backendUrl}/evaluation/`);
        const response = await axios.get(
          `${conf.backendUrl}/evaluation/`,
          config
        );
        setData(response.data);
        console.log(response);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          if (axiosError.response) {
            if (axiosError.response.status === 401) {
              toast.error("Your token has expired. Please login again.");
              dispatch(logOut());
              navigate("/");
            } else if (axiosError.response.status === 403) {
              toast.error("You aren't authorized to view this page.");
              navigate("/unauthorized");
            } else {
              setError(true);
              toast.error("An error occurred while fetching data.");
            }
          } else {
            setError(true);
            toast.error("Network error. Please try again later.");
          }
        } else {
          setError(true);
          toast.error("An unexpected error occurred.");
        }
      } finally {
        setFetching(false);
      }
      // Trigger animation after data is fetched
    };
    getEvaluations();
  }, [authToken, navigate, dispatch]);

  const handleCompleteClick = (evaluationId: number) => {
    navigate(`/admin-dashboard/view-scheduled-evaluation/${evaluationId}`);
  };

  return (
    <>
      {fetching && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mt: 20,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      {!fetching && !error && data.length > 0 && (
        <Box sx={{ padding: 4, minHeight: "100vh", width: "75%", mx: "auto" }}>
          <Card>
            <Typography variant="h6" sx={{ color: "#444", p: "1rem" }}>
              Evaluation Details
            </Typography>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: "#f0f0f0" }}>
                  <TableRow>
                    <TableCell align="center" sx={{ color: "#333" }}>
                      Number
                    </TableCell>
                    <TableCell align="center" sx={{ color: "#333" }}>
                      Track Name
                    </TableCell>
                    <TableCell align="center" sx={{ color: "#333" }}>
                      Batch Name
                    </TableCell>
                    <TableCell align="center" sx={{ color: "#333" }}>
                      Code Freeze
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.map((evaluation, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        cursor: "pointer",
                        "&:hover": { backgroundColor: "#f0f0f0" },
                      }}
                      onClick={() => handleCompleteClick(evaluation.id)}
                    >
                      <TableCell align="center">{index + 1}</TableCell>
                      <TableCell align="center" sx={{ color: "#555" }}>
                        {evaluation.track_name}
                      </TableCell>
                      <TableCell align="center">
                        {evaluation.batch_name}
                      </TableCell>
                      <TableCell align="center">
                        {new Date(
                          evaluation.code_freezing_time
                        ).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}
      {!fetching && error && <GenericErrorComponent />}
      {!fetching && !error && data.length == 0 && <NoDataFound />}
    </>
  );
};
