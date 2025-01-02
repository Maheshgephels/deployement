import React from 'react';
import { H5 } from '../../../AbstractElements';
import { useLocation } from 'react-router-dom';

const ActiveModuleName = () => {
  const location = useLocation();
  const { product_name } = location.state || {};

  // Retrieve product_name from localStorage if location.state is null
  const Product = product_name || localStorage.getItem('Userproduct_name');

  return (
    <div className=' '>
      <div className='d-flex h-100'>
        <H5 attrH6={{ className: 'mb-0 f-w-400' }}>
          {Product}
        </H5>
      </div>
    </div>
  );
};

export default ActiveModuleName;
