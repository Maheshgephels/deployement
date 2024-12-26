import React from 'react';
import { Card, CardBody, Button } from 'reactstrap';
import { H4 } from '../../../AbstractElements';
import { CiSquareRemove } from "react-icons/ci";
import { useNavigate } from 'react-router-dom'; // Import useNavigate for programmatic navigation
import SvgIcon from '../Component/SvgIcon';
import SquareGroupUi from '../../Dashboard/OnlineCourse/SquareGroupUi';

const WidgetWithList = ({ data, mainClass, onRemove }) => {
  const navigate = useNavigate(); // Initialize useNavigate
  const catID = data.catID;
  console.log(catID);

  const handleViewDetails = () => {
    navigate(`${process.env.PUBLIC_URL}/onsite/manage-user/Consoft`, { state: { catID } });
  };

  return (
    <Card className={`course-box card`}>
      <CardBody>
        <div className='course-widget'>
          <div className={`course-icon secondary`}>
            <SvgIcon className='fill-icon' iconId={data.icon} />
          </div>
          <div>
            <H4 attrH4={{ className: 'mb-0' }}>{data.total}</H4>
            <span className='f-light'>{data.title}</span>
            <a type='button' className='btn btn-light f-light d-flex justify-content-center' onClick={handleViewDetails}>
              View details
              <span className='ms-2'>
                <SvgIcon className='fill-icon f-light' iconId='arrowright' />
              </span>
            </a>
          </div>
          <div className='ms-auto'>
            <button className='btn btn-light f-light' onClick={onRemove}>
              <CiSquareRemove />
            </button>
          </div>
        </div>
      </CardBody>
      <SquareGroupUi />
    </Card>
  );
};

export default WidgetWithList;
