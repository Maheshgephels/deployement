import React, { useEffect, useState } from 'react';
import { Card, CardBody, Col, Media } from 'reactstrap';
import { H4, P, Btn, Image } from '../../../AbstractElements';
// import { WhatsNew } from '../../../Constant';
import CarToon from '../../../assets/images/dashboard/cartoon.svg';
import { BackendAPI } from '../../../api';

import axios from 'axios';
import { getToken } from '../../../Auth/Auth';
import useAuth from '../../../Auth/protectedAuth';

const GreetingCard = () => {
  const [eventName, setEventName] = useState('');
  const [eventDays, setEventDays] = useState('');
  // const [timeZone, setTimeZone] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch event name
      const token = getToken(); 
      const eventNameResponse = await axios.get(`${BackendAPI}/widgets/eventname`,{
        headers: {
            Authorization: `Bearer ${token}` // Include the token in the Authorization header
        }
    });
      setEventName(eventNameResponse.data[0].cs_value);

      // Fetch event days
      const eventDaysResponse = await axios.get(`${BackendAPI}/widgets/eventdays`,{
        headers: {
            Authorization: `Bearer ${token}` // Include the token in the Authorization header
        }
    });
      setEventDays(eventDaysResponse.data[0].cs_value);

      // Fetch time zone
      // const timeZoneResponse = await axios.get(`${BackendAPI}/widgets/timezone`);
      // setTimeZone(timeZoneResponse.data[0].cs_value);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <Col className='col-lg-12 col-12 box-col-12'>
      <Card className='profile-box'>
  <CardBody>
    <Media>
      <Media body>
        <div className='greeting-user'>
          <H4 attrH4={{ className: 'f-w-600 text-white' }}>{eventName || 'Loading...'}</H4>
          <span className='text-white'>Total Event Days: <span className='text-white'>{eventDays || 'Loading...'}</span></span>
          {/* <P>TimeZone: {timeZone}</P> */}
          <div className='whatsnew-btn'>
            {/* <Btn attrBtn={{ color: 'transparent', outline: true, className: 'btn btn-outline-white' }}>{WhatsNew}</Btn> */}
          </div>
        </div>
      </Media>
      <div>
        <div className='clockbox'>{/* Your clock SVG code */}</div>
        <div className='badge f-10 p-0' id='txt'></div>
      </div>
    </Media>
    <div className='cartoon'>
      <Image attrImage={{ src: CarToon, alt: 'vector women with laptop' }} />
    </div>
  </CardBody>
</Card>

    </Col>
  );
};

export default GreetingCard;
