import ConfigDB from '../../../Config/ThemeConfig';
import React, { Fragment, useState, useEffect } from 'react';
import Charts from 'react-apexcharts';
import { Row, Col, Card, CardBody } from 'reactstrap';
import HeaderCard from '../../Common/Component/HeaderCard';
import { BackendAPI } from '../../../api';
import { getToken } from '../../../Auth/Auth';

const primary = localStorage.getItem('default_color') || ConfigDB.data.color.primary_color;
const secondary = localStorage.getItem('secondary_color') || ConfigDB.data.color.secondary_color;

const BarWidgets = () => {
  const [marketData, setMarketData] = useState([]);

  useEffect(() => {
    const fetchDataFromBackend = async () => {
      const token = getToken();
      try {
        const response = await fetch(`${BackendAPI}/widgets/widgetcommonscan`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setMarketData(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchDataFromBackend();
  }, []);

  const prepareChartData = () => {
    if (!marketData) return null;


    // Extract facility types without numeric suffix
    const facilityTypes = marketData.reduce((types, day) => {
      day.facilities.forEach(facility => {
        if (!types.includes(facility.title)) {
          types.push(facility.title);
        }
      });
      return types;
    }, []);

    const series = facilityTypes.map(facilityName => ({
      name: facilityName,
      data: marketData.map(day => parseInt(day.facilities.find(f => f.title === facilityName)?.total) || 0),
    }));

    const categories = marketData.map(day => day.date);

    return { categories, series };
  };

  const chartData = prepareChartData();

  return (
    <Fragment>
      <Row>
        <Col xs='12'>
          <Card className='o-hidden'>
            <HeaderCard title={'Common Facility Scanned'} />
            <div className='bar-chart-widget'>
              <CardBody className='bottom-content'>
                <Row>
                  <Col>
                    <div id='chart-widget4'>
                      <Charts
                        options={{
                          xaxis: { categories: chartData.categories },
                          colors: [primary, secondary],
                          theme: { mode: 'light' },
                          chart: { toolbar: { show: false } },
                          plotOptions: {
                            bar: { horizontal: false, columnWidth: '55%' },
                          },
                          fill: { opacity: 1 },
                          dataLabels: { enabled: false },
                          tooltip: { theme: 'light' },
                        }}
                        series={chartData.series}
                        type='bar'
                        height={360}
                      />
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

export default BarWidgets;    
