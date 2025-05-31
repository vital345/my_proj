import { Button, Dialog, DialogContent, DialogTitle } from "@mui/material";

export const ShowResumeEvaluationDialog = ({
  isReloaded,
  setIsReloaded,
}: {
  isReloaded: boolean;
  setIsReloaded: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <>
      <Dialog open={isReloaded}>
        <DialogTitle
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          Resume Evaluation
        </DialogTitle>
        <DialogContent>
          <Button
            onClick={() => {
              setIsReloaded(false);
            }}
            variant="contained"
            color="primary"
            type="submit"
          >
            Click here to continue with your evaluation
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};
