import { useNavigate } from "react-router-dom";
import React, { Fragment, useState, useEffect, useContext, useRef } from "react";
import { Card, Col, Container, Form, FormGroup, Input, Label, Row, Button } from "reactstrap";
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { Btn, H4, P } from "../AbstractElements";
import { EmailAddress, ForgotPassword, Password, RememberPassword, SignIn } from "../Constant";
import { BackendAPI } from "../api";
import man from "../assets/images/dashboard/profile.jpg";
import CustomizerContext from "../_helper/Customizer";
import OtherWay from "./OtherWay";
import { ToastContainer, toast } from "react-toastify";
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import logo from "../assets/images/logo/logo-icon.png";
import { PermissionsContext } from "../contexts/PermissionsContext";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import eye icons
import styles from './Signin.module.css'; // Import CSS module
import useDashboard from './userdashboardAuth'

const validatePassword = (value) => {
  if (!value) return 'Password is required';

  // const lengthCriteria = /.{8,}/;
  // const uppercaseCriteria = /[A-Z]/;
  // const lowercaseCriteria = /[a-z]/;
  // const digitCriteria = /[0-9]/;
  // const specialCharacterCriteria = /[!@#$%^&*(),.?":{}|<>]/;

  // if (!lengthCriteria.test(value)) return 'Password must be at least 8 characters long';
  // if (!uppercaseCriteria.test(value)) return 'Password must include at least one uppercase letter';
  // if (!lowercaseCriteria.test(value)) return 'Password must include at least one lowercase letter';
  // if (!digitCriteria.test(value)) return 'Password must include at least one digit';
  // if (!specialCharacterCriteria.test(value)) return 'Password must include at least one special character';

  return undefined;
};

const validateUsername = (value) => {
  if (!value) return 'Username is required';
  // if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(value)) return 'Username can only contain alphanumeric characters, hyphen, and underscore, and must not start with a number';

  return undefined;
};

const UserSignin = ({ selected }) => {
  // useDashboard();
  const navigate = useNavigate();
  const passwordRef = useRef(null);
  const { updatePermissions } = useContext(PermissionsContext);
  const { layoutURL } = useContext(CustomizerContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [serverUsernameError, setServerUsernameError] = useState("");
  const [serverPasswordError, setServerPasswordError] = useState("");
  const [forgotPasswordModal, setForgotPasswordModal] = useState(false);
const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState('');

const toggleForgotPasswordModal = () => {
  setForgotPasswordModal(!forgotPasswordModal);
};

const handleForgotPasswordEmailChange = (e) => {
  setForgotPasswordEmail(e.target.value);
};

const handleForgotPasswordSubmit = async() => {
  // Handle forgot password submission (e.g., call API to send password reset email)
  console.log("Forgot password email:", forgotPasswordEmail);
  try {
    const response = await axios.post(`${BackendAPI}/auth/sendloginmail`, { forgotPasswordEmail }, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data.exists) {
      setMessage("We've sent an email to your registered email ID. Please check your inbox.");
    } else {
      setMessage("Your email is not in our records.");
    }

    setForgotPasswordEmail(' ');
  }catch (error) {
    setMessage("Your email is not in our records.");
    setForgotPasswordEmail(' ');
  }
  // Close the modal
  
  toggleForgotPasswordModal();
  setMessage(' ');
};

  useEffect(() => {
    if (localStorage.getItem('UsersessionExpired') === 'true') {
      toast.error('Session expired. Please log in again.');
      localStorage.removeItem('UsersessionExpired');
      
    }
    console.log("URL",process.env.PUBLIC_URL);
  }, []);

  const handleNavigation = () => {
    navigate(`${process.env.PUBLIC_URL}/usersignup`);
};

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    setUsernameError(validateUsername(value));
    setServerUsernameError(''); // Clear server error when user types
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(validatePassword(value));
    setServerPasswordError(''); // Clear server error when user types
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const loginAuth = async (e) => {
    e.preventDefault();

    const usernameErr = validateUsername(username);
    const passwordErr = validatePassword(password);

    setUsernameError(usernameErr);
    setPasswordError(passwordErr);

    if (usernameErr || passwordErr) return;

    try {
      const response = await axios.post(`${BackendAPI}/auth/userlogin`, { username, password }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 200) {
        const data = response.data;

        localStorage.setItem('Usertoken', data.token);
        localStorage.setItem('Userusername', data.username);
        localStorage.setItem('UserId', data.id);
        const decodedToken = jwtDecode(data.token);
        localStorage.setItem('Userauthenticated', true);
        localStorage.setItem("Userlogin", true);
        updatePermissions(data.permissions);
        localStorage.setItem("Username", decodedToken.role);
        localStorage.setItem("UserprofileURL", logo);
        localStorage.setItem("UserprofileURL", man);
        localStorage.setItem("Userusername", username);
        localStorage.setItem("Userpermissions", JSON.stringify(data.permissions));
        localStorage.setItem("UserloginSuccess", "true");
        navigate(`${process.env.PUBLIC_URL}/user-dashboard/Consoft`);
      } else {
        throw new Error('Failed to authenticate');
      }
    } catch (error) {
      console.error('Login error:', error.message);
      if (error.response && error.response.data && error.response.data.message) {
        const errorMessage = error.response.data.message;

        if (errorMessage.includes('Invalid username')) {
          setServerUsernameError("Incorrect username");
        } else if (errorMessage.includes('Invalid password')) {
          setServerPasswordError("Incorrect password");
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error('Failed to authenticate. Please try again.');
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (e.target.name === 'username') {
        passwordRef.current.focus();
      } else if (e.target.name === 'password') {
        loginAuth(e);
      }
    }
  };

  //  useEffect(() => {
  //   const fetchSettings = async () => {
  //     try {
  //       setLoading(true);

  //       const response = await axios.get(`${BackendAPI}/auth/getsettings`, {});

  //       const fetchedSettings = response.data.settings;

  //       if (!fetchedSettings || fetchedSettings === "No") {
  //         // Redirect to 404 if settings are invalid or "no"
  //         navigate("/404");
  //       } else {
  //         // Update state with valid settings
  //         setSettings(fetchedSettings);
  //       }

  //       setLoading(false);
  //     } catch (error) {
  //       console.error("Error fetching settings:", error);
  //       toast.error("Failed to load settings data");
  //       setLoading(false);
  //     }
  //   };

  //   fetchSettings();
  // }, [navigate]);

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
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings data");
        setLoading(false);
      }
    };
  return (
    <Fragment>
      <Container fluid={true} className="p-0 login-page">
        <Row>
          <Col xs="12">
            <div className="login-card">
              <Card>
                <div className="login-main login-tab">
                  <div className="text-center">
                    <img src={logo} alt="Logo" className="" />
                  </div>
                  <Form className="theme-form" onKeyDown={handleKeyDown}>
                    <H4 style={{ color: '#15496b' }} >{selected === "simpleLogin" ? "" : "Log In  "}</H4>
                    <P style={{ color: '#15496b' }}>{"Enter your Username & Password to login"}</P>
                    <FormGroup>
                      <Label className="col-form-label">Username</Label>
                      <Input
                        className={`form-control ${usernameError || serverUsernameError ? styles.inputError : ''}`}
                        type="text"
                        name="username"
                        onChange={handleUsernameChange}
                        value={username}
                      />
                      {usernameError && <div className={styles.errorMessage}>{usernameError}</div>}
                      {serverUsernameError && <div className={styles.errorMessage}>{serverUsernameError}</div>}
                    </FormGroup>
                    <FormGroup className="position-relative">
                      <Label className="col-form-label">Password</Label>
                      <div className="position-relative">
                        <Input
                          innerRef={passwordRef}
                          className={`form-control ${passwordError || serverPasswordError ? styles.inputError : ''}`}
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          onChange={handlePasswordChange}
                          value={password}
                        />
                        {passwordError && <div className={styles.errorMessage}>{passwordError}</div>}
                        {serverPasswordError && <div className={styles.errorMessage}>{serverPasswordError}</div>}
                        <span
                          className="position-absolute"
                          style={{ top: '24%', right: '10px', cursor: 'pointer' }}
                          onClick={togglePasswordVisibility}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                      </div>
                    </FormGroup>

                    <div className="position-relative form-group mb-0">
                  <Button 
                    color="link" 
                    className="float-right p-0 mt-2" 
                    onClick={toggleForgotPasswordModal}
                  >
                    Forgot Password?
                  </Button>
                </div>
                    <div className="position-relative form-group mb-0">
                      <Button color="primary" className="d-block w-100 mt-4" onClick={loginAuth}>Log In</Button>
                    </div>
                  </Form>

                  <div className="text-center mt-4">
                    <P>Don't have an account?  <a
                    onClick={handleNavigation} 
                    className={styles.signupLink}
                    style={{ color: 'blue', cursor: 'pointer' }}
                >Sign Up</a></P>
                  </div>
                </div>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>
      <Modal isOpen={forgotPasswordModal} toggle={toggleForgotPasswordModal}>
      <ModalHeader toggle={toggleForgotPasswordModal}>Forgot Password</ModalHeader>
      <ModalBody>
        <Form>
          <FormGroup>
            <Label for="email">Enter your Email ID</Label>
            <Input
              type="email"
              name="email"
              id="email"
              placeholder="Enter your email"
              value={forgotPasswordEmail}
              onChange={handleForgotPasswordEmailChange}
            />
          </FormGroup>
          <Button color="primary" onClick={handleForgotPasswordSubmit}>Submit</Button>
        </Form>
        {message && <p style={{ marginTop: '1rem', color: message.includes('not') ? 'red' : 'green' }}>{message}</p>}
      </ModalBody>
    </Modal>
      <ToastContainer />
    </Fragment>
  );
};

export default UserSignin;