const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const moment = require('moment-timezone');
const verifyToken = require('../api/middleware/authMiddleware');


// Define the route to fetch Facility data from the cs_os_badgeapp_userlogin
// router.get('/getWorkshop', verifyToken, async (req, res) => {
//   try {
//     // Extract page number, page size, and search query from request query parameters
//     const { page = 1, pageSize = 10, search = '', sortColumn = 'cs_workshop_id', sortOrder = 'DESC' } = req.query;
//     const offset = (page - 1) * pageSize;

//     const validColumns = ['cs_workshop_id', 'cs_workshop_name', 'cs_status'];  // Add all valid column names here
//     const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'cs_workshop_id';


//     // Define columns to fetch, including user count
//     const columnsToFetch = [
//       'cs_os_workshop.*',
//       'COUNT(DISTINCT cs_os_users.id) AS userCount'
//     ];

//     // Construct the SQL query with LEFT JOIN to count users based on cs_workshop_category
//     let query = `
//       SELECT ${columnsToFetch.join(', ')}
//       FROM cs_os_workshop
//       LEFT JOIN cs_os_users ON cs_os_workshop.cs_workshop_id = cs_os_users.cs_workshop_category
//     `;

//     // Append search condition if search query is provided
//     if (search) {
//       query += `
//         WHERE cs_workshop_name LIKE '%${search}%'
//       `;
//     }

//     // Append pagination
//     query += `
//        GROUP BY cs_os_workshop.cs_workshop_id
//       ORDER BY ${columnToSortBy} ${sortOrder}
//       LIMIT ${pageSize} OFFSET ${offset}
//     `;

//     // Execute the query to fetch user data from the table
//     const [userData] = await pool.query(query);

//     // Send the user data as a response along with pagination metadata
//     let totalItems = 0;
//     let totalPages = 0;

//     if (!search) {
//       const totalCountQuery = 'SELECT COUNT(*) AS total FROM cs_os_workshop WHERE cs_status = 1';
//       const [totalCountResult] = await pool.query(totalCountQuery);
//       totalItems = totalCountResult[0].total;
//       totalPages = Math.ceil(totalItems / pageSize);
//     }

//     res.json({ categories: userData, currentPage: parseInt(page), totalPages, pageSize, totalItems });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });
router.get('/getWorkshop', verifyToken, async (req, res) => {
  try {
    // Extract page number, page size, and search query from request query parameters
    const { page = 1, pageSize = 10, search = '', sortColumn = 'cs_workshop_id', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * pageSize;

    const validColumns = ['cs_workshop_id', 'cs_workshop_name', 'cs_status'];  // Add all valid column names here
    const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'cs_workshop_id';

    // Define columns to fetch, including user count and workshop type name (as tname)
    const columnsToFetch = [
      'cs_os_workshop.*',
      'cs_os_workshop_type.workshoptype_name AS tname'
    ];

    // Fetch `cs_field_name` values from `cs_os_field_data`
    const fieldDataQuery = `SELECT cs_field_name FROM cs_os_field_data WHERE cs_field_type LIKE '13'`;
    const [fieldDataResult] = await pool.query(fieldDataQuery);

    // Extract `cs_field_name` values
    const fieldNames = fieldDataResult.map((row) => row.cs_field_name);

    // If no field names found, return an empty result
    if (fieldNames.length === 0) {
      return res.json({ categories: [], currentPage: parseInt(page), totalPages: 0, pageSize, totalItems: 0 });
    }

    console.log("Field Names:", fieldNames);

    // Start building the query
    let query = `
    SELECT 
      cs_os_workshop.*, 
      ${fieldNames.map((fieldName, index) => `COUNT(DISTINCT cs_os_users_${index}.id)`).join(' + ')} AS userCount,
      cs_os_workshop_type.workshoptype_name AS tname
    FROM cs_os_workshop
  `;

    // Append field names for joining users dynamically
    fieldNames.forEach((fieldName, index) => {
      query += `
      LEFT JOIN cs_os_users AS cs_os_users_${index} ON cs_os_workshop.cs_workshop_id = cs_os_users_${index}.${fieldName}
    `;
    });

    query += `
    LEFT JOIN cs_os_workshop_type ON cs_os_workshop.cs_workshoptype_id = cs_os_workshop_type.id
    `;

    if (search) {
      query += `WHERE cs_workshop_name LIKE '%${search}%' `;
    }

    query += `
    GROUP BY cs_os_workshop.cs_workshop_id
    ORDER BY ${columnToSortBy} ${sortOrder}
    LIMIT ${pageSize} OFFSET ${offset}
  `;

    console.log("Query", query);

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
      SELECT cs_workshop_name,cs_workshoptype_id, cs_visible_add_user, cs_visible_onspot
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


    const updateQuery = `UPDATE cs_os_workshop SET cs_workshop_name = ?,cs_workshoptype_id = ?, cs_visible_add_user = ?, cs_visible_onspot = ?  WHERE cs_workshop_id = ?`;
    await pool.query(updateQuery, [values.dName, values.workshoptype_id, values.spot, values.spot, workshopId]);

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
    const { dName, workshoptype_id } = req.body;
    const status = 1;
    const spot = 0;

    const lastInsertedTypeResult = await pool.query('SELECT cs_name, cs_daywise, cs_facility_id FROM cs_os_facilitytype ORDER BY cs_facility_id DESC LIMIT 1');
    const lastInsertedId = lastInsertedTypeResult[0][0];

    // Construct the SQL query to insert a new role into the cs_tbl_roles table
    const insertQuery = `
        INSERT INTO cs_os_workshop (cs_workshop_name,cs_workshoptype_id, cs_facility_id, cs_visible_add_user, cs_visible_onspot, cs_status)
        VALUES (?, ?, ?, ?, ?,?)
      `;

    // Execute the query to insert the new role into the cs_tbl_roles table
    await pool.query(insertQuery, [dName, workshoptype_id, lastInsertedId.cs_facility_id, spot, spot, status]);


    return res.status(200).json({ message: 'Workshop Created succesffuly' });
  } catch (error) {
    console.error('Error updating workshop:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/gnratefacility', verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    const { cs_workshop_id } = req.body;


    const lastInsertedTypeResult = await pool.query('SELECT cs_name, cs_daywise, cs_facility_id FROM cs_os_facilitytype ORDER BY cs_facility_id DESC LIMIT 1');
    const lastInsertedId = lastInsertedTypeResult[0][0];

    // Construct the SQL query to insert a new role into the cs_tbl_roles table
    // const insertQuery = `
    //     INSERT INTO cs_os_workshop (cs_workshop_name, cs_facility_id, cs_visible_add_user, cs_visible_onspot, cs_status)
    //     VALUES (?, ?, ?, ?, ?)
    //   `;

    // // Execute the query to insert the new role into the cs_tbl_roles table
    // await pool.query(insertQuery, [dName, lastInsertedId.cs_facility_id, spot, spot, status]);

    const updateQuery = `UPDATE cs_os_workshop SET cs_facility_id = ? WHERE cs_workshop_id = ?`;
    await pool.query(updateQuery, [lastInsertedId.cs_facility_id, cs_workshop_id]);



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

    // Update cs_status in cs_os_facilitytype
    const updateQuery1 = `UPDATE cs_os_facilitytype SET cs_status = ? WHERE cs_display_name = ?`;
    await pool.query(updateQuery1, [status, Name]);

    // Retrieve cs_facility_id from cs_os_facilitytype using the Name
    const selectid = `SELECT cs_facility_id FROM cs_os_facilitytype WHERE cs_display_name = ?`;
    const [selectIdResult] = await pool.query(selectid, [Name]);
    const id = selectIdResult[0].cs_facility_id; // Extract cs_facility_id from the result


    // Update cs_status in cs_os_facility_detail using cs_facility_id
    const updateQuery2 = `UPDATE cs_os_facility_detail SET cs_status = ? WHERE cs_facility_id = ?`;
    await pool.query(updateQuery2, [status, id]);

    // Retrieve cs_facility_detail_id from cs_os_facility_detail
    const selectQuery = `SELECT cs_facility_detail_id FROM cs_os_facility_detail WHERE cs_facility_id = ?`;
    const [detailIdResults] = await pool.query(selectQuery, [id]);

    // Extract cs_facility_detail_id values from the result
    const csFacilityDetailIds = detailIdResults.map(result => result.cs_facility_detail_id);

    // Update cs_status in cs_os_facility_category based on each cs_facility_detail_id
    const updateQuery3 = `UPDATE cs_os_facility_category SET cs_status = ? WHERE cs_facility_detail_id = ?`;
    for (const csFacilityDetailId of csFacilityDetailIds) {
      await pool.query(updateQuery3, [status, csFacilityDetailId]);
    }

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

router.post('/check-workshoptype-name', verifyToken, async (req, res) => {
  const { dName } = req.body;

  try {
    // Execute SQL query to check if email exists in the database
    const [users] = await pool.query('SELECT * FROM cs_os_workshop_type WHERE workshoptype_name = ?', [dName]);

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

router.post('/addworkshoptype', verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    const { dName } = req.body;


    // Construct the SQL query to insert a new role into the cs_tbl_roles table
    const insertQuery = `
        INSERT INTO cs_os_workshop_type (workshoptype_name)
        VALUES (?)
      `;

    // Execute the query to insert the new role into the cs_tbl_roles table
    // await pool.query(insertQuery, [dName]);
    const [result] = await pool.query(insertQuery, [dName]);
    const workshopTypeId = result.insertId; // Get the generated ID


    const spot = 0;
    const label = dName.toLowerCase().replace(/\s/g, '');
    const fieldName = `cs_${label}`;

    // const lastfieldOrderResult = await pool.query('SELECT cs_field_order FROM cs_os_field_data ORDER BY cs_field_order DESC LIMIT 1');
    // const fieldOrder = lastfieldOrderResult[0][0].cs_field_order;
    const newfieldOrder = 0;

    // Construct the SQL query to alter the table
    const alterTableQuery = `
        ALTER TABLE cs_os_users
        ADD COLUMN ${fieldName} varchar(255) NULL
      `;

    // Execute the ALTER TABLE query
    await pool.query(alterTableQuery);

    // Construct the SQL query to insert a new role into the cs_os_field_data table
    const insertfieldQuery = `
        INSERT INTO cs_os_field_data (cs_field_name, cs_field_label, cs_workshoptype_id,cs_is_required,  cs_field_type, cs_field_order, cs_visible_add_user, cs_visible_onspot)
        VALUES (?, ?, ?, ?, ?, ?, ? , ?)
      `;

    // Execute the query to insert the new role into the cs_tbl_roles table
    await pool.query(insertfieldQuery, [fieldName, dName, workshopTypeId, spot, 13, newfieldOrder, spot, spot]);



    return res.status(200).json({ message: 'Workshop type Created succesffuly' });
  } catch (error) {
    console.error('Error updating workshop:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/getWorkshoptype', verifyToken, async (req, res) => {
  try {
    // Extract page number, page size, and search query from request query parameters
    const { page = 1, pageSize = 10, search = '', sortColumn = 'id', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * pageSize;

    const validColumns = ['id', 'workshoptype_name', 'cs_status'];  // Add all valid column names here
    const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'id';


    // Define columns to fetch, including user count
    const columnsToFetch = [
      'cs_os_workshop_type.*',
      'COUNT(cs_os_workshop.cs_workshoptype_id) AS workshop_count'  // Add count of related workshops
    ];

    // Construct the SQL query with LEFT JOIN to count workshops based on cs_workshoptype_id
    let query = `
      SELECT ${columnsToFetch.join(', ')}
      FROM cs_os_workshop_type
      LEFT JOIN cs_os_workshop ON cs_os_workshop_type.id = cs_os_workshop.cs_workshoptype_id
      AND cs_os_workshop.cs_status = 1
    `;

    // Append search condition if search query is provided
    if (search) {
      query += `
        WHERE workshoptype_name LIKE '%${search}%'
      `;
    }

    // Append pagination
    query += `
       GROUP BY  cs_os_workshop_type.id
      ORDER BY ${columnToSortBy} ${sortOrder}
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    // Execute the query to fetch user data from the table
    const [userData] = await pool.query(query);

    // Send the user data as a response along with pagination metadata
    let totalItems = 0;
    let totalPages = 0;

    if (!search) {
      const totalCountQuery = 'SELECT COUNT(*) AS total FROM  cs_os_workshop_type WHERE cs_status = 1';
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

router.delete('/deleteworkshoptype', verifyToken, async (req, res) => {
  const { workshopId, facilityId, workshopName } = req.body;


  try {
    // Delete from cs_os_workshop table
    const deleteQuery = 'DELETE FROM cs_os_workshop_type WHERE id = ?';
    await pool.query(deleteQuery, [workshopId]);


    const label = workshopName.toLowerCase().replace(/\s/g, '');
    const fieldName = `cs_${label}`;



    const alterTableQuery = `
    ALTER TABLE cs_os_users
    DROP COLUMN ${fieldName}
  `;

    // Execute the ALTER TABLE query
    await pool.query(alterTableQuery);

    const deleteQuery1 = 'DELETE FROM cs_os_field_data WHERE cs_workshoptype_id = ?';
    await pool.query(deleteQuery1, [workshopId]);

    res.status(200).json({ message: 'Workshop deleted successfully' });
  } catch (error) {
    console.error('Error deleting workshop:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.put('/UpdateworkshoptypeStatus', verifyToken, async (req, res) => {
  try {
    // Extract workshopId, status, and Name from the request body

    console.log("fsdfsfsf");
    const { workshopId, status, Name } = req.body;



    // Update cs_status in cs_os_workshop
    const updateQuery = `UPDATE cs_os_workshop_type SET cs_status = ? WHERE id = ?`;
    await pool.query(updateQuery, [status, workshopId]);

    const item = Name;
    const flag = status;

    const checkQuery = `
    SELECT cs_visible_add_user, cs_visible_onspot
    FROM cs_os_field_data 
    WHERE cs_field_label = ?`;

    // Execute the query to check the current values
    const [result] = await pool.query(checkQuery, [item]);

    // Check if the current values match the flag
    if (result && result.length > 0) {
      const { cs_visible_add_user, cs_visible_onspot } = result[0];
      if (cs_visible_add_user === flag && cs_visible_onspot === flag) {
        // Values are already set to the flag, no need to update
        console.log("Fields are already flagged");
        return res.status(200).json({ message: 'Fields are already flagged' });
      }
    }

    if (flag === 1) {
      // Get the current max field order
      const lastfieldOrderResult = await pool.query('SELECT cs_field_order FROM cs_os_field_data ORDER BY cs_field_order DESC LIMIT 1');
      const fieldOrder = lastfieldOrderResult[0][0].cs_field_order;
      const newfieldOrder = fieldOrder + 1;

      // Construct the SQL query for updating the fields
      const updateQuery = `
      UPDATE cs_os_field_data 
      SET cs_visible_add_user = ?, cs_visible_onspot = ?, cs_field_order = ?
      WHERE cs_field_label = ?`;


      console.log("Fields not in 1");

      // Execute the query to update the fields
      await pool.query(updateQuery, [flag, flag, newfieldOrder, item]);

    } else if (flag === 0) {
      const newFieldOrder = 0;

      // Construct the SQL query for updating the fields
      const updateQuery = `
      UPDATE cs_os_field_data 
      SET cs_visible_add_user = ?, cs_visible_onspot = ?, cs_field_order = ?
      WHERE cs_field_label = ?`;

      console.log("Fields not in 0");

      // Execute the query to update the fields
      await pool.query(updateQuery, [flag, flag, newFieldOrder, item]);
    }




    return res.status(200).json({ message: 'Status Updates successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/editworkshoptype', verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    const { workshopId } = req.body;

    console.log(workshopId);


    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
      SELECT workshoptype_name
      FROM  cs_os_workshop_type
      WHERE id = ${workshopId};
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


router.post('/updateworkshoptype', verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    const { values, workshopId } = req.body;


    const updateQuery = `UPDATE cs_os_workshop_type SET workshoptype_name = ? WHERE id = ?`;
    await pool.query(updateQuery, [values.dName, workshopId]);


    const updateQuery1 = `
    UPDATE cs_os_field_data 
    SET cs_field_label = ?
    WHERE cs_workshoptype_id = ?`;

    // Execute the query to update the fields
    await pool.query(updateQuery1, [values.dName, workshopId]);




    return res.status(200).json({ message: 'Workshop Updates succesffuly' });
  } catch (error) {
    console.error('Error updating workshop:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});











module.exports = router;