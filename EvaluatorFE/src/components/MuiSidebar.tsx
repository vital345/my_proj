// MuiSidebar.tsx
import { Event, Schedule } from "@mui/icons-material";
import BarChartIcon from "@mui/icons-material/BarChart";
import {
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import React from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import "./MuiSidebar.css";

interface MuiSidebarProps {
  open: boolean;
  handleDrawerToggle: () => void;
}

const MuiSidebar: React.FC<MuiSidebarProps> = ({
  open,
  handleDrawerToggle,
}) => {
  const loc = useLocation();

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={handleDrawerToggle}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile.
      }}
      PaperProps={{
        style: { width: 240 },
      }}
    >
      <div style={{ minHeight: 64 }} /> {/* theme.mixins.toolbar */}
      <Divider />
      {loc.pathname.startsWith("/admin-dashboard") && (
        <List>
          <ListItem
            className="listItem"
            component={RouterLink}
            to="/admin-dashboard/monitor-results"
          >
            <ListItemIcon>
              <BarChartIcon style={{ color: "yellowgreen" }} />
            </ListItemIcon>
            <ListItemText
              style={{ color: " #1b849b" }}
              primary="Monitor Results"
            />
          </ListItem>
          <ListItem
            className="listItem"
            component={RouterLink}
            to="/admin-dashboard/schedule-evaluation"
          >
            <ListItemIcon>
              <Event style={{ color: "grey" }} />
            </ListItemIcon>
            <ListItemText
              style={{ color: " #1b849b" }}
              primary="Schedule Evaluation"
            />
          </ListItem>
          <ListItem
            className="listItem"
            component={RouterLink}
            to="/admin-dashboard/view-scheduled-evaluation"
          >
            <ListItemIcon>
              <Schedule style={{ color: "orange" }} />
            </ListItemIcon>
            <ListItemText
              style={{ color: "#1b849b" }}
              primary="View Scheduled Evaluation"
            />
          </ListItem>
        </List>
      )}
    </Drawer>
  );
};

export default MuiSidebar;
