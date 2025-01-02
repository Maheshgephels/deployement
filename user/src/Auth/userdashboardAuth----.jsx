import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import { BackendAPI } from "../api";

const UserDashboard = () => {
  const navigate = useNavigate();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);

        const response = await axios.get(`${BackendAPI}/auth/getsettings`, {});

        const fetchedSettings = response.data.settings;

        if (!fetchedSettings || fetchedSettings === "No") {
          // Redirect to 404 if settings are invalid or "no"
          navigate("/404");
        } else {
          // Update state with valid settings
          setSettings(fetchedSettings);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings data");
        setLoading(false);
      }
    };

    fetchSettings();
  }, [navigate]);

  return (
    <div>
      {loading ? <p>Loading...</p> : <p>Settings Value: {settings}</p>}
      <ToastContainer />
    </div>
  );
};

export default UserDashboard;
