import React, { useState, useEffect } from 'react';
import { Col, Row, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import WidgetWithList from '../../Common/CommonWidgets/WidgetWithList';
import { H5 } from '../../../AbstractElements';
import WidgetWithPercentage from '../../Common/CommonWidgets/WidgetWithPercentage';
import WidgetFacilityTotal from '../../Common/CommonWidgets/WidgetFacilityTotal';
import CustomBreadcrumbs from '../../../CommonElements/Breadcrumbs/CustomBreadcrumbs';
import TransparentBreadcrumbs from '../../../CommonElements/Breadcrumbs/TransparentBreadcrumb';
// import { Link } from 'react-router-dom';

import { BackendAPI } from '../../../api';
import axios from 'axios';
import { getToken } from '../../../Auth/Auth';
import useAuth from '../../../Auth/protectedAuth';

const WidgetsWrapper = () => {
  const [apiData, setApiData] = useState([]);
  const [dataWidgetWithPercent, setDataWidgetWithPercent] = useState([]);
  const [widgetFacilityTotalData, setWidgetFacilityTotalData] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedWidgets, setSelectedWidgets] = useState([]);

  useEffect(() => {
    fetchData();
    fetchDataWithPercent();
    fetchWidgetFacilityTotal();
  }, []);

  const fetchData = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${BackendAPI}/widgets/widgetdata`, {
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

  const fetchDataWithPercent = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${BackendAPI}/widgets/widgetdataWithPercent`, {
        headers: {
          Authorization: `Bearer ${token}` // Include the token in the Authorization header
        }
      });
      setDataWidgetWithPercent(response.data);
    } catch (error) {
      console.error('Error fetching data for WidgetWithPercentage:', error);
    }
  };

  const fetchWidgetFacilityTotal = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${BackendAPI}/widgets/totalCounts`, {
        headers: {
          Authorization: `Bearer ${token}` // Include the token in the Authorization header
        }
      });
      setWidgetFacilityTotalData(response.data);
    } catch (error) {
      console.error('Error fetching data for WidgetFacilityTotal:', error);
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(prevState => !prevState);
  };

  const removeWidget = (widgetId) => {
    // Find the widget to remove
    const removedWidget = selectedWidgets.find(widget => widget.id === widgetId);

    // Remove the widget from selectedWidgets
    setSelectedWidgets(prevWidgets => prevWidgets.filter(widget => widget.id !== widgetId));

    // Add the removed widget back to apiData
    setApiData(prevApiData => [...prevApiData, removedWidget]);
  };

  const removedWidgetTitles = apiData.filter(widget => !selectedWidgets.includes(widget));

  return (
    <>
      {/* Dropdown for adding widgets */}
      {/* <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown} className='mb-3'>
        <DropdownToggle caret>
          Category Widgets
        </DropdownToggle>
        <DropdownMenu>
          {removedWidgetTitles.map((widgetData, index) => (
            <DropdownItem key={index} onClick={() => setSelectedWidgets(prevWidgets => [...prevWidgets, widgetData])}>
              {widgetData.title} (Removed)
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown> */}

      {/* Render all widgets */}
      {/* <H5 className="mb-4">Category Count</H5> */}
      <TransparentBreadcrumbs mainTitle="Category Count" />
      <Row>
        {selectedWidgets.map((widgetData, index) => (
          <Col key={index} xxl='auto' xl='4' sm='6' className='box-col-6'>
            <Row>
              <Col xl='12'>
                <WidgetWithList data={widgetData} />  {/* onRemove={() => removeWidget(widgetData.id)} */}
              </Col>
            </Row>
          </Col>
        ))}
      </Row>

      {widgetFacilityTotalData.length > 0 && (
        <>
          {/* <H5 className="mb-4">Total Facility Counts</H5> */}
          <TransparentBreadcrumbs mainTitle="Total Facility Counts" />
          {widgetFacilityTotalData.map((item, i) => (
            <Col xl='3' sm='6' key={i}>
              <WidgetFacilityTotal data={item} />
            </Col>
          ))}
        </>
      )}


      {/* Render widgets from DataWidgetWithPercentage */}
      {dataWidgetWithPercent.length > 0 && (
  <>
    {/* <H5 className="mb-4">Facility Day Wise Counts</H5> */}
    <TransparentBreadcrumbs mainTitle="Facility Day Wise Counts" />
    {dataWidgetWithPercent.map((item, i) => (
      <Col xl='3' sm='6' key={i}>
        {/* <Link to="/onsite/facility-scan-records/Consoft"> */}
        <WidgetWithPercentage data={item} />
        {/* </Link> */}
      </Col>
    ))}
  </>
)}


    </>
  );
};

export default WidgetsWrapper;

