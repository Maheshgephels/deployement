import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import MobileDevicePreview from 'sanity-mobile-preview';
import 'sanity-mobile-preview/dist/index.css';
import { Container, Row, Col, Card, Button, Input, PopoverBody, UncontrolledPopover } from 'reactstrap';
import { BackendAPI } from '../../api';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import Breadcrumbs from '../../CommonElements/Breadcrumbs';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import debounce from 'lodash.debounce';
import styled from 'styled-components';


const CustomPreview = styled.div`
  width: 400px;
  height: 800px;
  padding: 105px 24px;
  background: #d9dbdc;
  border-radius: 56px;
  box-shadow: inset 0 0 3px 0 rgba(0, 0, 0, 0.2);
`;

const AppLayout = () => {
  useAuth();
  const [appcolor, setAppColor] = useState([]);
  const [backgroundColorLight, setBackgroundColorLight] = useState('#FFFFFF');
  const [backgroundColorDark, setBackgroundColorDark] = useState('#FFFFFF');
  const [appBarColorDark, setAppBarColorDark] = useState('#FFFFFF');
  const [appBarColorLight, setAppBarColorLight] = useState('#FFFFFF');
  const [appBarColor, setAppBarColor] = useState('#FFFFFF');
  const [buttonColorDark, setButtonColorDark] = useState('#FFFFFF');
  const [buttonColorLight, setButtonColorLight] = useState('#FFFFFF');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetchColors();
  }, [darkMode]);

  const fetchColors = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${BackendAPI}/applayout/colors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched colors:', response.data);
      setAppColor(response.data);

      response.data.forEach(color => {
        if (darkMode) {
          if (color.color_elements === 'pageBackgroundColor') {
            setBackgroundColorDark(color.dark_color_code);
          }
          if (color.color_elements === 'appBarColor') {
            setAppBarColorDark(color.dark_color_code);
          }
          if (color.color_elements === 'buttonColor') {
            setButtonColorDark(color.dark_color_code);
          }
        } else {
          if (color.color_elements === 'pageBackgroundColor') {
            setBackgroundColorLight(color.light_color_code);
          }
          if (color.color_elements === 'appBarColor') {
            setAppBarColorLight(color.light_color_code);
          }
          if (color.color_elements === 'buttonColor') {
            setButtonColorLight(color.light_color_code);
          }
        }
      });
    } catch (error) {
      console.error('Error fetching colors:', error);
    }
  };

  const debounceColorChange = useCallback(
    debounce(async (colorId, lightColor, darkColor) => {
      try {
        const token = getToken();
        await axios.put(
          `${BackendAPI}/applayout/colors/${colorId}`,
          { light_color_code: lightColor, dark_color_code: darkColor },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Color updated:', { colorId, lightColor, darkColor });
        fetchColors();
      } catch (error) {
        console.error('Error updating color:', error);
      }
    }, 500),
    []
  );

  const handleColorChange = (colorId, lightColor, darkColor) => {
    debounceColorChange(colorId, lightColor, darkColor);
  };

  const handleModeToggle = () => {
    setDarkMode(!darkMode);
  };

  const handleInputChange = (color, type, value) => {
    const newColor = { ...color, [type]: value };
    handleColorChange(color.color_id, newColor.light_color_code, newColor.dark_color_code);

    const colorCode = darkMode ? newColor.dark_color_code : newColor.light_color_code;
    console.log('Updated color:', { color, colorCode });

    switch (color.color_elements) {
      case 'pageBackgroundColor':
        if (darkMode) {
          setBackgroundColorDark(colorCode);
        } else {
          setBackgroundColorLight(colorCode);
        }
        break;
      case 'appBarColor':
        if (darkMode) {
          setAppBarColorDark(colorCode);
        } else {
          setAppBarColorLight(colorCode);
        }
        break;
      case 'buttonColor':
        if (darkMode) {
          setButtonColorDark(colorCode);
        } else {
          setButtonColorLight(colorCode);
        }
        break;
      default:
        break;
    }
  };

  const colorNameMap = {
    buttonColor: 'Button Color',
    appBarColor: 'App & Nav Bar Color',
    pageBackgroundColor: 'Page Background Color',
  };

  return (
    <div>
      <Container fluid>
        <Breadcrumbs mainTitle={
          <>
            App Layout
            <MdInfoOutline
              id="layoutPopover"
              style={{
                cursor: 'pointer', position: 'absolute', marginLeft: '5px'
              }}
            />
            <UncontrolledPopover
              placement="bottom"
              target="layoutPopover"
              trigger="focus"
            >
              <PopoverBody>
                Here’s how your Event App colors will appear on the mobile app. <br/>
                Set the colors for <strong>Light Mode</strong> and <strong>Dark Mode</strong>. The app will display the colors you choose based on the selected mode. <br/>
                Please ensure the colors meet the required specifications for the best display quality.
              </PopoverBody>
            </UncontrolledPopover>
          </>
        } parent="Event App Admin" title="App Layout" />
        <Row>
          <Col md={3}>
            <Card className="p-4">
              <Button className='mb-3' onClick={handleModeToggle}>
                {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              </Button>
              {appcolor.map((color) => (
                <Card key={color.color_id} className="mb-3 p-2">
                  <label><strong>{colorNameMap[color.color_elements] || color.color_elements}</strong></label>
                  <Input
                    type="color"
                    value={darkMode ? color.dark_color_code : color.light_color_code}
                    onChange={(e) => handleInputChange(color, darkMode ? 'dark_color_code' : 'light_color_code', e.target.value)}
                  />
                </Card>
              ))}
            </Card>
          </Col>
          <Col md={9}>
            <Card className='table-responsive'>
              <div style={{ minHeight: '50vh', padding: '20px' }}>
                <MobileDevicePreview
                  lightColor={!darkMode ? backgroundColorLight : backgroundColorDark}
                  darkColor={darkMode ? backgroundColorDark : backgroundColorLight}
                  defaultDevice="iPhone X"
                  preSelectedColor={"black"}
                  showMenu={false}
                  style={{ boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)', borderRadius: '10px', overflow: 'hidden' }}
                >
                  <header className='d-flex align-items-end justify-content-center' style={{ backgroundColor: darkMode ? appBarColorDark : appBarColorLight, minHeight: '8%' }}>
                    <p>App Bar</p>
                  </header>
                  <main className='d-flex align-items-center justify-content-center' style={{ backgroundColor: darkMode ? backgroundColorDark : backgroundColorLight, minHeight: '84%' }}>
                    <button className='btn' style={{ backgroundColor: darkMode ? buttonColorDark : buttonColorLight }}>Sample Button</button>
                  </main>
                  <footer className='d-flex align-items-center justify-content-center' style={{ backgroundColor: darkMode ? appBarColorDark : appBarColorLight, minHeight: '8%' }}>
                    <p>Nav Bar</p>
                  </footer>
                </MobileDevicePreview>
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
    </div >
  );
};

export default AppLayout;
