import ConfigDB from '../../Config/ThemeConfig';
import React, { Fragment, useState, useEffect } from 'react';
import Charts from 'react-apexcharts';
import { Row, Col, Card, CardBody } from 'reactstrap';
import HeaderCard from '../Common/Component/HeaderCard';
import { BackendAPI } from '../../api'; 
import { getToken } from '../../Auth/Auth';
import moment from 'moment'; // Import moment.js for date formatting

const primary = localStorage.getItem('default_color') || ConfigDB.data.color.primary_color;
const secondary = localStorage.getItem('secondary_color') || ConfigDB.data.color.secondary_color;

const UserRegistrationGraph = () => {
  const [registrationData, setRegistrationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const AdminTimezone = localStorage.getItem('AdminTimezone');



  useEffect(() => {
    const fetchDataFromBackend = async () => {
      const token = getToken();
      try {
        const response = await fetch(`${BackendAPI}/eventdata/userCountByDate`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setRegistrationData(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDataFromBackend();
  }, []);

  // Prepare data for rendering charts
  const prepareChartData = () => {
    if (!registrationData || registrationData.length === 0) return null;

    // Format dates and handle null values
    const dates = registrationData.map(item => 
      item.registration_date 
        ? moment(item.registration_date).tz(AdminTimezone).format('YYYY-MM-DD') 
        : 'Unknown Date'
    );
    
    // Extract user counts
    const userCounts = registrationData.map(item => item.userCount);

    // Prepare chart series data
    const series = [
      {
        name: 'User Count',
        data: userCounts
      }
    ];

    return { categories: dates, series };
  };

  const chartData = prepareChartData();

  return (
    <Fragment>
      <Row>
        <Col xs='12'>
          <Card className='o-hidden'>
            <HeaderCard title={'User Registrations'} />
            <div className='bar-chart-widget'>
              <CardBody className='bottom-content'>
                <Row>
                  <Col>
                    <div id='chart-widget4'>
                      {loading && <div>Loading...</div>}
                      {error && <div>Error: {error.message}</div>}
                      {chartData && (
                        <Charts
                          options={{
                            xaxis: {
                              categories: chartData.categories,
                              title: {
                                text: 'Registration Date'
                              }
                            },
                            yaxis: {
                              title: {
                                text: 'User Count'
                              }
                            },
                            colors: [primary] // Set chart color to primary color
                          }}
                          series={chartData.series}
                          type='bar'
                          height={360}
                        />
                      )}
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </div>
          </Card>
        </Col>
      </Row>
    </Fragment>
  );
};

export default UserRegistrationGraph;
