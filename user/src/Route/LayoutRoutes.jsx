import React, { Fragment, useEffect, useState } from 'react';
import { Route, Routes ,Navigate} from 'react-router-dom';
import { routes } from './Routes';
import AppLayout from '../Layout/Layout';
import PrivateRoute from "./PrivateRoute";


const LayoutRoutes = () => {

  return (
    <>
      <Routes>
        {routes.map(({ path, Component }, i) => (
          <Fragment key={i}>
          <Route element={<AppLayout />} key={i}>
            <Route path={path} element={Component} />
          </Route>
          </Fragment>
        ))}
      </Routes>
    </>
  );
};


  export default LayoutRoutes;