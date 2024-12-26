const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const moment = require('moment-timezone');
const verifyToken = require('../api/middleware/authMiddleware');


// Define the route to fetch Facility data from the cs_os_badgeapp_userlogin
router.get('/getWorkshop', verifyToken, async (req, res) => {
  try {
    // Extract page number, page size, and search query from request query parameters
    const { page = 1, pageSize = 10, search = '', sortColumn = 'cs_workshop_id', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * pageSize;

    const validColumns = ['cs_workshop_id', 'cs_workshop_name', 'cs_status'];  // Add all valid column names here
    const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'cs_workshop_id';


    // Define columns to fetch, including user count
    const columnsToFetch = [
      'cs_os_workshop.*',
      'COUNT(DISTINCT cs_os_users.id) AS userCount'
    ];

    // Construct the SQL query with LEFT JOIN to count users based on cs_workshop_category
    let query = `
      SELECT ${columnsToFetch.join(', ')}
      FROM cs_os_workshop
      LEFT JOIN cs_os_users ON cs_os_workshop.cs_workshop_id = cs_os_users.cs_workshop_category
    `;

    // Append search condition if search query is provided
    if (search) {
      query += `
        WHERE cs_workshop_name LIKE '%${search}%'
      `;
    }

    // Append pagination
    query += `
       GROUP BY cs_os_workshop.cs_workshop_id
      ORDER BY ${columnToSortBy} ${sortOrder}
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    // Execute the query to fetch user data from the table
    const [userData] = await pool.query(query);

    // Send the user data as a response along with pagination metadata
    let totalItems = 0;
    let totalPages = 0;

    if (!search) {
      const totalCountQuery = 'SELECT COUNT(*) AS total FROM cs_os_workshop WHERE cs_status = 1';
      const [totalCountResult] = await pool.query(totalCountQuery);
      totalItems = totalCountResult[0].total;
      totalPages = Math.ceil(totalItems / pageSize);
    }

    res.json({ categories: userData, currentPage: parseInt(page), totalPages, pageSize, totalItems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



router.post('/editworkshop', verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    const { workshopId } = req.body;

    console.log(workshopId);


    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
      SELECT cs_workshop_name, cs_visible_add_user, cs_visible_onspot
      FROM cs_os_workshop
      WHERE cs_workshop_id = ${workshopId};
      `;


    // Execute the query to fetch pages data for the specified role_id
    const [pagesData] = await pool.query(query, [workshopId]);

    // Send the pages data as a response
    res.json(pagesData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/updateworkshop', verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    const { values, workshopId } = req.body;


    const updateQuery = `UPDATE cs_os_workshop SET cs_workshop_name = ?, cs_visible_add_user = ?, cs_visible_onspot = ?  WHERE cs_workshop_id = ?`;
    await pool.query(updateQuery, [values.dName, values.spot, values.spot, workshopId]);

    // Retrieve cs_facility_id from cs_os_facilitytype using the Name
    const selectid = `SELECT cs_facility_id FROM cs_os_workshop WHERE cs_workshop_name = ?`;
    const [selectIdResult] = await pool.query(selectid, [values.dName]);
    const id = selectIdResult[0].cs_facility_id; // Extract cs_facility_id from the result

    //Edit Facility Name
    const updateQuery1 = `UPDATE cs_os_facilitytype SET cs_display_name = ? WHERE cs_facility_id = ${id} `;
    await pool.query(updateQuery1, [values.dName]);


    return res.status(200).json({ message: 'Workshop Updates succesffuly' });
  } catch (error) {
    console.error('Error updating workshop:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/addworkshop', verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    const { wName } = req.body;


    // Construct the SQL query to insert a new role into the cs_tbl_roles table
    const insertQuery = `
        INSERT INTO cs_os_workshop (cs_workshop_name, cs_facility_id)
        VALUES (?, ?)
      `;

    // Execute the query to insert the new role into the cs_tbl_roles table
    await pool.query(insertQuery, [wName, 0]);


    return res.status(200).json({ message: 'Workshop Created succesffuly' });
  } catch (error) {
    console.error('Error updating workshop:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.delete('/deleteworkshop', verifyToken, async (req, res) => {
  const { workshopId, facilityId } = req.body;


  try {
    // Delete from cs_os_workshop table
    const deleteQuery = 'DELETE FROM cs_os_workshop WHERE cs_workshop_id = ?';
    await pool.query(deleteQuery, [workshopId]);

    // Delete from cs_os_workshop table
    const deleteQuery1 = 'DELETE FROM cs_os_facilitytype WHERE cs_facility_id = ?';
    await pool.query(deleteQuery1, [facilityId]);

    // Delete from cs_os_access_status table
    const deleteQuery4 = 'DELETE FROM cs_os_access_status WHERE cs_facility_id = ?';
    await pool.query(deleteQuery4, [facilityId]);

    // Delete from cs_os_facility_detail table
    const deleteQuery2 = `DELETE FROM cs_os_facility_detail WHERE cs_facility_id = ?`;


    // Retrieve cs_facility_detail_id from cs_os_facility_detail
    const selectQuery = `SELECT cs_facility_detail_id FROM cs_os_facility_detail WHERE cs_facility_id = ?`;
    const [detailIdResults] = await pool.query(selectQuery, [facilityId]);

    // Extract cs_facility_detail_id values from the result
    const csFacilityDetailIds = detailIdResults.map(result => result.cs_facility_detail_id);

    console.log(csFacilityDetailIds);

    // Delete from cs_os_facility_category table based on cs_facility_detail_id
    const deleteQuery3 = `DELETE FROM cs_os_facility_category WHERE cs_facility_detail_id = ?`;
    for (const csFacilityDetailId of csFacilityDetailIds) {
      await pool.query(deleteQuery2, [facilityId]);
      await pool.query(deleteQuery3, [csFacilityDetailId]);
    }

    console.log(`Workshop with ID ${workshopId} deleted successfully.`);
    res.status(200).json({ message: 'Workshop deleted successfully' });
  } catch (error) {
    console.error('Error deleting workshop:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.put('/UpdateStatus', verifyToken, async (req, res) => {
  try {
    // Extract workshopId, status, and Name from the request body
    const { workshopId, status, Name } = req.body;


    // Update cs_status in cs_os_workshop
    const updateQuery = `UPDATE cs_os_workshop SET cs_status = ? WHERE cs_workshop_id = ?`;
    await pool.query(updateQuery, [status, workshopId]);

    return res.status(200).json({ message: 'Status Updates successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/check-workshop-name', verifyToken, async (req, res) => {
  const { dName } = req.body;

  try {
    // Execute SQL query to check if email exists in the database
    const [users] = await pool.query('SELECT * FROM cs_os_workshop WHERE cs_workshop_name = ?', [dName]);

    // Check if any user with the provided email exists
    if (users.length > 0) {
      // Email already exists in the database
      res.status(200).json({ available: false });
    } else {
      // Email is available
      res.status(200).json({ available: true });
    }
  } catch (error) {
    console.error('Error checking workshop availability:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});










module.exports = router;