import ConfigDB from '../../../Config/ThemeConfig';
import React, { Fragment, useState, useEffect } from 'react';
import Charts from 'react-apexcharts';
import { Row, Col, Card, CardBody } from 'reactstrap';
import HeaderCard from '../../Common/Component/HeaderCard';
import { BackendAPI } from '../../../api';
import { getToken } from '../../../Auth/Auth';

const primary = localStorage.getItem('default_color') || ConfigDB.data.color.primary_color;
const secondary = localStorage.getItem('secondary_color') || ConfigDB.data.color.secondary_color;

const BarScanWidgets = () => {
  const [marketData, setMarketData] = useState([]);

  useEffect(() => {
    const fetchDataFromBackend = async () => {
      const token = getToken();
      try {
        const response = await fetch(`${BackendAPI}/widgets/widgetdatachart`, {
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
    if (!Array.isArray(marketData) || marketData.length === 0) return { categories: [], series: [] };

    const facilityTypes = marketData.reduce((types, day) => {
      day.facilities.forEach(facility => {
        const facilityName = facility.title.replace(/ Day \d+$/, '');
        if (!types.includes(facilityName)) {
          types.push(facilityName);
        }
      });
      return types;
    }, []);

    const series = facilityTypes.map(facilityName => ({
      name: facilityName,
      data: marketData.map(day => parseInt(day.facilities.find(f => f.title.startsWith(facilityName))?.total) || 0),
    }));

    const categories = marketData.map(day => `Event Day ${day.day}`);

    return { categories, series };
  };

  const chartData = prepareChartData();
  console.log(chartData);

  return (
    <Fragment>
      <Row>
        <Col xs='12'>
          <Card className='o-hidden'>
            <HeaderCard title={'Facility Scanned'} />
            <div className='bar-chart-widget'>
              <CardBody className='bottom-content'>
                <Row>
                  <Col>
                    <div id='chart-widget4'>
                      {chartData.categories.length > 0 && (
                        <Charts
                          options={{
                            xaxis: { categories: chartData.categories },
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

export default BarScanWidgets;
