const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const moment = require('moment-timezone');
const verifyToken = require('../api/middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// router.get('/getrole', verifyToken, async (req, res) => {
//     try {
//       // Extract page number, page size, and search query from request query parameters
//       const { page = 1, pageSize = 10, search = '' } = req.query;
//       const offset = (page - 1) * pageSize;
  
//       const columnsToFetch = ['*'];
  
//       // Construct the SQL query to fetch specific columns with pagination and search
//       let query = `
//         SELECT ${columnsToFetch}
//         FROM cs_app_roles
//       `;
  
//       // Append search condition if search query is provided
//       if (search) {
//         query += `
//           AND role_name LIKE '%${search}%'
//         `;
//       }
  
//       // Append pagination
//       query += `
//         LIMIT ${pageSize} OFFSET ${offset}
//       `;
  
//       // Execute the query to fetch category data from the table
//       const [categoryData] = await pool.query(query);
  
//       // Construct the total count query
//       let totalCountQuery = `
//         SELECT COUNT(*) AS total
//         FROM cs_app_roles
//       `;
  
//       // Append search condition if search query is provided
//       if (search) {
//         totalCountQuery += `
//           AND role_name LIKE '%${search}%'
//         `;
//       }
  
//       // Execute the total count query
//       const [totalCountResult] = await pool.query(totalCountQuery);
//       const totalItems = totalCountResult[0].total;
//       const totalPages = Math.ceil(totalItems / pageSize);
  
//       // Send the category data as a response along with pagination metadata
//       res.json({
//         categories: categoryData,
//         currentPage: parseInt(page),
//         totalPages,
//         pageSize,
//         totalItems
//       });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Internal server error' });
//     }
//   });


router.get('/getrole', verifyToken, async (req, res) => {
  try {
    // Extract page number, page size, and search query from request query parameters
    const { page = 1, pageSize = 10, search = '', sortColumn = 'role_id', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * pageSize;

    const validColumns = ['role_id', 'role_name', 'status'];  // Add all valid column names here
    const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'role_id';
  
    const columnsToFetch = '*'; // Assuming you want to fetch all columns
  
    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
      SELECT ${columnsToFetch}
      FROM cs_app_roles
    `;
  
    // Append search condition if search query is provided
    if (search) {
      query += `
        WHERE role_name LIKE ?
      `;
    }
  
    // Append pagination
    query += `
      ORDER BY ${columnToSortBy} ${sortOrder}
      LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}
    `;
  
    // Log the constructed query for debugging
    console.log('Executing query:', query);

    // Execute the query to fetch category data from the table
    const [categoryData] = await pool.query(query, [`%${search}%`]);

    // Log the fetched data
    console.log('Fetched data:', categoryData);

    // Construct the total count query
    let totalCountQuery = `
      SELECT COUNT(*) AS total
      FROM cs_app_roles
    `;
  
    // Append search condition if search query is provided
    if (search) {
      totalCountQuery += `
        WHERE role_name LIKE ?
      `;
    }
  
    // Log the constructed total count query for debugging
    console.log('Executing total count query:', totalCountQuery);

    // Execute the total count query
    const [totalCountResult] = await pool.query(totalCountQuery, [`%${search}%`]);

    // Log the total count result
    console.log('Total count result:', totalCountResult);

    const totalItems = totalCountResult[0].total;
    const totalPages = Math.ceil(totalItems / pageSize);
  
    // Send the category data as a response along with pagination metadata
    res.json({
      categories: categoryData,
      currentPage: parseInt(page),
      totalPages,
      pageSize,
      totalItems
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


  
  router.get('/checkRoleInSessionAndSubsession/:roleId', async (req, res) => {
    const roleId = req.params.roleId;
    console.log("roleId", roleId);

    try {
        const [sessionResult] = await pool.query('SELECT COUNT(*) as count FROM cs_app_session_role_details WHERE role_id = ?', [roleId]);
        const [subSessionResult] = await pool.query('SELECT COUNT(*) as count FROM cs_app_subsessios_role_details WHERE role_id = ?', [roleId]);

        const roleExistsInSession = sessionResult[0].count > 0;
        const roleExistsInSubSession = subSessionResult[0].count > 0;

        console.log("roleExistsInSession", roleExistsInSession);
        console.log("roleExistsInSubSession", roleExistsInSubSession);

        const exists = roleExistsInSession || roleExistsInSubSession;

        res.json({ exists });
    } catch (error) {
        console.error('Error checking role in session and subsession tables:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



router.put('/UpdateStatus',verifyToken, async (req, res) => {
    try {
      // Extract workshopId, status, and Name from the request body
      console.log(req.body);
      const {Id, status} = req.body;
  
  
  
      // Update cs_status in cs_os_workshop
      const updateQuery = `UPDATE cs_app_roles SET status = ? WHERE role_id = ?`;
      await pool.query(updateQuery, [status,  Id]);
  
      // Update cs_status in cs_os_facilitytyp
      return res.status(200).json({ message: 'Status Updates successfully' });
    } catch (error) {
      console.error('Error updating status:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });


  router.delete('/deleterole',verifyToken, async (req, res) => {
    const {catId} = req.body;
  
  
    try {
      // Delete from cs_os_workshop table
      const deleteQuery = 'DELETE FROM cs_app_roles WHERE role_id = ?';
      await pool.query(deleteQuery, [catId]);

      res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
      console.error('Error deleting workshop:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  router.post('/check-role', verifyToken, async (req, res) => {
    const { catName } = req.body;
  
    console.log(catName);
    try {
      // Execute SQL query to check if email exists in the database
      const [users] = await pool.query('SELECT * FROM cs_app_roles WHERE role_name = ?', [catName]);
  
      // Check if any user with the provided email exists
      if (users.length > 0) {
        // Email already exists in the database
        res.status(200).json({ available: false });
      } else {
        // Email is available
        res.status(200).json({ available: true });
      }
    } catch (error) {
      console.error('Error checking email availability:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });


  router.post('/addrole', verifyToken, async (req, res) => {
    try {
        console.log(req.body);
        const { catName } = req.body;

        // Construct the SQL query to insert a new role
        const insertCategoryQuery = `
          INSERT INTO cs_app_roles (role_name)
          VALUES (?)
        `;

        // Execute the query to insert the new role
        await pool.query(insertCategoryQuery, [catName]);

        return res.status(200).json({ message: 'Role created successfully' });
    } catch (error) {
        console.error('Error creating role:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Duplicate entry' });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
});



router.post('/editRole', verifyToken, async (req, res) => {
  try {
    // Extract catId from the request body
    const { catId } = req.body;
    console.log(req.body);

    // Construct the SQL query to select data based on role_id
    const query = `
      SELECT * FROM cs_app_roles WHERE role_id = ?
    `;

    // Execute the query to fetch data
    const [categoryData] = await pool.query(query, [catId]);

    // Log cs_designation_name if you need to debug
    // categoryData.forEach(category => {
    //   console.log('cs_designation_name:', category.cs_designation_name);
    // });

    // Send the data as a response
    res.json(categoryData);
  } catch (error) {
    console.error('Error fetching role data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/updateRole', verifyToken, async (req, res) => {
  try {
    // Extract data from the request body
    const { catId, RoleName } = req.body;
    console.log(req.body);

    // Construct the SQL query to update the role
    const updateQuery = `
      UPDATE cs_app_roles
      SET role_name = ?
      WHERE role_id = ?
    `;

    // Execute the query to update the role
    const [result] = await pool.query(updateQuery, [RoleName, catId]);

    // Check if any rows were affected
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Send success response
    res.status(200).json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});




module.exports = router;