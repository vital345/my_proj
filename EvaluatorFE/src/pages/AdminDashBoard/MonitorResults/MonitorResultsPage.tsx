import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { MdPendingActions } from "react-icons/md";
import Loader from "../../../components/Loader";
import { SearchComponent } from "../../../components/SearchComponents";

export interface LinkerResult {
  email: string;
  grade: string;
  track: string;
  batch: string;
}

export const MonitorResultsPage = () => {
  const [linkerResults, setLinkerResults] = useState<LinkerResult[]>([
    { email: "sfvsvs", grade: "A", track: "sjd", batch: "huhu" },
  ]);
  const [loading] = useState(false);

  useEffect(() => {
    // Fetch results and update state if needed
  }, []);

  const handleSearch = (results: LinkerResult[] | string) => {
    if (typeof results != "string") setLinkerResults([...results]);
    // Implement search logic here
  };

  return (
    <div
      style={{
        paddingBlock: "1rem",
        gap: "2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "whitesmoke",
      }}
    >
      <Typography color="#333" variant="h4" gutterBottom>
        Results of Linkers
      </Typography>
      <SearchComponent onSearchForResults={handleSearch} />
      {linkerResults.length > 0 && loading === false && (
        <TableContainer
          component={Paper}
          elevation={7.5}
          style={{ overflowX: "auto", width: "100%" }}
        >
          <Table style={{ minWidth: 600 }}>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Batch</TableCell>
                <TableCell>Track</TableCell>
                <TableCell>Grade</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {linkerResults.map((linkerResult, index) => (
                <TableRow
                  style={{
                    cursor:
                      linkerResult.grade === "pending"
                        ? "not-allowed"
                        : "pointer",
                    backgroundColor:
                      linkerResult.grade === "pending" ? "whitesmoke" : "auto",
                  }}
                  key={index}
                >
                  <TableCell>{linkerResult.email}</TableCell>
                  <TableCell>{linkerResult.batch}</TableCell>
                  <TableCell>{linkerResult.track}</TableCell>
                  <TableCell>
                    {linkerResult.grade === "pending" ? (
                      <MdPendingActions size={"1.5rem"} color="gray" />
                    ) : (
                      linkerResult.grade
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {loading === true && (
        <>
          <Loader />
        </>
      )}
    </div>
  );
};
