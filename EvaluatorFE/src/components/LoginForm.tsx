import React, { useEffect, useState } from 'react';
import { TextField, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Loader from './Loader';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logIn } from '../store/authSlice';


const LoginForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({ email: '', password: '' });
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const authStatus = useAppSelector((state) => state.auth.status);
    const user = useAppSelector((state) => state.auth.user);

    useEffect(() => {
        if (authStatus === "success") {
            if (user?.role === 'admin') {
                navigate("/admin-dashboard");
            } else {
                toast.error("You aren't authorized to move ahead");
            }
        } else if (authStatus === "failure") {
            toast.error("Invalid username or password");
        }
    }, [authStatus, navigate, user]);

    const validateEmail = (email: string): boolean => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email.toLowerCase());
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      let valid = true;
      const errors = { email: '', password: '' };
  
      if (!email) {
          errors.email = 'Email is required';
          valid = false;
      } else if (!validateEmail(email)) {
          errors.email = 'Email is not valid';
          valid = false;
      }
  
      if (!password) {
          errors.password = 'Password is required';
          valid = false;
      }
  
      setErrors(errors);
  
      const formData = new URLSearchParams();
      formData.append('username', email); // Assuming 'email' is used as 'username'
      formData.append('password', password);
  
      if (valid) {
        dispatch(
            logIn(formData)
        );
      } else {
          toast.error('Please correct the errors in the form.');
      }
  };

    return (
        <>
            {authStatus === "loading" ? (
                <Loader />
            ) : (
                <Box
                    component="form"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        width: "clamp(20rem, 75%, 30rem)",
                        borderRadius: '1rem',
                        height:"clamp(25.5rem,45vh,35.5rem)",
                        justifyContent:'space-evenly',
                        backgroundColor: "whitesmoke",
                        boxShadow: "rgba(145, 158, 171, 0.2) 0px 0px 2px 0px, rgba(145, 158, 171, 0.12) 0px 12px 24px -4px",
                        zIndex: 0,
                        padding:"2rem",
                        transition: "box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    noValidate
                    autoComplete="off"
                    onSubmit={handleSubmit}
                
                >
                    <h2 style={{ color: "#333", textAlign: "left", fontSize: "2.15rem" }}>Login</h2>
                    <TextField
                        required
                        id="email"
                        label="Email"
                        type="email"
                        variant="outlined"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={!!errors.email}
                        helperText={errors.email}
                        fullWidth
                        InputProps={{
                            style: {
                              paddingInline:"1rem",
                              borderRadius:"0.75rem",
                              paddingBlock:"0.3rem",
                              height:"3.5rem",
                            
                              marginBottom:"1.25rem"
                            },
                          }}
                        
                        
                    />
                    <TextField
                        required
                        id="password"
                        label="Password"
                        type="password"
                        variant="outlined"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        error={!!errors.password}
                        helperText={errors.password}
                        fullWidth
                        InputProps={{
                            style: {
                              paddingInline:"1rem",
                              borderRadius:"0.75rem",
                              paddingBlock:"0.3rem",
                             
                              
                            },
                          }}
                         
                          
                      
                    />
                    <Button variant="contained" color="primary" type="submit" sx={{
                        backgroundColor: "#1C252E",
                        marginTop:"2.25rem",
                        fontSize: "0.875rem",
                        paddingInline:"1rem",
                        borderRadius:"0.75rem",
                        paddingBlock:"0.3rem",
                        transition:"0.5s ease",
                        height:"3.5rem",
                        '&:active': {
                            color:"#333",
                            backgroundColor: "transparent", // Change the background color on hover
                            outlineColor:"#333",
                            outlineWidth:"0.1rem",
                            outlineStyle:"solid",
                            transition:"0.5s ease" // Add a shadow on hover
                          },
                    }} fullWidth>
                        Login
                    </Button>
                </Box>
            )}
        </>
    );
};

export default LoginForm;