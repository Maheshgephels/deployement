// src/contexts/PermissionsContext.js
import React, { createContext, useState, useEffect } from 'react';

// Create the permissions context
export const PermissionsContext = createContext();

// Define the PermissionsContextProvider component
export const PermissionsContextProvider = ({ children }) => {

// Mahesh Changes

  // State to hold the permissions data
  const [permissions, setPermissions] = useState({});

  console.log("Permissions on context page:", permissions);
 
  useEffect(() => {
    // Retrieve permissions data from local storage when component mounts
    const storedPermissions = localStorage.getItem('permissions');
    if (storedPermissions) {
      const parsedPermissions = JSON.parse(storedPermissions);
      console.log('Retrieved permissions context page:', parsedPermissions);
      setPermissions(parsedPermissions);
    }
  }, []);
  
    // Function to update permissions data in local storage
    const updatePermissions = (newPermissions) => {
      localStorage.setItem('permissions', JSON.stringify(newPermissions));
      setPermissions(newPermissions);
    };

  return (
    <PermissionsContext.Provider value={{ permissions, updatePermissions }}>
      {children}
    </PermissionsContext.Provider>
  );
};
