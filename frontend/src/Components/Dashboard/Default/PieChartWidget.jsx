import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import Charts from 'react-apexcharts';
import { Row, Col, Card, CardBody } from 'reactstrap';
import { BackendAPI } from '../../../api'; // Adjust import path as necessary
import HeaderCard from '../../Common/Component/HeaderCard';
import useAuth from '../../../Auth/protectedAuth';
import { getToken } from '../../../Auth/Auth';
import moment from 'moment'; // Import moment.js for date formatting


const PieChartWidget = () => {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [registrationData, setRegistrationData] = useState([]);
  const AdminTimezone = localStorage.getItem('AdminTimezone');



  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const token = getToken(); 
        const response = await fetch(`${BackendAPI}/widgets/widgetdatapie`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        const uniqueFacilities = [];
        data.forEach((day) => {
          day.facilities.forEach((facility) => {
            if (!uniqueFacilities.some((item) => item.value === facility.title)) {
              uniqueFacilities.push({
                label: facility.title,
                value: facility.title,
              });
            }
          });
        });
        setFacilities(uniqueFacilities);
        setSelectedFacility(uniqueFacilities[0]); // Set default selected facility as the first one
        setRegistrationData(data);
      } catch (error) {
        console.error('Error fetching facilities:', error);
      }
    };
    fetchFacilities();
  }, []);

  const handleFacilityChange = (selectedOption) => {
    setSelectedFacility(selectedOption);
  };

  // Prepare data for the pie chart based on the selected facility
  const preparePieChartData = () => {
    if (!selectedFacility || !registrationData) return [];

    const selectedFacilityData = registrationData.map((day) => {
      const facility = day.facilities.find(
        (facility) => facility.title === selectedFacility.value
      );
      const date = registrationData.map(item => 
        item.date 
          ? moment(item.date).tz(AdminTimezone).format('YYYY-MM-DD') 
          : 'Unknown Date'
      );
      // return { date: day.date, total: parseInt(facility ? facility.total : 0) };
      return { date: date, total: parseInt(facility ? facility.total : 0) };

    });

    return selectedFacilityData;
  };

  const pieChartData = preparePieChartData();

  return (
    <Row>
      <Col xs='12'>
        <Card className='o-hidden'>
          <HeaderCard title={'Date Distribution'} />
          <CardBody className='bottom-content'>
            <Row>
              <Col className='col-6 col-lg-9'></Col>
              <Col className='col-6 col-lg-3'>
                <Select
                  options={facilities}
                  value={selectedFacility}
                  onChange={handleFacilityChange}
                  placeholder='Select Facility'
                  classNamePrefix='react-select'
                />
              </Col>
            </Row>
            <Row>
              <Col>
                <div id='pie-chart-widget'>
                  {pieChartData.length > 0 ? (
                    <Charts
                      options={{
                        labels: pieChartData.map((data) => `Date ${data.date}`),
                      }}
                      series={pieChartData.map((data) => data.total)}
                      type='pie'
                      height={360}
                    />
                  ) : (
                    <p className="text-center">No data found</p> // Display message if no data
                  )}
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
};

export default PieChartWidget;
