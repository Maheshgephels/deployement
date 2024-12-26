import { useNavigate } from "react-router-dom";
import React, { Fragment, useState, useEffect, useContext } from "react";
import { Col, Container, Form, FormGroup, Input, Label, Row } from "reactstrap";
import { Btn, H4, P } from "../AbstractElements";
import { EmailAddress, ForgotPassword, Password, RememberPassword, SignIn } from "../Constant";
import { BackendAPI } from "../api";


import man from "../assets/images/dashboard/profile.jpg";

import CustomizerContext from "../_helper/Customizer";
import OtherWay from "./OtherWay";
import { ToastContainer, toast } from "react-toastify";
import axios from 'axios';
import { jwtDecode } from "jwt-decode";

// import logo from '../assets/images/consoft-512x512.png';
// import logo;
import styles from './Signin.module.css'; // Import CSS module

const Signin = ({ selected }) => {

  const history = useNavigate();

  useEffect(() => {
    const isAuthenticated = JSON.parse(localStorage.getItem("authenticated"));
    const islogin= JSON.parse(localStorage.getItem("login"));
    if (isAuthenticated || islogin) {
      // Redirect the user to the dashboard or another authenticated page
      history(`${process.env.PUBLIC_URL}/dashboard/default/${layoutURL}`);
    }
  }, []);
  
  

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [togglePassword, setTogglePassword] = useState(false);

  const { layoutURL } = useContext(CustomizerContext);

  const [value, setValue] = useState(localStorage.getItem("profileURL" || man));
  const [name, setName] = useState(localStorage.getItem("Name"));
  const [login, setLogin] = useState(JSON.parse(localStorage.getItem("login")));

  useEffect(() => {
    if (value) {
      localStorage.setItem("profileURL", value);
    }
    if (name) {
      localStorage.setItem("Name", name);
    }

  }, [value, name]);


  useEffect(() => {
    // Debug function to print local storage data when component mounts
    const debugLocalStorage = () => {
      console.log("Local Storage Data:");
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        console.log(`${key}: ${value}`);
      }
    };

    debugLocalStorage(); 
  }, []);

  const loginAuth = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${BackendAPI}/auth/login`, {
        username,
        password
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      // console.log(response.data) ;
      // Check if response status is in the range of 200 to 299 (indicating success)
      if (response.status === 200) {
        const data = response.data;

        localStorage.setItem('token', data.token);
        const decodedToken = jwtDecode(data.token);
        localStorage.setItem('authenticated', true);
        localStorage.setItem("login", true); 
        // setLogin(true);
        localStorage.setItem("name", decodedToken.role);
        localStorage.setItem("profileURL", man);
        // localStorage.setItem("Name", "Emay Walter");
        history(`${process.env.PUBLIC_URL}/dashboard/default/${layoutURL}`);
        toast.success('Successfully logged in!..');
      } else {
        throw new Error('Failed to authenticate');
      }
    } catch (error) {
      console.error('Login error:', error.message);
      if (error.response && error.response.data && error.response.data.message) {
        // If the error message is available in the response data, show it to the user
        toast.error(error.response.data.message);
      } else {
        // Otherwise, show a generic error message
        toast.error('Failed to authenticate. Please try again.');
      }
    }
  };


  return (
    <Fragment>
      <Container fluid={true} className="p-0 login-page">
        <Row>
          <Col xs="12">
            <div className="login-card">
              <div className="login-main login-tab">
                {/* <div className={styles["logo-container"]}>
                  <img src={logo} alt="Logo" className={styles.logo} />
                </div> */}

                <Form className="theme-form">
                  <H4>{selected === "simpleLogin" ? "" : "Login In  "}</H4>
                  <P>{"Enter your username & password to login"}</P>
                  <FormGroup>
                    <Label className="col-form-label">Username</Label>
                    <Input className="form-control" type="text" onChange={(e) => setUsername(e.target.value)} value={username} />
                  </FormGroup>
                  <FormGroup className="position-relative">
                    <Label className="col-form-label">{Password}</Label>
                    <div className="position-relative">
                      <Input className="form-control" type={togglePassword ? "text" : "password"} onChange={(e) => setPassword(e.target.value)} value={password} />
                      <div className="show-hide" onClick={() => setTogglePassword(!togglePassword)}>
                        <span className={togglePassword ? "" : "show"}></span>
                      </div>
                    </div>
                  </FormGroup>
                  <div className="position-relative form-group mb-0">
                    <div className="checkbox">
                      <Input id="checkbox1" type="checkbox" />
                      <Label className="text-muted" for="checkbox1">
                        {RememberPassword}
                      </Label>
                    </div>
                    {/* <a className="link" href="#javascript">
                      {ForgotPassword}
                    </a> */}
                    <Btn attrBtn={{ color: "primary", className: "d-block w-100 mt-2", onClick: (e) => loginAuth(e) }}>Login In</Btn>
                  </div>
                  {/* <OtherWay /> */}
                </Form>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
      <ToastContainer />
    </Fragment>
  );
};


export default Signin;
