import ConfigDB from '../../../Config/ThemeConfig';
import React, { Fragment, useState, useEffect } from 'react';
import Charts from 'react-apexcharts';
import { Row, Col, Card, CardBody } from 'reactstrap';
import HeaderCard from '../../Common/Component/HeaderCard';
import { BackendAPI } from '../../../api';
import { getToken } from '../../../Auth/Auth';

const primary = localStorage.getItem('default_color') || ConfigDB.data.color.primary_color;
const secondary = localStorage.getItem('secondary_color') || ConfigDB.data.color.secondary_color;

const BarCategoryWidgets = () => {
  const [registrationData, setRegistrationData] = useState([]); // Ensure initial state is an array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDataFromBackend = async () => {
      const token = getToken();
      try {
        const response = await fetch(`${BackendAPI}/widgets/categoryregistrations`, {
          headers: {
            Authorization: `Bearer ${token}` // Include the token in the Authorization header
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
    // md 
    if (!registrationData) return null;

   
  
    // Extract dates
    const dates = registrationData.map(item => item.date);

    // Extract unique categories
    const categories = Array.from(
      new Set(registrationData.flatMap(item => item.registrations.map(reg => reg.category)))
    );

    // Initialize an object to store category counts for each date
    const categoryCountsByDate = {};

    // Iterate over the registration data to populate category counts by date
    registrationData.forEach(item => {
      item.registrations.forEach(reg => {
        if (!categoryCountsByDate[item.date]) {
          categoryCountsByDate[item.date] = {};
        }
        categoryCountsByDate[item.date][reg.category] = reg.total;
      });
    });

    // Create series data for each category
    const series = categories.map(category => ({
      name: category,
      data: dates.map(date => categoryCountsByDate[date]?.[category] || 0)
    }));

    return { categories: dates, series };
  };

  const chartData = prepareChartData();

  return (
    <Fragment>
      <Row>
        <Col xs='12'>
          <Card className='o-hidden'>
            <HeaderCard title={'Category Registrations'} />
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
                            xaxis: { categories: chartData.categories }
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

export default BarCategoryWidgets;
