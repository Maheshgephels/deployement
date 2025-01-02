import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { jwtDecode } from "jwt-decode";
import { BackendAPI } from "../api";

const useDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get the current location

  // State variables for settings and loading
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);



  // Fetch settings logic
  useEffect(() => {
    fetchSettings();
  }, []);
  
    const fetchSettings = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get(`${BackendAPI}/auth/getsettings`, {});
        const fetchedSettings = response.data.settings;
        
        if (!fetchedSettings || fetchedSettings === "No") {
          // Redirect to 404 if settings are invalid or "no"
          navigate(`${process.env.PUBLIC_URL}/404`);
        } else {
          // Update state with valid settings
          navigate(`${process.env.PUBLIC_URL}/userlogin`);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings data");
        setLoading(false);
      }
    };

 

  return (
    <>
      <ToastContainer />
    </>
  );
};

export default useDashboard;
