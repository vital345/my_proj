// MuiHeader.tsx
import { Menu } from "@mui/icons-material";
import { AppBar, IconButton, Toolbar, Typography } from "@mui/material";
import React from "react";
import { useLocation } from "react-router-dom";

interface MuiHeaderProps {
  handleDrawerToggle: () => void;
}

const MuiHeader: React.FC<MuiHeaderProps> = ({ handleDrawerToggle }) => {
  const loc = useLocation();
  return (
    <AppBar
      position="fixed"
      style={{ zIndex: 99, backgroundColor: " #1b849b" }} // Higher than the drawer
    >
      <Toolbar>
        {loc.pathname !== "/" &&
          !loc.pathname.startsWith("/user-evaluation") && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleDrawerToggle}
              style={{ marginRight: 2 }} // theme.spacing(2)
            >
              <Menu />
            </IconButton>
          )}
        <Typography
          variant="h6"
          noWrap
          style={{ flexGrow: 1, fontWeight: "bold" }}
        >
          HUEvaluator
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default MuiHeader;
