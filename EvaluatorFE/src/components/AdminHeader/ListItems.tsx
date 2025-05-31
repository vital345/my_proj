import BarChartIcon from '@mui/icons-material/BarChart';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import * as React from 'react';
import { Link } from 'react-router-dom';
 
export const mainListItems = (
  <React.Fragment>
    <ListItemButton component={Link} to="/admin-dashboard/schedule-evaluation">
      <ListItemIcon>
        <DashboardIcon />
      </ListItemIcon>
      <ListItemText primary="Schedule Evaluation" />
    </ListItemButton>
    <ListItemButton component={Link} to="/admin-dashboard/view-scheduled-evaluation">
      <ListItemIcon>
        <BarChartIcon />
      </ListItemIcon>
      <ListItemText primary="Evaluations" />
    </ListItemButton>
  </React.Fragment>
);

// import * as React from 'react';
// import ListItemButton from '@mui/material/ListItemButton';
// import ListItemIcon from '@mui/material/ListItemIcon';
// import ListItemText from '@mui/material/ListItemText';
// // import ListSubheader from '@mui/material/ListSubheader';
// import DashboardIcon from '@mui/icons-material/Dashboard';
// // import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
// // import PeopleIcon from '@mui/icons-material/People';
// import BarChartIcon from '@mui/icons-material/BarChart';
// // import LayersIcon from '@mui/icons-material/Layers';
// // import AssignmentIcon from '@mui/icons-material/Assignment';
// import { Link } from 'react-router-dom';

// export const mainListItems = (
//   <React.Fragment>
//     <ListItemButton component={Link} to="/admin-dashboard/schedule-evaluation">
//       <ListItemIcon>
//         <DashboardIcon />
//       </ListItemIcon>
//       <ListItemText primary="Schedule Evaluation" />
//     </ListItemButton>
//     <ListItemButton component={Link} to="/admin-dashboard/view-scheduled-evaluation">
//       <ListItemIcon>
//         {/* <ShoppingCartIcon /> */}
//         <BarChartIcon />
//       </ListItemIcon>
//       <ListItemText primary="Evaluations" />
//     </ListItemButton>
//     {/* <ListItemButton component={Link} to="/admin-dashboard/view-scheduled-evaluation/:evaluationId">
//       <ListItemIcon>
//         <PeopleIcon />
//       </ListItemIcon>
//       <ListItemText primary="View Scheduled Evaluation" />
//     </ListItemButton> */}
//     {/* <ListItemButton component={Link} to="/admin-dashboard/evaluation-report/:evaluationId/:userId">
//       <ListItemIcon>
//         <BarChartIcon />
//       </ListItemIcon>
//       <ListItemText primary="Evaluation Report" />
//     </ListItemButton> */}
//     {/* <ListItemButton component={Link} to="/admin-dashboard/integrations">
//       <ListItemIcon>
//         <LayersIcon />
//       </ListItemIcon>
//       <ListItemText primary="Integrations" />
//     </ListItemButton> */}
//   </React.Fragment>
// );

// export const secondaryListItems = (
//   <React.Fragment>
//     <ListSubheader component="div" inset>
//       Saved reports
//     </ListSubheader>
//     <ListItemButton component={Link} to="/admin-dashboard/current-month">
//       <ListItemIcon>
//         <AssignmentIcon />
//       </ListItemIcon>
//       <ListItemText primary="Current month" />
//     </ListItemButton>
//     <ListItemButton component={Link} to="/admin-dashboard/last-quarter">
//       <ListItemIcon>
//         <AssignmentIcon />
//       </ListItemIcon>
//       <ListItemText primary="Last quarter" />
//     </ListItemButton>
//     <ListItemButton component={Link} to="/admin-dashboard/year-end-sale">
//       <ListItemIcon>
//         <AssignmentIcon />
//       </ListItemIcon>
//       <ListItemText primary="Year-end sale" />
//     </ListItemButton>
//   </React.Fragment>
// );