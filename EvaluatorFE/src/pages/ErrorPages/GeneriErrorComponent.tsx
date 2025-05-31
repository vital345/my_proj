import React from 'react';
import { Box, Typography } from '@mui/material';


const GenericErrorComponent: React.FC = ({message = "Something went wrong"} : {message?:string }) => {
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f4f8',
        textAlign: 'center',
        color: '#1b849b',
      }}
    >
      {/* <ErrorOutlineIcon sx={{ fontSize: 100, mb: 2 }} /> */}

      <Typography variant="h1" sx={{ mb: 1 }}>
        OOPS
      </Typography>
      <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        // justifyContent: 'center',
        alignItems:'center'
      }}
      >
        {/* <ErrorOutlineIcon sx={{ fontSize: 100, mb: 2 }} /> */}
        <Typography variant="h4" sx={{ mb: 1 }}>
            {message}
        </Typography>
      </Box>
    </Box>
  );
};

export default GenericErrorComponent;
