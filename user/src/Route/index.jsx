import React from "react";
import { Suspense, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Loader from "../Layout/Loader";
import { authRoutes } from "./AuthRoutes";
import LayoutRoutes from "../Route/LayoutRoutes";
import UserSignin from "../Auth/UserSignin";
import PrivateRoute from "./PrivateRoute";
import { classes } from "../Data/Layouts";

// setup fake backend

const Routers = () => {
  const login = useState(JSON.parse(localStorage.getItem("Userlogin")))[0];
  const [authenticated, setAuthenticated] = useState(false);
  const defaultLayoutObj = classes.find((item) => Object.values(item).pop(1) === "compact-wrapper");
  const layout = localStorage.getItem("Userlayout") || Object.keys(defaultLayoutObj).pop();

  useEffect(() => {
    let abortController = new AbortController();
    setAuthenticated(JSON.parse(localStorage.getItem("Userauthenticated")));
    console.ignoredYellowBox = ["Warning: Each", "Warning: Failed"];
    console.disableYellowBox = true;
    return () => {
      abortController.abort();
    };
  }, []);

  return (
    <BrowserRouter basename={"/"}>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path={"/"} element={<PrivateRoute />}>
            {login || authenticated ? (
              <>
                <Route exact path={`${process.env.PUBLIC_URL}`} element={<Navigate to={`${process.env.PUBLIC_URL}/user-dashboard/${layout}`} />} />
                <Route exact path={`/`} element={<Navigate to={`${process.env.PUBLIC_URL}/user-dashboard/${layout}`} />} />
              </>
            ) : (
              ""
            )}
            <Route path={`/*`} element={<LayoutRoutes />} />
          </Route>

          <Route exact path={`${process.env.PUBLIC_URL}/userlogin`} element={<UserSignin />} />
          {authRoutes.map(({ path, Component }, i) => (
            <Route path={path} element={Component} key={i} />
          ))}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default Routers;
