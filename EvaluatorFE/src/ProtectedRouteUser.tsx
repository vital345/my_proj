import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Loader from "./components/Loader";

export const ProtectedRouteUser = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.search).get("token");

  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (!token) {
      // Redirect to home if no token is present
      navigate("/");
      return;
    }

    const checkToken = async () => {
      try {
        // Simulate an API call to validate the token
        /*const response = await fetch(`/fvfvdf/?token=${token}`);
        const result = await response.json();
        
        if (result) {
          setIsValid(true);
        } else {
          navigate("/");
        }*/
       setTimeout(()=>{
        if(token=="hi"){
            setIsValid(true);
           }
           else{
            navigate("/");
           }
       },2000)
      
      } catch (error) {
        console.error("Error validating token:", error);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, [token, navigate]);

  if (isLoading) {
    return <div>Loading...</div>; // Show a loading indicator while validating
  }

  return isValid ? <Outlet /> : <div style={{width:"100%",height:"70vh",display:"flex",justifyContent:"center",alignItems:"center"}}><Loader/></div>; // Render Outlet if valid, otherwise render nothing
};
