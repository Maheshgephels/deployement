import React from 'react';
import { Card, CardBody } from 'reactstrap';
import { H4 } from '../../../AbstractElements';
import { useNavigate } from 'react-router-dom';
import SvgIcon from '../Component/SvgIcon';
import SquareGroupUi from '../../Dashboard/OnlineCourse/SquareGroupUi';

const EventWidgetWithList = ({ userCount }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`${process.env.PUBLIC_URL}/onsite/manage-user/Consoft`, { state: { Title: "Total Users" } });
  };

  return (
    <Card className="course-box card">
      <CardBody>
        <div className='course-widget'>
          <div className='course-icon secondary'>
            <SvgIcon className='fill-icon' iconId='course-1' />
          </div>
          <div>
            <H4 attrH4={{ className: 'mb-0' }}>{userCount || 'Loading...'}</H4>
            <span className='f-light'>Total Users</span>
            <a
              type='button'
              className='btn btn-light f-light d-flex justify-content-center'
              onClick={handleViewDetails}
            >
              View details
              <span className='ms-2'>
                <SvgIcon className='fill-icon f-light' iconId='arrowright' />
              </span>
            </a>
          </div>
        </div>
      </CardBody>
      <SquareGroupUi />
    </Card>
  );
};

export default EventWidgetWithList;
