import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from 'react-toastify';

const useAuth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('Userlogin') === 'true';
      const token = localStorage.getItem('Usertoken');

      // console.log('isLoggedIn:', isLoggedIn);
      // console.log('token:', token);

      if (!isLoggedIn) {
        // console.log('User is not authenticated, clearing localStorage and navigating to login');

        // Clear specific items from localStorage
        clearLocalStorage();

        // Show toast message
        toast.error('Please log in to continue');

        // Navigate to login page
        navigate(`${process.env.PUBLIC_URL}/userlogin`);
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
              localStorage.setItem('UsersessionExpired', 'true');
              // Show toast message
              toast.error('Session expired. Please log in again');

              // Navigate to login page
              navigate(`${process.env.PUBLIC_URL}/userlogin`);
            }
          } catch (error) {
            // console.error('Error decoding token:', error);
            // Clear localStorage and navigate to login page if decoding fails
            clearLocalStorage();
            navigate(`${process.env.PUBLIC_URL}/userlogin`);
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
  localStorage.removeItem('UserprofileURL');
  localStorage.removeItem('Usertoken');
  localStorage.removeItem('Userauth0_profile');
  localStorage.removeItem('UserName');
  localStorage.removeItem('Userpermissions');
  localStorage.setItem('Userauthenticated', 'false');
  localStorage.setItem('Userlogin', 'false');
};
