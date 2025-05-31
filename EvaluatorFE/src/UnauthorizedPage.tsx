import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from './store/hooks';
import { logOut } from './store/authSlice';

const UnauthorizedPage: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const handleGoBackClick = () => {
        dispatch(logOut());
        navigate('/');
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
            <Typography variant="h1" sx={{ mb: 1 }}>
                403
            </Typography>
            <Typography variant="h4" sx={{ mb: 1 }}>
                Unauthorized
            </Typography>
            <Typography variant="h6" sx={{ mb: 3 }}>
                You do not have permission to view this page.
            </Typography>
            <Button
                variant="contained"
                color="primary"
                sx={{ backgroundColor: '#1b849b' }}
                onClick={handleGoBackClick}
            >
                Go to Home
            </Button>
        </Box>
    );
};

export default UnauthorizedPage;
