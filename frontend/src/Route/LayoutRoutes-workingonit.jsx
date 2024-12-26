import React, { Fragment, useEffect, useState } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { routes } from './Routes';
import AppLayout from '../Layout/Layout';
import axios from 'axios';
import { BackendAPI } from '../api';

const LayoutRoutes = () => {
  const location = useLocation();
  const [accessibleProducts, setAccessibleProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${BackendAPI}/auth/products`);
      setAccessibleProducts(response.data); // Assuming the API returns an array of product objects
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const isProductAccessible = (productValue) => {
    // Check if the productValue exists in the fetched product records
    return accessibleProducts.some(product => product.product_value === productValue);
  };

  const getProductValueFromPath = (path) => {
    const match = path.match(/^\/([^/]+)\/([^/]+)/); // Matches the first two segments after the root
    return match ? match[1] : ''; // Return the first segment as product_value
  };

  const currentProductValue = getProductValueFromPath(location.pathname);

  if (loading) {
    // return <div>Loading...</div>;
    return;
  }

  return (
    <>
      <Routes>
        {routes.map(({ path, Component }, i) => {
          if (isProductAccessible(currentProductValue)) {
            return (
              <Fragment key={i}>
                <Route element={<AppLayout />} key={i}>
                  <Route path={path} element={Component} />
                </Route>
              </Fragment>
            );
          } else {
            return (
              <Route
                key={i}
                path={path}
                element={<Navigate to={`${process.env.PUBLIC_URL}/products/Consoft`} replace />}
              />
            );
          }
        })}
        <Route path="*" element={<Navigate to={`${process.env.PUBLIC_URL}/products/Consoft`} replace />} />
      </Routes>
    </>
  );
};

export default LayoutRoutes;
