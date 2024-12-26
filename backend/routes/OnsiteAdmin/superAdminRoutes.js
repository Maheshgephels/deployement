const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database'); // Import the database db
const moment = require('moment-timezone');
const verifyToken = require('../api/middleware/authMiddleware');


router.get('/getAllrole', verifyToken, async (req, res) => {
  try {
    // Extract page number, page size, and search query from request query parameters
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const offset = (page - 1) * pageSize;

    const columnsToFetch = ['*'];

    // Construct the base SQL query
    let query = `
          SELECT ${columnsToFetch.join(',')}
          FROM cs_ad_roles Where csa_status = "1"
        `;

    // Append search condition if search query is provided
    let searchCondition = '';
    if (search) {
      searchCondition = `
            WHERE csa_role_name LIKE '%${search}%'
          `;
      query += searchCondition;
    }

    // Append pagination
    query += `
          LIMIT ${pageSize} OFFSET ${offset}
        `;

    // Execute the query to fetch role data from the table
    const [roleData] = await pool.query(query);

    console.log(roleData);

    // Construct the SQL query to count total items with the same search condition
    let totalCountQuery = 'SELECT COUNT(*) AS total FROM cs_ad_roles';
    if (searchCondition) {
      totalCountQuery += searchCondition;
    }

    // Execute the query to get the total count
    const [totalCountResult] = await pool.query(totalCountQuery);
    const totalItems = totalCountResult[0].total;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Send the role data as a response along with pagination metadata
    res.json({ roles: roleData, currentPage: parseInt(page), totalPages, pageSize, totalItems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/getpages', verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    const { roleId } = req.body;

    // Specify the columns you want to fetch from the tables
    const columnsToFetch = ['cs_ad_components_access.*', 'cs_ad_components.cs_component_name','cs_ad_components.product_id'];

    const query = `
    SELECT ${columnsToFetch.join(',')}
    FROM cs_ad_components_access
    INNER JOIN cs_ad_components ON cs_ad_components_access.cs_component_id = cs_ad_components.cs_component_id
    WHERE cs_ad_components_access.csa_role_id = ? 
    AND cs_ad_components.cs_status = 1
`;


    console.log('query', query);
    // Execute the query to fetch pages data for the specified role_id
    const [pagesData] = await pool.query(query, [roleId]);

    // Send the pages data as a response
    res.json(pagesData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

router.get('/getproduct',verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body

    // Specify the columns you want to fetch from the tables
    console.log('query');

    const query = `
     SELECT * FROM cs_ad_products where cs_status ="1"
`;


    console.log('query', query);
    // Execute the query to fetch pages data for the specified role_id
    const [pagesData] = await pool.query(query);

    // Send the pages data as a response
    res.json(pagesData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});



router.post('/updatepermission', verifyToken, async (req, res) => {
  const { RoleId, Component, value, ComponentId } = req.body;

  // Log the received request data for debugging
  console.log('Received update request:');
  console.log('Role ID:', RoleId);
  console.log('Component:', Component);
  console.log('Updated Value:', value);
  console.log('Component ID:', ComponentId);

  // Whitelist of allowed components
  const allowedComponents = ['add', 'validate', 'print', 'edit', 'delete', 'view']; // Add other allowed components as necessary

  if (!allowedComponents.includes(Component)) {
    return res.status(400).json({ message: 'Invalid component' });
  }

  try {
    // Escape the component name to prevent SQL injection
    const escapedComponent = `\`${Component}\``;

    // Construct the SQL query to update the specified field for a specific user and facility
    const query = `
      UPDATE cs_ad_components_access
      SET ${escapedComponent} = ?
      WHERE csa_role_id = ? AND cs_component_id = ?
    `;

    // Execute the query to update the specified field in the database
    const result = await pool.query(query, [value, RoleId, ComponentId]);

    // Send a success response
    res.json({ message: `${Component} updated successfully` });
  } catch (error) {
    // Log any errors that occur
    console.error('Error updating permission:', error);

    // Send an error response
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/updateRole', verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    const { roleName, roleDes, roleId } = req.body;

    console.log(roleDes);

        // Fetch the time zone from cs_tbl_sitesetting table
        const timeZoneQuery = `
        SELECT cs_value 
        FROM cs_tbl_sitesetting 
        WHERE cs_parameter = 'Time Zone'
        LIMIT 1
        `;
        const timeZoneResult = await pool.query(timeZoneQuery);
        const timeZone = timeZoneResult[0][0].cs_value;
    
        // Get the current timestamp in the database's time zone
        const currentTimestamp = moment().tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

    // Corrected SQL query with comma between cs_role_name and role_description
    const updateQuery = `UPDATE cs_ad_roles SET csa_role_name = ?, csa_role_description = ?, updated_at = ? WHERE csa_role_id = ?`;
    await pool.query(updateQuery, [roleName, roleDes, currentTimestamp, roleId]);

    return res.status(200).json({ message: 'Role Update successful' });
  } catch (error) {
    console.error('Error updating role:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});





module.exports = router;