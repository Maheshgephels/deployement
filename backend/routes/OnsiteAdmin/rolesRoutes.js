const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database'); // Import the database db
const moment = require('moment-timezone');
const verifyToken = require('../api/middleware/authMiddleware');


//fetch Roles data from the cs_os_roles
router.get('/getRoles', verifyToken, async (req, res) => {
  try {
    // Specify the columns you want to fetch from the table
    const columnsToFetch = ['*'];

    // Construct the SQL query to fetch specific columns
    const query = `SELECT ${columnsToFetch.join(',')} FROM cs_os_roles WHERE cs_status = 1`;

    // Execute the query to fetch user data from the table
    const [userData] = await pool.query(query);

    // Send the user data as a response
    res.json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/getAllrole', verifyToken, async (req, res) => {
  try {
    // Extract page number, page size, and search query from request query parameters
    const { page = 1, pageSize = 10, search = '', sortColumn = 'cs_role_id', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * pageSize;

    const validColumns = ['cs_role_id', 'cs_role_name', 'created_at', 'cs_status'];  // Add all valid column names here
    const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'cs_role_id';

    const columnsToFetch = ['*'];

    // Construct the base SQL query
    let query = `
        SELECT ${columnsToFetch.join(',')}
        FROM cs_os_roles
      `;

    // Append search condition if search query is provided
    let searchCondition = '';
    if (search) {
      searchCondition = `
          WHERE cs_role_name LIKE '%${search}%'
        `;
      query += searchCondition;
    }

    // Append pagination
    query += `
        ORDER BY ${columnToSortBy} ${sortOrder}
        LIMIT ${pageSize} OFFSET ${offset}
      `;

    // Execute the query to fetch role data from the table
    const [roleData] = await pool.query(query);

    console.log(roleData);

    // Construct the SQL query to count total items with the same search condition
    let totalCountQuery = 'SELECT COUNT(*) AS total FROM cs_os_roles';
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




router.put('/updateStatus', verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    const { id, status } = req.body;

    const updateQuery = `UPDATE cs_os_roles SET cs_status = ? WHERE cs_role_id = ?`;
    await pool.query(updateQuery, [status, id]);




    return res.status(200).json({ message: 'Status Updates succesffuly' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/updateRole', verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    const { roleName, roleDes, roleId } = req.body;

    console.log(roleDes);


    // Corrected SQL query with comma between cs_role_name and role_description
    const updateQuery = `UPDATE cs_os_roles SET cs_role_name = ?, role_description = ? WHERE cs_role_id = ?`;
    await pool.query(updateQuery, [roleName, roleDes, roleId]);

    return res.status(200).json({ message: 'Role Update successful' });
  } catch (error) {
    console.error('Error updating role:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});



router.put('/deleterole', verifyToken, async (req, res) => {
  const { Id, newRoleid } = req.body;

  console.log(req.body);

  try {


    // Update cs_os_badgeapp_userlogin table
    const updateQuery = 'UPDATE cs_os_badgeapp_userlogin SET cs_role_id = ? WHERE cs_role_id = ?';
    await pool.query(updateQuery, [newRoleid, Id]);

    // Delete from cs_os_roles table
    const deleteRolesQuery = 'DELETE FROM cs_os_roles WHERE cs_role_id = ?';
    await pool.query(deleteRolesQuery, [Id]);

    // Delete from cs_os_access_status table
    const deleteAccessQuery = 'DELETE FROM cs_os_access_status WHERE cs_role_id = ?';
    await pool.query(deleteAccessQuery, [Id]);

    res.status(200).json({ message: `Role with ID ${Id} deleted successfully.` });
    console.log(`Role with ID ${Id} deleted successfully.`);
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Define the route to fetch Roles data from the cs_os_roles
router.get('/getpermission', verifyToken, async (req, res) => {
  try {
    // Specify the columns you want to fetch from the table
    const columnsToFetch = ['*'];

    // Construct the SQL query to fetch specific columns
    const query = `SELECT ${columnsToFetch.join(',')} FROM cs_os_facilitytype WHERE cs_os_facilitytype.cs_status IN (1, 2)
          ORDER BY cs_os_facilitytype.cs_status ASC `;

    // Execute the query to fetch user data from the table
    const [userData] = await pool.query(query);

    // Send the user data as a response
    res.json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/addrole', verifyToken, async (req, res) => {
  try {
    const { role_name, role_description, permissions } = req.body;

    // Check if role_name, role_description, and permissions are provided
    if (!role_name || !permissions) {
      return res.status(400).json({ message: 'Role name, description, and permissions are required.' });
    }

    // Construct the SQL query to insert a new role into the cs_os_roles table
    const insertRoleQuery = `
          INSERT INTO cs_os_roles (cs_role_name, role_description)
          VALUES (?, ?)
        `;

    // Execute the query to insert the new role into the cs_os_roles table
    await pool.query(insertRoleQuery, [role_name, role_description]);

    // Retrieve the last inserted role_id
    const roleIdResult = await pool.query('SELECT LAST_INSERT_ID() AS cs_role_id FROM cs_os_roles');
    const roleId = roleIdResult[0][0].cs_role_id;

    // Construct the SQL query to insert the new role_id and corresponding access status into the cs_os_access_status table
    const insertAccessQuery = `
        INSERT INTO cs_os_access_status (cs_role_id, cs_facility_id, cs_read_search, cs_validate, cs_add, cs_edit, cs_delete, cs_print, cs_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

    // Iterate over the permissions array and insert access status for each facility
    for (const permission of permissions) {
      const { cs_facility_id, cs_read_search, cs_validate, cs_add, cs_edit, cs_delete, cs_print, cs_count } = permission;
      await pool.query(insertAccessQuery, [roleId, cs_facility_id, cs_read_search, cs_validate, cs_add, cs_edit, cs_delete, cs_print, cs_count]);
    }

    res.status(201).json({ message: 'Role and corresponding access status added successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
});


router.post('/getpages', verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    const { roleId } = req.body;

    // Specify the columns you want to fetch from the tables
    const columnsToFetch = ['cs_os_access_status.*', 'cs_os_facilitytype.cs_display_name', 'cs_os_facilitytype.cs_type'];

    const query = `
        SELECT ${columnsToFetch.join(',')}
        FROM cs_os_access_status
        INNER JOIN cs_os_facilitytype ON cs_os_access_status.cs_facility_id = cs_os_facilitytype.cs_facility_id
        WHERE cs_os_access_status.cs_role_id = ? 
        AND cs_os_facilitytype.cs_status IN (1, 2)
        ORDER BY cs_os_facilitytype.cs_status ASC
      `;

    // Execute the query to fetch pages data for the specified role_id
    const [pagesData] = await pool.query(query, [roleId]);

    // Send the pages data as a response
    res.json(pagesData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/updatepermission', verifyToken, async (req, res) => {
  const { userId, pageId, field, value, facilityId } = req.body;

  try {
    // Log the received request data for debugging
    console.log('Received update request:');
    console.log('User ID:', userId);
    console.log('Page ID:', pageId);
    console.log('Field:', field);
    console.log('Updated Value:', value);
    console.log('Facility ID:', facilityId);

    // Perform data validation if necessary
    if (!userId || !field || !value || !facilityId) {
      throw new Error('Missing required fields');
    }

    // Construct the SQL query to update the specified field for a specific user and facility
    const query = `
          UPDATE cs_os_access_status
          SET ${field} = ?
          WHERE cs_role_id = ? AND cs_facility_id = ?
      `;

    // Execute the query to update the specified field in the database
    const result = await pool.query(query, [value, userId, facilityId]);

    // Send a success response
    res.json({ message: `${field} updated successfully` });
  } catch (error) {
    // Log any errors that occur
    console.error('Error updating permission:', error);

    // Send an error response
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Define other admin-related routes here

router.post('/check-role-name',verifyToken, async (req, res) => {
  const { rName } = req.body;

  try {
    // Execute SQL query to check if email exists in the database
    const [users] = await pool.query('SELECT * FROM cs_os_roles WHERE cs_role_name = ?', [rName]);

    // Check if any user with the provided email exists
    if (users.length > 0) {
      // Email already exists in the database
      res.status(200).json({ available: false });
    } else {
      // Email is available
      res.status(200).json({ available: true });
    }
  } catch (error) {
    console.error('Error checking facility availability:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/getRole', verifyToken, async (req, res) => {
  try {


    const columnsToFetch = ['*'];

    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
    SELECT ${columnsToFetch}
    FROM cs_os_roles
    WHERE cs_status = 1
  `;
    // Execute the query to fetch field data from the table
    const [roleData] = await pool.query(query);

    let query1 = `
    SELECT cs_role_id
    FROM cs_os_badgeapp_userlogin
  `;
    // Execute the query to fetch field data from the table
    const [loginData] = await pool.query(query1);



    res.json({ role: roleData, login: loginData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports = router;
