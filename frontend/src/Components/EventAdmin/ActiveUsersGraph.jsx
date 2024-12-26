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

const ActiveUsersGraph = () => {
  const [activeUsersData, setActiveUsersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const AdminTimezone = localStorage.getItem('AdminTimezone');




  useEffect(() => {
    const fetchDataFromBackend = async () => {
      const token = getToken();
      try {
        const response = await fetch(`${BackendAPI}/eventdata/getActiveUsers`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setActiveUsersData(data.activeUsers || []);  // Ensure data is an array
      } catch (error) {
        console.error('Error fetching active users data:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDataFromBackend();
  }, []);

  const prepareChartData = () => {
    if (!Array.isArray(activeUsersData) || activeUsersData.length === 0) {
      return null;
    }

    // Extract dates and format them
    // const dates = activeUsersData.map(item => new Date(item.login_date).toLocaleDateString());
    const dates = activeUsersData.map(item => 
      item.login_date 
        ? moment(item.login_date).tz(AdminTimezone).format('YYYY-MM-DD') 
        : 'Unknown Date'
    );

    // Extract active users count
    const activeUsersCount = activeUsersData.map(item => item.activeUsers);

    return {
      categories: dates,
      series: [
        {
          name: 'Active Users',
          data: activeUsersCount
        }
      ]
    };
  };

  const chartData = prepareChartData();

  const chartOptions = {
    chart: {
      id: 'active-users-bar-chart',
      toolbar: {
        show: true
      }
    },
    xaxis: {
      categories: chartData ? chartData.categories : [],
      title: {
        text: 'Date'
      }
    },
    yaxis: {
      title: {
        text: 'Active Users'
      },
      min: 0
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%',
        endingShape: 'rounded'
      }
    },
    colors: [primary],
    dataLabels: {
      enabled: false
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return `${val} users`;
        }
      }
    }
  };

  return (
    <Fragment>
      <Row>
        <Col xs='12'>
          <Card className='o-hidden'>
            <HeaderCard title={'Active Users'} />
            <div className='bar-chart-widget'>
              <CardBody className='bottom-content'>
                <Row>
                  <Col>
                    <div id='chart-widget-active-users'>
                      {loading && <div>Loading...</div>}
                      {error && <div>Error: {error.message}</div>}
                      {chartData ? (
                        <Charts
                          options={chartOptions}
                          series={chartData.series}
                          type='bar'
                          height={360}
                        />
                      ) : (
                        !loading && <div className='text-center'>No data available</div>
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

export default ActiveUsersGraph;
