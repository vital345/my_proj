import {
  Box,
  Button,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
} from "@mui/material";
import { useState } from "react";
import { toast } from "react-toastify";
import conf from "../../conf/conf";
import { GeneratedQuestionType } from "./GeneratedQuestion.types";

export const GenerateQuestions = ({
  generatedQuestion,
  setGeneratedQuestion,
}: {
  generatedQuestion: GeneratedQuestionType[];
  setGeneratedQuestion: React.Dispatch<
    React.SetStateAction<GeneratedQuestionType[]>
  >;
}) => {
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [topic, setTopic] = useState<string>("");

  const handleGenerateQuestion = () => {
    if (!topic?.length) {
      toast.info("topic is necessary to generate questions");
      return;
    }
    setIsButtonLoading(true);
    fetch(
      `${
        conf.backendUrl
      }/evaluation/generate-questions/?requirement=${topic}&number_of_questions=${10}`
    )
      .then((res) => {
        res.json().then((r) => {
          console.log(r);
          setGeneratedQuestion((prev) => [
            ...prev,
            ...((r?.questions as string[]) || [])?.map((q) => ({
              isSelected: false,
              question: q,
            })),
          ]);
        });
      })
      .finally(() => {
        setIsButtonLoading(false);
      });
  };

  return (
    <div
      style={{
        marginTop: "10px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: "10px",
        }}
      >
        <TextField
          id="topicToGenerate"
          label="Topic"
          fullWidth
          placeholder="Enter the topic on which the questions must be generated"
          onBlur={(e) => {
            setTopic(e.target.value);
          }}
        />
        <Button
          variant="contained"
          loading={isButtonLoading}
          onClick={handleGenerateQuestion}
          sx={{
            backgroundColor: "#1b849b",
            padding: "0.5rem 1rem",
            "&:hover": {
              backgroundColor: "#5f5379",
            },
          }}
        >
          {generatedQuestion?.length ? "Regenerate" : "Generate"}
        </Button>
      </Box>
      {!!generatedQuestion?.length && (
        <Box>
          <h1 style={{ margin: "10px 0px", fontSize: "1.125rem" }}>
            Generated Question Details
          </h1>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableBody>
              {generatedQuestion.map((question, index) => (
                <TableRow
                  key={question?.question}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div>{index + 1}</div>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <label
                          style={{ cursor: "pointer" }}
                          htmlFor={`question-select-${index}`}
                        >
                          <Checkbox
                            id={`question-select-${index}`}
                            onChange={(e) => {
                              generatedQuestion[index].isSelected =
                                e.target.checked;
                              setGeneratedQuestion(generatedQuestion);
                            }}
                          />
                          {question?.question}
                        </label>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </div>
  );
};
