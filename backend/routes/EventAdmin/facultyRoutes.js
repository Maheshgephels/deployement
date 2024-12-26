const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const moment = require('moment-timezone');
const multer = require('multer');
const path = require('path');
const verifyToken = require('../api/middleware/authMiddleware');


// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, 'faculty-profile/'); // Save uploaded files to the 'app-icon' directory
//     },
//     filename: (req, file, cb) => {
//       const dName = req.body.fName.replace(/\s+/g, '').toLowerCase(); // Extract the name from the request body
//       const dateTime = new Date().toLocaleString('en-US', { hour12: false }).replace(/[^\w\s]/gi, '').replace(/ /g, '_'); // Get current date and time in a formatted string without AM/PM
//       let filename;
//       if (file.fieldname === 'brightModeIcon') {
//         filename = `${dName}-facultyprofile-${path.extname(file.originalname)}`;
//       }else if(file.fieldname === 'Facultycv'){
//         filename = `${dName}-facultycv-${path.extname(file.originalname)}`;
//       }
//        else {
//         filename = `${dName}-${path.extname(file.originalname)}`;
//       }
//       cb(null, filename);
//     },
//   });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    if (file.fieldname === 'Facultycv') {
      uploadPath = 'faculty-cv/'; // Save 'Facultycv' files to 'faculty-cv' directory
    } else {
      uploadPath = 'faculty-profile/'; // Save other files to 'faculty-profile' directory
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const dName = req.body.fName.replace(/\s+/g, '').toLowerCase(); // Extract the name from the request body
    const dateTime = new Date().toLocaleString('en-US', { hour12: false }).replace(/[^\w\s]/gi, '').replace(/ /g, '_'); // Get current date and time in a formatted string without AM/PM
    let filename;
    if (file.fieldname === 'brightModeIcon') {
      filename = `${dName}-facultyprofile${path.extname(file.originalname)}`;
    } else if (file.fieldname === 'Facultycv') {
      filename = `${dName}-facultycv${path.extname(file.originalname)}`;
    } else {
      filename = `${dName}${path.extname(file.originalname)}`;
    }
    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // optional, to set file size limit (e.g., 5MB)
});

// const upload = multer({ storage: storage });

// router.get('/getFaculty',verifyToken, async (req, res) => {
//     try {
//       // Extract page number, page size, and search query from request query parameters
//       const { page = 1, pageSize = 10, search = '' } = req.query;
//       const offset = (page - 1) * pageSize;


//       const columnsToFetch = ['*'];

//       // Construct the SQL query to fetch specific columns with pagination and search
//       let query = `
//       SELECT ${columnsToFetch}
//       FROM cs_app_faculties
//       ORDER BY faculty_id DESC
//     `;

//       // Append search condition if search query is provided
//       if (search) {
//         query += `
//           WHERE heading LIKE '%${search}%'
//         `;
//       }

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
//         const totalCountQuery = 'SELECT COUNT(*) AS total FROM cs_app_faculties';
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



router.get('/getFaculty', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = '', sortBy = '', sortColumn = 'locat_id', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * pageSize;

    console.log("Data", req.query);

    const validColumns = ['faculty_id', 'fname', 'lname', 'email1', 'status', 'sessionCount'];  // Add all valid column names here
    const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'faculty_order';

    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
      SELECT f.*, COUNT(sr.faculty_id) AS sessionCount
      FROM cs_app_faculties f
      LEFT JOIN cs_app_session_role_details sr ON f.faculty_id = sr.faculty_id 
    `;

    let conditions = [];

    // Append search condition if search query is provided
    if (search) {
      // Split search term into separate words
      const searchTerms = search.split(' ').map(term => term.trim()).filter(term => term.length > 0);

      if (searchTerms.length > 0) {
        // Create conditions for fname, mname, and lname in any order
        let nameConditions = [];

        // Check if the search terms match any part of fname, mname, or lname
        searchTerms.forEach(term => {
          let termConditions = [];
          termConditions.push(`f.fname LIKE '%${term}%'`);
          termConditions.push(`f.mname LIKE '%${term}%'`);
          termConditions.push(`f.lname LIKE '%${term}%'`);
          nameConditions.push(`(${termConditions.join(' OR ')})`);
        });

        // Combine all name conditions
        if (nameConditions.length > 0) {
          conditions.push(`(${nameConditions.join(' AND ')})`);
        }
      }
    }

    // Append sort condition for active/inactive status
    if (sortBy === 'active') {
      conditions.push(`f.status = 1`);
    } else if (sortBy === 'inactive') {
      conditions.push(`f.status = 0`);
    }

    // Combine conditions into the WHERE clause if any exist
    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    // Append GROUP BY, ORDER BY, and pagination
    query += `
      GROUP BY f.faculty_id
      ORDER BY ${columnToSortBy} ${sortOrder}
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    // Execute the query to fetch user data from the table
    const [userData] = await pool.query(query);

    // Calculate total items with the same conditions for pagination metadata
    let totalCountQuery = `
      SELECT COUNT(DISTINCT f.faculty_id) AS total 
      FROM cs_app_faculties f
      LEFT JOIN cs_app_session_role_details sr ON f.faculty_id = sr.faculty_id 
    `;

    if (conditions.length > 0) {
      totalCountQuery += ` WHERE ` + conditions.join(' AND ');
    }

    const [totalCountResult] = await pool.query(totalCountQuery);
    const totalItems = totalCountResult[0].total;
    const totalPages = Math.ceil(totalItems / pageSize);

    res.json({ categories: userData, currentPage: parseInt(page), totalPages, pageSize, totalItems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// router.get('/getFaculty', verifyToken, async (req, res) => {
//   try {
//     // Extract page number, page size, search query, and sortBy from request query parameters
//     const { page = 1, pageSize = 10, search = '', sortBy = '' } = req.query;
//     const offset = (page - 1) * pageSize;

//     // Start constructing the SQL query to fetch specific columns with pagination and search
//     let query = `
//       SELECT f.*, COUNT(sr.faculty_id) AS sessionCount
//       FROM cs_app_faculties f
//       LEFT JOIN cs_app_session_role_details sr ON f.faculty_id = sr.faculty_id 
//     `;

//     // Array to hold query conditions
//     const conditions = [];

//     // Append search condition if search query is provided
//     if (search) {
//       conditions.push(`
//         (f.fname LIKE '%${search}%' OR 
//          f.lname LIKE '%${search}%' OR
//          f.email1 LIKE '%${search}%' OR
//          f.ntitle LIKE '%${search}%')
//       `);
//     }

//     // Append sort condition for active/inactive status
//     if (sortBy === 'active') {
//       conditions.push(`f.status = '1'`);
//     } else if (sortBy === 'inactive') {
//       conditions.push(`f.status = '0'`);
//     }

//     // Combine conditions into the WHERE clause if any exist
//     if (conditions.length > 0) {
//       query += ` WHERE ` + conditions.join(' AND ');
//     }

//     // Append GROUP BY, ORDER BY, and pagination
//     query += `
//       GROUP BY f.faculty_id
//       ORDER BY f.faculty_id DESC
//       LIMIT ${pageSize} OFFSET ${offset}
//     `;

//     // Execute the query to fetch faculty data from the table
//     const [userData] = await pool.query(query);

//     // Get total count of items for pagination metadata
//     const totalCountQuery = `SELECT COUNT(*) AS total FROM cs_app_faculties` + 
//       (conditions.length > 0 ? ` WHERE ` + conditions.join(' AND ') : '');
//     const [totalCountResult] = await pool.query(totalCountQuery);
//     const totalItems = totalCountResult[0].total;
//     const totalPages = Math.ceil(totalItems / pageSize);

//     // Send the response with faculty data and pagination info
//     res.json({ categories: userData, currentPage: parseInt(page), totalPages, pageSize, totalItems });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });


router.put('/UpdateStatus', verifyToken, async (req, res) => {
  try {
    // Extract workshopId, status, and Name from the request body
    console.log(req.body);
    const { FacultyId, status } = req.body;



    // Update cs_status in cs_os_workshop
    const updateQuery = `UPDATE cs_app_faculties SET status = ? WHERE faculty_id = ?`;
    await pool.query(updateQuery, [status, FacultyId]);

    // Update cs_status in cs_os_facilitytyp
    return res.status(200).json({ message: 'Status Updates successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.delete('/deleteFaculty', verifyToken, async (req, res) => {
  const { FacultyId } = req.body;


  try {
    // Delete from cs_os_workshop table
    const deleteQuery = 'DELETE FROM cs_app_faculties WHERE faculty_id = ?';
    await pool.query(deleteQuery, [FacultyId]);

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting workshop:', error);
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
      custom: customData
    };

    // Send the response containing data from all queries
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


//   router.post('/addfaculty', verifyToken, upload.fields([
//     { name: 'brightModeIcon', maxCount: 1 },
//     { name: 'Facultycv', maxCount: 1 }
//   ]), async (req, res) => {
//     try {
//         console.log(req.body);
//         const {
//           Website, prefix,fName, mName, lname, mobile, email, facultytype, description, City, country ,longdescription// Add more fields as needed
//         } = req.body;


//         if (!req.files || !req.files['brightModeIcon']) {
//             res.status(400).json({ message: 'Missing file(s)' });
//             return;
//           }

//           const brightModeIcon = req.files['brightModeIcon'][0];
//           const facultycv = req.files['Facultycv'][0];

//         const insertQuery = `
//             INSERT INTO cs_app_faculties (
//                 ntitle,fname, mname, lname, contact1, email1, facultytype_id, description, city, country, status, photo, long_description , resume, reg_date ,website_link
//             ) VALUES (
//                 ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? , ? , now(), ?
//             )
//         `;

//         await pool.query(insertQuery, [
//           prefix,fName, mName, lname, mobile, email, facultytype, description, City, country, 1, brightModeIcon.path, longdescription , facultycv.path , Website
//         ]);

//         return res.status(200).json({ message: 'Faculty added successfully' });
//     } catch (error) {
//         console.error('Error adding faculty:', error);
//         return res.status(500).json({ error: 'Internal server error' });
//     }
// });



router.post('/addfaculty', verifyToken, upload.fields([
  { name: 'brightModeIcon', maxCount: 1 },
  { name: 'Facultycv', maxCount: 1 }
]), async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();



    const {
      Website, prefix, fName, mName, lname, mobile, email, facultytype, description, City, country, longdescription // Ensure all fields are properly included
    } = req.body;


    // Insert query for faculty details
    const insertQuery = `
      INSERT INTO cs_app_faculties (
        ntitle, fname, mname, lname, contact1, email1, facultytype_id, description, city, country, status, long_description, reg_date, website_link
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?
      )
    `;
    const insertValues = [
      prefix, fName, mName, lname, mobile, email, facultytype, description, City, country, 1, longdescription, Website
    ];

    // Begin transaction
    await connection.beginTransaction();

    // Insert faculty details
    const [insertResult] = await connection.query(insertQuery, insertValues);
    const FacultyId = insertResult.insertId;

    // Conditional update for photo
    if (req.files['brightModeIcon']) {
      const updateQueryForPhoto = `
        UPDATE cs_app_faculties 
        SET photo = ? 
        WHERE faculty_id = ?
      `;
      await connection.query(updateQueryForPhoto, [req.files['brightModeIcon'][0].path, FacultyId]);
    }

    // Conditional update for CV
    if (req.files['Facultycv']) {
      const updateQueryForCV = `
        UPDATE cs_app_faculties 
        SET resume = ? 
        WHERE faculty_id = ?
      `;
      await connection.query(updateQueryForCV, [req.files['Facultycv'][0].path, FacultyId]);
    }

    // Commit transaction
    await connection.commit();

    return res.status(200).json({ message: 'Faculty added successfully' });
  } catch (error) {
    // Rollback transaction on error
    if (connection) {
      await connection.rollback();
    }
    console.error('Error adding faculty:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    // Release connection back to the pool
    if (connection) {
      connection.release();
    }
  }
});


router.post('/editFaculty', verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    const { FacultyId } = req.body;

    console.log("NotificationId", FacultyId);


    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
        SELECT *
        FROM cs_app_faculties
        WHERE faculty_id = ${FacultyId};
        `;


    // Execute the query to fetch pages data for the specified role_id
    const [pagesData] = await pool.query(query, [FacultyId]);

    console.log(pagesData);

    // Send the pages data as a response
    res.json(pagesData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//   router.post('/updateFaculty', verifyToken,  upload.fields([
//     { name: 'brightModeIcon', maxCount: 1 },
//     { name: 'Facultycv', maxCount: 1 }
//   ]), async (req, res) => {
//     try {
//       const {
//         Website, prefix,fName, mName, lname, mobile, email, facultytype, description, City, state, country ,longdescription// Add more fields as needed
//       } = req.body;

//         // Check if brightModeIcon is available
//         const brightModeIcon = req.files['brightModeIcon'][0]; // Assuming you have only one file uploaded

//         const facultycv = req.files['Facultycv'][0];


//         const updateQuery = `
//             UPDATE cs_app_faculties 
//             SET ntitle = ? ,fname = ?, mname = ?, lname = ?, contact1 = ?, email1 = ?, facultytype_id = ?, description = ?, city = ?, state = ?, country = ?, status = ?, photo = ?, website_link = ? , long_description  = ? ,resume = ?
//             WHERE faculty_id = ?
//         `;

//         await pool.query(updateQuery, [
//           prefix,fName, mName, lname, mobile, email, facultytype, description, City, state, country, 1, brightModeIcon.path, req.body.FacultyId,Website,longdescription,facultycv
//         ]);

//         return res.status(200).json({ message: 'Faculty updated successfully' });
//     } catch (error) {
//         console.error('Error updating Faculty:', error);
//         return res.status(500).json({ error: 'Internal server error' });
//     }
// });


// router.post('/updateFaculty', verifyToken, upload.fields([
//   { name: 'brightModeIcon', maxCount: 1 },
//   { name: 'Facultycv', maxCount: 1 }
// ]), async (req, res) => {
//   try {
//     const {
//       Website, prefix, fName, mName, lname, mobile, email, facultytype, description, City, state, country, longdescription, FacultyId
//     } = req.body;

//     // Check if brightModeIcon and Facultycv are available
//     // const brightModeIcon = req.files['brightModeIcon'] ? req.files['brightModeIcon'][0].path : null; // Get the path of the uploaded file
//     // const facultycv = req.files['Facultycv'] ? req.files['Facultycv'][0].path : null; // Get the path of the uploaded file

//     if(req.files['brightModeIcon']){
//       const updateQueryforphoto = `
//       UPDATE cs_app_faculties 
//       SET photo = ?  WHERE faculty_id = ?
//     `;

//     await pool.query(updateQueryforphoto, [req.files['brightModeIcon']]);

//     }

//     if(req.files['Facultycv']){
//       const updateQueryforcv = `
//       UPDATE cs_app_faculties 
//       SET resume = ?  WHERE faculty_id = ?
//     `;

//     await pool.query(updateQueryforcv, [req.files['Facultycv']]);

//     }

//     const updateQuery = `
//       UPDATE cs_app_faculties 
//       SET ntitle = ?, fname = ?, mname = ?, lname = ?, contact1 = ?, email1 = ?, facultytype_id = ?, description = ?, city = ?, state = ?, country = ?, website_link = ?, long_description = ?
//       WHERE faculty_id = ?
//     `;

//     await pool.query(updateQuery, [
//       prefix, fName, mName, lname, mobile, email, facultytype, description, City, state, country, Website, longdescription, FacultyId
//     ]);

//     return res.status(200).json({ message: 'Faculty updated successfully' });
//   } catch (error) {
//     console.error('Error updating Faculty:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// });


// router.post('/updateFaculty', verifyToken, upload.fields([
//   { name: 'brightModeIcon', maxCount: 1 },
//   { name: 'Facultycv', maxCount: 1 }
// ]), async (req, res) => {
//   try {
//     const {
//       Website, prefix, fName, mName, lname, mobile, email, facultytype, description, City, country, longdescription, FacultyId ,designation
//     } = req.body;

//     // Check if brightModeIcon and Facultycv are available
//     if (req.files['brightModeIcon']) {
//       const updateQueryForPhoto = `
//         UPDATE cs_app_faculties 
//         SET photo = ? 
//         WHERE faculty_id = ?
//       `;

//       await pool.query(updateQueryForPhoto, [req.files['brightModeIcon'][0].path, FacultyId]);
//     }

//     if (req.files['Facultycv']) {
//       const updateQueryForCV = `
//         UPDATE cs_app_faculties 
//         SET resume = ? 
//         WHERE faculty_id = ?
//       `;

//       await pool.query(updateQueryForCV, [req.files['Facultycv'][0].path, FacultyId]);
//     }

//     const updateQuery = `
//       UPDATE cs_app_faculties 
//       SET ntitle = ?, fname = ?, mname = ?, lname = ?, contact1 = ?, email1 = ?, facultytype_id = ?, description = ?, city = ?, country = ?, website_link = ?, long_description = ? designation = ?
//       WHERE faculty_id = ?
//     `;

//     await pool.query(updateQuery, [
//       prefix, fName, mName, lname, mobile, email, facultytype, description, City, country, Website, longdescription ,designation , FacultyId
//     ]);

//     return res.status(200).json({ message: 'Faculty updated successfully' });
//   } catch (error) {
//     console.error('Error updating Faculty:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// });


router.post('/updateFaculty', verifyToken, upload.fields([
  { name: 'brightModeIcon', maxCount: 1 },
  { name: 'Facultycv', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      Website, fName, mName, lname, mobile, email, facultytype, description, City, country, longdescription, FacultyId, designation
    } = req.body;

    console.log(req.body);

    // Check if brightModeIcon and Facultycv are available
    if (req.files['brightModeIcon']) {
      const updateQueryForPhoto = `
        UPDATE cs_app_faculties 
        SET photo = ? 
        WHERE faculty_id = ?
      `;
      await pool.query(updateQueryForPhoto, [req.files['brightModeIcon'][0].path, FacultyId]);
    }

    if (req.files['Facultycv']) {
      const updateQueryForCV = `
        UPDATE cs_app_faculties 
        SET resume = ? 
        WHERE faculty_id = ?
      `;
      await pool.query(updateQueryForCV, [req.files['Facultycv'][0].path, FacultyId]);
    }

    const updateQuery = `
      UPDATE cs_app_faculties 
      SET  fname = ?, mname = ?, lname = ?, contact1 = ?, email1 = ?, facultytype_id = ?, description = ?, city = ?, country = ?, website_link = ?, long_description = ?, designation = ?
      WHERE faculty_id = ?
    `;

    await pool.query(updateQuery, [
      fName, mName, lname, mobile, email, facultytype, description, City, country, Website, longdescription, designation, FacultyId
    ]);

    return res.status(200).json({ message: 'Faculty updated successfully' });
  } catch (error) {
    console.error('Error updating Faculty:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/adminserver', verifyToken, async (req, res) => {
  try {
    // Query to get the value of the setting 'event_host'
    const updatedSettingsQuery = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = ?`;
    const [updatedResults] = await pool.query(updatedSettingsQuery, ['AdminPath']);

    if (updatedResults.length > 0) {
      // Send the retrieved setting value in the response
      res.json({
        adminserver_name: updatedResults[0].cs_value // Adjust the key based on your response structure
      });
    } else {
      res.status(404).json({ message: 'Setting not found' });
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/moveup', verifyToken, async (req, res) => {
  try {
    // Extract item from the request body
    const { item, order } = req.body;

    console.log(req.body);

    // // Get the current field order of the item
    // const getOrderQuery = 'SELECT cs_field_order FROM cs_os_field_data WHERE cs_field_id = ?';
    // const [orderResult] = await pool.query(getOrderQuery, [item]);

    // if (orderResult.length === 0) {
    //   return res.status(404).json({ error: 'Item not found' });
    // }

    // const currentOrder = orderResult[0].cs_field_order;

    if (order <= 0) {
      return res.status(202).json({ error: 'Cannot move up. page order is already at the minimum value.' });
    }

    // Get the item that currently has the cs_field_order one less than or nearest to the current order,
    // but ensure cs_field_order doesn't go below 1
    const swapOrderQuery = `
    SELECT faculty_id 
    FROM cs_app_faculties 
    WHERE faculty_order < ? AND faculty_order >= 1 
    ORDER BY faculty_order DESC 
    LIMIT 1`;
    const [swapOrderResult] = await pool.query(swapOrderQuery, [order]);






    if (swapOrderResult.length === 0) {
      return res.status(500).json({ error: 'Failed to find the item to swap orders with' });
    }

    const swapItemId = swapOrderResult[0].faculty_id;

    // Update the cs_field_order values for the two items
    const updateOrderQuery = `
      UPDATE cs_app_faculties 
      SET faculty_order = CASE 
        WHEN faculty_id = ? THEN ?
        WHEN faculty_id = ? THEN ?
      END
      WHERE faculty_id IN (?, ?)`;

    await pool.query(updateOrderQuery, [item, order - 1, swapItemId, order, item, swapItemId]);

    // Send success response
    return res.status(200).json({ message: 'Moved up successfully' });
  } catch (error) {
    // Handle errors
    console.error('Error while moving up:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/movedown', verifyToken, async (req, res) => {
  try {
    // Extract item from the request body
    const { item, order } = req.body;

    console.log(req.body);

    // Get the current field order of the item
    // const getOrderQuery = 'SELECT cs_field_order FROM cs_os_field_data WHERE cs_field_id = ?';
    // const [orderResult] = await pool.query(getOrderQuery, [item]);

    // if (orderResult.length === 0) {
    //   return res.status(404).json({ error: 'Item not found' });
    // }

    // const currentOrder = orderResult[0].cs_field_order;

    // Get the maximum field order
    const getMaxOrderQuery = 'SELECT MAX(faculty_order) AS max_order FROM cs_app_faculties';
    const [maxOrderResult] = await pool.query(getMaxOrderQuery);

    const maxOrder = maxOrderResult[0].max_order;

    // Prevent cs_field_order from going beyond the maximum value
    if (order >= maxOrder) {
      return res.status(202).json({ error: 'Cannot move down. page order is already at the maximum value.' });
    }

    // Get the item that currently has the cs_field_order one more than the current order
    const swapOrderQuery = 'SELECT faculty_id FROM cs_app_faculties WHERE faculty_order = ?';
    const [swapOrderResult] = await pool.query(swapOrderQuery, [order + 1]);

    if (swapOrderResult.length === 0) {
      return res.status(500).json({ error: 'Failed to find the item to swap orders with' });
    }

    const swapItemId = swapOrderResult[0].faculty_id;

    // Update the cs_field_order values for the two items
    const updateOrderQuery = `
      UPDATE cs_app_faculties 
      SET faculty_order = CASE 
        WHEN faculty_id = ? THEN ?
        WHEN faculty_id = ? THEN ?
      END
      WHERE faculty_id IN (?, ?)`;

    await pool.query(updateOrderQuery, [item, order + 1, swapItemId, order, item, swapItemId]);

    // Send success response
    return res.status(200).json({ message: 'Moved down successfully' });
  } catch (error) {
    // Handle errors
    console.error('Error while moving down:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;