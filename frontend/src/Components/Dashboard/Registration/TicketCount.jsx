import React, { useEffect, useState } from 'react';
import { Card, CardBody, Col, Row } from 'reactstrap';
import { H4 } from '../../../AbstractElements';
import { useNavigate } from 'react-router-dom';
import SvgIcon from '../../Common/Component/SvgIcon';
import SquareGroupUi from '../../Dashboard/OnlineCourse/SquareGroupUi';
import { BackendAPI } from '../../../api';

const TicketCount = ({ mainClass }) => {
  const navigate = useNavigate();
  const [ticketData, setTicketData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicketCounts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${BackendAPI}/regWidgets/counts`);
        const result = await response.json();
        setTicketData(result.ticketCounts);
      } catch (error) {
        console.error('Error fetching ticket counts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTicketCounts();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={mainClass}>
      {/* <h4>Ticket wise Counts</h4> */}
      <Row>
        {ticketData.map((ticket, index) => (
          <Col key={index} xxl='auto' xl='4' sm='6' className='box-col-6'>
            <Card className='course-box card'>
              <CardBody>
                <div className='course-widget'>
                  <div className='course-icon secondary'>
                    <SvgIcon className='fill-icon' iconId='course-1' />
                  </div>
                  <div>
                    <H4 attrH4={{ className: 'mb-0' }}>{ticket.user_count || '0'}</H4>
                    <span className='f-light'>{ticket.ticket_title}</span>
                    <a
                      type='button'
                      className='btn btn-light f-light d-flex justify-content-center'
                      onClick={() => {
                        const url = `${process.env.PUBLIC_URL}/registration/confirm-user-listing/Consoft`;
                        console.log("Navigating to:", url); // Log the URL
                        navigate(url, {
                          state: { ticketId: ticket.ticket_id }
                        });
                      }}
                    >
                      View details
                      <SvgIcon className='fill-icon f-light' iconId='arrowright' />
                    </a>
                  </div>
                </div>
              </CardBody>
              <SquareGroupUi />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default TicketCount;
