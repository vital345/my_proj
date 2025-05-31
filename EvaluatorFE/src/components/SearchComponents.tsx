import { Button, Grid, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { LinkerResult } from "../pages/AdminDashBoard/MonitorResults/MonitorResultsPage";
import { ScheduledEvaluation } from "./ProjectDescption";

export interface BasicStudentDetails {
  email: string;
  link: string;
}

interface SearchProps {
  onSearchForResults?: (ans: LinkerResult[] | string) => void;
  onSearchForScheduledEvaluations?: (ans: ScheduledEvaluation) => void;
  batch?: string;
  track?: string;
}

export const SearchComponent: React.FC<SearchProps> = ({
  onSearchForResults = () => {},
  onSearchForScheduledEvaluations = () => {},
  track,
  batch,
}) => {
  const [batchName, setBatchName] = useState<string>(() => {
    if (batch) {
      return batch;
    }
    return "";
  });
  const [trackName, setTrackName] = useState<string>(() => {
    if (track) {
      return track;
    }
    return "";
  });
  const loc = useLocation();
  const handleSearch = () => {
    if (!batchName || !trackName) {
      alert("Both Batch Name and Track Name must be filled.");
    } else {
      /*fetch(`https://example.com?batch=${batchName}&track=${trackName}`).then((res:any)=>res.json())
        .then((ans:LinkerResult[])=>{
            onSearch(ans)
        })*/

      if (loc.pathname === "/admin-dashboard/view-scheduled-evaluation") {
        onSearchForScheduledEvaluations({
          track_name: "Full Stack Development",
          batch_name: "Batch 2023",
          code_freezing_time: "2023-12-31T23:59",
          requirements:
            "dfbfgdfkhvdfvkjdfvk,jdfvjkdrgjdfv,jdfbfvufvhiadufvliuadfgvluiaergflairufgwarlfbywefwelofywevflawveufyawel vfw lwiefhlwefhwqnlefoyw qwloefywlenfvyqwelofynwqelfvuqweyflwyflweuyfweldlfiubghsrleiugherwliughewrlitvghewrliguweyrbgliuwerhgliuewrhngvliuerhbgwleirughwerliughwetljgbhtrilubghwebrliugbheriulgfwe wliefwerliufhwqenlfiuywegv,dfbgv,jfdbgdrjh,gbedrfjhgberkjgberkjgerkjgntyjyt",
          users: [
            {
              email_id: "student1@example.com",
              github_url: "https://github.com/student1/project",
              deployed_url: "https://student1-project.com",
              full_name: "student",
            },
            {
              email_id: "student2@example.com",
              github_url: "https://github.com/student2/project",
              deployed_url: "https://student2-project.com",
              full_name: "student1",
            },
            {
              email_id: "student3@example.com",
              github_url: "https://github.com/student3/project",
              deployed_url: "https://student3-project.com",
              full_name: "student3",
            },
          ],
        });
      } else {
        onSearchForResults([
          { email: batchName, track: "java", grade: "A", batch: "hu1.2" },
        ]);
      }
    }
  };
  useEffect(() => {
    if (batchName != "" && trackName != "") {
      handleSearch();
    }
  }, []);

  return (
    <Grid
      container
      spacing={3}
      justifyContent="center"
      alignItems="center"
      style={{ marginBottom: "20px" }}
    >
      <Grid item xs={12} sm={4}>
        <TextField
          label="Batch Name"
          value={batchName}
          onChange={(e) => setBatchName(e.target.value)}
          fullWidth
          variant="outlined"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          label="Track Name"
          value={trackName}
          onChange={(e) => setTrackName(e.target.value)}
          fullWidth
          variant="outlined"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Button
          onClick={handleSearch}
          variant="contained"
          style={{ background: "#1b849b", color: "white", width: "100%" }}
        >
          Search
        </Button>
      </Grid>
    </Grid>
  );
};
