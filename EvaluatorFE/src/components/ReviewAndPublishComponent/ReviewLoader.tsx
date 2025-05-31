import PendingActionsIcon from "@mui/icons-material/PendingActions";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Box, Button, Typography } from "@mui/material";

export const ReviewLoader = ({ reload }: { reload: any }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        mb: 2,
        color: "#1b849b",
      }}
    >
      <PendingActionsIcon sx={{ fontSize: "6rem", mb: 2 }} />
      <Typography variant="h6">This step is in Progress</Typography>
      <Typography variant="body1" sx={{ opacity: "0.9" }}>
        Refresh after sometime to reflect changes
      </Typography>
      <Button
        onClick={reload}
        startIcon={<RefreshIcon />}
        variant="contained"
        sx={{ backgroundColor: "#1b849b", mt: 2 }}
      >
        Refresh
      </Button>
    </Box>
  );
};
