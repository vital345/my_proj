import { Box, Button, Typography } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";

const NotFoundPage: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const navigate = useNavigate();

  // useEffect(() => {
  //     if (authStatus === "success") {
  //         if (user?.role === 'admin') {
  //             navigate("/admin-dashboard/schedule-evaluation");
  //         } else {
  //             toast.error("You aren't authorized to move ahead");
  //         }
  //     } else if (authStatus === "failure") {
  //         toast.error("Invalid username or password");
  //     }
  // }, [authStatus, navigate, user]);
  const handleGoBackClick = () => {
    navigate(`/admin-dashboard`);
  };
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f0f4f8",
        textAlign: "center",
        color: "#1b849b",
      }}
    >
      {/* <ErrorOutlineIcon sx={{ fontSize: 100, mb: 2 }} /> */}

      <Typography variant="h1" sx={{ mb: 1 }}>
        404
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          // justifyContent: 'center',
          alignItems: "center",
        }}
      >
        {/* <ErrorOutlineIcon sx={{ fontSize: 100, mb: 2 }} /> */}
        <Typography variant="h4" sx={{ mb: 1 }}>
          Page Not Found
        </Typography>
      </Box>

      <Typography variant="h6" sx={{ mb: 3 }}>
        Sorry, the page you are looking for does not exist.
      </Typography>
      {user?.role === "admin" && (
        <Button
          variant="contained"
          color="primary"
          sx={{ backgroundColor: "#1b849b" }}
          onClick={handleGoBackClick}
        >
          Go to Home
        </Button>
      )}
    </Box>
  );
};

export default NotFoundPage;
