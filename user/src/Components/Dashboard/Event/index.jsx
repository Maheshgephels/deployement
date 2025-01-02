import React, { Fragment, useEffect } from "react";
import { Container, Row } from "reactstrap";
import CustomBreadcrumbs from "../../../CommonElements/Breadcrumbs/CustomBreadcrumbs";
import { ToastContainer, toast } from 'react-toastify';

import EventGreetingCard from "./EventGreetingCard";
import EventWidgetsWrapper from "./EventWidgetsWrapper";
import ActiveUsersGraph from "../../EventAdmin/ActiveUsersGraph";


const EventDashboard = () => {


  return (
    <Fragment>
        <ToastContainer />
      <CustomBreadcrumbs mainTitle="Dashboard" />
      <Container fluid={true}>
        <Row className="widget-grid">
          <EventGreetingCard />
          <EventWidgetsWrapper />
          <ActiveUsersGraph />
        </Row>
      </Container>
    </Fragment>
  );
};

export default EventDashboard;
