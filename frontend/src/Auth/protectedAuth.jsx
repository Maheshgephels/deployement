import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from 'react-toastify';

const useAuth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('login') === 'true';
      const token = localStorage.getItem('token');

      // console.log('isLoggedIn:', isLoggedIn);
      // console.log('token:', token);

      if (!isLoggedIn) {
        // console.log('User is not authenticated, clearing localStorage and navigating to login');

        // Clear specific items from localStorage
        clearLocalStorage();

        // Show toast message
        toast.error('Please log in to continue');

        // Navigate to login page
        navigate(`${process.env.PUBLIC_URL}/login`);
      } else {
        // console.log('User is authenticated');

        // Check token expiration
        if (token) {
          try {
            const decodedToken = jwtDecode(token);
            // console.log('Decoded token:', decodedToken);

            const currentTime = Date.now() / 1000; // Convert to seconds
            // console.log('Current time:', currentTime);

            if (decodedToken.exp < currentTime) {
              // console.log('Token has expired, navigating to login page');

              // Clear specific items from localStorage
              clearLocalStorage();
              localStorage.setItem('sessionExpired', 'true');
              // Show toast message
              toast.error('Session expired. Please log in again');

              // Navigate to login page
              navigate(`${process.env.PUBLIC_URL}/login`);
            }
          } catch (error) {
            // console.error('Error decoding token:', error);
            // Clear localStorage and navigate to login page if decoding fails
            clearLocalStorage();
            navigate(`${process.env.PUBLIC_URL}/login`);
          }
        }
      }
    };

    checkAuth();

    const intervalId = setInterval(checkAuth, 60000); // Check every 60 seconds

    return () => clearInterval(intervalId); // Clear the interval when the component unmounts
  }, [navigate]);

  return <ToastContainer />;
};

export default useAuth;

const clearLocalStorage = () => {
  localStorage.removeItem('profileURL');
  localStorage.removeItem('token');
  localStorage.removeItem('auth0_profile');
  localStorage.removeItem('Name');
  localStorage.removeItem('permissions');
  localStorage.setItem('authenticated', 'false');
  localStorage.setItem('login', 'false');
};
