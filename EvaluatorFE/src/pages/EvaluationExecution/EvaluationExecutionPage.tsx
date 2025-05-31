import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
} from "@mui/lab";
import { useState } from "react";

export const EvaluationExecutionPage = () => {
  const timeline: string[] = ["Started", "Viva 1", "Viva 2", "Testing of code"];
  const [status] = useState<number[]>([1, 1, 1, 0]);
  /*useEffect(()=>{
    const getStatus=async()=>{
       const response=await fetch("/");
       const answer=await response.json();
       setStatus((prev:number[])=>{
        return answer;
       })
    }
  },[])*/
  return (
    <div
      style={{
        height: "77.5vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Timeline style={{ color: "#333" }}>
        {timeline.map((eachTimeLine, index) => {
          return (
            <TimelineItem key={index}>
              <TimelineSeparator>
                <TimelineDot
                  style={{ width: "1rem", height: "1rem" }}
                  color={status[index] === 1 ? "success" : "grey"}
                />
                {index < timeline.length - 1 && (
                  <TimelineConnector
                    style={{
                      background: status[index] === 1 ? "green" : "grey",
                      height: "2rem",
                      width: "0.25rem",
                    }}
                  />
                )}
              </TimelineSeparator>
              <TimelineContent
                style={{ fontSize: "1.25rem" }}
                color={status[index] === 1 ? "success" : "grey"}
              >
                {eachTimeLine}
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
    </div>
  );
};
