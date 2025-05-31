import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const NoDataFound: React.FC = () => {
    const navigate = useNavigate();
    const handleGoBackClick = () => {
        navigate('/admin-dashboard');
    };
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
        <ErrorOutlineIcon sx={{ fontSize: 100, mb: 2 }} />

        {/* <Typography variant="h1" sx={{ mb: 1 }}>
            404
        </Typography> */}
        <Box
        sx={{
            display: 'flex',
            flexDirection: 'row',
            // justifyContent: 'center',
            alignItems:'center'
        }}
        >
            <Typography variant="h4" sx={{ mb: 1 }}>
                No evaluations found
            </Typography>
        </Box>
        
        <Typography variant="h6" sx={{ mb: 3 }}>
            Sorry, the evaluations you are looking for do not exist.
        </Typography>
            <Button
                variant="contained"
                color="primary"
                sx={{ backgroundColor: '#1b849b' }}
                onClick={handleGoBackClick}
            >
                Schedule an Evaluation
            </Button>
        </Box>
    );
};

export default NoDataFound;
