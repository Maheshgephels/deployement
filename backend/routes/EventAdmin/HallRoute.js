const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const moment = require('moment-timezone');
const multer = require('multer');
const path = require('path');
const verifyToken = require('../api/middleware/authMiddleware');
const { Console } = require('console');


// router.get('/getHall', verifyToken, async (req, res) => {
//     try {
//       // Extract page number, page size, and search query from request query parameters
//       const { page = 1, pageSize = 10, search = '' } = req.query;
//       const offset = (page - 1) * pageSize;

//       const columnsToFetch = ['*'];

//       // Construct the SQL query to fetch specific columns with pagination and search
//       let query = `
//         SELECT ${columnsToFetch}
//         FROM cs_app_location_hall
//       `;

//       // Append search condition if search query is provided
//       if (search) {
//         query += `
//           WHERE locat_name LIKE '%${search}%'
//         `;
//       }

//       // Append the ORDER BY clause
//       query += `
//         ORDER BY locat_id DESC
//       `;

//       // Append pagination
//       query += `
//         LIMIT ${pageSize} OFFSET ${offset}
//       `;

//       // Execute the query to fetch user data from the table
//       const [userData] = await pool.query(query);

//       // Send the user data as a response along with pagination metadata
//       let totalItems = 0;
//       let totalPages = 0;

//       if (!search) {
//         const totalCountQuery = 'SELECT COUNT(*) AS total FROM cs_app_location_hall';
//         const [totalCountResult] = await pool.query(totalCountQuery);
//         totalItems = totalCountResult[0].total;
//         totalPages = Math.ceil(totalItems / pageSize);
//       }

//       res.json({ categories: userData, currentPage: parseInt(page), totalPages, pageSize, totalItems });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Internal server error' });
//     }
//   });


router.get('/getHall', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = '', sortColumn = 'locat_id', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * pageSize;

    console.log(sortColumn);
    console.log(pageSize);

    const validColumns = ['locat_id', 'locat_name', 'hall_type_name', 'status'];
    const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'locat_id';

    const columnsToFetch = [
      'cs_app_location_hall.*',
      'cs_app_hall_type.hall_type_name'
    ];

    let query = `
      SELECT ${columnsToFetch.join(', ')}
      FROM cs_app_location_hall
      JOIN cs_app_hall_type ON cs_app_location_hall.locat_type = cs_app_hall_type.hall_type_id
    `;

    // Append search condition if search query is provided
    if (search) {
      query += `
        WHERE cs_app_location_hall.locat_name LIKE '%${search}%' OR hall_type_name LIKE '%${search}%'
      `;
    }

    // Append ORDER BY clause using columnToSortBy and sortOrder from query parameters
    query += `
      ORDER BY ${columnToSortBy} ${sortOrder}
    `;

    // Append pagination
    query += `
      LIMIT ? OFFSET ?
    `;

    const queryParams = [parseInt(pageSize), parseInt(offset)];

    const [userData] = await pool.query(query, queryParams);

    let totalItems = 0;
    let totalPages = 0;

    if (!search) {
      const totalCountQuery = 'SELECT COUNT(*) AS total FROM cs_app_location_hall';
      const [totalCountResult] = await pool.query(totalCountQuery);
      totalItems = totalCountResult[0].total;
      totalPages = Math.ceil(totalItems / pageSize);
    }

    res.json({
      categories: userData,
      currentPage: parseInt(page),
      totalPages,
      pageSize: parseInt(pageSize),
      totalItems,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/getMappedHallId', verifyToken, async (req, res) => {
  try {
    const getStorageQuery = `SELECT local_hall_position FROM cs_app_storage WHERE id = ?`;
    const [rows] = await pool.query(getStorageQuery, [1]);

    // Check if rows are returned
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No storage data found.' });
    }

    const locationPosition = JSON.parse(rows[0].local_hall_position); // Parse the local_position JSON

    // console.log("Location", locationPosition);

    // Function to get IDs with lat and lng as integers
    const getIdsWithCoordinates = (location) => {
      const ids = [];
      Object.entries(location).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          // Check for coordinates in geometry
          if (value.geometry && value.geometry.coordinates) {
            ids.push(parseInt(key, 10)); // Convert the outer ID to an integer
          }
        }
      });
      return ids;
    };

    // Get the IDs where lat and lng are defined
    const mapedid = getIdsWithCoordinates(locationPosition);

    console.log("Mapped ID", mapedid); // Should now log [1, 3]

    // Send response
    res.json({ mapedid });
  } catch (error) {
    console.error("Error fetching mapped ID:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});






router.put('/UpdateStatus', verifyToken, async (req, res) => {
  try {
    // Extract HallId and status from the request body
    console.log(req.body);
    const { HallId, status } = req.body;

    // Update the status in the cs_app_location_hall table
    const updateQuery = `UPDATE cs_app_location_hall SET status = ? WHERE locat_id = ?`;
    await pool.query(updateQuery, [status, HallId]);

    // If status is 0, remove the entry from the cs_app_storage table
    if (status === 0) {
      // Fetch the current local_hall_position from cs_app_storage
      const getStorageQuery = `SELECT local_hall_position FROM cs_app_storage WHERE id = ?`;
      const [rows] = await pool.query(getStorageQuery, [1]);

      if (rows.length > 0) {
        const localHallPosition = JSON.parse(rows[0].local_hall_position); // Corrected field name

        console.log("Local Hall Position", localHallPosition);

        // Delete the hall position based on HallId
        if (localHallPosition[HallId]) {
          delete localHallPosition[HallId]; // Remove the hall entry with HallId
        }

        // Update the local_hall_position back in the database after deletion
        const updatedLocalHallPosition = JSON.stringify(localHallPosition);
        console.log("Updated Local Hall Position", updatedLocalHallPosition);

        const updateStorageQuery = `UPDATE cs_app_storage SET local_hall_position = ? WHERE id = ?`;
        await pool.query(updateStorageQuery, [updatedLocalHallPosition, 1]);
      }
    }

    // Respond with success message
    return res.status(200).json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.delete('/deleteHall', verifyToken, async (req, res) => {
  const { HallId } = req.body;

  try {
    // Delete from cs_os_workshop table
    const deleteQuery = 'DELETE FROM cs_app_location_hall WHERE locat_id = ?';
    await pool.query(deleteQuery, [HallId]);

    const deleteSessionQuery = 'DELETE FROM cs_app_session WHERE locat_id = ?';
    await pool.query(deleteSessionQuery, [HallId]);

    // Delete from cs_app_session_role_details table
    const deleteSessionRoleDetailsQuery = 'DELETE FROM cs_app_session_role_details WHERE locat_id = ?';
    await pool.query(deleteSessionRoleDetailsQuery, [HallId]);

    // Delete from cs_app_subsessions table
    const deleteSubsessionsQuery = 'DELETE FROM cs_app_subsessions WHERE locat_id = ?';
    await pool.query(deleteSubsessionsQuery, [HallId]);

    // Delete from cs_app_subsessions_role_details table
    const deleteSubsessionsRoleDetailsQuery = 'DELETE FROM cs_app_subsessios_role_details WHERE locat_id = ?';
    await pool.query(deleteSubsessionsRoleDetailsQuery, [HallId]);

    // Fetch the current local_hall_position from cs_app_storage
    const getStorageQuery = `SELECT local_hall_position FROM cs_app_storage WHERE id = ?`;
    const [rows] = await pool.query(getStorageQuery, [1]);

    if (rows.length > 0) {
      const localHallPosition = JSON.parse(rows[0].local_hall_position);

      console.log("Local Hall Position", localHallPosition);

      // Delete the hall position based on HallId
      if (localHallPosition[HallId]) {
        delete localHallPosition[HallId]; // Remove the hall entry with HallId
      }

      // Update the local_hall_position back in the database after deletion
      const updatedLocalHallPosition = JSON.stringify(localHallPosition);
      console.log("Updated Local Hall Position", updatedLocalHallPosition);

      const updateStorageQuery = `UPDATE cs_app_storage SET local_hall_position = ? WHERE id = ?`;
      await pool.query(updateStorageQuery, [updatedLocalHallPosition, 1]);
    }

    // If everything went well, send a success response
    res.status(200).json({ message: 'Hall and related data deleted successfully' });

  } catch (error) {
    console.error('Error deleting hall:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/addHall', verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    console.log(req.body);
    const { dName, description, halltype } = req.body;


    // Construct the SQL query to insert a new role into the cs_tbl_roles table
    const insertQuery = `
          INSERT INTO cs_app_location_hall (locat_name,description,locat_type)
          VALUES (?, ?, ?)
        `;

    // Execute the query to insert the new role into the cs_tbl_roles table
    await pool.query(insertQuery, [dName, description, halltype.value]);


    return res.status(200).json({ message: 'Hall Created succesffuly' });
  } catch (error) {
    console.error('Error updating workshop:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/editHall', verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    const { HallId } = req.body;



    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
        SELECT *
        FROM cs_app_location_hall
        WHERE locat_id = ${HallId};
        `;


    // Execute the query to fetch pages data for the specified role_id
    const [pagesData] = await pool.query(query, [HallId]);


    // Send the pages data as a response
    res.json(pagesData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/updateHall', verifyToken, async (req, res) => {
  try {
    console.log(req.body);
    const { values, HallId } = req.body;

    // Corrected update query with comma between description and locat_type
    const updateQuery = `UPDATE cs_app_location_hall SET locat_name = ?, description = ?, locat_type = ? WHERE locat_id = ?`;
    await pool.query(updateQuery, [values.dName, values.Description, values.halltype, HallId]);

    return res.status(200).json({ message: 'Workshop updated successfully' });
  } catch (error) {
    console.error('Error updating workshop:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});



router.post('/check-Hall-name', verifyToken, async (req, res) => {
  const { dName } = req.body;

  try {
    // Execute SQL query to check if email exists in the database
    const [users] = await pool.query('SELECT * FROM cs_app_location_hall WHERE locat_name = ?', [dName]);

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


router.get('/getDropdownData', verifyToken, async (req, res) => {
  try {
    // Specify the columns you want to fetch from each table
    const facilitytype = ['cs_type'];
    const prefix = ['cs_prefix', 'cs_prefix_id'];
    const country = ['cs_country', 'cs_countryCode'];
    const states = ['cs_state_name', 'cs_state_id', 'cs_country_id'];
    const reg_cat = ['cs_reg_category', 'cs_reg_cat_id'];
    const work_cat = ['cs_workshop_name', 'cs_workshop_id'];
    const day_type = ['cs_reg_daytype_name', 'cs_reg_daytype_id'];
    const facultytype = ['type_title', 'facultytype_id'];
    const halltype = ['hall_type_name', 'hall_type_id'];

    const custom_data = ['cs_field_option', 'cs_field_option_value, cs_field_option_id, cs_field_id'];


    // Execute each query to fetch data from respective tables
    const [facilitytypeData] = await pool.query(`SELECT ${facilitytype.join(',')} FROM cs_os_facilitytype`);
    const [prefixData] = await pool.query(`SELECT ${prefix.join(',')} FROM cs_os_name_prefixes`);
    const [countryData] = await pool.query(`SELECT ${country.join(',')} FROM cs_tbl_country`);
    const [statesData] = await pool.query(`SELECT ${states.join(',')} FROM cs_tbl_states`);
    const [regCatData] = await pool.query(`SELECT ${reg_cat.join(',')} FROM cs_os_category WHERE cs_status = 1`);
    const [workshopData] = await pool.query(`SELECT ${work_cat.join(',')} FROM cs_os_workshop WHERE cs_status = 1`);
    const [dayTypeData] = await pool.query(`SELECT ${day_type.join(',')} FROM cs_os_reg_daytype WHERE cs_status = 1`);
    const [facultytypeData] = await pool.query(`SELECT ${facultytype.join(',')} FROM cs_app_facultytype WHERE status = 1`);
    const [halltypeData] = await pool.query(`SELECT ${halltype.join(',')} FROM cs_app_hall_type WHERE status = 1`);

    const [customData] = await pool.query(`SELECT ${custom_data.join(',')} FROM cs_os_field_option WHERE cs_status = 1`);




    // Construct the response object
    const responseData = {
      // facilityType: facilitytypeData,
      prefix: prefixData,
      country: countryData,
      states: statesData,
      regCategory: regCatData,
      workshop: workshopData,
      dayType: dayTypeData,
      facultytype: facultytypeData,
      halltype: halltypeData,
      custom: customData
    };

    // Send the response containing data from all queries
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});




module.exports = router;