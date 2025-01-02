import React, { Fragment, useEffect } from "react";
import { Container, Row } from "reactstrap";
import { Breadcrumbs } from "../../../AbstractElements";
import CustomBreadcrumbs from "../../../CommonElements/Breadcrumbs/CustomBreadcrumbs";
import { ToastContainer, toast } from 'react-toastify';

// import OverallBalance from "./OverallBalance";
import GreetingCard from "./GreetingCard";
import WidgetsWrapper from "./WidgetsWraper";
import RecentSpot from "../../Admin/recent-spot";
import BarWidgets from '../../Dashboard/Default/BarWidgets';
import BarCategoryWidgets from '../../Dashboard/Default/BarCategoryWidgets';
import PieChartWidget from '../../Dashboard/Default/PieChartWidget';
import BarScanWidgets from "./BarScanWidgets";
import MobileAppCard from "../Social/MobileAppCard";
// import UserListing from "../../Admin/user-listing";
// import RecentOrders from "./RecentOrders";
// import ActivityCard from "./ActivityCard";
// import RecentSales from "./RecentSales";
// import TimelineCard from "./TimelineCard";
// import PreAccountCard from "./PreAccountCard";
// import TotalUserAndFollower from "./TotalUserAndFollower";
// import PaperNote from "./PaperNote";erfer
const Dashboard = () => {



  return (
    <Fragment>
        <ToastContainer />
      <CustomBreadcrumbs mainTitle="Dashboard" />
      <Container fluid={true}>
        <Row className="widget-grid">
          <GreetingCard />
          {/* <MobileAppCard /> */}
          <WidgetsWrapper />
          <RecentSpot />
          <BarWidgets />
          <BarScanWidgets />
          <BarCategoryWidgets />
          <PieChartWidget />
          {/* <UserListing /> */}
          {/* <OverallBalance />
          <RecentOrders />
          <ActivityCard />
          <RecentSales />
          <TimelineCard />
          <PreAccountCard />
          <TotalUserAndFollower />
          <PaperNote /> */}
        </Row>
      </Container>
    </Fragment>
  );
};

export default Dashboard;
