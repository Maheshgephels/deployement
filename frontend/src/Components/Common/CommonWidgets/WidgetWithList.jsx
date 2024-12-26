import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button } from 'reactstrap';
import { H4 } from '../../../AbstractElements';
import { CiSquareRemove } from "react-icons/ci";
import { useNavigate } from 'react-router-dom';
import SvgIcon from '../Component/SvgIcon';
import SquareGroupUi from '../../Dashboard/OnlineCourse/SquareGroupUi';

const WidgetWithList = ({ data, mainClass, onRemove }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // Initialize loading state

  // Simulating data fetching delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false); // Set loading to false after a delay (simulating data fetching)
    }, 500); // Adjust the delay as needed

    return () => clearTimeout(timer);
  }, []);

  const catID = data.catID;
  const Title = data.title;
  console.log(catID);

  const handleViewDetails = () => {
    navigate(`${process.env.PUBLIC_URL}/onsite/manage-user/Consoft`, { state: { catID, Title }});
  };

  // Render sample cards while loading
  if (loading) {
    return (
      <div>
        <Card className={`course-box card`}>
          <CardBody>
            <div className='course-widget'>
              <div className={`course-icon secondary`}>
              <SvgIcon className='fill-icon' iconId='course-1' />
                <div className='placeholder-icon'></div>
              </div>
              <div>
                <H4 attrH4={{ className: 'mb-0' }}>00</H4>
                <span className='f-light'>Category Name</span>
                <a type='button' className='btn btn-light f-light d-flex justify-content-center' onClick={handleViewDetails}>
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
        {/* You can render more sample cards here if needed */}
      </div>
    );
  }

  // Render actual data once loaded
  return (
<Card className='course-box card'>
  <CardBody>
    <div className='course-widget'>
      <div className='course-icon secondary'>
        {data.icon ? (
          <SvgIcon className='fill-icon' iconId={data.icon} />
        ) : (
          <div className='placeholder-icon' />
        )}
      </div>
      <div>
        <H4 attrH4={{ className: 'mb-0' }}>{data.total || 'Loading...'}</H4>
        <span className='f-light'>{data.title || 'Loading title...'}</span>
        <a
          type='button'
          className='btn btn-light f-light d-flex justify-content-center'
          onClick={handleViewDetails}
        >
          {data.total && data.title ? 'View details' : 'Loading...'}
          <span className='ms-2'>
            {data.total && data.title ? (
              <SvgIcon className='fill-icon f-light' iconId='arrowright' />
            ) : (
              <div className='placeholder-arrow' />
            )}
          </span>
        </a>
      </div>
      {/* <div className='ms-auto'>
        <button className='btn btn-light f-light' onClick={onRemove}>
          <CiSquareRemove />
        </button>
      </div> */}
    </div>
  </CardBody>
  <SquareGroupUi />
</Card>

  );
};

export default WidgetWithList;
