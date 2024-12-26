import React, { Fragment, useEffect, useState, useContext } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { routes } from './Routes';
import AppLayout from '../Layout/Layout';
import axios from 'axios';
import { BackendAPI } from '../api';
import { PermissionsContext } from '../contexts/PermissionsContext'; 

const LayoutRoutes = () => {
  const location = useLocation();
  const [accessibleProducts, setAccessibleProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { permissions } = useContext(PermissionsContext);

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
    // console.log("path", path);
    const match = path.match(/^\/([^/]+)\/([^/]+)/); // Matches the first two segments after the root
    // console.log("match", match);
    return match ? match[1] : ''; // Return the first segment as product_value
  };

  // const getProductValueFromPath = (path) => {
  //   // Remove '/admin/' part if it exists
  //   const pathWithoutAdmin = path.replace(/^\/admin\//, ''); // Removes '/admin/' only at the start of the path
    
  //   // Match the first segment after removing '/admin/'
  //   const match = pathWithoutAdmin.match(/^([^/]+)/); // Match the first segment after '/admin/' is removed
    
  //   return match ? match[1] : ''; // Return the first segment as the product value
  // };
  

  const hasComponentPermission = (Component) => {
    const componentType = Component.type; // Access the 'type' property of the React element
    const componentName = componentType?.name; // Get the component's name
  
    // console.log("Component Name:", componentName); // Log the component name
  
    const componentPermissions = permissions[componentName]; // Assuming Component's name is its key in permissions
  
    if (componentPermissions) {
      // If permissions are found, check if 'view' is 1
      return componentPermissions.view === 1;
    } else {
      // If no permissions are found, grant access by default
      return true;
    }
  };
  

 // Get the current product value from the URL
 const currentProductValue = getProductValueFromPath(location.pathname);

  console.log("currentProductValue", currentProductValue);
 

  if (loading) {
    // return <div>Loading...</div>;
    return;
  }

  return (
    <>
      <Routes>
        {routes.map(({ path, Component }, i) => {
          // if (isProductAccessible(currentProductValue)) {
            if (isProductAccessible(currentProductValue) && hasComponentPermission(Component)) {
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
