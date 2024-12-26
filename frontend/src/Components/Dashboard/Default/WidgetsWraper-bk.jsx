import React, { useState, useEffect } from 'react';
import { Col, Row, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import WidgetWithList from '../../Common/CommonWidgets/WidgetWithList';
import WidgetWithPercentage from '../../Common/CommonWidgets/WidgetWithPercentage';
import WidgetFacilityTotal from '../../Common/CommonWidgets/WidgetFacilityTotal';

import { BackendAPI } from '../../../api';
import axios from 'axios';



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
      const response = await axios.get(`${BackendAPI}/widgets/widgetdata`);
      setApiData(response.data);
      setSelectedWidgets(response.data); // Set selected widgets by default
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchDataWithPercent = async () => {
    try {
      const response = await axios.get(`${BackendAPI}/widgets/widgetdataWithPercent`);
      setDataWidgetWithPercent(response.data);
    } catch (error) {
      console.error('Error fetching data for WidgetWithPercentage:', error);
    }
  };

  const fetchWidgetFacilityTotal = async () => {
    try {
      const response = await axios.get(`${BackendAPI}/widgets/totalCounts`);
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
      <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown} className='mb-3'>
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
      </Dropdown>

      {/* Render all widgets */}
      <Row>
        {selectedWidgets.map((widgetData, index) => (
          <Col key={index} xxl='auto' xl='4' sm='6' className='box-col-6'>
            <Row>
              <Col xl='12'>
                <WidgetWithList data={widgetData} onRemove={() => removeWidget(widgetData.id)} />
              </Col>
            </Row>
          </Col>
        ))}
      </Row>

       {/* Render widgets from WidgetFacilityTotal */}
       {widgetFacilityTotalData.map((item, i) => (
        <Col xl='3' sm='6' key={i}>
          <WidgetFacilityTotal data={item} />
        </Col>
      ))}

      {/* Render widgets from DataWidgetWithPercentage */}
      {dataWidgetWithPercent.map((item, i) => (
        <Col xl='3' sm='6' key={i}>
          <WidgetWithPercentage data={item} />
        </Col>
      ))}

    </>
  );
};

export default WidgetsWrapper;
