const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const multer = require('multer');
const verifyToken = require('../api/middleware/authMiddleware');


// Define the route to fetch Facility data from the cs_os_badgeapp_userlogin
// router.get('/getappuserlogin',verifyToken, async (req, res) => {
//   console.log(req.query);
//   try {
//     // Extract page number, page size, and search query from request query parameters
//     const { sortColumn = 'id', sortOrder = 'DESC' } = req.query;
//     const page = parseInt(req.query.page) || 1;
//     const pageSize = parseInt(req.query.pageSize) || 10;
//     const search = req.query.search || '';
//     const offset = (page - 1) * pageSize;

//     const validColumns = ['id', 'cs_username', 'cs_status', 'created_at', 'cs_valid_upto', 'cs_login_time', 'cs_role_id'];  // Add all valid column names here
//     const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'id';

//     // Construct the SQL query to fetch specific columns with pagination and search
//     let baseQuery = `
//       SELECT u.*, r.cs_role_name, l.cs_device_id AS logged_in_device_id, l.cs_login_time
//       FROM cs_os_badgeapp_userlogin u
//       LEFT JOIN cs_os_roles r ON u.cs_role_id = r.cs_role_id
//       LEFT JOIN cs_os_logedin_users l ON u.cs_username = l.cs_username
//     `;

//     // Append search condition if search query is provided
//     let searchCondition = '';
//     const searchParams = [];
//     if (search) {
//       searchCondition = `
//         WHERE 
//           u.cs_username LIKE ? OR 
//           u.cs_email LIKE ? OR 
//           r.cs_role_name LIKE ? OR 
//           l.cs_device_id LIKE ? OR 
//           u.created_at LIKE ? OR 
//           u.cs_valid_upto LIKE ? OR
//           l.cs_login_time LIKE ?
//       `;
//       const searchWildcard = `%${search}%`;
//       searchParams.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard, searchWildcard, searchWildcard, searchWildcard);
//     }

//     // Combine base query with search condition and pagination
//     // let query = `${baseQuery} ${searchCondition} LIMIT ? OFFSET ?`;
//     // query += `ORDER BY ${columnToSortBy} ${sortOrder}`;

//     let query = `${baseQuery} ${searchCondition} LIMIT ? OFFSET ? `;
// query += `ORDER BY ${columnToSortBy} ${sortOrder}`;
//     searchParams.push(pageSize, offset);

//     // Execute the query to fetch user data from the table
//     const [userData] = await pool.query(query, searchParams);

//     // Construct the SQL query to count total items with the same search condition
//     const totalCountQuery = `SELECT COUNT(*) AS total FROM (${baseQuery} ${searchCondition}) AS subquery`;
//     const [totalCountResult] = await pool.query(totalCountQuery, searchParams.slice(0, -2)); // Remove LIMIT and OFFSET params for count query

//     const totalItems = totalCountResult[0].total;
//     const totalPages = Math.ceil(totalItems / pageSize);

//     // Send the user data as a response along with pagination metadata
//     res.json({ facilities: userData, currentPage: page, totalPages, pageSize, totalItems });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

router.get('/getappuserlogin', verifyToken, async (req, res) => {
  console.log("Login", req.query);
  try {
    const { sortColumn = 'id', sortOrder = 'DESC' } = req.query;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * pageSize;

    const validColumns = ['id', 'cs_username', 'cs_status', 'created_at', 'cs_valid_upto', 'cs_login_time', 'cs_role_id', 'logged_in_device_id'];
    const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'id';

    // Base query with initial WHERE clause
    let baseQuery = `
      SELECT u.*, r.cs_role_name, l.cs_device_id AS logged_in_device_id, l.cs_login_time
      FROM cs_os_badgeapp_userlogin u
      LEFT JOIN cs_os_roles r ON u.cs_role_id = r.cs_role_id
      LEFT JOIN cs_os_logedin_users l ON u.cs_username = l.cs_username
      WHERE u.cs_adminaccess = 1
    `;

    // Append search condition if search query is provided
    const searchParams = [];
    if (search) {
      baseQuery += `
    AND (
      u.cs_username LIKE ? OR 
      r.cs_role_name LIKE ? OR 
      l.cs_device_id LIKE ?
    )
  `;
      const searchWildcard = `%${search}%`;
      searchParams.push(searchWildcard, searchWildcard, searchWildcard);
    }


    // Combine base query with ordering and pagination
    const query = `${baseQuery} ORDER BY ${columnToSortBy} ${sortOrder} LIMIT ? OFFSET ?`;

    searchParams.push(pageSize, offset);

    // Execute the query to fetch user data
    const [userData] = await pool.query(query, searchParams);

    // Query for total count with the same search condition (without LIMIT and OFFSET)
    const totalCountQuery = `SELECT COUNT(*) AS total FROM (${baseQuery}) AS subquery`;
    const [totalCountResult] = await pool.query(totalCountQuery, searchParams.slice(0, -2));

    const totalItems = totalCountResult[0].total;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Send the response
    res.json({ facilities: userData, currentPage: page, totalPages, pageSize, totalItems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});






// DELETE endpoint to delete a user login record by ID
router.delete('/RemoveAppUser/:id', verifyToken, async (req, res) => {
  const id = req.params.id;

  try {
    // Perform the deletion operation in the database
    await pool.query('DELETE FROM cs_os_badgeapp_userlogin WHERE id = ?', [id]);
    res.status(200).json({ message: 'User login record deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user login record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.put('/updateStatus', verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    const { id, status } = req.body;

    const updateQuery = `UPDATE cs_os_badgeapp_userlogin SET cs_status = ? WHERE id = ?`;
    await pool.query(updateQuery, [status, id]);




    return res.status(200).json({ message: 'Status Updates succesffuly' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});



// Define the route to store data in cs_os_badgeapp_userlogin
router.post('/storeappuserlogin', verifyToken, async (req, res) => {
  try {
    // Extract data from the request body
    let { uName, pass, email, expiry, roleid, spotnumber } = req.body;

    console.log('Expiry before processing:', expiry); // Log expiry before processing

    const status = 1;

    // Check if all required fields are provided
    if (!uName || !pass || !email || !expiry || !roleid || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Convert expiry date from "YYYY-MM-DD" to "DD-MM-YYYY"
    const parts = expiry.split('-');
    const formattedExpiry = `${parts[2]}-${parts[1]}-${parts[0]}`;

    // Construct the SQL query to insert data into cs_os_badgeapp_userlogin
    const query = `
            INSERT INTO cs_os_badgeapp_userlogin (cs_username, cs_password, cs_email, cs_valid_upto, cs_role_id, cs_regno_start)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

    // Execute the query to insert data into the table
    await pool.query(query, [uName, pass, email, formattedExpiry, roleid, spotnumber]);

    // Send success response
    res.status(201).json({ message: 'Data stored successfully in cs_os_badgeapp_userlogin' });
  } catch (error) {
    console.error('Error storing data in cs_os_badgeapp_userlogin:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


//Edit
router.post('/updateLogin', verifyToken, async (req, res) => {
  try {
    const { cs_id, cs_role_id, cs_email, uName, cs_valid_upto, cs_regno_start, cs_password } = req.body;

    // Construct the update query dynamically
    let updateQuery = `UPDATE cs_os_badgeapp_userlogin SET `;
    const updateParams = [];
    const updateValues = [];

    // Check each parameter and add it to the update query if it exists
    if (cs_role_id) {
      updateQuery += `cs_role_id = ?, `;
      updateParams.push(cs_role_id);
    }
    if (cs_email) {
      updateQuery += `cs_email = ?, `;
      updateParams.push(cs_email);
    }
    if (uName) {
      updateQuery += `cs_username = ?, `;
      updateParams.push(uName);
    }
    if (cs_valid_upto) {
      updateQuery += `cs_valid_upto = ?, `;
      updateParams.push(cs_valid_upto);
    }
    if (cs_regno_start) {
      updateQuery += `cs_regno_start = ?, `;
      updateParams.push(cs_regno_start);
    }
    if (cs_password) {
      updateQuery += `cs_password = ?, `;
      updateParams.push(cs_password);
    }


    // Remove the trailing comma and add the WHERE clause
    updateQuery = updateQuery.slice(0, -2) + ` WHERE id = ?`;
    updateParams.push(cs_id);

    // Execute the query
    await pool.query(updateQuery, [...updateParams, cs_id]);

    return res.status(200).json({ message: 'User login updated successfully' });
  } catch (error) {
    console.error('Error updating user login:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});





// DELETE endpoint to delete a user login record by ID
router.delete('/LogoutUser/:Username', verifyToken, async (req, res) => {
  const { Username } = req.params;

  try {
    // Perform the deletion operation in the database
    await pool.query('DELETE FROM cs_os_logedin_users WHERE cs_username = ?', [Username]);
    res.status(200).json({ message: 'User Logout successfully.' });
  } catch (error) {
    console.error('Error deleting user login record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//Edit App User Login

router.post('/editlogin', verifyToken, async (req, res) => {
  const { cs_id } = req.body;


  try {

    const columnsToFetch = ['*'];

    const query = `
      SELECT ${columnsToFetch.join(',')}
      FROM cs_os_badgeapp_userlogin
      WHERE id = ? 
    `;

    // Execute the query to fetch pages data for the specified role_id
    const [loginData] = await pool.query(query, [cs_id]);


    console.log(loginData);
    // Send the pages data as a response
    res.json(loginData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/check-user-name', verifyToken, async (req, res) => {
  const { uName } = req.body;

  console.log(req.body);
  try {
    // Execute SQL query to check if email exists in the database
    const [users] = await pool.query('SELECT * FROM cs_os_badgeapp_userlogin WHERE cs_username = ?', [uName]);

    // Check if any user with the provided email exists
    if (users.length > 0) {
      // Email already exists in the database
      res.status(200).json({ available: false });
    } else {
      // Email is available
      res.status(200).json({ available: true });
    }
  } catch (error) {
    console.error('Error checking username availability:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



router.post('/check-facility-name', verifyToken, async (req, res) => {
  const { dName } = req.body;

  try {
    // Execute SQL query to check if email exists in the database
    const [users] = await pool.query('SELECT * FROM cs_os_facilitytype WHERE cs_display_name = ?', [dName]);

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



module.exports = router;