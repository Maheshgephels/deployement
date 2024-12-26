import React, { useState, useEffect } from 'react';
import { Card, CardBody, Col, Row } from 'reactstrap';
import { H4 } from '../../../AbstractElements';
import { useNavigate } from 'react-router-dom';
import SvgIcon from '../../Common/Component/SvgIcon';
import SquareGroupUi from '../../Dashboard/OnlineCourse/SquareGroupUi';
import CustomBreadcrumbs from '../../../CommonElements/Breadcrumbs/CustomBreadcrumbs';
import TransparentBreadcrumbs from '../../../CommonElements/Breadcrumbs/TransparentBreadcrumb';
import WidgetWithEventList from '../../Common/CommonWidgets/WidgetWithEventList';
import LoggedInUsers from '../../EventAdmin/LoggedInUsers';
import LatestSignUpUsers from '../../EventAdmin/LatestSignUpUsers';
import UserRegistrationGraph from '../../EventAdmin/UserRegistrationGraph';
import axios from 'axios';
import { getToken } from '../../../Auth/Auth';
import { BackendAPI } from '../../../api';

const EventWidgetsWrapper = () => {
  const [userCount, setUserCount] = useState(0);
  const [loginuserCount, setLoginUserCount] = useState(0);
  const [totalFacultyCount, setTotalFacultyCount] = useState(0);
  const [activeFacultyCount, setActiveFacultyCount] = useState(0);
  const [inactiveFacultyCount, setInactiveFacultyCount] = useState(0);
  const [selectedWidgets, setSelectedWidgets] = useState([]);
  const [apiData, setApiData] = useState([]);
  const navigate = useNavigate();

  console.log("WIDGET:", apiData);

  useEffect(() => {
    fetchCounts();
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${BackendAPI}/widgets/eventWidgetData`, {
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
      const responseUser = await axios.get(`${BackendAPI}/eventdata/userCount`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUserCount(responseUser.data.userCount);
      setLoginUserCount(responseUser.data.userloggedinCount)

      // Fetch faculty counts
      const responseFaculty = await axios.get(`${BackendAPI}/eventdata/facultyCount`, {
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
    navigate(`${process.env.PUBLIC_URL}/event/manage-faculty/Consoft`, { state: { sortBy, Title: "Total Faculty" } });
  };

  const handleUserViewDetails = () => {
    navigate(`${process.env.PUBLIC_URL}/event/manage-user/Consoft`, { state: { Title: "Total Users" } });
  };

  const handleloggedinViewDetails = () => {
    navigate(`${process.env.PUBLIC_URL}/event/loggedin-user/Consoft`);
  };

  return (
    <>
      <TransparentBreadcrumbs mainTitle="Statistics" />
      <Row>
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
                      <span className='f-light'>Total Users</span>
                      <a
                        type='button'
                        className='btn btn-light f-light d-flex justify-content-center'
                        onClick={() => handleUserViewDetails('user')}
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
        </Col>

        {/* Active Faculty Count Card */}
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
        </Col>

        {/* Inactive Faculty Count Card */}
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
        </Col>


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
          {/* <Row> */}
            {selectedWidgets.map((widgetData, index) => (
              <Col key={index} xxl='auto' xl='4' sm='6' className='box-col-6'>
                <Row>
                  <Col xl='12'>
                    <WidgetWithEventList data={widgetData} />  {/* onRemove={() => removeWidget(widgetData.id)} */}
                  </Col>
                </Row>
              </Col>
            ))}
          {/* </Row> */}
        
        {/* <LoggedInUsers /> */}
        <LatestSignUpUsers />
        <UserRegistrationGraph />
      </Row>
    </>
  );
};

export default EventWidgetsWrapper;
