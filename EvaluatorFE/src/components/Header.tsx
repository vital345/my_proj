import * as React from 'react';
import { useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import AdbIcon from '@mui/icons-material/Adb';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];

export function Header() {
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const [openHelpDialog, setOpenHelpDialog] = React.useState<boolean>(false);
  const location = useLocation();



 

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenHelpDialog = () => {
    setOpenHelpDialog(true);
  };

  const handleCloseHelpDialog = () => {
    setOpenHelpDialog(false);
  };

  return (
    <>
      <AppBar position="static">
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <AdbIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
            <Typography
              variant="h6"
              noWrap
              component="a"
              href="#app-bar-with-responsive-menu"
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.1rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              HUEvaluatorAssist
            </Typography>

            <AdbIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
            <Typography
              variant="h5"
              noWrap
              component="a"
              href="#app-bar-with-responsive-menu"
              sx={{
                mr: 2,
                display: { xs: 'flex', md: 'none' },
                flexGrow: 1,
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.1rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              HUEvaluatorAssist
            </Typography>

            <Box sx={{ flexGrow: 1 }} />

            <Box sx={{ flexGrow: 0 }}>
              {location.pathname === '/admin-dashboard/schedule-evaluation' && (
                <Tooltip title="Help">
                  <IconButton onClick={handleOpenHelpDialog} color="inherit">
                    <HelpOutlineIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                {settings.map((setting) => (
                  <MenuItem key={setting} onClick={handleCloseUserMenu}>
                    <Typography sx={{ textAlign: 'center' }}>{setting}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Dialog open={openHelpDialog} onClose={handleCloseHelpDialog}>
        <DialogTitle>Help</DialogTitle>
        <DialogContent>
          <Typography>
            <p>You can either type a single linker's email and git repo link</p>
            <h2 style={{ textAlign: 'center' }}>OR</h2>
            <p>You can upload a csv file which has email and git repo links for Linkers</p>
            <small>You can upload a csv file and then add one by one or vice versa...</small>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHelpDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
