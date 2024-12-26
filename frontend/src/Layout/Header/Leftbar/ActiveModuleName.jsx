import React, { useState, useEffect } from 'react';
import { H5 } from '../../../AbstractElements';
import { useLocation } from 'react-router-dom';

const ActiveModuleName = () => {
  const location = useLocation();
  const { product_name } = location.state || {};
  
  // State to store the active product name
  const [product, setProduct] = useState(product_name || localStorage.getItem('product_name'));

  // Update localStorage and state if product_name is available in location.state
  useEffect(() => {
    if (product_name) {
      localStorage.setItem('product_name', product_name); // Sync to localStorage
      setProduct(product_name); // Update state
    }
  }, [product_name]);

  return (
    <div className=' '>
      <div className='d-flex h-100'>
        <H5 attrH6={{ className: 'mb-0 f-w-400' }}>
          {product || 'No Active Product'}
        </H5>
      </div>
    </div>
  );
};

export default ActiveModuleName;

