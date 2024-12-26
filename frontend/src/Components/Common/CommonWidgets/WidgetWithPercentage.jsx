import React, { useEffect } from 'react';
import { Card, CardBody } from 'reactstrap';
import { Image, H5 } from '../../../AbstractElements';
import RadialChart from './RadialChart';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for programmatic navigation
import { BackendPath } from '../../../api';
import { FaRegFileImage } from "react-icons/fa6";

const WidgetWithPercentage = ({ data }) => {
  const navigate = useNavigate(); // Initialize useNavigate
  const facilityType = data.facilityType;
  const Title = data.title;
  const Total = data.total;
  const TotalAllowCount = data.TotalAllowCount;
  const logo = data.image;

  const handleViewRecords = () => {
    navigate(`${process.env.PUBLIC_URL}/onsite/facility-scan-records/Consoft`, { state: { facilityType, Title, Total, TotalAllowCount } });
  };

  useEffect(() => {
    console.log(`${BackendPath}${logo}`);
  }, [logo, BackendPath]);
  
  return (
    <Card className='social-widget widget-hover'>
      <a type='button' className='btn btn-light ' onClick={handleViewRecords}>
        <CardBody>
          <div className='d-flex align-items-center justify-content-between'>
            <div className='d-flex align-items-center gap-2'>
              <div className='social-icons'>
                {logo ? (
                  <Image 
                    attrImage={{ 
                      src: `${BackendPath}${logo}`, 
                      alt: 'Facility icon', 
                      style: { width: '50px' } 
                    }} 
                  />
                ) : (
                  <FaRegFileImage style={{ color: '#FD7E14', fontSize: '40px' }} />
                )}
              </div>
              <span>{data.title}</span>
            </div>
            {/* <span className='font-success f-12 d-xxl-block d-xl-none'>+{data.gros}%</span> */}
          </div>
          <div className='social-content'>
            <div>
              <H5 attrH5={{ className: 'mb-1' }}>{data.total}</H5>
              <span className='f-light'>{data.subTitle}</span>
            </div>
            <div className='social-chart'>
              <RadialChart chartData={data.chart} />
            </div>
          </div>
        </CardBody>
      </a>
    </Card>
  );
};

export default WidgetWithPercentage;
