import React, { Fragment, useState, useEffect } from 'react';
import { Image } from '../../AbstractElements';

const Loader = (props) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShow(false);
    }, 3000);

    return () => {
      clearTimeout(timeout);
    };
  }, [show]);

  return (
    <Fragment>
      <div className={`loader-wrapper ${show ? '' : 'loderhide'}`}>
        <div className='loader-index'>
          {/* <span></span> */}
          <Image 
            attrImage={{ 
              className: 'img-fluid d-inline', 
              src: `${require('../../assets/images/logo/loader.gif')}`, 
              alt: '',
              style: { width: '40%' } // Add this line to set the width to 80%
            }} 
          />
        </div>
      </div>
    </Fragment>
  );
};

export default Loader;
