import React, { useState, useEffect } from 'react';
import { Card, CardBody, Col, Row } from 'reactstrap';
import { H4 } from '../../../AbstractElements';
import { useNavigate } from 'react-router-dom';
import SvgIcon from '../../Common/Component/SvgIcon';
import SquareGroupUi from '../../Dashboard/OnlineCourse/SquareGroupUi';
import CustomBreadcrumbs from '../../../CommonElements/Breadcrumbs/CustomBreadcrumbs';
import TransparentBreadcrumbs from '../../../CommonElements/Breadcrumbs/TransparentBreadcrumb';
import WidgetWithRegList from '../../Common/CommonWidgets/WidgetWithRegList';
import LoggedInUsers from '../../EventAdmin/LoggedInUsers';
import LatestRegUsers from '../../Registration/LatestRegUsers';
import UserRegistrationGraph from '../../EventAdmin/UserRegistrationGraph';
import axios from 'axios';
import { getToken } from '../../../Auth/Auth';
import { BackendAPI } from '../../../api';
import TicketCount from './TicketCount';
import styled from 'styled-components';


const EventWidgetsWrapper = () => {
  const [basicuserCount, setBasicUserCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [compCount, setCompCount] = useState(0);
  const [cancelCount, setCancelCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [tempCount, setTempCount] = useState(0);
  const [discardedCount, setDiscardedCount] = useState(0);
  const [loginuserCount, setLoginUserCount] = useState(0);
  const [totalFacultyCount, setTotalFacultyCount] = useState(0);
  const [activeFacultyCount, setActiveFacultyCount] = useState(0);
  const [inactiveFacultyCount, setInactiveFacultyCount] = useState(0);
  const [selectedWidgets, setSelectedWidgets] = useState([]);
  const [show, setShow] = useState('');
  const [apiData, setApiData] = useState([]);
  const navigate = useNavigate();


  console.log("WIDGET:", apiData);

  useEffect(() => {
    fetchCounts();
    fetchData();
    fetchSettings();
  }, []);


  const fetchSettings = async () => {
    try {

      const response = await axios.get(`${BackendAPI}/auth/getsettings`, {});
      const fetchedSettings = response.data.settings;

      console.log("Fetch Setting", fetchedSettings);
      setShow(fetchedSettings);


    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchData = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${BackendAPI}/widgets/regWidgetData`, {
        headers: {
          Authorization: `Bearer ${token}` // Include the token in the Authorization header
        }
      });
      setApiData(response.data);
      setSelectedWidgets(response.data); // Set selected widgets by default
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchCounts = async () => {
    try {
      const token = getToken();

      // Fetch user count
      const responseUser = await axios.get(`${BackendAPI}/regWidgets/userCount`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setBasicUserCount(responseUser.data.BasicuserCount);
      setUserCount(responseUser.data.userCount);
      setLoginUserCount(responseUser.data.userloggedinCount);
      setCompCount(responseUser.data.compCount);
      setCancelCount(responseUser.data.cancelledCount);
      setInactiveCount(responseUser.data.inactiveCount);
      setDiscardedCount(responseUser.data.discCount);
      setTempCount(responseUser.data.tempCount);

      // Fetch faculty counts
      const responseFaculty = await axios.get(`${BackendAPI}/regWidgets/facultyCount`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTotalFacultyCount(responseFaculty.data.totalFacultyCount);
      setActiveFacultyCount(responseFaculty.data.activeFacultyCount);
      setInactiveFacultyCount(responseFaculty.data.inactiveFacultyCount);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const handleViewDetails = (sortBy) => {
    navigate(`${process.env.PUBLIC_URL}/registration/manage-faculty/Consoft`, { state: { sortBy, Title: "Total Faculty" } });
  };

  const handleUserViewDetails = (complimentary = '', cancel = '', inactive = '') => {
    navigate(`${process.env.PUBLIC_URL}/registration/confirm-user-listing/Consoft`, { state: { complimentary, cancel, inactive, Title: "Total Users" } });
  };

  const handleloggedinViewDetails = () => {
    navigate(`${process.env.PUBLIC_URL}/event/loggedin-user/Consoft`);
  };

  const handleTotalUser = () => {
    navigate(`${process.env.PUBLIC_URL}/registration/confirm-user-listing/Consoft`);
  };

  const handleBasicUser = () => {
    navigate(`${process.env.PUBLIC_URL}/registration/basic-user-listing/Consoft`);
  };

  const handleTempViewDetails = () => {
    navigate(`${process.env.PUBLIC_URL}/registration/temp-user-listing/Consoft`);
  };

  const handleDiscardedViewDetails = () => {
    navigate(`${process.env.PUBLIC_URL}/registration/discarded-temp-user-listing/Consoft`);
  };

  return (
    <>
      <TransparentBreadcrumbs mainTitle="Category Counts" />
      <Row>
        {/*Basic User Count Card */}
        {show === 'Yes' && (
          <Col xxl='auto' xl='4' sm='6' className='box-col-6'>
            <Row>
              <Col xl='12'>
                <Card className="course-box card">
                  <CardBody>
                    <div className='course-widget'>
                      <div className='course-icon secondary'>
                        <SvgIcon className='fill-icon' iconId='course-1' />
                      </div>
                      <div>
                        <H4 attrH4={{ className: 'mb-0' }}>{basicuserCount || '0'}</H4>
                        <span className='f-light'>Total Basic Users</span>
                        <a
                          type='button'
                          className='btn btn-light f-light d-flex justify-content-center'
                          onClick={() => handleBasicUser('user')}
                        >
                          View details
                          <span className='ms-2'>
                            <SvgIcon className='fill-icon f-light' iconId='arrowright' />
                          </span>
                        </a>
                      </div>
                    </div>
                  </CardBody>
                  <SquareGroupUi />
                </Card>
              </Col>
            </Row>
          </Col>
        )}
        {/* User Count Card */}
        <Col xxl='auto' xl='4' sm='6' className='box-col-6'>
          <Row>
            <Col xl='12'>
              <Card className="course-box card">
                <CardBody>
                  <div className='course-widget'>
                    <div className='course-icon secondary'>
                      <SvgIcon className='fill-icon' iconId='course-1' />
                    </div>
                    <div>
                      <H4 attrH4={{ className: 'mb-0' }}>{userCount || '0'}</H4>
                      <span className='f-light'>Total Confirm Users</span>
                      <a
                        type='button'
                        className='btn btn-light f-light d-flex justify-content-center'
                        onClick={() => handleTotalUser('user')}
                      >
                        View details
                        <span className='ms-2'>
                          <SvgIcon className='fill-icon f-light' iconId='arrowright' />
                        </span>
                      </a>
                    </div>
                  </div>
                </CardBody>
                <SquareGroupUi />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Total Faculty Count Card */}
        {/* <Col xxl='auto' xl='4' sm='6' className='box-col-6'>
          <Row>
            <Col xl='12'>
              <Card className="course-box card">
                <CardBody>
                  <div className='course-widget'>
                    <div className='course-icon secondary'>
                      <SvgIcon className='fill-icon' iconId='course-1' />
                    </div>
                    <div>
                      <H4 attrH4={{ className: 'mb-0' }}>{totalFacultyCount || '0'}</H4>
                      <span className='f-light'>Total Faculty</span>
                      <a
                        type='button'
                        className='btn btn-light f-light d-flex justify-content-center'
                        onClick={() => handleViewDetails('total')}
                      >
                        View details
                        <span className='ms-2'>
                          <SvgIcon className='fill-icon f-light' iconId='arrowright' />
                        </span>
                      </a>
                    </div>
                  </div>
                </CardBody>
                <SquareGroupUi />
              </Card>
            </Col>
          </Row>
        </Col> */}

        {/* Active Faculty Count Card */}
        {/* <Col xxl='auto' xl='4' sm='6' className='box-col-6'>
          <Row>
            <Col xl='12'>
              <Card className="course-box card">
                <CardBody>
                  <div className='course-widget'>
                    <div className='course-icon secondary'>
                      <SvgIcon className='fill-icon' iconId='course-1' />
                    </div>
                    <div>
                      <H4 attrH4={{ className: 'mb-0' }}>{activeFacultyCount || '0'}</H4>
                      <span className='f-light'>Active Faculty</span>
                      <a
                        type='button'
                        className='btn btn-light f-light d-flex justify-content-center'
                        onClick={() => handleViewDetails('active')}
                      >
                        View details
                        <span className='ms-2'>
                          <SvgIcon className='fill-icon f-light' iconId='arrowright' />
                        </span>
                      </a>
                    </div>
                  </div>
                </CardBody>
                <SquareGroupUi />
              </Card>
            </Col>
          </Row>
        </Col> */}

        {/* Inactive Faculty Count Card */}
        {/* <Col xxl='auto' xl='4' sm='6' className='box-col-6'>
          <Row>
            <Col xl='12'>
              <Card className="course-box card">
                <CardBody>
                  <div className='course-widget'>
                    <div className='course-icon secondary'>
                      <SvgIcon className='fill-icon' iconId='course-1' />
                    </div>
                    <div>
                      <H4 attrH4={{ className: 'mb-0' }}>{inactiveFacultyCount || '0'}</H4>
                      <span className='f-light'>Inactive Faculty</span>
                      <a
                        type='button'
                        className='btn btn-light f-light d-flex justify-content-center'
                        onClick={() => handleViewDetails('inactive')}
                      >
                        View details
                        <span className='ms-2'>
                          <SvgIcon className='fill-icon f-light' iconId='arrowright' />
                        </span>
                      </a>
                    </div>
                  </div>
                </CardBody>
                <SquareGroupUi />

              </Card>
            </Col>
          </Row>
        </Col> */}

        {show === 'Yes' && (
          <Col xxl='auto' xl='4' sm='6' className='box-col-6'>
            <Row>
              <Col xl='12'>
                <Card className="course-box card">
                  <CardBody>
                    <div className='course-widget'>
                      <div className='course-icon secondary'>
                        <SvgIcon className='fill-icon' iconId='course-1' />
                      </div>
                      <div>
                        <H4 attrH4={{ className: 'mb-0' }}>{loginuserCount || '0'}</H4>
                        <span className='f-light'>LoggedIn User</span>
                        <a
                          type='button'
                          className='btn btn-light f-light d-flex justify-content-center'
                          onClick={() => handleloggedinViewDetails('inactive')}
                        >
                          View details
                          <span className='ms-2'>
                            <SvgIcon className='fill-icon f-light' iconId='arrowright' />
                          </span>
                        </a>
                      </div>
                    </div>
                  </CardBody>
                  <SquareGroupUi />

                </Card>
              </Col>
            </Row>
          </Col>
        )}
        {/* <Row> */}
        {selectedWidgets.map((widgetData, index) => (
          <Col key={index} xxl='auto' xl='4' sm='6' className='box-col-6'>
            <Row>
              <Col xl='12'>
                <WidgetWithRegList data={widgetData} />  {/* onRemove={() => removeWidget(widgetData.id)} */}
              </Col>
            </Row>
          </Col>
        ))}
        {/* </Row> */}

        <TransparentBreadcrumbs mainTitle="Ticket wise Counts" />
        <TicketCount />

        <TransparentBreadcrumbs mainTitle="Advance Counts" />

        {/* Total Temp user Count Card */}
        <Col xxl='auto' xl='4' sm='6' className='box-col-6'>
          <Row>
            <Col xl='12'>
              <Card className="course-box card">
                <CardBody>
                  <div className='course-widget'>
                    <div className='course-icon secondary'>
                      <SvgIcon className='fill-icon' iconId='course-1' />
                    </div>
                    <div>
                      <H4 attrH4={{ className: 'mb-0' }}>{tempCount || '0'}</H4>
                      <span className='f-light'>Temp User

                      </span>
                      <a
                        type='button'
                        className='btn btn-light f-light d-flex justify-content-center'
                        onClick={() => handleTempViewDetails()}
                      >
                        View details
                        <span className='ms-2'>
                          <SvgIcon className='fill-icon f-light' iconId='arrowright' />
                        </span>
                      </a>
                    </div>
                  </div>
                </CardBody>
                <SquareGroupUi />
              </Card>
            </Col>
          </Row>
        </Col>


        {/* Total Complimentary Count Card */}
        <Col xxl='auto' xl='4' sm='6' className='box-col-6'>
          <Row>
            <Col xl='12'>
              <Card className="course-box card">
                <CardBody>
                  <div className='course-widget'>
                    <div className='course-icon secondary'>
                      <SvgIcon className='fill-icon' iconId='course-1' />
                    </div>
                    <div>
                      <H4 attrH4={{ className: 'mb-0' }}>{compCount || '0'}</H4>
                      <span className='f-light'>Complimentary

                      </span>
                      <a
                        type='button'
                        className='btn btn-light f-light d-flex justify-content-center'
                        onClick={() => handleUserViewDetails('complimentary', '', '')}
                      >
                        View details
                        <span className='ms-2'>
                          <SvgIcon className='fill-icon f-light' iconId='arrowright' />
                        </span>
                      </a>
                    </div>
                  </div>
                </CardBody>
                <SquareGroupUi />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Total Cancelled Count Card */}
        <Col xxl='auto' xl='4' sm='6' className='box-col-6'>
          <Row>
            <Col xl='12'>
              <Card className="course-box card">
                <CardBody>
                  <div className='course-widget'>
                    <div className='course-icon secondary'>
                      <SvgIcon className='fill-icon' iconId='course-1' />
                    </div>
                    <div>
                      <H4 attrH4={{ className: 'mb-0' }}>{cancelCount || '0'}</H4>
                      <span className='f-light'>Cancelled

                      </span>
                      <a
                        type='button'
                        className='btn btn-light f-light d-flex justify-content-center'
                        onClick={() => handleUserViewDetails('', 'cancel', '')}
                      >
                        View details
                        <span className='ms-2'>
                          <SvgIcon className='fill-icon f-light' iconId='arrowright' />
                        </span>
                      </a>
                    </div>
                  </div>
                </CardBody>
                <SquareGroupUi />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Total Inactive Count Card */}
        <Col xxl='auto' xl='4' sm='6' className='box-col-6'>
          <Row>
            <Col xl='12'>
              <Card className="course-box card">
                <CardBody>
                  <div className='course-widget'>
                    <div className='course-icon secondary'>
                      <SvgIcon className='fill-icon' iconId='course-1' />
                    </div>
                    <div>
                      <H4 attrH4={{ className: 'mb-0' }}>{inactiveCount || '0'}</H4>
                      <span className='f-light'>Inactive

                      </span>
                      <a
                        type='button'
                        className='btn btn-light f-light d-flex justify-content-center'
                        onClick={() => handleUserViewDetails('', '', 'inactive')}
                      >
                        View details
                        <span className='ms-2'>
                          <SvgIcon className='fill-icon f-light' iconId='arrowright' />
                        </span>
                      </a>
                    </div>
                  </div>
                </CardBody>
                <SquareGroupUi />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Total Temp user Count Card */}
        <Col xxl='auto' xl='4' sm='6' className='box-col-6'>
          <Row>
            <Col xl='12'>
              <Card className="course-box card">
                <CardBody>
                  <div className='course-widget'>
                    <div className='course-icon secondary'>
                      <SvgIcon className='fill-icon' iconId='course-1' />
                    </div>
                    <div>
                      <H4 attrH4={{ className: 'mb-0' }}>{discardedCount || '0'}</H4>
                      <span className='f-light'>Discarded User

                      </span>
                      <a
                        type='button'
                        className='btn btn-light f-light d-flex justify-content-center'
                        onClick={() => handleDiscardedViewDetails()}
                      >
                        View details
                        <span className='ms-2'>
                          <SvgIcon className='fill-icon f-light' iconId='arrowright' />
                        </span>
                      </a>
                    </div>
                  </div>
                </CardBody>
                <SquareGroupUi />
              </Card>
            </Col>
          </Row>
        </Col>



        {/* <LoggedInUsers /> */}
        {/* <LatestRegUsers /> */}
        <UserRegistrationGraph />

      </Row>
    </>
  );
};

export default EventWidgetsWrapper;
