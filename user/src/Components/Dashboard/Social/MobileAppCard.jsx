import React from 'react';
import { Card, Col, CardBody, CardHeader } from 'reactstrap';
import { Btn, H5, Image } from '../../../AbstractElements';
import { HaveYouTriedOur, MobileApplication, TryNow } from '../../../Constant';

import wave from '../../../assets/images/dashboard-5/wave.png';
import mobileImage from '../../../assets/images/dashboard-5/mobile-img.png';

const MobileAppCard = () => {
  return (
    <Col md='4'>
    <Card className='mobile-app-card p-2 mb-0'>
      <CardHeader className='card-no-border pb-0'>
        <H5 attrH5={{ className: 'mb-3' }}>
          <span className='f-16 f-light'>{HaveYouTriedOur} </span>
          Mobile Application
        </H5>
        <Btn attrBtn={{ color: 'primary', className: 'purchase-btn btn-hover-effect f-w-500 mb-2', type: 'button' }}>Download</Btn>
      </CardHeader>
      {/* <CardBody className='p-0 text-end'>
        <Image attrImage={{ className: 'wavy', src: wave, alt: '' }} />
        <Image attrImage={{ src: mobileImage, alt: '' }} />
      </CardBody> */}
    </Card>
    </Col>
  );
};

export default MobileAppCard;
