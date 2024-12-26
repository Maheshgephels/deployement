import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const [login, setLogin] = useState(JSON.parse(localStorage.getItem("login")));
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(JSON.parse(localStorage.getItem("authenticated")));
  }, []);

  return login || authenticated ? (children ? children : <Outlet />) : <Navigate to={`${process.env.PUBLIC_URL}/login`} />;
};

export default PrivateRoute;
