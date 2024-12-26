import React, { useEffect, useState } from 'react';
import { Card, CardBody, Col, Media } from 'reactstrap';
import { H4, P, Btn, Image } from '../../../AbstractElements';
import CarToon from '../../../assets/images/dashboard/cartoon.svg';
import axios from 'axios';
import { BackendAPI, BackendPath } from '../../../api';

// Icons
import { CiCalendarDate } from "react-icons/ci";
import { IoLocationOutline } from "react-icons/io5";

const EventGreetingCard = () => {
  const [eventDetails, setEventDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    fetchEventData();
  }, []);

  const fetchEventData = async () => {
    try {
      const response = await axios.get(`${BackendAPI}/eventdata/eventDetails`);
      if (response.data && response.data.eventDetails) {
        setEventDetails(response.data.eventDetails);
      } else {
        setError('No event data available');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching event data:', error);
      setError('Failed to load event data');
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  const event = eventDetails.reduce((acc, detail) => {
    acc[detail.cs_parameter] = detail.cs_value;
    return acc;
  }, {});

  return (
    <Col className='col-lg-12 col-12 box-col-12'>
      <Card className='profile-box'>
        <CardBody>
          <Media>
            <Media body>
              <div className="d-flex">
              <div className='pe-4'>
              <img className='rounded' src={`${BackendPath}${event['event_image_url']}`} alt="Current Exhibitor image" style={{ maxHeight: '120px' }} />
                </div>
                <div className='greeting-user'>
                  <H4 attrH4={{ className: 'f-w-600 text-white' }}>
                    {event['Event Name'] || 'No Event'}
                  </H4>
                  <span className='text-white'>
                    <CiCalendarDate /> <strong>Event Date Time:</strong>{' '}
                    {event['Event Start Date'] && event['event_time'] 
                      ? `${event['Event Start Date']} ${event['event_time']}` 
                      : 'No Event'}
                  </span>
                  <span className='text-white d-block'>
                    <IoLocationOutline /> <strong>Event Venue:</strong>{' '}
                    {event['event_venue'] || 'No Event'}
                  </span>
                  <div className='whatsnew-btn'>
                    {/* <Btn attrBtn={{ color: 'transparent', outline: true, className: 'btn btn-outline-white' }}>
                      Whats New
                    </Btn> */}
                  </div>
                </div>
              </div>
            </Media>
            <div>
              {/* Your clock SVG code */}
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

export default EventGreetingCard;
