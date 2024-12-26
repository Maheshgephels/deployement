const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const moment = require('moment-timezone');
const multer = require('multer');
const verifyToken = require('../api/middleware/authMiddleware');
const queueMiddleware = require('../api/middleware/queueMiddleware');
const ExcelJS = require('exceljs');
const excel = require('exceljs');
const nodemailer = require('nodemailer'); // Import nodemailer


// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_PASS,  // Your Gmail app password
  },
});

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'faculty-profile/'); // Specify the directory where files will be uploaded
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); // Set the filename
  }
});

const upload = multer({ storage: storage });





// router.get('/getUser', async (req, res) => {
//   try {
//     // Extract page number, page size, and search query from request query parameters
//     const { page = 1, pageSize = 10, search = '' } = req.query;
//     const offset = (page - 1) * pageSize;

//     const allDataQuery = `
//             SELECT cs_field_name, cs_field_label
//             FROM cs_os_field_data
//             WHERE cs_visible_add_user = 1
//             ORDER BY cs_field_order; 
//         `;

//     // Execute the query to fetch field data
//     const [alldata] = await pool.query(allDataQuery);

//     // Extract columns to fetch from the result of field data query
//     const allColumns = alldata.map(row => ({
//       cs_field_name: row.cs_field_name,
//       cs_field_label: row.cs_field_label
//     }));

//     // console.log('Colmn Fetched:', allColumns);


//     // Construct the SQL query to fetch specific columns from cs_os_field_data
//     const fieldDataQuery = `
//             SELECT *
//             FROM cs_os_field_data
//             WHERE cs_status = 1 AND cs_visible_add_user = 1
//             ORDER BY cs_field_order; 
//             `;


//     // Execute the query to fetch field data
//     const [fieldData] = await pool.query(fieldDataQuery);

//     // Extract columns to fetch from the result of field data query
//     const columnsToFetch = fieldData.map(row => row.cs_field_name).join(', ');


//     // Construct the main SQL query to fetch data from cs_os_users
//     let query = `
//         SELECT ${columnsToFetch}
//         FROM cs_os_users
//       `;

//     // Append search condition if search query is provided
//     if (search) {
//       query += `
//           WHERE cs_last_name LIKE '%${search}%' OR 
//           cs_first_name LIKE '%${search}%' OR
//           cs_regno LIKE '%${search}%' OR
//           cs_reg_category LIKE '%${search}%'

//         `;
//     }

//     // Append pagination
//     query += `
//         LIMIT ${pageSize} OFFSET ${offset}
//       `;

//     // Execute the main query to fetch user data from the table
//     const [userData] = await pool.query(query);

//     // Send the user data as a response along with pagination metadata
//     let totalItems = 0;
//     let totalPages = 0;

//     if (!search) {
//       const totalCountQuery = 'SELECT COUNT(*) AS total FROM cs_os_users WHERE cs_status = 1';
//       const [totalCountResult] = await pool.query(totalCountQuery);
//       totalItems = totalCountResult[0].total;
//       totalPages = Math.ceil(totalItems / pageSize);
//     }

//     res.json({ Users: userData, Column: columnsToFetch, allColumn: allColumns, currentPage: parseInt(page), totalPages, pageSize, totalItems });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

//Basic user listing
router.get('/getBasicUser', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = '', catID, sortColumn = 'id', sortOrder = 'DESC', selectedColumns } = req.query;
    const offset = (page - 1) * pageSize;

    console.log(req.query);

    // Convert selectedColumns back into an array
    const columnsArray = selectedColumns ? selectedColumns.split(',') : [];



    const allDataQuery = `
    SELECT cs_field_name, cs_field_label
    FROM cs_os_field_data
    WHERE cs_visible_add_user = 1 
      AND cs_visible_reg_basicform = 1
      AND cs_status IN (1, 2) 
      AND cs_field_id != 1
    ORDER BY cs_field_order
  `;

    const [alldata] = await pool.query(allDataQuery);

    const allColumns = alldata.map(row => ({
      cs_field_name: row.cs_field_name,
      cs_field_label: row.cs_field_label
    }));


    const fieldDataQuery = `
      SELECT cs_field_name
      FROM cs_os_field_data
      WHERE cs_status IN (1, 2) AND cs_visible_add_user = 1 AND cs_visible_reg_basicform = 1
      ORDER BY cs_field_order
    `;

    const [fieldData] = await pool.query(fieldDataQuery);
    const columnsToFetch = fieldData.map(row => row.cs_field_name).join(', ');

    console.log('fieldData', columnsToFetch);

    const validColumns = ['id', 'cs_first_name', 'cs_last_name', 'cs_reg_category', 'cs_title', 'cs_workshop_category', 'cs_country', 'cs_state', 'cs_city', 'cs_email', 'cs_address', 'cs_phone', 'cs_company_name', 'cs_reg_type', 'cs_status']; // Add all valid column names here
    const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'id';

    let query = `
      SELECT ${columnsToFetch}, id, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at, cs_status, cs_isduplicate
      FROM cs_os_users
      WHERE cs_isconfirm = 0 
    `;

    if (search) {
      const searchTrimmed = search.trim(); // Remove leading/trailing spaces
      const searchTerms = searchTrimmed.split(' ');

      let searchConditions = '';

      if (searchTerms.length === 3) {
        // If three terms are entered, assume first name, middle name/initial, and last name
        const firstName = searchTerms[0];
        const middleInitial = searchTerms[1];
        const lastName = searchTerms[2];

        searchConditions = `
          (
            cs_first_name LIKE '%${firstName} ${middleInitial}%' AND cs_last_name LIKE '%${lastName}%'
          )
        `;
      } else if (searchTerms.length === 2) {
        // If two terms are entered, handle cases like "Uma B." or "Uma Robinson"
        const firstName = searchTerms[0];
        const secondTerm = searchTerms[1];

        searchConditions = `
          (
            cs_first_name LIKE '%${firstName} ${secondTerm}%' OR
            (cs_first_name LIKE '%${firstName}%' AND cs_last_name LIKE '%${secondTerm}%')
          )
        `;
      } else {
        // Generate `LIKE` conditions for each selected column
        searchConditions = columnsArray
          .map(column => `${column} LIKE '%${search}%'`)
          .join(' OR ');
      }

      query += `
        AND (${searchConditions})
      `;
    }



    if (catID !== 'Yes' && catID) {
      query += ` AND cs_reg_cat_id = ${catID}`;
    } else if (catID === 'Yes') {
      query += ` AND cs_onspot = 'Yes'`;
    }

    query += `
      ORDER BY ${columnToSortBy} ${sortOrder}
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const [userData] = await pool.query(query);

    for (let user of userData) {
      const workshopQuery = `
        SELECT cs_workshop_name
        FROM cs_os_workshop
        WHERE cs_workshop_id = ?
      `;

      try {
        const [workshopData] = await pool.query(workshopQuery, [user.cs_workshop_category]);
        if (workshopData.length > 0 && workshopData[0].cs_workshop_name) {
          user.cs_workshop_category = workshopData[0].cs_workshop_name;
        }
      } catch (error) {
        console.error("Error fetching workshop data:", error);
      }
    }

    for (let user of userData) {
      const eventdaysQuery = `
        SELECT cs_reg_daytype_name
        FROM cs_os_reg_daytype
        WHERE cs_reg_daytype_id = ?
      `;

      try {
        const [eventdayData] = await pool.query(eventdaysQuery, [user.cs_reg_type]);
        if (eventdayData.length > 0 && eventdayData[0].cs_reg_daytype_name) {
          user.cs_reg_type = eventdayData[0].cs_reg_daytype_name;
        }
      } catch (error) {
        console.error("Error fetching eventday data:", error);
      }
    }

    let totalCountQuery = `
      SELECT COUNT(*) AS total
      FROM cs_os_users
      WHERE cs_isconfirm = 0 
    `;

    // Replicate the search logic
    if (search) {
      const searchTrimmed = search.trim();
      const searchTerms = searchTrimmed.split(' ');

      let searchConditions = '';

      if (searchTerms.length === 3) {
        const firstName = searchTerms[0];
        const middleInitial = searchTerms[1];
        const lastName = searchTerms[2];

        searchConditions = `
        (
          cs_first_name LIKE '%${firstName} ${middleInitial}%' AND cs_last_name LIKE '%${lastName}%'
        )
      `;
      } else if (searchTerms.length === 2) {
        const firstName = searchTerms[0];
        const secondTerm = searchTerms[1];

        searchConditions = `
        (
          cs_first_name LIKE '%${firstName} ${secondTerm}%' OR
          (cs_first_name LIKE '%${firstName}%' AND cs_last_name LIKE '%${secondTerm}%')
        )
      `;
      } else {
        // Generate `LIKE` conditions for each selected column
        searchConditions = columnsArray
          .map(column => `${column} LIKE '%${search}%'`)
          .join(' OR ');
      }
      totalCountQuery += `
      AND (${searchConditions})
    `;
    }


    if (catID !== 'Yes' && catID) {
      totalCountQuery += ` AND cs_reg_cat_id = ${catID}`;
    } else if (catID === 'Yes') {
      totalCountQuery += ` AND cs_onspot = 'Yes'`;
    }

    const [totalCountResult] = await pool.query(totalCountQuery);
    const totalItems = totalCountResult[0].total;
    const totalPages = Math.ceil(totalItems / pageSize);

    res.json({
      Users: userData,
      Column: columnsToFetch,
      allColumn: allColumns,
      currentPage: parseInt(page),
      totalPages,
      pageSize,
      totalItems
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// //Confirm User listing
// router.get('/getConfirmUser', verifyToken, async (req, res) => {
//   try {
//     const { page = 1, pageSize = 10, search = '', catID, ticketId, sortColumn = 'id', sortOrder = 'DESC', opt = '' } = req.query;
//     const offset = (page - 1) * pageSize;

//     console.log(req.query);



//     const allDataQuery = `
//       SELECT cs_field_name, cs_field_label
//       FROM cs_os_field_data
//       WHERE cs_status IN (1, 2) AND cs_visible_add_user = 1 OR cs_field_id = 1
//       ORDER BY cs_field_order
//     `;

//     const [alldata] = await pool.query(allDataQuery);

//     const allColumns = alldata.map(row => ({
//       cs_field_name: row.cs_field_name,
//       cs_field_label: row.cs_field_label
//     }));


//     const fieldDataQuery = `
//       SELECT cs_field_name
//       FROM cs_os_field_data
//       WHERE cs_status IN (1, 2) AND cs_visible_add_user = 1 OR cs_field_id = 1
//       ORDER BY cs_field_order
//     `;

//     const [fieldData] = await pool.query(fieldDataQuery);
//     const columnsToFetch = fieldData.map(row => row.cs_field_name).join(', ');

//     console.log('fieldData', columnsToFetch);

//     const validColumns = ['id', 'cs_first_name', 'cs_last_name', 'cs_reg_category', 'cs_title', 'cs_workshop_category', 'cs_country', 'cs_state', 'cs_city', 'cs_email', 'cs_address', 'cs_phone', 'cs_company_name', 'cs_reg_type', 'cs_status']; // Add all valid column names here
//     const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'id';
//     let query = `
//     SELECT ${columnsToFetch}, id, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at, cs_status, cs_isduplicate
//     FROM cs_os_users
//     WHERE cs_isconfirm = 1
//   `;


//     if (search) {
//       // Split columnsToFetch into an array and map over it to create dynamic search conditions
//       const searchConditions = fieldData
//         .map(row => `${row.cs_field_name} LIKE '%${search}%'`)
//         .join(' OR ');

//       query += `
//     AND (
//       ${searchConditions}
//     )
//   `;
//     }

//     if (catID !== 'Yes' && catID) {
//       query += ` AND cs_reg_cat_id = ${catID}`;
//     } else if (catID === 'Yes') {
//       query += ` AND cs_onspot = 'Yes'`;
//     }

//     query += `
//       ORDER BY ${columnToSortBy} ${sortOrder}
//       LIMIT ${pageSize} OFFSET ${offset}
//     `;

//     const [userData] = await pool.query(query);

//     for (let user of userData) {
//       const workshopQuery = `
//         SELECT cs_workshop_name
//         FROM cs_os_workshop
//         WHERE cs_workshop_id = ?
//       `;

//       try {
//         const [workshopData] = await pool.query(workshopQuery, [user.cs_workshop_category]);
//         if (workshopData.length > 0 && workshopData[0].cs_workshop_name) {
//           user.cs_workshop_category = workshopData[0].cs_workshop_name;
//         }
//       } catch (error) {
//         console.error("Error fetching workshop data:", error);
//       }
//     }

//     for (let user of userData) {
//       const eventdaysQuery = `
//         SELECT cs_reg_daytype_name
//         FROM cs_os_reg_daytype
//         WHERE cs_reg_daytype_id = ?
//       `;

//       try {
//         const [eventdayData] = await pool.query(eventdaysQuery, [user.cs_reg_type]);
//         if (eventdayData.length > 0 && eventdayData[0].cs_reg_daytype_name) {
//           user.cs_reg_type = eventdayData[0].cs_reg_daytype_name;
//         }
//       } catch (error) {
//         console.error("Error fetching eventday data:", error);
//       }
//     }

//     let totalCountQuery = `
//       SELECT COUNT(*) AS total
//       FROM cs_os_users
//       WHERE cs_isconfirm = 0 
//     `;

//     if (search) {
//       totalCountQuery += `
//         AND (cs_last_name LIKE '%${search}%' OR 
//              cs_first_name LIKE '%${search}%' OR
//              cs_reg_category LIKE '%${search}%')
//       `;
//     }
//     if (catID !== 'Yes' && catID) {
//       totalCountQuery += ` AND cs_reg_cat_id = ${catID}`;
//     } else if (catID === 'Yes') {
//       totalCountQuery += ` AND cs_onspot = 'Yes'`;
//     }

//     const [totalCountResult] = await pool.query(totalCountQuery);
//     const totalItems = totalCountResult[0].total;
//     const totalPages = Math.ceil(totalItems / pageSize);

//     res.json({
//       Users: userData,
//       Column: columnsToFetch,
//       allColumn: allColumns,
//       currentPage: parseInt(page),
//       totalPages,
//       pageSize,
//       totalItems
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error', error });
//   }
// });


// Confirm User listing
router.get('/getConfirmUser', verifyToken, async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      catID,
      ticketId, // Capture ticketId from query parameters
      sortColumn = 'id',
      sortOrder = 'DESC',
      opt = '',
      selectedColumns,
      iscomplimentary,
      iscancel,
      isinactive,
    } = req.query;

    const offset = (page - 1) * pageSize;

    console.log(req.query);

    // Convert selectedColumns back into an array
    const columnsArray = selectedColumns ? selectedColumns.split(',') : [];



    const allDataQuery = `
      SELECT cs_field_name, cs_field_label
      FROM cs_os_field_data
      WHERE cs_status IN (1, 2) AND cs_visible_add_user = 1 OR cs_field_id = 1
      ORDER BY cs_field_order
    `;

    const [alldata] = await pool.query(allDataQuery);
    const allColumns = alldata.map(row => ({
      cs_field_name: row.cs_field_name,
      cs_field_label: row.cs_field_label
    }));

    const fieldDataQuery = `
      SELECT cs_field_name
      FROM cs_os_field_data
      WHERE cs_status IN (1, 2) AND cs_visible_add_user = 1 OR cs_field_id = 1
      ORDER BY cs_field_order
    `;

    const [fieldData] = await pool.query(fieldDataQuery);
    const columnsToFetch = fieldData.map(row => row.cs_field_name).join(', ');

    console.log('fieldData', columnsToFetch);

    const validColumns = ['id', 'cs_first_name', 'cs_last_name', 'cs_reg_category', 'cs_title', 'cs_workshop_category', 'cs_country', 'cs_state', 'cs_city', 'cs_email', 'cs_address', 'cs_phone', 'cs_company_name', 'cs_reg_type', 'cs_status']; // Valid column names
    const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'id';

    let query = `
      SELECT ${columnsToFetch}, id, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at, cs_status, cs_isduplicate, cs_reg_cat_id
      FROM cs_os_users
      WHERE cs_isconfirm = 1
    `;

    // Add search conditions
    // if (search) {
    //   const searchConditions = fieldData
    //     .map(row => `${row.cs_field_name} LIKE '%${search}%'`)
    //     .join(' OR ');

    //   query += ` AND (${searchConditions})`;
    // }
    if (search) {
      const searchTrimmed = search.trim(); // Remove leading/trailing spaces
      const searchTerms = searchTrimmed.split(' ');

      let searchConditions = '';

      if (searchTerms.length === 3) {
        // If three terms are entered, assume first name, middle name/initial, and last name
        const firstName = searchTerms[0];
        const middleInitial = searchTerms[1];
        const lastName = searchTerms[2];

        searchConditions = `
          (
            cs_first_name LIKE '%${firstName} ${middleInitial}%' AND cs_last_name LIKE '%${lastName}%'
          )
        `;
      } else if (searchTerms.length === 2) {
        // If two terms are entered, handle cases like "Uma B." or "Uma Robinson"
        const firstName = searchTerms[0];
        const secondTerm = searchTerms[1];

        searchConditions = `
          (
            cs_first_name LIKE '%${firstName} ${secondTerm}%' OR
            (cs_first_name LIKE '%${firstName}%' AND cs_last_name LIKE '%${secondTerm}%')
          )
        `;
      } else {
        // Generate `LIKE` conditions for each selected column
        searchConditions = columnsArray
          .map(column => `${column} LIKE '%${search}%'`)
          .join(' OR ');
      }

      query += `
        AND (${searchConditions})
      `;
    }


    // Filter by category ID
    if (catID !== 'Yes' && catID) {
      query += ` AND cs_reg_cat_id = ${catID}`;
    } else if (catID === 'Yes') {
      query += ` AND cs_onspot = 'Yes'`;
    }

    // Filter by ticket ID if provided
    if (ticketId) {
      query += ` AND cs_ticket = ${ticketId}`; // Adjust the column name if necessary
    }

    // Filter by comilmentary if provided
    if (iscomplimentary) {
      query += ` AND cs_iscomplimentary = 1`; // Adjust the column name if necessary
    }

    // Filter by cancelled if provided
    if (iscancel) {
      query += ` AND cs_status = 2`; // Adjust the column name if necessary
    }

    // Filter by inacrtive if provided
    if (isinactive) {
      query += ` AND cs_status = 0`; // Adjust the column name if necessary
    }

    query += `
      ORDER BY ${columnToSortBy} ${sortOrder}
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const [userData] = await pool.query(query);

    for (let user of userData) {
      const workshopQuery = `
        SELECT cs_workshop_name
        FROM cs_os_workshop
        WHERE cs_workshop_id = ?
      `;

      try {
        const [workshopData] = await pool.query(workshopQuery, [user.cs_workshop_category]);
        if (workshopData.length > 0 && workshopData[0].cs_workshop_name) {
          user.cs_workshop_category = workshopData[0].cs_workshop_name;
        }
      } catch (error) {
        console.error("Error fetching workshop data:", error);
      }
    }

    for (let user of userData) {
      const eventdaysQuery = `
        SELECT cs_reg_daytype_name
        FROM cs_os_reg_daytype
        WHERE cs_reg_daytype_id = ?
      `;

      try {
        const [eventdayData] = await pool.query(eventdaysQuery, [user.cs_reg_type]);
        if (eventdayData.length > 0 && eventdayData[0].cs_reg_daytype_name) {
          user.cs_reg_type = eventdayData[0].cs_reg_daytype_name;
        }
      } catch (error) {
        console.error("Error fetching eventday data:", error);
      }
    }

    let totalCountQuery = `
      SELECT COUNT(*) AS total
      FROM cs_os_users
      WHERE cs_isconfirm = 1
    `;

    // Replicate the search logic
    if (search) {
      const searchTrimmed = search.trim();
      const searchTerms = searchTrimmed.split(' ');

      let searchConditions = '';

      if (searchTerms.length === 3) {
        const firstName = searchTerms[0];
        const middleInitial = searchTerms[1];
        const lastName = searchTerms[2];

        searchConditions = `
        (
          cs_first_name LIKE '%${firstName} ${middleInitial}%' AND cs_last_name LIKE '%${lastName}%'
        )
      `;
      } else if (searchTerms.length === 2) {
        const firstName = searchTerms[0];
        const secondTerm = searchTerms[1];

        searchConditions = `
        (
          cs_first_name LIKE '%${firstName} ${secondTerm}%' OR
          (cs_first_name LIKE '%${firstName}%' AND cs_last_name LIKE '%${secondTerm}%')
        )
      `;
      } else {
        // Generate `LIKE` conditions for each selected column
        searchConditions = columnsArray
          .map(column => `${column} LIKE '%${search}%'`)
          .join(' OR ');
      }
      totalCountQuery += `
      AND (${searchConditions})
    `;
    }

    if (catID !== 'Yes' && catID) {
      totalCountQuery += ` AND cs_reg_cat_id = ${catID}`;
    } else if (catID === 'Yes') {
      totalCountQuery += ` AND cs_onspot = 'Yes'`;
    }

    // Include ticketId in total count if provided
    if (ticketId) {
      totalCountQuery += ` AND cs_ticket = ${ticketId}`; // Adjust the column name if necessary
    }

    if (iscomplimentary) {
      totalCountQuery += ` AND cs_iscomplimentary = 1`; // Adjust the column name if necessary
    }

    // Filter by cancelled if provided
    if (iscancel) {
      totalCountQuery += ` AND cs_status = 2`; // Adjust the column name if necessary
    }

    // Filter by inacrtive if provided
    if (isinactive) {
      totalCountQuery += ` AND cs_status = 0`; // Adjust the column name if necessary
    }

    const [totalCountResult] = await pool.query(totalCountQuery);
    const totalItems = totalCountResult[0].total;
    const totalPages = Math.ceil(totalItems / pageSize);

    res.json({
      Users: userData,
      Column: columnsToFetch,
      allColumn: allColumns,
      currentPage: parseInt(page),
      totalPages,
      pageSize,
      totalItems
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});


//Temp user listing and Non confirm user listing
router.get('/getTempUser', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = '', catID, sortColumn = 'id', sortOrder = 'DESC', opt = '', selectedColumns } = req.query;
    const offset = (page - 1) * pageSize;

    console.log("Data", req.query);

    // Convert selectedColumns back into an array
    const columnsArray = selectedColumns ? selectedColumns.split(',') : [];

    const allDataQuery = `
      SELECT cs_field_name, cs_field_label
      FROM cs_os_field_data
      WHERE cs_visible_add_user = 1 AND cs_status IN (1, 2)
      ORDER BY cs_field_order
    `;

    const [alldata] = await pool.query(allDataQuery);

    const allColumns = alldata.map(row => ({
      cs_field_name: row.cs_field_name,
      cs_field_label: row.cs_field_label
    }));


    const fieldDataQuery = `
      SELECT cs_field_name
      FROM cs_os_field_data
      WHERE cs_status IN (1, 2) AND cs_visible_add_user = 1 
      ORDER BY cs_field_order
    `;

    const [fieldData] = await pool.query(fieldDataQuery);
    const columnsToFetch = fieldData.map(row => row.cs_field_name).join(', ');

    console.log('fieldData', columnsToFetch);

    const validColumns = ['id', 'cs_first_name', 'cs_last_name', 'cs_reg_category', 'cs_title', 'cs_workshop_category', 'cs_country', 'cs_state', 'cs_city', 'cs_email', 'cs_address', 'cs_phone', 'cs_company_name', 'cs_reg_type', 'cs_status']; // Add all valid column names here
    const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'id';
    //   let query = `
    //   SELECT ${columnsToFetch}, id, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at, cs_status, cs_isduplicate
    //   FROM cs_os_users
    //   WHERE cs_isconfirm = 1
    // `;

    if (opt === 'Temp') {
      query = `
      SELECT 
        ${columnsToFetch}, 
        u.id, 
        DATE_FORMAT(u.created_at, '%Y-%m-%d %H:%i:%s') as created_at, 
        u.cs_status, 
        u.cs_isduplicate,
        u.cs_reg_cat_id,
        u.cs_regno,
        p.total_paid_amount,      -- From cs_reg_temp_payment
        p.processing_fee,         -- From cs_reg_temp_payment
        p.conference_fees,        -- From cs_reg_temp_payment
        p.branch,                 -- From cs_reg_temp_payment
        p.bank,                   -- From cs_reg_temp_payment
        p.payment_date,           -- From cs_reg_temp_payment
        p.cheque_no,              -- From cs_reg_temp_payment
        p.tracking_id,            -- From cs_reg_temp_payment
        p.payment_mode,           -- From cs_reg_temp_payment
        p.paymenttype_id,         -- From cs_reg_temp_payment
        p.paymentstatus_id,       -- From cs_reg_temp_payment
        p.currency,               -- From cs_reg_temp_payment
        p.order_id,
        p.regamount,
        p.temppayment_id,
        p.is_discarded,
        t.ticket_title,
        a.addon_title
      FROM cs_os_users u
      INNER JOIN cs_reg_temp_payment p ON u.id = p.user_id
      LEFT JOIN cs_reg_tickets t ON u.cs_ticket = t.ticket_id
      LEFT JOIN cs_reg_add_ons a ON u.cs_addons = a.addon_id
      WHERE u.cs_isconfirm = 0
      AND p.confirm_payment = 0
      AND p.payment_mode = 'online'
      AND p.status = 1
      AND p.is_discarded = 1
      `;
    }


    if (opt === 'Disc') {
      query = `
      SELECT 
        ${columnsToFetch}, 
        u.id, 
        DATE_FORMAT(u.created_at, '%Y-%m-%d %H:%i:%s') as created_at, 
        u.cs_status, 
        u.cs_isduplicate,
        u.cs_reg_cat_id,
        u.cs_regno,
        p.total_paid_amount,      -- From cs_reg_temp_payment
        p.processing_fee,         -- From cs_reg_temp_payment
        p.conference_fees,        -- From cs_reg_temp_payment
        p.branch,                 -- From cs_reg_temp_payment
        p.bank,                   -- From cs_reg_temp_payment
        p.payment_date,           -- From cs_reg_temp_payment
        p.cheque_no,              -- From cs_reg_temp_payment
        p.tracking_id,              -- From cs_reg_temp_payment
        p.payment_mode,           -- From cs_reg_temp_payment
        p.paymenttype_id,         -- From cs_reg_temp_payment
        p.paymentstatus_id,       -- From cs_reg_temp_payment
        p.currency,                -- From cs_reg_temp_payment
        p.order_id,
        p.regamount,
        p.temppayment_id,
        p.is_discarded,
        t.ticket_title,
        a.addon_title
      FROM cs_os_users u
      INNER JOIN cs_reg_temp_payment p ON u.id = p.user_id
      LEFT JOIN cs_reg_tickets t ON u.cs_ticket = t.ticket_id
      LEFT JOIN cs_reg_add_ons a ON u.cs_addons = a.addon_id
      WHERE u.cs_isconfirm = 0
      AND p.is_discarded = 0
    `;
    }



    if (opt === 'NonConf') {
      query = `
      SELECT 
        ${columnsToFetch}, 
        u.id, 
        DATE_FORMAT(u.created_at, '%Y-%m-%d %H:%i:%s') as created_at, 
        u.cs_status, 
        u.cs_isduplicate,
        u.cs_reg_cat_id,
        u.cs_regno,
        p.total_paid_amount,      -- From cs_reg_temp_payment
        p.processing_fee,         -- From cs_reg_temp_payment
        p.conference_fees,        -- From cs_reg_temp_payment
        p.branch,                 -- From cs_reg_temp_payment
        p.bank,                   -- From cs_reg_temp_payment
        p.payment_date,           -- From cs_reg_temp_payment
        p.cheque_no,              -- From cs_reg_temp_payment
        p.tracking_id,              -- From cs_reg_temp_payment
        p.payment_mode,           -- From cs_reg_temp_payment
        p.paymenttype_id,         -- From cs_reg_temp_payment
        p.paymentstatus_id,       -- From cs_reg_temp_payment
        p.currency,                -- From cs_reg_temp_payment
        p.order_id,
        p.regamount,
        p.temppayment_id,
        p.is_discarded,
        t.ticket_title,
        a.addon_title
      FROM cs_os_users u
      INNER JOIN cs_reg_temp_payment p ON u.id = p.user_id
      LEFT JOIN cs_reg_tickets t ON u.cs_ticket = t.ticket_id
      LEFT JOIN cs_reg_add_ons a ON u.cs_addons = a.addon_id
      WHERE u.cs_isconfirm = 0
      AND p.confirm_payment = 1
      AND p.status = 1
      AND p.is_discarded = 1
    `;
    }



    if (search) {
      const searchTrimmed = search.trim(); // Remove leading/trailing spaces
      const searchTerms = searchTrimmed.split(' ');

      let searchConditions = '';

      if (searchTerms.length === 3) {
        // If three terms are entered, assume first name, middle name/initial, and last name
        const firstName = searchTerms[0];
        const middleInitial = searchTerms[1];
        const lastName = searchTerms[2];

        searchConditions = `
          (
            cs_first_name LIKE '%${firstName} ${middleInitial}%' AND cs_last_name LIKE '%${lastName}%'
          )
        `;
      } else if (searchTerms.length === 2) {
        // If two terms are entered, handle cases like "Uma B." or "Uma Robinson"
        const firstName = searchTerms[0];
        const secondTerm = searchTerms[1];

        searchConditions = `
          (
            cs_first_name LIKE '%${firstName} ${secondTerm}%' OR
            (cs_first_name LIKE '%${firstName}%' AND cs_last_name LIKE '%${secondTerm}%')
          )
        `;
      } else {
        // Generate `LIKE` conditions for each selected column
        searchConditions = columnsArray
          .map(column => `${column} LIKE '%${search}%'`)
          .join(' OR ');
      }

      query += `
        AND (${searchConditions})
      `;
    }

    if (catID !== 'Yes' && catID) {
      query += ` AND cs_reg_cat_id = ${catID}`;
    } else if (catID === 'Yes') {
      query += ` AND cs_onspot = 'Yes'`;
    }

    query += `
      ORDER BY ${columnToSortBy} ${sortOrder}
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const [userData] = await pool.query(query);

    for (let user of userData) {
      const workshopQuery = `
        SELECT cs_workshop_name
        FROM cs_os_workshop
        WHERE cs_workshop_id = ?
      `;

      try {
        const [workshopData] = await pool.query(workshopQuery, [user.cs_workshop_category]);
        if (workshopData.length > 0 && workshopData[0].cs_workshop_name) {
          user.cs_workshop_category = workshopData[0].cs_workshop_name;
        }
      } catch (error) {
        console.error("Error fetching workshop data:", error);
      }
    }

    for (let user of userData) {
      const eventdaysQuery = `
        SELECT cs_reg_daytype_name
        FROM cs_os_reg_daytype
        WHERE cs_reg_daytype_id = ?
      `;

      try {
        const [eventdayData] = await pool.query(eventdaysQuery, [user.cs_reg_type]);
        if (eventdayData.length > 0 && eventdayData[0].cs_reg_daytype_name) {
          user.cs_reg_type = eventdayData[0].cs_reg_daytype_name;
        }
      } catch (error) {
        console.error("Error fetching eventday data:", error);
      }
    }

    let totalCountQuery = `
    SELECT COUNT(*) AS total
    FROM cs_os_users
    WHERE cs_isconfirm = 1
  `;

    if (opt === 'Temp') {
      totalCountQuery = `
      SELECT COUNT(*) AS total
      FROM cs_os_users u
      INNER JOIN cs_reg_temp_payment p ON u.id = p.user_id
      WHERE u.cs_isconfirm = 0
      AND p.confirm_payment = 0
      AND p.payment_mode = 'Online'
      AND p.status = 1
    `;
    } else if (opt === 'NonConf') {
      totalCountQuery = `
      SELECT COUNT(*) AS total
      FROM cs_os_users u
      INNER JOIN cs_reg_temp_payment p ON u.id = p.user_id
      WHERE u.cs_isconfirm = 0
      AND p.confirm_payment = 1
      AND p.status = 1
    `;
    } else if (opt === 'Disc') {
      totalCountQuery = `
      SELECT COUNT(*) AS total
      FROM cs_os_users u
      INNER JOIN cs_reg_temp_payment p ON u.id = p.user_id
      WHERE u.cs_isconfirm = 0
      AND p.confirm_payment = 1
      AND p.status = 0
    `;
    }


    // Replicate the search logic
    if (search) {
      const searchTrimmed = search.trim();
      const searchTerms = searchTrimmed.split(' ');

      let searchConditions = '';

      if (searchTerms.length === 3) {
        const firstName = searchTerms[0];
        const middleInitial = searchTerms[1];
        const lastName = searchTerms[2];

        searchConditions = `
        (
          cs_first_name LIKE '%${firstName} ${middleInitial}%' AND cs_last_name LIKE '%${lastName}%'
        )
      `;
      } else if (searchTerms.length === 2) {
        const firstName = searchTerms[0];
        const secondTerm = searchTerms[1];

        searchConditions = `
        (
          cs_first_name LIKE '%${firstName} ${secondTerm}%' OR
          (cs_first_name LIKE '%${firstName}%' AND cs_last_name LIKE '%${secondTerm}%')
        )
      `;
      } else {
        // Generate `LIKE` conditions for each selected column
        searchConditions = columnsArray
          .map(column => `${column} LIKE '%${search}%'`)
          .join(' OR ');
      }
      totalCountQuery += `
      AND (${searchConditions})
    `;
    }

    if (catID !== 'Yes' && catID) {
      totalCountQuery += ` AND u.cs_reg_cat_id = ${catID}`;
    } else if (catID === 'Yes') {
      totalCountQuery += ` AND u.cs_onspot = 'Yes'`;
    }

    // Execute the query
    const [totalCountResult] = await pool.query(totalCountQuery);
    const totalItems = totalCountResult[0].total;
    const totalPages = Math.ceil(totalItems / pageSize);


    res.json({
      Users: userData,
      Column: columnsToFetch,
      allColumn: allColumns,
      currentPage: parseInt(page),
      totalPages,
      pageSize,
      totalItems
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});








router.get('/getField', verifyToken, async (req, res) => {
  try {
    const columnsToFetch = 'cs_os_field_data.*, cs_os_field_type.field_type_name';

    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
    SELECT ${columnsToFetch}
    FROM cs_os_field_data
    LEFT JOIN cs_os_field_type ON cs_os_field_data.cs_field_type = cs_os_field_type.cs_field_type
    WHERE cs_visible_reg_adminform = 1
    ORDER BY cs_field_order; 
`;


    const [fieldData] = await pool.query(query);

    // Send the field data as a response
    res.json({ Fields: fieldData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/getEditField', verifyToken, async (req, res) => {
  try {
    const columnsToFetch = 'cs_os_field_data.*, cs_os_field_type.field_type_name';

    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
      SELECT ${columnsToFetch}
      FROM cs_os_field_data
      LEFT JOIN cs_os_field_type ON cs_os_field_data.cs_field_type = cs_os_field_type.cs_field_type
      WHERE  cs_visible_reg_adminform = 1
        AND cs_os_field_data.cs_field_id NOT IN (12, 13, 24, 25)
      ORDER BY cs_field_order; 
    `;

    const [fieldData] = await pool.query(query);

    // Send the field data as a response
    res.json({ Fields: fieldData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/getBasicField', verifyToken, async (req, res) => {
  try {
    const columnsToFetch = 'cs_os_field_data.*, cs_os_field_type.field_type_name';

    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
    SELECT ${columnsToFetch}
    FROM cs_os_field_data
    LEFT JOIN cs_os_field_type ON cs_os_field_data.cs_field_type = cs_os_field_type.cs_field_type
    WHERE cs_visible_reg_basicform = 1
    ORDER BY cs_field_order; 
`;


    const [fieldData] = await pool.query(query);

    // Send the field data as a response
    res.json({ Fields: fieldData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// router.get('/getDropdownData', verifyToken, async (req, res) => {
//   try {
//     // Specify the columns you want to fetch from each table
//     const facilitytype = ['cs_type'];
//     const prefix = ['cs_prefix', 'cs_prefix_id'];
//     const country = ['cs_country', 'cs_country_id'];
//     const states = ['cs_state_name', 'cs_state_id', 'cs_country_id'];
//     const reg_cat = ['cs_reg_category', 'cs_reg_cat_id'];
//     const work_cat = ['cs_workshop_name', 'cs_workshop_id'];
//     const day_type = ['cs_reg_daytype_name', 'cs_reg_daytype_id'];
//     const ticket = ['ticket_id', 'ticket_title', 'ticket_type', 'ticket_category'];
//     const addon = ['addon_id', 'addon_title', 'addon_ticket_ids'];
//     const paymenttype = ['paymenttype_id', 'paymenttype_name'];
//     const paymentstatus = ['paymentstatus_id', 'paymentstatus_name'];
//     const ticketAmount = ['ticket_id', 'tick_amount', 'tick_duration_start_date', 'tick_duration_till_date'];
//     const addonAmount = ['addon_id', 'addon_amount'];
//     const processingFeesQuery = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Processing fee in %"`;
//     const facultytype = ['type_title', 'facultytype_id'];
//     const exhibitor = ['exh_name', 'exh_id'];



//     // Execute each query to fetch data from respective tables
//     const [facilitytypeData] = await pool.query(`SELECT ${facilitytype.join(',')} FROM cs_os_facilitytype`);
//     const [prefixData] = await pool.query(`SELECT ${prefix.join(',')} FROM cs_os_name_prefixes`);
//     const [countryData] = await pool.query(`SELECT ${country.join(',')} FROM cs_tbl_country`);
//     const [statesData] = await pool.query(`SELECT ${states.join(',')} FROM cs_tbl_states`);
//     const [regCatData] = await pool.query(`SELECT ${reg_cat.join(',')} FROM cs_os_category WHERE cs_status = 1`);
//     const [workshopData] = await pool.query(`SELECT ${work_cat.join(',')} FROM cs_os_workshop WHERE cs_status = 1`);
//     const [dayTypeData] = await pool.query(`SELECT ${day_type.join(',')} FROM cs_os_reg_daytype WHERE cs_status = 1 ORDER BY cs_reg_daytype_id ASC`);
//     const [customData] = await pool.query(`SELECT cs_field_option, cs_field_option_value, cs_field_option_id, cs_field_id FROM cs_os_field_option WHERE cs_status = 1`);
//     const [ticketData] = await pool.query(`SELECT ${ticket.join(',')} FROM cs_reg_tickets WHERE ticket_visibility = 1`);
//     const [addonData] = await pool.query(`SELECT ${addon.join(',')} FROM cs_reg_add_ons WHERE addon_visiblility = 1`);
//     const [paymentTypeData] = await pool.query(`SELECT ${paymenttype.join(',')} FROM cs_reg_payment_type WHERE status = 1`);
//     const [paymentStatusData] = await pool.query(`SELECT ${paymentstatus.join(',')} FROM cs_reg_payment_status WHERE status = 1`);
//     const [ticketAmountData] = await pool.query(`SELECT ${ticketAmount.join(',')} FROM cs_reg_ticket_duration WHERE status = 1`);
//     // Assuming `ticketAmount` is an array of columns you want to select
//     // const currentDate = new Date(); // Get the current date
//     // const [ticketAmountData] = await pool.query(`
//     //   SELECT ${ticketAmount.join(', ')} 
//     //   FROM cs_reg_ticket_duration 
//     //   WHERE tick_duration_start_date <= ? 
//     //   AND tick_duration_till_date >= ? 
//     //   AND Status = 1
//     // `, [currentDate, currentDate]);
//     const [addonAmountData] = await pool.query(`SELECT ${addonAmount.join(',')} FROM cs_reg_addon_duration WHERE status = 1`);
//     const [processingFeesData] = await pool.query(processingFeesQuery);
//     const [facultytypeData] = await pool.query(`SELECT ${facultytype.join(',')} FROM cs_app_facultytype WHERE status = 1`);
//     const [exhibitorData] = await pool.query(`SELECT ${exhibitor.join(',')} FROM cs_app_exhibitor WHERE status = 1`);



//     // Construct the response object
//     const responseData = {
//       // facilityType: facilitytypeData, // Uncomment if needed
//       prefix: prefixData,
//       country: countryData,
//       states: statesData,
//       regCategory: regCatData,
//       workshop: workshopData,
//       dayType: dayTypeData,
//       ticket: ticketData,
//       addon: addonData,
//       custom: customData,
//       paymentType: paymentTypeData,
//       paymentStatus: paymentStatusData,
//       ticketAmount: ticketAmountData,
//       addonAmount: addonAmountData,
//       processingFees: processingFeesData, // Added processing fees to response
//       facultytype: facultytypeData,
//       exhibitor: exhibitorData,
//     };

//     // Send the response containing data from all queries
//     res.json(responseData);
//   } catch (error) {
//     console.error('Error fetching dropdown data:', error); // More descriptive logging
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });


router.get('/getDropdownData', verifyToken, async (req, res) => {
  try {
    // Specify the columns you want to fetch from each table
    const facilitytype = ['cs_type'];
    const prefix = ['cs_prefix', 'cs_prefix_id'];
    const country = ['cs_country', 'cs_country_id'];
    const states = ['cs_state_name', 'cs_state_id', 'cs_country_id'];
    const reg_cat = ['cs_reg_category', 'cs_reg_cat_id'];
    const work_cat = ['cs_workshop_name', 'cs_workshop_id'];
    const day_type = ['cs_reg_daytype_name', 'cs_reg_daytype_id'];
    const ticket = ['ticket_id', 'ticket_title', 'ticket_type', 'ticket_category','ticket_ispaid','ticket_type','ticket_count'];
    const addon = ['addon_id', 'addon_title', 'addon_ticket_ids','addon_cat_type','addon_workshop_id','addon_accper_type','	addon_accper_limit','addon_type','addon_count','addon_ispaid','addon_workshoprtype_id'];
    const paymenttype = ['paymenttype_id', 'paymenttype_name'];
    const paymentstatus = ['paymentstatus_id', 'paymentstatus_name'];
    const ticketAmount = ['ticket_id', 'tick_amount', 'tick_duration_start_date', 'tick_duration_till_date'];
    const addonAmount = ['addon_id', 'addon_amount'];
    const processingFeesQuery = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Processing fee in %"`;
    const facultytype = ['type_title', 'facultytype_id'];
    const exhibitor = ['exh_name', 'exh_id'];
    const currency = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "currency"`;
    const processinginclded = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "processing_fee_IncludeExclude"`;
    const processingfeeornot = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "processing_fees"`;
    const processingfeein = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "processing_fees_in"`;
    const gstinclded = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "GST_Include"`;
    const gstfee = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "GST"`;
    const IGSTfee = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "IGST"`;
    const paymentmode = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Payment_mode"`;
    const workshop_type = ['workshoptype_name', 'id'];





    // Execute each query to fetch data from respective tables
    const [facilitytypeData] = await pool.query(`SELECT ${facilitytype.join(',')} FROM cs_os_facilitytype`);
    const [prefixData] = await pool.query(`SELECT ${prefix.join(',')} FROM cs_os_name_prefixes`);
    const [countryData] = await pool.query(`SELECT ${country.join(',')} FROM cs_tbl_country`);
    const [statesData] = await pool.query(`SELECT ${states.join(',')} FROM cs_tbl_states`);
    // const [regCatData] = await pool.query(`SELECT ${reg_cat.join(',')} FROM cs_os_category WHERE cs_status = 1`);
    const [regCatData] = await pool.query(`SELECT ${reg_cat.join(',')} FROM cs_os_category WHERE cs_status = 1 AND cs_show_conference_form = 1`);
    const [workshopData] = await pool.query(`SELECT ${work_cat.join(',')} FROM cs_os_workshop WHERE cs_status = 1`);
    const [dayTypeData] = await pool.query(`SELECT ${day_type.join(',')} FROM cs_os_reg_daytype WHERE cs_status = 1 ORDER BY cs_reg_daytype_id ASC`);
    const [customData] = await pool.query(`SELECT cs_field_option, cs_field_option_value, cs_field_option_id, cs_field_id FROM cs_os_field_option WHERE cs_status = 1`);
    const [ticketData] = await pool.query(`SELECT ${ticket.join(',')} FROM cs_reg_tickets WHERE ticket_visibility = 1`);
    const [addonData] = await pool.query(`SELECT ${addon.join(',')} FROM cs_reg_add_ons WHERE addon_visiblility = 1`);
    const [paymentTypeData] = await pool.query(`SELECT ${paymenttype.join(',')} FROM cs_reg_payment_type WHERE status = 1`);
    const [paymentStatusData] = await pool.query(`SELECT ${paymentstatus.join(',')} FROM cs_reg_payment_status WHERE status = 1`);
    const [workshoptypeData] = await pool.query(`SELECT ${workshop_type.join(',')} FROM cs_os_workshop_type WHERE cs_status = 1`);
    // const [ticketAmountData] = await pool.query(`SELECT ${ticketAmount.join(',')} FROM cs_reg_ticket_duration WHERE status = 1`);
    // Assuming `ticketAmount` is an array of columns you want to select
    const currentDate = new Date(); // Get the current date
    const formattedCurrentDate = currentDate.toISOString().split('T')[0]; // Get the date in 'YYYY-MM-DD' format


    console.log("Formatted Current Date", formattedCurrentDate);

    const [ticketAmountData] = await pool.query(`
      SELECT ${ticketAmount.join(', ')} 
      FROM cs_reg_ticket_duration 
      WHERE tick_duration_start_date <= ? 
      AND tick_duration_till_date >= ? 
      AND Status = 1
    `, [formattedCurrentDate, formattedCurrentDate]);

    console.log(ticketAmountData);

    // const [addonAmountData] = await pool.query(`SELECT ${addonAmount.join(',')} FROM cs_reg_addon_duration WHERE status = 1`);

    const [addonAmountData] = await pool.query(`
      SELECT ${addonAmount.join(', ')} 
      FROM cs_reg_addon_duration 
      WHERE addon_duration_start_date <= ? 
      AND 	addon_duration_till_date >= ? 
      AND Status = 1
    `, [formattedCurrentDate, formattedCurrentDate]);

    console.log(addonAmountData);
    const [processingFeesData] = await pool.query(processingFeesQuery);
    const [facultytypeData] = await pool.query(`SELECT ${facultytype.join(',')} FROM cs_app_facultytype WHERE status = 1`);
    const [exhibitorData] = await pool.query(`SELECT ${exhibitor.join(',')} FROM cs_app_exhibitor WHERE status = 1`);
    const [processingincldedData] = await pool.query(processinginclded);
    const [CurrencyData] = await pool.query(currency);
    const [processingfeeornotData] = await pool.query(processingfeeornot);
    const [gstincldedData] = await pool.query(gstinclded);
    const [gstfeeData] = await pool.query(gstfee);
    const [processingfeeinData] = await pool.query(processingfeein);
    const [gstamount] = await pool.query(IGSTfee);
    const [paymentmodeData] = await pool.query(paymentmode);




    // Construct the response object
    const responseData = {
      // facilityType: facilitytypeData, // Uncomment if needed
      prefix: prefixData,
      country: countryData,
      states: statesData,
      regCategory: regCatData,
      workshop: workshopData,
      dayType: dayTypeData,
      ticket: ticketData,
      addon: addonData,
      custom: customData,
      paymentType: paymentTypeData,
      paymentStatus: paymentStatusData,
      ticketAmount: ticketAmountData,
      addonAmount: addonAmountData,
      processingFees: processingFeesData, // Added processing fees to response
      facultytype: facultytypeData,
      exhibitor: exhibitorData,
      currency: CurrencyData,
      gstfee: gstfeeData,
      gstinclded: gstincldedData,
      processingfeein: processingfeeinData,
      processinginclded: processingincldedData,
      processingfeeornot: processingfeeornotData,
      gstamount: gstamount,
      paymentmode : paymentmodeData,
      workshoptype: workshoptypeData

    };

    // Send the response containing data from all queries
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching dropdown data:', error); // More descriptive logging
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/addBasicUser', verifyToken, async (req, res) => {
  console.log(req.body);

  try {
    const userData = req.body;

    // Get the columns (keys) and values from the request body dynamically
    const columns = Object.keys(userData);
    const values = Object.values(userData);

    // Add 'cs_module' column and its value if it's constant or from req.body
    columns.push('cs_module');
    values.push(1);  // Set your desired value for cs_module

    // Create placeholders for the values in the SQL query
    const placeholders = values.map(() => '?').join(', ');

    // Construct the dynamic SQL query for inserting the new user
    const insertQuery = `
      INSERT INTO cs_os_users (${columns.join(', ')})
      VALUES (${placeholders})
    `;

    // Execute the query and retrieve the new user ID
    const [insertResult] = await pool.query(insertQuery, values);
    const newUserId = insertResult.insertId;


    res.status(200).json({ success: true, message: "User added successfully", data: { ...userData } });
  } catch (error) {
    console.error('Error adding user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/editBasicUser', verifyToken, async (req, res) => {
  console.log(req.body);

  try {
    const userData = req.body;

    // Extract the unique identifier (e.g., cs_regno) for updating the user
    const { cs_regno } = userData;

    if (!cs_regno) {
      return res.status(400).json({ error: 'Registration number (cs_regno) is required for updating the user.' });
    }

    // Remove cs_regno from userData, as we don't want to update this field
    delete userData.cs_regno;

    // Get the columns and values from the request body dynamically
    const columns = Object.keys(userData);
    const values = Object.values(userData);

    // Construct the SQL query with dynamic column assignments for the UPDATE statement
    const updateQuery = `
      UPDATE cs_os_users
      SET ${columns.map(col => `${col} = ?`).join(', ')}
      WHERE id = ?
    `;

    // Execute the query with the dynamically generated values and cs_regno at the end
    await pool.query(updateQuery, [...values, cs_regno]);

    res.status(200).json({ success: true, message: "User updated successfully", data: userData });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/editConfirmUser', verifyToken, async (req, res) => {
  console.log(req.body);

  try {
    const userData = req.body;

    // Extract the unique identifier (e.g., cs_regno) for updating the user
    const { id } = userData;

    // Remove cs_regno from userData, as we don't want to update this field
    delete userData.id;

    // Get the columns and values from the request body dynamically
    const columns = Object.keys(userData);
    const values = Object.values(userData);

    // Construct the SQL query with dynamic column assignments for the UPDATE statement
    const updateQuery = `
      UPDATE cs_os_users
      SET ${columns.map(col => `${col} = ?`).join(', ')}
      WHERE id = ?
    `;

    // Execute the query with the dynamically generated values and cs_regno at the end
    await pool.query(updateQuery, [...values, id]);

    res.status(200).json({ success: true, message: "User updated successfully", data: userData });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


//Working 18/10/2024
// router.post('/addConfirmUser', verifyToken, async (req, res) => {
//   console.log(req.body);

//   try {
//     const userData = req.body.data;
//     // const sendEmail = req.body.userData.sendEmail; // Not used in this example, but you might use it later
//     const UserId = req.body.Id;
//     const payment = req.body.paymentDetails;

//     // Get the columns (keys) from the userData
//     // const columns = Object.keys(userData);
//     // const values = Object.values(userData);
//     // Get the columns (keys) from the userData
//     const columns = Object.keys(userData).filter(col => col !== 'sendEmail'); // Exclude sendEmail
//     const values = Object.values(userData).filter((_, index) => columns[index] !== 'sendEmail');

//     // Add the cs_module value
//     const csModuleValue = 1; // Replace with the actual value if necessary

//     // Fetch cs_reg_cat_id based on cs_reg_category
//     const [categoryResult] = await pool.query(
//       'SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?',
//       [userData.cs_reg_category] // Use cs_reg_category value to fetch cs_reg_cat_id
//     );

//     // Check if categoryResult is not empty
//     if (categoryResult.length === 0) {
//       return res.status(404).json({ error: 'Category not found' });
//     }

//     // Get the fetched cs_reg_cat_id
//     const csRegCat = categoryResult[0].cs_reg_category;

//     // Step 2: Fetch the last registration number from the site settings
//     const siteSettingResult = await pool.query('SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Admin Reg Start Number"');
//     let lastRegNo = siteSettingResult.length > 0 ? parseInt(siteSettingResult[0][0].cs_value, 10) : 0;
//     console.log("lastRegNo", lastRegNo);

//     // Step 3: Check if the incremented regNo already exists, if yes, find a unique one
//     let regNoExists = true;
//     while (regNoExists) {
//       const existingRegNoResult = await pool.query('SELECT COUNT(*) AS count FROM cs_os_users WHERE cs_regno = ?', [lastRegNo]);
//       const existingRegNoCount = existingRegNoResult[0][0].count || 0;
//       if (existingRegNoCount > 0) {
//         lastRegNo++;
//       } else {
//         regNoExists = false;
//       }
//     }

//     // Step 4: Increment registration number
//     let regNo = lastRegNo + 1;

//     // Add cs_reg_cat_id to columns and values
//     columns.push('cs_reg_cat_id', 'cs_reg_category', 'cs_regno', 'cs_module', 'cs_isconfirm');
//     values.push(userData.cs_reg_category, csRegCat, regNo, csModuleValue, 1);

//     // Create SET clause for the SQL query
//     const setClause = columns.map((column) => `${column} = ?`).join(', ');

//     // Construct the SQL UPDATE query
//     const updateQuery = `
//     UPDATE cs_os_users
//     SET ${setClause}, cs_module = ?
//     WHERE id = ?
//   `;


//     // Execute the query with the dynamically generated values
//     const [updateResult] = await pool.query(updateQuery, [...values, csModuleValue, UserId]);


//     if (payment) {
//       try {
//         // Insert the payment data into cs_reg_payment
//         const paymentColumns = Object.keys(payment);
//         const paymentValues = Object.values(payment);

//         // Add the additional column and value
//         const additionalColumn = 'user_id'; // Replace with actual column name
//         const additionalValue = UserId; // Replace with actual value

//         paymentColumns.push(additionalColumn);
//         paymentValues.push(additionalValue);

//         // Prepare the SQL query
//         const paymentInsertQuery = `
//           INSERT INTO cs_reg_payment (${paymentColumns.join(', ')})
//           VALUES (${paymentColumns.map(() => '?').join(', ')})
//         `;

//         // Execute the query
//         await pool.query(paymentInsertQuery, paymentValues);

//         // Optionally update the setting value in cs_tbl_sitesetting after user update
//         await pool.query(
//           'UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter = ?',
//           [regNo, 'Admin Reg Start Number']
//         );
//       } catch (paymentError) {
//         console.error('Error inserting payment data:', paymentError);
//         return res.status(500).json({ error: 'Error inserting payment data' });
//       }
//     }



//     console.log("Call", updateResult);

//     const [warnings] = await pool.query('SHOW WARNINGS');
//     console.log("Warnings:", warnings);

//     // Sending email with error handling
//     if (userData.sendEmail) {
//       try {
//         const [userRow] = await pool.query('SELECT * FROM cs_os_users WHERE id = ?', [UserId]);
//         if (userRow.length > 0) {
//           await sendConfirmEmail(userRow[0]);
//         }
//       } catch (emailError) {
//         console.error('Error sending email:', emailError);
//         return res.status(500).json({ error: 'Error sending email' });
//       }
//     }

//     res.status(200).json({ success: true, message: "User updated successfully", data: userData });
//   } catch (error) {
//     console.error('Error updating user:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// });
//24-10-2024
// router.post('/addConfirmUser', verifyToken, async (req, res) => {
//   console.log('Request Body:', req.body); // Log the incoming request body

//   try {
//     const userData = req.body.data;
//     const UserId = req.body.Id;
//     const payment = req.body.paymentDetails;

//     console.log('User Data:', userData); // Log userData
//     console.log('User ID:', UserId); // Log UserId
//     console.log('Payment Details:', payment); // Log payment details

//     // Exclude sendEmail from userData
//     const { sendEmail, ...filteredUserData } = userData;

//     // Get columns and values from the filtered userData
//     const columns = Object.keys(filteredUserData);
//     const values = Object.values(filteredUserData);

//     console.log('Columns:', columns); // Log columns
//     console.log('Values:', values); // Log values

//     const csModuleValue = 1; // Replace with the actual value if necessary

//     // Fetch cs_reg_cat_id based on cs_reg_category
//     const [categoryResult] = await pool.query(
//       'SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?',
//       [userData.cs_reg_category]
//     );

//     console.log('Category Result:', categoryResult); // Log fetched category result

//     // Check if categoryResult is not empty
//     if (categoryResult.length === 0) {
//       return res.status(404).json({ error: 'Category not found' });
//     }

//     const csRegCat = categoryResult[0].cs_reg_category;

//     // Fetch the last registration number from the site settings
//     const siteSettingResult = await pool.query('SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Admin Reg Start Number"');
//     let lastRegNo = siteSettingResult.length > 0 ? parseInt(siteSettingResult[0][0].cs_value, 10) : 0;
//     console.log("Last Registration Number:", lastRegNo); // Log last registration number

//     // Check if the incremented regNo already exists
//     let regNoExists = true;
//     while (regNoExists) {
//       const existingRegNoResult = await pool.query('SELECT COUNT(*) AS count FROM cs_os_users WHERE cs_regno = ?', [lastRegNo]);
//       const existingRegNoCount = existingRegNoResult[0][0].count || 0;
//       console.log('Existing Registration Number Count:', existingRegNoCount); // Log count of existing registration numbers
//       if (existingRegNoCount > 0) {
//         lastRegNo++;
//       } else {
//         regNoExists = false;
//       }
//     }

//     let regNo = lastRegNo;
//     console.log("New Registration Number:", regNo); // Log new registration number

//     // Add cs_reg_cat_id to columns and values
//     columns.push('cs_reg_cat_id', 'cs_reg_category', 'cs_regno', 'cs_module', 'cs_isconfirm');
//     values.push(userData.cs_reg_category, csRegCat, regNo, csModuleValue, 1);

//     console.log('Updated Columns for SQL:', columns); // Log updated columns
//     console.log('Updated Values for SQL:', values); // Log updated values

//     // Create SET clause for the SQL query
//     const setClause = columns.map((column) => `${column} = ?`).join(', ');

//     // Construct the SQL UPDATE query
//     const updateQuery = `
//       UPDATE cs_os_users
//       SET ${setClause}
//       WHERE id = ?
//     `;

//     // Execute the query with the dynamically generated values
//     const [updateResult] = await pool.query(updateQuery, [...values, UserId]);
//     console.log("Update Result:", updateResult); // Log update result

//     if (payment) {
//       try {
//         // Insert the payment data into cs_reg_payment
//         const paymentColumns = Object.keys(payment);
//         const paymentValues = Object.values(payment);

//         const additionalColumn = 'user_id';
//         const additionalValue = UserId;

//         paymentColumns.push(additionalColumn);
//         paymentValues.push(additionalValue);

//         // Prepare the SQL query
//         const paymentInsertQuery = `
//           INSERT INTO cs_reg_payment (${paymentColumns.join(', ')})
//           VALUES (${paymentColumns.map(() => '?').join(', ')})
//         `;

//         // Execute the query
//         await pool.query(paymentInsertQuery, paymentValues);
//         console.log("Payment Insert Result:", paymentValues); // Log payment insert result


//       } catch (paymentError) {
//         console.error('Error inserting payment data:', paymentError);
//         return res.status(500).json({ error: 'Error inserting payment data' });
//       }
//     }

//     // Optionally update the setting value in cs_tbl_sitesetting after user update
//     await pool.query(
//       'UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter = ?',
//       [regNo, 'Admin Reg Start Number']
//     );

//     const [warnings] = await pool.query('SHOW WARNINGS');
//     console.log("Warnings:", warnings); // Log any SQL warnings

//     // Sending email with error handling
//     if (userData.sendEmail) {
//       try {
//         const [userRow] = await pool.query('SELECT * FROM cs_os_users WHERE id = ?', [UserId]);
//         if (userRow.length > 0) {
//           await sendConfirmEmail(userRow[0]);

//           // Update cs_confirmmail to 1 after successfully sending the email
//           await pool.query(
//             'UPDATE cs_os_users SET cs_confirmmail = ? WHERE id = ?',
//             [1, UserId]
//           );
//           console.log("cs_confirmmail updated successfully for UserId:", UserId); // Log success
//         }
//       } catch (emailError) {
//         console.error('Error sending email:', emailError);

//         // Set cs_confirmmail to 0 if there is an error
//         await pool.query(
//           'UPDATE cs_os_users SET cs_confirmmail = ? WHERE id = ?',
//           [0, UserId]
//         );

//         return res.status(500).json({ error: 'Error sending email' });
//       }
//     }

//     res.status(200).json({ success: true, message: "User updated successfully", data: userData });
//   } catch (error) {
//     console.error('Error updating user:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// });

router.post('/addConfirmUser', verifyToken, upload.fields([
  { name: 'photo', maxCount: 1 }, { name: 'resume', maxCount: 1 }
]), async (req, res) => {
  console.log('Request Body khushboo:', req.body); // Log the incoming request body
  const photo = req.files.photo ? req.files.photo[0].path : null;
  const resume = req.files.resume ? req.files.resume[0].path : null;



  console.log('Profile', photo);
  console.log('CV', resume);



  try {
    const userData = req.body.data ? JSON.parse(req.body.data) : {}; // Parse if it’s a string
    const UserId = req.body.Id; // Ensure this is being sent in the request
    const payment = req.body.paymentDetails ? JSON.parse(req.body.paymentDetails) : {};
    const faculty = req.body.facultyDetails ? JSON.parse(req.body.facultyDetails) : {};


    console.log('User Data:', userData); // Log userData
    console.log('User ID:', UserId); // Log UserId
    console.log('Payment Details:', payment); // Log payment details
    console.log('Faculty Details:', faculty); // Log faculty details
    console.log('Received accompany_person_data:', accompany_person_data);
    

    // Exclude sendEmail from userData
    const { sendEmail, facultytype_id, description, long_description, accompany_person_data, ...filteredUserData } = userData;

    // Get columns and values from the filtered userData
    const columns = Object.keys(filteredUserData);
    const values = Object.values(filteredUserData);

    console.log('Columns:', columns); // Log columns
    console.log('Values:', values); // Log values

    const csModuleValue = 1; // Replace with the actual value if necessary

    // Fetch cs_reg_cat_id based on cs_reg_category
    const [categoryResult] = await pool.query(
      'SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?',
      [userData.cs_reg_category]
    );

    console.log('Category Result:', categoryResult); // Log fetched category result

    // Check if categoryResult is not empty
    if (categoryResult.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const csRegCat = categoryResult[0].cs_reg_category;

    // Fetch the last registration number from the site settings
    const siteSettingResult = await pool.query('SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Admin Reg Start Number"');
    let lastRegNo = siteSettingResult.length > 0 ? parseInt(siteSettingResult[0][0].cs_value, 10) : 0;
    console.log("Last Registration Number:", lastRegNo); // Log last registration number

    // Check if the incremented regNo already exists
    let regNoExists = true;
    while (regNoExists) {
      const existingRegNoResult = await pool.query('SELECT COUNT(*) AS count FROM cs_os_users WHERE cs_regno = ?', [lastRegNo]);
      const existingRegNoCount = existingRegNoResult[0][0].count || 0;
      console.log('Existing Registration Number Count:', existingRegNoCount); // Log count of existing registration numbers
      if (existingRegNoCount > 0) {
        lastRegNo++;
      } else {
        regNoExists = false;
      }
    }

    let regNo = lastRegNo;
    console.log("New Registration Number:", regNo); // Log new registration number

    // Add cs_reg_cat_id to columns and values
    columns.push('cs_reg_cat_id', 'cs_reg_category', 'cs_regno', 'cs_module', 'cs_isconfirm');
    values.push(userData.cs_reg_category, csRegCat, regNo, csModuleValue, 1);

    console.log('Updated Columns for SQL:', columns); // Log updated columns
    console.log('Updated Values for SQL:', values); // Log updated values

    // Create SET clause for the SQL query
    const setClause = columns.map((column) => `${column} = ?`).join(', ');

    // Construct the SQL UPDATE query
    const updateQuery = `
      UPDATE cs_os_users
      SET ${setClause}
      WHERE id = ?
    `;

    // Execute the query with the dynamically generated values
    const [updateResult] = await pool.query(updateQuery, [...values, UserId]);
    console.log("Update Result:", updateResult); // Log update result

    console.log('Received accompany_person_data:', accompany_person_data);

    // Step 1: Parse the string into an object
    let parsedData;
    try {
        parsedData = JSON.parse(accompany_person_data);
    } catch (error) {
        console.error('Error parsing accompany_person_data:', error);
        return res.status(400).json({ message: 'Invalid JSON format for accompany_person_data' });
    }

    console.log('Parsed Data:', parsedData);

    // Step 2: Extract the array of people using the first key dynamically
    const firstKey = Object.keys(parsedData)[0];  // Get the first key (e.g., "18")
    const personArray = parsedData[firstKey];  // Get the array associated with that key

    console.log('Extracted personArray:', personArray);

    if (Array.isArray(personArray)) {
        // Step 3: Process each person in the array
        personArray.forEach(person => {
            // Here, you get each person's name and age
            console.log('Person:', person);

            // If you want to process or store the data, you can now map this information
            const accperData = {

                accper_name: person.name,
                accper_age: person.age || null, // Handle if age is missing
            };

            console.log('Mapped accperData:', accperData);

            // Optionally, you can insert this data into the database or process it as needed
            // For example, if you're inserting this data:
            const insertAccperQuery = 'INSERT INTO cs_reg_accper (user_id,accper_name, accper_age) VALUES ?';
            const insertData = [[userid,accperData.accper_name, accperData.accper_age]];

            console.log('Data to insert into the database:', insertData);

            try {
                // Insert into the database (example using a pool)
                 pool.query(insertAccperQuery, [insertData]);
                console.log('Accompanying person inserted:', accperData);
            } catch (error) {
                console.error('Error inserting accompanying person:', error);
            }
        });

        // return res.status(200).json({ message: 'Accompanying persons processed successfully' });
    } else {
        console.log('Expected personArray, but found:', personArray);
        // return res.status(400).json({ message: 'No valid array of persons found in the parsed data' });
    }


    if (payment && Object.keys(payment).length > 0) {
      try {
        // Insert the payment data into cs_reg_payment
        const paymentColumns = Object.keys(payment);
        const paymentValues = Object.values(payment);

        const additionalColumn = 'user_id';
        const additionalValue = UserId;

        paymentColumns.push(additionalColumn);
        paymentValues.push(additionalValue);

        // Prepare the SQL query
        const paymentInsertQuery = `
      INSERT INTO cs_reg_payment (${paymentColumns.join(', ')})
      VALUES (${paymentColumns.map(() => '?').join(', ')})
    `;

        // Execute the query
        await pool.query(paymentInsertQuery, paymentValues);
        console.log("Payment Insert Result:", paymentValues); // Log payment insert result

      } catch (paymentError) {
        console.error('Error inserting payment data:', paymentError);
        return res.status(500).json({ error: 'Error inserting payment data' });
      }
    }

    if (faculty && Object.keys(faculty).length > 0) {
      try {
        // Extract faculty data from the request body
        const facultyValues = [];
        const facultyColumns = [];

        // Fetch the maximum faculty order to assign the new order
        const [result] = await pool.query(`SELECT MAX(faculty_order) AS maxOrder FROM cs_app_faculties`);
        const maxOrder = result[0].maxOrder || 0;
        const newOrder = maxOrder + 1;

        // Add user_id and faculty_order to the columns and values
        facultyColumns.push('user_id', 'faculty_order');
        facultyValues.push(UserId, newOrder);

        // Check if photo and resume are present, and add them only if they exist
        if (photo) {
          facultyColumns.push('photo');
          facultyValues.push(photo);
        }

        if (resume) {
          facultyColumns.push('resume');
          facultyValues.push(resume);
        }

        // Add the rest of the faculty data
        for (const [key, value] of Object.entries(faculty)) {
          facultyColumns.push(key);
          facultyValues.push(value);
        }

        // Prepare the SQL query
        const facultyInsertQuery = `
          INSERT INTO cs_app_faculties (${facultyColumns.join(', ')})
          VALUES (${facultyColumns.map(() => '?').join(', ')})
        `;

        // Execute the query
        await pool.query(facultyInsertQuery, facultyValues);
        console.log("Faculty Insert Result:", facultyValues); // Log faculty insert result

      } catch (facultyError) {
        console.error('Error inserting faculty data:', facultyError);
        return res.status(500).json({ error: 'Error inserting faculty data' });
      }
    }



    // Optionally update the setting value in cs_tbl_sitesetting after user update
    await pool.query(
      'UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter = ?',
      [regNo, 'Admin Reg Start Number']
    );

    const [warnings] = await pool.query('SHOW WARNINGS');
    console.log("Warnings:", warnings); // Log any SQL warnings

   
    // Sending email with error handling
    if (userData.sendEmail) {
      try {
        const [userRow] = await pool.query('SELECT * FROM cs_os_users WHERE id = ?', [UserId]);
        if (userRow.length > 0) {
          await sendConfirmEmail(userRow[0]);

          // Update cs_confirmmail to 1 after successfully sending the email
          await pool.query(
            'UPDATE cs_os_users SET cs_confirmmail = ? WHERE id = ?',
            [1, UserId]
          );
          console.log("cs_confirmmail updated successfully for UserId:", UserId); // Log success
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);

        // Set cs_confirmmail to 0 if there is an error
        await pool.query(
          'UPDATE cs_os_users SET cs_confirmmail = ? WHERE id = ?',
          [0, UserId]
        );

        return res.status(500).json({ error: 'Error sending email' });
      }
    }

    res.status(200).json({ success: true, message: "User updated successfully", data: userData });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});



router.post('/addBasConfUser', verifyToken, upload.fields([
  { name: 'photo', maxCount: 1 }, { name: 'resume', maxCount: 1 }
]), async (req, res) => {
  console.log('Request Body 2:', req.body); // Log the incoming request body
  const photo = req.files.photo ? req.files.photo[0].path : null;
  const resume = req.files.resume ? req.files.resume[0].path : null;



  console.log('Profile', photo);
  console.log('CV', resume);



  try {
    const userData = req.body.data ? JSON.parse(req.body.data) : {}; // Parse if it’s a string
    const UserId = req.body.Id; // Ensure this is being sent in the request
    const payment = req.body.paymentDetails ? JSON.parse(req.body.paymentDetails) : {};
    const faculty = req.body.facultyDetails ? JSON.parse(req.body.facultyDetails) : {};
    const accompany_person_data = req.body.accompany_person_data ;

    console.log('User Data:', userData); // Log userData
    console.log('Payment Details:', payment); // Log payment details
    console.log('Faculty Details:', faculty); // Log faculty details

    // console.log("Email", sendEmail);

    // Get the columns (keys) from the userData, excluding `sendEmail`
    // const columns = Object.keys(userData);
    // const values = Object.values(userData);
    //     const columns = Object.keys(userData).filter(col => col !== 'sendEmail'); // Exclude sendEmail
    // const values = Object.values(userData).filter((_, index) => columns[index] !== 'sendEmail');

    // Exclude sendEmail from userData
    const { sendEmail, ...filteredUserData } = userData;

    // Get columns and values from the filtered userData
    const columns = Object.keys(filteredUserData);
    const values = Object.values(filteredUserData);

    // Add the cs_module value
    const csModuleValue = 1; // Replace with the actual value if necessary

    // Fetch cs_reg_cat_id based on cs_reg_category
    const [categoryResult] = await pool.query(
      'SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?',
      [userData.cs_reg_category] // Use cs_reg_category value to fetch cs_reg_cat_id
    );

    // Check if categoryResult is not empty
    if (categoryResult.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Get the fetched cs_reg_cat_id
    const csRegCat = categoryResult[0].cs_reg_category;

    // Update the cs_reg_category value in columns and values
    const regCategoryIndex = columns.indexOf('cs_reg_category');
    if (regCategoryIndex !== -1) {
      // Update the value in the values array
      values[regCategoryIndex] = csRegCat;
    }

    // Step 2: Fetch the last registration number from the site settings
    const siteSettingResult = await pool.query('SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Admin Reg Start Number"');
    let lastRegNo = siteSettingResult.length > 0 ? parseInt(siteSettingResult[0][0].cs_value, 10) : 0;
    console.log("lastRegNo", lastRegNo);

    // Step 3: Check if the incremented regNo already exists, if yes, find a unique one
    let regNoExists = true;
    while (regNoExists) {
      const existingRegNoResult = await pool.query('SELECT COUNT(*) AS count FROM cs_os_users WHERE cs_regno = ?', [lastRegNo]);
      const existingRegNoCount = existingRegNoResult[0][0].count || 0;
      if (existingRegNoCount > 0) {
        lastRegNo++;
      } else {
        regNoExists = false;
      }
    }

    // Step 4: Increment registration number
    let regNo = lastRegNo;

    // Add cs_reg_cat_id and other necessary fields to columns and values
    // Add cs_reg_cat_id and other necessary fields to columns and values
    columns.push('cs_reg_cat_id', 'cs_regno', 'cs_module', 'cs_isconfirm');
    values.push(userData.cs_reg_category, regNo, csModuleValue, 1);


    // Create columns and placeholders for the SQL INSERT query
    const insertColumns = columns.join(', ');
    const placeholders = columns.map(() => '?').join(', ');

    // Construct the SQL INSERT query
    const insertQuery = `
      INSERT INTO cs_os_users (${insertColumns})
      VALUES (${placeholders})
    `;

    // Execute the INSERT query
    const [insertResult] = await pool.query(insertQuery, values);

    console.log("Successful", insertResult);

    const [warnings] = await pool.query('SHOW WARNINGS');

    console.log("Warnings:", warnings);

    // if (payment && Object.keys(payment).length > 0) {
    //   try {
    //     // Insert the payment data into cs_reg_payment if there are payment details
    //     const paymentColumns = Object.keys(payment);
    //     const paymentValues = Object.values(payment);

    //     // Add the additional column and value
    //     const additionalColumn = 'user_id'; // Replace with actual column name
    //     const additionalValue = insertResult.insertId; // Use the ID of the newly inserted user

    //     paymentColumns.push(additionalColumn);
    //     paymentValues.push(additionalValue);

    //     // Prepare the SQL query for payment insertion
    //     const paymentInsertQuery = `
    //       INSERT INTO cs_reg_payment (${paymentColumns.join(', ')})
    //       VALUES (${paymentColumns.map(() => '?').join(', ')})
    //     `;

    //     // Execute the payment insertion query
    //     await pool.query(paymentInsertQuery, paymentValues);
    //   } catch (paymentError) {
    //     console.error('Error inserting payment data:', paymentError);
    //     return res.status(500).json({ error: 'Error inserting payment data' });
    //   }
    // }
    console.log('Received accompany_person_data:', accompany_person_data);

    // Step 1: Parse the string into an object
    let parsedData;
    try {
        parsedData = JSON.parse(accompany_person_data);
    } catch (error) {
        console.error('Error parsing accompany_person_data:', error);
        return res.status(400).json({ message: 'Invalid JSON format for accompany_person_data' });
    }

    console.log('Parsed Data:', parsedData);

    // Step 2: Extract the array of people using the first key dynamically
    const firstKey = Object.keys(parsedData)[0];  // Get the first key (e.g., "18")
    const personArray = parsedData[firstKey];  // Get the array associated with that key

    console.log('Extracted personArray:', personArray);

    if (Array.isArray(personArray)) {
        // Step 3: Process each person in the array
        personArray.forEach(person => {
            // Here, you get each person's name and age
            console.log('Person:', person);

            // If you want to process or store the data, you can now map this information
            const accperData = {

                accper_name: person.name,
                accper_age: person.age || null, // Handle if age is missing
            };

            console.log('Mapped accperData:', accperData);

            // Optionally, you can insert this data into the database or process it as needed
            // For example, if you're inserting this data:
            const insertAccperQuery = 'INSERT INTO cs_reg_accper (user_id,accper_name, accper_age) VALUES ?';
            const insertData = [[insertResult.insertId,accperData.accper_name, accperData.accper_age]];

            console.log('Data to insert into the database:', insertData);

            try {
                // Insert into the database (example using a pool)
                 pool.query(insertAccperQuery, [insertData]);
                console.log('Accompanying person inserted:', accperData);
            } catch (error) {
                console.error('Error inserting accompanying person:', error);
            }
        });

        // return res.status(200).json({ message: 'Accompanying persons processed successfully' });
    } else {
        console.log('Expected personArray, but found:', personArray);
        // return res.status(400).json({ message: 'No valid array of persons found in the parsed data' });
    }

    if (payment && Object.keys(payment).length > 0) {
      try {
        // Insert the payment data into cs_reg_payment
        const paymentColumns = Object.keys(payment);
        const paymentValues = Object.values(payment);

        const additionalColumn = 'user_id';
        const additionalValue = insertResult.insertId;

        paymentColumns.push(additionalColumn);
        paymentValues.push(additionalValue);

        // Prepare the SQL query
        const paymentInsertQuery = `
      INSERT INTO cs_reg_payment (${paymentColumns.join(', ')})
      VALUES (${paymentColumns.map(() => '?').join(', ')})
    `;

        // Execute the query
        await pool.query(paymentInsertQuery, paymentValues);
        console.log("Payment Insert Result:", paymentValues); // Log payment insert result

      } catch (paymentError) {
        console.error('Error inserting payment data:', paymentError);
        return res.status(500).json({ error: 'Error inserting payment data' });
      }
    }

    if (faculty && Object.keys(faculty).length > 0) {
      try {
        // Extract faculty data from the request body
        const facultyValues = [];
        const facultyColumns = [];

        // Fetch the maximum faculty order to assign the new order
        const [result] = await pool.query(`SELECT MAX(faculty_order) AS maxOrder FROM cs_app_faculties`);
        const maxOrder = result[0].maxOrder || 0;
        const newOrder = maxOrder + 1;

        // Add user_id and faculty_order to the columns and values
        facultyColumns.push('user_id', 'faculty_order');
        facultyValues.push(insertResult.insertId, newOrder);

        // Check if photo and resume are present, and add them only if they exist
        if (photo) {
          facultyColumns.push('photo');
          facultyValues.push(photo);
        }

        if (resume) {
          facultyColumns.push('resume');
          facultyValues.push(resume);
        }

        // Add the rest of the faculty data
        for (const [key, value] of Object.entries(faculty)) {
          facultyColumns.push(key);
          facultyValues.push(value);
        }

        // Prepare the SQL query
        const facultyInsertQuery = `
          INSERT INTO cs_app_faculties (${facultyColumns.join(', ')})
          VALUES (${facultyColumns.map(() => '?').join(', ')})
        `;

        // Execute the query
        await pool.query(facultyInsertQuery, facultyValues);
        console.log("Faculty Insert Result:", facultyValues); // Log faculty insert result

      } catch (facultyError) {
        console.error('Error inserting faculty data:', facultyError);
        return res.status(500).json({ error: 'Error inserting faculty data' });
      }
    }

    // Update the setting value in cs_tbl_sitesetting after user insertion
    await pool.query(
      'UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter = ?',
      [regNo, 'Admin Reg Start Number']
    );


    // Sending email with error handling
    if (userData.sendEmail) {
      try {
        const [userRow] = await pool.query('SELECT * FROM cs_os_users WHERE cs_regno = ?', [regNo]);
        if (userRow.length > 0) {
          await sendConfirmEmail(userRow[0]);

          // Update cs_confirmmail to 1 after successfully sending the email
          await pool.query(
            'UPDATE cs_os_users SET cs_confirmmail = ? WHERE cs_regno = ?',
            [1, regNo]
          );
          console.log("cs_confirmmail updated successfully for Reg:", regNo); // Log success
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);

        // Set cs_confirmmail to 0 if there is an error
        await pool.query(
          'UPDATE cs_os_users SET cs_confirmmail = ? WHERE cs_regno = ?',
          [0, regNo]
        );

        return res.status(500).json({ error: 'Error sending email' });
      }
    }



    // Log result and send success response
    console.log("Inserted user:", insertResult);
    res.status(201).json({ success: true, message: "User created successfully", data: userData });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

//Temp and Non confirm member
router.post('/addTempConfirmUser', verifyToken, async (req, res) => {
  console.log('Request Body:', req.body); // Log the incoming request body

  try {
    const userData = req.body.data;
    const UserId = req.body.Id;
    const payment = req.body.paymentDetails;

    console.log('User Data:', userData); // Log userData
    console.log('User ID:', UserId); // Log UserId
    console.log('Payment Details:', payment); // Log payment details

    // Exclude sendEmail from userData
    const { sendEmail, ...filteredUserData } = userData;

    // Get columns and values from the filtered userData
    const columns = Object.keys(filteredUserData);
    const values = Object.values(filteredUserData);

    console.log('Columns:', columns); // Log columns
    console.log('Values:', values); // Log values

    const csModuleValue = 1; // Replace with the actual value if necessary

    // Fetch cs_reg_cat_id based on cs_reg_category
    const [categoryResult] = await pool.query(
      'SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?',
      [userData.cs_reg_category]
    );

    console.log('Category Result:', categoryResult); // Log fetched category result

    // Check if categoryResult is not empty
    if (categoryResult.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const csRegCat = categoryResult[0].cs_reg_category;

    // Fetch the last registration number from the site settings
    const siteSettingResult = await pool.query('SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Admin Reg Start Number"');
    let lastRegNo = siteSettingResult.length > 0 ? parseInt(siteSettingResult[0][0].cs_value, 10) : 0;
    console.log("Last Registration Number:", lastRegNo); // Log last registration number

    // Check if the incremented regNo already exists
    let regNoExists = true;
    while (regNoExists) {
      const existingRegNoResult = await pool.query('SELECT COUNT(*) AS count FROM cs_os_users WHERE cs_regno = ?', [lastRegNo]);
      const existingRegNoCount = existingRegNoResult[0][0].count || 0;
      console.log('Existing Registration Number Count:', existingRegNoCount); // Log count of existing registration numbers
      if (existingRegNoCount > 0) {
        lastRegNo++;
      } else {
        regNoExists = false;
      }
    }

    let regNo = lastRegNo;
    console.log("New Registration Number:", regNo); // Log new registration number

    // Add cs_reg_cat_id to columns and values
    columns.push('cs_reg_cat_id', 'cs_reg_category', 'cs_regno', 'cs_module', 'cs_isconfirm');
    values.push(userData.cs_reg_category, csRegCat, regNo, csModuleValue, 1);

    console.log('Updated Columns for SQL:', columns); // Log updated columns
    console.log('Updated Values for SQL:', values); // Log updated values

    // Create SET clause for the SQL query
    const setClause = columns.map((column) => `${column} = ?`).join(', ');

    // Construct the SQL UPDATE query
    const updateQuery = `
      UPDATE cs_os_users
      SET ${setClause}
      WHERE id = ?
    `;

    // Execute the query with the dynamically generated values
    const [updateResult] = await pool.query(updateQuery, [...values, UserId]);
    console.log("Update Result:", updateResult); // Log update result

    if (payment) {
      try {
        // Insert the payment data into cs_reg_payment
        const paymentColumns = Object.keys(payment);
        const paymentValues = Object.values(payment);

        const additionalColumn = 'user_id';
        const additionalValue = UserId;

        paymentColumns.push(additionalColumn);
        paymentValues.push(additionalValue);

        // Prepare the SQL query
        const paymentInsertQuery = `
          INSERT INTO cs_reg_payment (${paymentColumns.join(', ')})
          VALUES (${paymentColumns.map(() => '?').join(', ')})
        `;



        // Execute the query
        await pool.query(paymentInsertQuery, paymentValues);
        console.log("Payment Insert Result:", paymentValues); // Log payment insert result

        const tempUpdate = `
        UPDATE cs_reg_temp_payment
        SET status = ?, confirm_payment = ?
        WHERE user_id = ?
      `;

        await pool.query(tempUpdate, [0, 1, UserId]);


      } catch (paymentError) {
        console.error('Error inserting payment data:', paymentError);
        return res.status(500).json({ error: 'Error inserting payment data' });
      }
    }

    // Optionally update the setting value in cs_tbl_sitesetting after user update
    await pool.query(
      'UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter = ?',
      [regNo, 'Admin Reg Start Number']
    );

    const [warnings] = await pool.query('SHOW WARNINGS');
    console.log("Warnings:", warnings); // Log any SQL warnings

    // Sending email with error handling
    if (userData.sendEmail) {
      try {
        const [userRow] = await pool.query('SELECT * FROM cs_os_users WHERE id = ?', [UserId]);
        if (userRow.length > 0) {
          await sendConfirmEmail(userRow[0]);

          // Update cs_confirmmail to 1 after successfully sending the email
          await pool.query(
            'UPDATE cs_os_users SET cs_confirmmail = ? WHERE id = ?',
            [1, UserId]
          );
          console.log("cs_confirmmail updated successfully for UserId:", UserId); // Log success
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);

        // Set cs_confirmmail to 0 if there is an error
        await pool.query(
          'UPDATE cs_os_users SET cs_confirmmail = ? WHERE id = ?',
          [0, UserId]
        );

        return res.status(500).json({ error: 'Error sending email' });
      }
    }

    res.status(200).json({ success: true, message: "User updated successfully", data: userData });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// router.post('/addConfirmUser', verifyToken, async (req, res) => {
//   console.log(req.body);

//   try {
//     const userData = req.body.data;
//     const email = req.body.sendEmail ? 1 : 0; // Convert to 1 for true and 0 for false
//     const UserId = req.body.Id;

//     console.log("EMail", email);

//     // List of keys to exclude
//     const excludedKeys = [
//       'sendEmail',
//       'currency',
//       'paymenttype_id',
//       'payment_mode',
//       'payment_date',
//       'conference_fees',
//       'processing_fee',
//       'total_paid_amount',
//       'bank',
//       'branch',
//       'cheque_no',
//       'cs_iscomplimentary',
//       'cs_reg_category',
//       // Add more keys to exclude here if needed
//     ];

//     // Prepare columns and values by filtering out excluded keys
//     const columns = Object.keys(userData).filter(col => !excludedKeys.includes(col));
//     const values = Object.values(userData).filter((_, index) => !excludedKeys.includes(columns[index]));

//     const csModuleValue = 1; // Replace with the actual value if necessary

//     const [categoryResult] = await pool.query(
//       'SELECT cs_reg_category, cs_reg_cat_id FROM cs_os_category WHERE cs_reg_cat_id = ?',
//       [userData.cs_reg_category]
//     );
//     if (categoryResult.length === 0) {
//       return res.status(404).json({ error: 'Category not found' });
//     }

//     const csRegCat = categoryResult[0].cs_reg_category;
//     const csRegCatId = categoryResult[0].cs_reg_cat_id;

//     // Step 2: Fetch the last registration number from the site settings
//     const siteSettingResult = await pool.query('SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Admin Reg Start Number"');
//     let lastRegNo = siteSettingResult.length > 0 ? parseInt(siteSettingResult[0][0].cs_value, 10) : 0;
//     console.log("lastRegNo", lastRegNo);

//     // Step 3: Check if the incremented regNo already exists, if yes, find a unique one
//     let regNoExists = true;
//     while (regNoExists) {
//       const existingRegNoResult = await pool.query('SELECT COUNT(*) AS count FROM cs_os_users WHERE cs_regno = ?', [lastRegNo]);
//       const existingRegNoCount = existingRegNoResult[0][0].count || 0;
//       if (existingRegNoCount > 0) {
//         lastRegNo++;
//       } else {
//         regNoExists = false;
//       }
//     }

//     // Step 4: Increment registration number
//     let regNo = lastRegNo + 1;

//     // // Add cs_reg_cat_id, cs_reg_category, and cs_regno to the columns and values
//     // columns.push('cs_reg_cat_id', 'cs_reg_category', 'cs_regno');
//     // values.push(userData.cs_reg_category, csRegCat, regNo);

//     console.log("Values", columns);
//     console.log("Values", values);  

//     // Prepare the update query
//     const setClause = columns.map((column) => `${column} = ?`).join(', ');


//     // // Add cs_reg_cat_id, cs_reg_category, and cs_regno to the columns and values
//     // columns.push('cs_reg_cat_id', 'cs_reg_category', 'cs_regno');
//     // values.push(csRegCatId, csRegCat, csRegNo);

//     // const setClause = columns.map((column) => `${column} = ?`).join(', ');

//     const updateQuery = `
//       UPDATE cs_os_users
//       SET ${setClause}
//       WHERE id = ?
//     `;

//     const [updateResult] = await pool.query(updateQuery, [...values, UserId]);

//     const [warnings] = await pool.query('SHOW WARNINGS');
//     console.log("Warnings:", warnings);


//     await pool.query(
//       'UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter = ?',
//       [regNo, 'Admin Reg Start Number']
//     );

//     console.log("Call", updateResult);

//     // Sending email with error handling
//     // if (updateResult) {
//     //   try {
//     //     const [userRow] = await pool.query('SELECT * FROM cs_os_users WHERE id = ?', [UserId]);
//     //     if (userRow.length > 0) {
//     //       await sendConfirmEmail(userRow[0]);
//     //     }
//     //   } catch (emailError) {
//     //     console.error('Error sending email:', emailError);
//     //     return res.status(500).json({ error: 'Error sending email' });
//     //   }
//     // }
//     // If email flag is true, send the confirmation email
//     if (updateResult && email === 1) {
//       // Fetch the email template from the database
//       const templateQuery = `SELECT template_content, template_subject FROM cs_tbl_email_template WHERE template_id = ?`;
//       const [templateData] = await pool.query(templateQuery, [7]);

//       if (!templateData || templateData.length === 0) {
//         console.log("No email template found");
//         return res.status(500).json({ error: 'No email template found' });
//       }

//       const userEmail = userData.cs_email;
//       if (!userEmail) {
//         console.log("User email is not defined");
//         return res.status(500).json({ error: 'User email is not defined' });
//       }

//       // Replace placeholders in the email template with user data
//       let emailBody = templateData[0].template_content;
//       const emailSubject = templateData[0].template_subject;

//       const replacePlaceholders = (template, data) => {
//         return template.replace(/{{(\w+)}}/g, (_, key) => data[key] || '');
//       };
//       emailBody = replacePlaceholders(emailBody, userData);

//       // Prepare the email options
//       const mailOptions = {
//         from: process.env.GMAIL_USER,
//         to: userEmail,
//         subject: emailSubject,
//         html: emailBody,
//       };

//       // Try sending the email
//       try {
//         await transporter.sendMail(mailOptions);
//         console.log(`Email sent successfully to ${userEmail}`);

//         // Update cs_confirmmail to 1 if email is sent successfully
//         await pool.query(
//           'UPDATE cs_os_users SET cs_confirmmail = ? WHERE id = ?',
//           [1, UserId]
//         );
//       } catch (error) {
//         console.error(`Error sending email to ${userEmail}:`, error.message);

//         // Update cs_confirmmail to 0 if email not sent
//         await pool.query(
//           'UPDATE cs_os_users SET cs_confirmmail = ? WHERE id = ?',
//           [0, UserId]
//         );
//       }
//     }

//     res.status(200).json({ success: true, message: "User updated successfully", data: userData });
//   } catch (error) {
//     console.error('Error updating user:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// });


// router.post('/addConfirmUser', verifyToken, async (req, res) => {
//   const connection = await pool.getConnection(); // Get a connection
//   await connection.beginTransaction(); // Start transaction

//   try {
//     const userData = req.body.data;
//     const email = req.body.sendEmail; // Email flag
//     const UserId = req.body.Id;

//     // Get the columns (keys) from userData, excluding sendEmail
//     const columns = Object.keys(userData).filter(col => col !== 'sendEmail');
//     const values = Object.values(userData).filter((_, index) => columns[index] !== 'sendEmail');

//     // Fetch cs_reg_cat_id based on cs_reg_category
//     const [categoryResult] = await connection.query(
//       'SELECT cs_reg_category, cs_reg_cat_id FROM cs_os_category WHERE cs_reg_cat_id = ?',
//       [userData.cs_reg_category]
//     );

//     if (categoryResult.length === 0) {
//       await connection.rollback(); // Rollback transaction if category not found
//       return res.status(404).json({ error: 'Category not found' });
//     }

//     const csRegCat = categoryResult[0].cs_reg_category;
//     const csRegCatId = categoryResult[0].cs_reg_cat_id;

//     // Fetch reg start number from settings
//     const [regNoResult] = await connection.query(
//       'SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = ?',
//       ["Admin Reg Start Number"]
//     );

//     if (regNoResult.length === 0) {
//       await connection.rollback(); // Rollback transaction if registration number setting not found
//       return res.status(404).json({ error: 'Registration number setting not found' });
//     }

//     const csRegNo = parseInt(regNoResult[0].cs_value, 10) + 1;

//     // Add cs_reg_cat_id, cs_reg_category, and cs_regno to columns and values
//     columns.push('cs_reg_cat_id', 'cs_reg_category', 'cs_regno');
//     values.push(csRegCatId, csRegCat, csRegNo);

//     // Create SQL query for updating user
//     const setClause = columns.map(column => `${column} = ?`).join(', ');
//     const updateQuery = `
//       UPDATE cs_os_users
//       SET ${setClause}, cs_module = ?, cs_isconfirm = ?
//       WHERE id = ?
//     `;

//     // Execute update query
//     await connection.query(updateQuery, [...values, 1, 1, UserId]);

//     // Update the registration number in the setting
//     await connection.query(
//       'UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter = ?',
//       [csRegNo, 'Admin Reg Start Number']
//     );

//     // Commit the transaction for updating the user and settings
//     await connection.commit();

//     // If email flag is true, send the confirmation email
//     if (email) {
//       // Fetch the email template from the database
//       const templateQuery = `SELECT template_content, template_subject FROM cs_tbl_email_template WHERE template_id = ?`;
//       const [templateData] = await pool.query(templateQuery, [7]);

//       if (!templateData || templateData.length === 0) {
//         console.log("No email template found");
//         return res.status(500).json({ error: 'No email template found' });
//       }

//       const userEmail = userData.cs_email;
//       if (!userEmail) {
//         console.log("User email is not defined");
//         return res.status(500).json({ error: 'User email is not defined' });
//       }

//       // Replace placeholders in the email template with user data
//       let emailBody = templateData[0].template_content;
//       const emailSubject = templateData[0].template_subject;

//       const replacePlaceholders = (template, data) => {
//         return template.replace(/{{(\w+)}}/g, (_, key) => data[key] || '');
//       };
//       emailBody = replacePlaceholders(emailBody, userData);

//       // Prepare the email options
//       const mailOptions = {
//         from: process.env.GMAIL_USER,
//         to: userEmail,
//         subject: emailSubject,
//         html: emailBody,
//       };

//       // Try sending the email
//       try {
//         await transporter.sendMail(mailOptions);
//         console.log(`Email sent successfully to ${userEmail}`);

//         // Update cs_confirmmail to 1 if email is sent successfully
//         await pool.query(
//           'UPDATE cs_os_users SET cs_confirmmail = ? WHERE id = ?',
//           [1, UserId]
//         );
//       } catch (error) {
//         console.error(`Error sending email to ${userEmail}:`, error.message);

//         // Update cs_confirmmail to 0 if email not sent
//         await pool.query(
//           'UPDATE cs_os_users SET cs_confirmmail = ? WHERE id = ?',
//           [0, UserId]
//         );
//       }
//     }

//     res.status(200).json({ success: true, message: "User updated successfully", data: userData });

//   } catch (error) {
//     // Rollback transaction if error occurs
//     await connection.rollback();
//     console.error('Error updating user:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   } finally {
//     // Release the connection
//     connection.release();
//   }
// });




// router.post('/addConfirmUser', verifyToken, async (req, res) => {
//   console.log(req.body);

//   try {
//     const userData = req.body.data;
//     const email = req.body.sendEmail; // Email flag
//     const UserId = req.body.Id;

//     // Extract payment-related fields to be inserted into cs_reg_payment
//     const paymentData = {
//       currency: userData.currency,
//       paymenttype_id: userData.paymenttype_id,
//       payment_mode: userData.payment_mode,
//       payment_date: userData.payment_date,
//       conference_fees: userData.conference_fees,
//       processing_fee: userData.processing_fee,
//       total_paid_amount: userData.total_paid_amount,
//       bank: userData.bank,
//       branch: userData.branch,
//       cheque_no: userData.cheque_no,
//       total_paid_amount: userData.total_paid_amount,
//     };

//     // Get the columns (keys) from the userData, excluding sendEmail and payment fields
//     const columns = Object.keys(userData)
//       .filter(col => col !== 'sendEmail' && !Object.keys(paymentData).includes(col))
//       .map(col => col.trim()); // Trim any potential whitespace in the keys

//     const values = Object.values(userData).filter((_, index) =>
//       columns[index] !== 'sendEmail' && !Object.keys(paymentData).includes(columns[index])
//     );

//     // Add the cs_module value
//     const csModuleValue = 1; // Replace with the actual value if necessary

//     // Fetch cs_reg_cat_id based on cs_reg_category
//     const [categoryResult] = await pool.query(
//       'SELECT cs_reg_category, cs_reg_cat_id FROM cs_os_category WHERE cs_reg_cat_id = ?',
//       [userData.cs_reg_category] // Use cs_reg_category value to fetch cs_reg_cat_id
//     );

//     // Check if categoryResult is not empty
//     if (categoryResult.length === 0) {
//       return res.status(404).json({ error: 'Category not found' });
//     }

//     // Get the fetched cs_reg_cat_id and cs_reg_category
//     const csRegCat = categoryResult[0].cs_reg_category;
//     const csRegCatId = categoryResult[0].cs_reg_cat_id;

//     // Fetch reg start number from setting
//     const [regNoResult] = await pool.query(
//       'SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = ?',
//       ["Admin Reg Start Number"]
//     );

//     // Check if regNoResult is not empty
//     if (regNoResult.length === 0) {
//       return res.status(404).json({ error: 'Registration number setting not found' });
//     }

//     // Increment the fetched cs_value by 1 for cs_regno
//     const csRegNo = parseInt(regNoResult[0].cs_value, 10) + 1;

//     // Add cs_reg_cat_id, cs_reg_category, and cs_regno to columns and values
//     columns.push('cs_reg_cat_id', 'cs_reg_category', 'cs_regno');
//     values.push(csRegCatId, csRegCat, csRegNo);

//     // Create SET clause for the SQL query
//     const setClause = columns.map((column) => `${column} = ?`).join(', ');

//     try {
//       // Execute the UPDATE query
//       const updateQuery = `
//         UPDATE cs_os_users
//         SET ${setClause}, cs_module = ?, cs_isconfirm = ?
//         WHERE id = ?
//       `;
//       await pool.query(updateQuery, [...values, csModuleValue, 1, UserId]);
//     } catch (updateError) {
//       console.error('Error updating user:', updateError);
//       return res.status(500).json({ error: 'Error updating user information' });
//     }

//     try {
//       // Insert the payment data into cs_reg_payment
//       const paymentColumns = Object.keys(paymentData);
//       const paymentValues = Object.values(paymentData);

//       const paymentInsertQuery = `
//         INSERT INTO cs_reg_payment (${paymentColumns.join(', ')})
//         VALUES (${paymentColumns.map(() => '?').join(', ')})
//       `;
//       await pool.query(paymentInsertQuery, paymentValues);

//       // Optionally update the setting value in cs_tbl_sitesetting after user update
//       await pool.query(
//         'UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter = ?',
//         [csRegNo, 'Admin Reg Start Number']
//       );
//     } catch (paymentError) {
//       console.error('Error inserting payment data:', paymentError);
//       return res.status(500).json({ error: 'Error inserting payment data' });
//     }

//     // Send email if email flag is true
//     if (email) {
//       try {
//         const [userRow] = await pool.query('SELECT * FROM cs_os_users WHERE id = ?', [UserId]);
//         if (userRow.length > 0) {
//           await sendConfirmEmail(userRow[0]);
//         }
//       } catch (emailError) {
//         console.error('Error sending confirmation email:', emailError);
//         // You can continue or handle the error as needed here (e.g., res.json)
//       }
//     }

//     res.status(200).json({ success: true, message: "User updated and payment inserted successfully", data: userData });
//   } catch (error) {
//     console.error('Unexpected error:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// });








router.post('/addUser', verifyToken, async (req, res) => {
  try {
    // Extract all properties from the request body
    const { ...userData } = req.body;

    console.log(req.body);

    const days = userData.cs_reg_type;
    const regId = userData.cs_reg_category;
    const workshop = userData.cs_workshop_category;
    const firstName = userData.cs_first_name;
    const lastName = userData.cs_last_name;

    console.log("firstName", firstName);

    // Fetch facility data based on regId
    const [rows, fields] = await pool.query(`
          SELECT fd.cs_facility_name, fc.cs_allow_count, fd.cs_facility_id
          FROM cs_os_facility_category fc
          JOIN cs_os_facility_detail fd ON fc.cs_facility_detail_id = fd.cs_facility_detail_id
          WHERE fc.cs_reg_cat_id = ? AND fd.cs_status = 1
      `, [regId]);

    // Initialize badgeData object
    const badgeData = {};

    // Check if cs_reg_type is available and not equal to "101"
    if (userData.cs_reg_type && userData.cs_reg_type !== 101) {
      console.log("i am in daywise");
      const reg_daytype = days;

      // Check if the query was successful
      if (rows) {
        // Loop through the results and construct the badge data
        rows.forEach(row => {
          const facilityName = row.cs_facility_name;
          const allowCount = row.cs_allow_count;
          const facilityId = row.cs_facility_id;

          // Fetch facility type
          const facilityTypeQuery = `
            SELECT cs_type 
            FROM cs_os_facilitytype 
            WHERE cs_facility_id = ?
          `;
          pool.query(facilityTypeQuery, [facilityId])
            .then(([typeRows, typeFields]) => {
              const facilityType = typeRows[0].cs_type;

              // If facility type is workshop, further check for workshop category
              if (facilityType === 'workshop') {
                const workshopQuery = `
                  SELECT cs_workshop_id 
                  FROM cs_os_workshop 
                  WHERE cs_facility_id = ? 
                `;
                pool.query(workshopQuery, [facilityId])
                  .then(([workshopRows, workshopFields]) => {
                    const workshopId = workshopRows[0].cs_workshop_id;
                    // If workshop category matches, set the count fetched from the table
                    if (workshopId === workshop) {
                      badgeData[facilityName] = allowCount;
                      badgeData[facilityName + '_status'] = "0";
                    } else {
                      badgeData[facilityName] = "0";
                      badgeData[facilityName + '_status'] = "0";
                    }
                  })
                  .catch(error => {
                    console.error("Error executing workshop query:", error);
                  });
              } else {
                // If facility type is not workshop, set count to 0
                if (facilityName.includes(reg_daytype) || !/\d$/.test(facilityName)) {
                  // Facility matches, set the count fetched from the table
                  badgeData[facilityName] = allowCount;
                  // Set the status to "0" for each facility
                  badgeData[facilityName + '_status'] = "0";
                } else {
                  // Facility doesn't match, set count to 0
                  badgeData[facilityName] = "0";
                  // Set the status to "0" for each facility
                  badgeData[facilityName + '_status'] = "0";
                }
              }
            })
            .catch(error => {
              console.error("Error executing facility type query:", error);
            });
        });
      } else {
        // Query failed
        console.error("Error executing facility query");
      }
    } else {
      // cs_reg_type not available, set count to 0 for all facilities

      console.log("i am here in all day")
      if (rows) {
        rows.forEach(row => {
          const facilityName = row.cs_facility_name;
          const allowCount = row.cs_allow_count;
          const facilityId = row.cs_facility_id;

          // Fetch facility type
          const facilityTypeQuery = `
            SELECT cs_type 
            FROM cs_os_facilitytype 
            WHERE cs_facility_id = ?
          `;
          pool.query(facilityTypeQuery, [facilityId])
            .then(([typeRows, typeFields]) => {
              const facilityType = typeRows[0].cs_type;

              // If facility type is workshop, further check for workshop category
              if (facilityType === 'workshop') {
                const workshopQuery = `
                  SELECT cs_workshop_id 
                  FROM cs_os_workshop 
                  WHERE cs_facility_id = ? 
                `;
                pool.query(workshopQuery, [facilityId])
                  .then(([workshopRows, workshopFields]) => {
                    const workshopId = workshopRows[0].cs_workshop_id;
                    // If workshop category matches, set the count fetched from the table
                    if (workshopId === workshop) {
                      badgeData[facilityName] = allowCount;
                      badgeData[facilityName + '_status'] = "0";
                    }
                    else {
                      badgeData[facilityName] = "0";
                      badgeData[facilityName + '_status'] = "0";
                    }
                  })
                  .catch(error => {
                    console.error("Error executing workshop query:", error);
                  });
              } else {
                // If facility type is not workshop, set count to 0
                badgeData[facilityName] = allowCount;
                // Set the status to "0" for each facility
                badgeData[facilityName + '_status'] = "0";
              }
            })
            .catch(error => {
              console.error("Error executing facility type query:", error);
            });
        });
      } else {
        // Query failed
        console.error("Error executing facility query");
      }
    }

    // Get the last inserted cs_regno from cs_os_users table
    // const lastRegNoResult = await pool.query('SELECT cs_regno FROM cs_os_users ORDER BY cs_regno DESC LIMIT 1');
    // let lastRegNo = lastRegNoResult.length > 0 ? lastRegNoResult[0][0].cs_regno : 0;
    // let regNo = lastRegNo + 1;

    // // Check if the incremented regNo already exists, if yes, find a unique one
    // let regNoExists = true;
    // while (regNoExists) {
    //   const existingRegNoResult = await pool.query('SELECT COUNT(*) AS count FROM cs_os_users WHERE cs_regno = ?', [regNo]);
    //   const existingRegNoCount = existingRegNoResult[0].count || 0;
    //   if (existingRegNoCount > 0) {
    //     regNo++;
    //   } else {
    //     regNoExists = false;
    //   }
    // }

    // // Now regNo is a unique value, use it in your userData
    // userData.cs_regno = regNo;

    const siteSettingResult = await pool.query('SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Admin Reg Start Number"');
    let lastRegNo = siteSettingResult.length > 0 ? parseInt(siteSettingResult[0][0].cs_value, 10) : 0;
    console.log("lastRegNo", lastRegNo);
    let regNoExists = true;
    while (regNoExists) {
      const existingRegNoResult = await pool.query('SELECT COUNT(*) AS count FROM cs_os_users WHERE cs_regno = ?', [lastRegNo]);
      console.log("existingRegNoResult", existingRegNoResult);
      const existingRegNoCount = existingRegNoResult[0][0].count || 0;
      if (existingRegNoCount > 0) {
        lastRegNo++;
      } else {
        regNoExists = false;
      }
    }

    let regNo = lastRegNo + 1;

    // Step 3: Update the cs_tbl_sitesetting table with the new regNo
    await pool.query('UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE  cs_parameter ="Admin Reg Start Number"', [regNo]);

    // Step 4: Now regNo is a unique value, use it in your userData
    userData.cs_regno = lastRegNo;


    // Map fields containing IDs to their corresponding values from different tables
    await Promise.all([
      mapFieldById(userData, 'cs_reg_category', 'cs_os_category', 'cs_reg_cat_id', 'cs_reg_category'),
      mapRegCategory(userData) // Handle cs_reg_category and cs_reg_cat_id together
    ]);

    // Perform insertion into cs_os_users table with current timestamp for created_at and updated_at
    const insertUserQuery = `
      INSERT INTO cs_os_users SET ?, cs_isconfirm = ?
    `;
    const insertResult = await pool.query(insertUserQuery, [userData, 1]);
    console.log('Insert result:', insertResult);
    const newUserId = insertResult[0].insertId;

    // const newUserId = insertResult.insertId;

    if (!newUserId) {
      throw new Error("Failed to retrieve new user ID");
    }



    const username = `${firstName.toLowerCase()}${lastName[0].toLowerCase()}${newUserId}`;
    const password = `${firstName[0].toUpperCase()}${lastName.toLowerCase()}@${newUserId}`;


    console.log("username", username);
    console.log("password", password);
    const updateUserQuery = `
        UPDATE cs_os_users
        SET cs_username = ?, cs_password = ?
        WHERE id = ?
      `;

    await pool.query(updateUserQuery, [username, password, newUserId]);

    console.log("badgeData", badgeData);

    const insertBadgeQuery = `
      INSERT INTO cs_os_badges (cs_regno, cs_reg_cat_id, cs_badge_data)
      VALUES (?, ?, ?)
    `;
    await pool.query(insertBadgeQuery, [lastRegNo, regId, JSON.stringify(badgeData)]);

    // Send response or perform further operations
    res.status(200).json({ success: true, message: "User added successfully", data: userData });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ success: false, message: "Error adding user", error: error.message });
  }
});




async function mapRegCategory(userData) {
  if (userData.cs_reg_category) {
    const { cs_reg_category, cs_reg_cat_id } = await getRegCategoryAndId(userData.cs_reg_category);
    if (cs_reg_category && cs_reg_cat_id) {
      userData.cs_reg_category = cs_reg_category;
      userData.cs_reg_cat_id = cs_reg_cat_id;
    }
  }
}

async function getRegCategoryAndId(regCategoryId) {
  try {
    // Perform a query to fetch both cs_reg_category and cs_reg_cat_id from cs_os_category table
    const [result] = await pool.query('SELECT cs_reg_category, cs_reg_cat_id FROM cs_os_category WHERE cs_reg_cat_id = ?', [regCategoryId]);
    if (result && result.length > 0) {
      return { cs_reg_category: result[0].cs_reg_category, cs_reg_cat_id: result[0].cs_reg_cat_id };
    }
    return { cs_reg_category: null, cs_reg_cat_id: null }; // If values not found for given ID
  } catch (error) {
    console.error('Error fetching cs_reg_category and cs_reg_cat_id:', error);
    throw error;
  }
}

async function mapFieldById(userData, fieldName, tableName, idColumnName, valueColumnName) {
  if (userData[fieldName]) {
    const value = await getValueById(tableName, idColumnName, valueColumnName, userData[fieldName]);
    if (value) {
      userData[fieldName] = value;
    }
  }
}

async function getValueById(tableName, idColumnName, valueColumnName, id) {
  try {
    // Perform a query to fetch value from the specified table based on the provided ID
    const [result] = await pool.query(`SELECT ${valueColumnName} FROM ${tableName} WHERE ${idColumnName} = ?`, [id]);
    if (result && result.length > 0) {
      return result[0][valueColumnName];
    }
    return null; // If value not found for given ID
  } catch (error) {
    console.error(`Error fetching value from ${tableName}:`, error);
    throw error;
  }
}


async function mapRegCategory(userDataWithFields) {
  if (userDataWithFields.cs_reg_category) {
    try {
      const { cs_reg_category, cs_reg_cat_id } = await getRegCategoryAndId(userDataWithFields.cs_reg_category);
      console.log('Returned category and ID:', cs_reg_category, cs_reg_cat_id); // Log the returned values
      if (cs_reg_category && cs_reg_cat_id) {
        userDataWithFields.cs_reg_category = cs_reg_category;
        userDataWithFields.cs_reg_cat_id = cs_reg_cat_id;
      }
    } catch (error) {
      console.error('Error mapping registration category:', error); // Log any errors
    }
  }
}


//Basic import user

router.get('/samplefile', async (req, res) => {
  try {
    // Create a new workbook and add a worksheet
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Sample');




    const [dynamicFields] = await pool.query(`
      SELECT cs_field_label, cs_is_required
      FROM cs_os_field_data 
      WHERE cs_visible_reg_basicform = 1 AND cs_field_id != 12 OR cs_field_id = 13
          ORDER BY 
              CASE 
                  WHEN cs_status = 1 THEN cs_field_order 
                  ELSE 999999 
              END
  `);

    const headerRow = [
      ...dynamicFields.map(field => `${field.cs_field_label}`)
    ];




    // Add the header row to the worksheet
    // worksheet.addRow([]);

    const [mandatoryfields] = await pool.query(`
      SELECT cs_field_label, cs_is_required FROM cs_os_field_data WHERE cs_visible_add_user = 1 AND cs_is_required = 1 AND cs_field_id != 12;
`);

    worksheet.addRow(headerRow).font = { bold: true };


    const csvData = await workbook.csv.writeBuffer();

    // Send the generated CSV file to the client
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sample.csv');
    res.status(200).send(csvData);

    workbook.xlsx.write(res)
      .then(() => {
        res.end();
      })
      .catch(err => {
        console.error('Error generating sample Excel file:', err);
        res.status(500).send('Internal Server Error');
      });
  } catch (error) {
    console.error('Error fetching registration categories:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/instructionfile', async (req, res) => {
  try {
    // Create a new workbook and add a worksheet
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Sample');

    // Add the instructions and sample data to the worksheet
    const data = [
      ['Import User Template'],
      [],
      ['How to import your data'],
      ['Step 1:', 'Collect all your attendee information and when you are ready, add your data to the Import sample sheet.'],
      ['Step 2:', 'Add your content; the columns mention in the mandatory section are required.'],
      ['Step 3:', 'When you are done adding your content, upload this file through the "Select File" menu on Consoft Onsite admin.'],
      ['Step 4:', 'Your content will be selected. If there are any errors you will be notified.'],
      [],
      ['NOTE:', "Don't delete any columns from the sample sheet. If you aren't using a column, just leave it empty."],
      [],
      ['TIP:', 'Users in the template can be in any order'],
      // ['TIP:', 'Using Registration Category for your users? Make sure the Category already exist before using their id here.'],
      [],
      ['Column Name', 'Column Descriptions', 'Column Examples'],
      ['Registration number', 'The unique identifier for the user (do not delete or change this value)', '1023'],
      ['Title', 'The title for the user', 'Mr.'],
      ['First Name*', 'The first name (first name) of the user', 'John'],
      ['Last Name*', 'The last name (last name) of the user', 'Smith'],
      // ['Registration Category', 'The Attendee Registration Category of the users', '1'],
      ['Email', 'The email address the attendee used to register for the event.', 'dummy@gmail.com'],
      ['Company', 'The User Company Name', 'Socio'],
      ['Additional', 'Any Additional Question with value', 'X'],
      [],
      ['Questions?', 'If you have any questions or problems uploading your data, email us on info@consoftservices.com'],
      [],
      // ['Registration Category', 'Value to need mention in import file']
    ];

    // Add data to worksheet
    data.forEach((row, index) => {
      worksheet.addRow(row);
      if (index === 0 || index === 2 || index === 4 || index === 6 || index === 8 || index === 10 || index === 12 || index === 14) {
        worksheet.getRow(index + 1).font = { bold: true };
      }
    });


    const [prefixes] = await pool.query('SELECT cs_prefix, cs_prefix_id FROM cs_os_name_prefixes');
    if (prefixes.length > 0) {
      worksheet.addRow([]);
      worksheet.addRow(['Tittle', 'Tittle ID']);
      prefixes.forEach(prefix => {
        worksheet.addRow([prefix.cs_prefix, prefix.cs_prefix_id]);
      });
    }



    const [dynamicFields] = await pool.query(`
      SELECT cs_field_label, cs_is_required FROM cs_os_field_data WHERE cs_visible_reg_basicform = 1 AND cs_field_id != 12 OR cs_field_id = 13
      ORDER BY 
              CASE 
                  WHEN cs_status = 1 THEN cs_field_order 
                  ELSE 999999 
              END;
`);

    const headerRow = dynamicFields.map(field => {
      return field.cs_field_label;
    });

    // Add the header row to the worksheet
    worksheet.addRow([]);

    const [mandatoryfields] = await pool.query(`
      SELECT cs_field_label, cs_is_required FROM cs_os_field_data WHERE cs_visible_reg_basicform = 1 AND cs_is_required = 1 AND cs_field_id != 12;
`);

    worksheet.addRow(["Mandatory fields"]);

    mandatoryfields.forEach(field => {
      worksheet.addRow([field.cs_field_label]);
    });

    worksheet.addRow([]);
    worksheet.addRow([]);

    // worksheet.addRow(["Note- Before import file delete instructions Data"]).font = { color: { argb: 'FF0000' }, bold: true };
    // worksheet.addRow(headerRow).font = { bold: true };



    // Send the generated Excel file to the client
    // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    // res.setHeader('Content-Disposition', 'attachment; filename=sample.xlsx');

    const csvData = await workbook.csv.writeBuffer();

    // Send the generated CSV file to the client
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sample.csv');
    res.status(200).send(csvData);

    workbook.xlsx.write(res)
      .then(() => {
        res.end();
      })
      .catch(err => {
        console.error('Error generating sample Excel file:', err);
        res.status(500).send('Internal Server Error');
      });
  } catch (error) {
    console.error('Error fetching registration categories:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/getEmails', verifyToken, async (req, res) => {
  try {
    // Specify the columns you want to fetch from the table
    console.log("user dataa");
    const columnsToFetch = ['cs_email'];

    // Construct the SQL query to fetch specific columns
    const query = `SELECT ${columnsToFetch.join(',')} FROM cs_os_users`;



    // Execute the query to fetch user data from the table
    const [userData] = await pool.query(query);

    // console.log("user dataa",userData);

    // Send the user data as a response
    res.json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/addBulkUser', verifyToken, queueMiddleware, async (req, res) => {
  try {
    const userDataArray = req.body.data; // Array of user data objects
    const email = req.body.sendEmail; // Check if email flag is true


    // Filter out the 'Id' field from each user data object
    const filteredUserDataArray = userDataArray.map(userData => {
      const { Id, ...filteredUserData } = userData; // Destructure 'Id' field and exclude it
      return filteredUserData;
    });

    // Retrieve field names from the database based on keys
    const keys = Object.keys(filteredUserDataArray[0]); // Assuming all objects have the same keys
    console.log('Keys:', keys);

    const queryResult = await pool.query('SELECT cs_field_label, cs_field_name FROM cs_os_field_data WHERE cs_field_label IN (?)', [keys]);

    // Extract field labels and names from query result
    const fieldMap = {};
    queryResult[0].forEach(row => {
      fieldMap[row.cs_field_label] = row.cs_field_name;
    });

    console.log('Field Map:', fieldMap);

    // Prepare an array to hold all user data with fields
    const allUserDataWithFields = [];

    const getTitleById = async (id) => {
      const [rows] = await pool.query('SELECT cs_prefix FROM cs_os_name_prefixes WHERE cs_prefix_id = ?', [id]);
      if (rows.length > 0) {
        return rows[0].cs_prefix;
      } else {
        return null; // Return null if no title is found
      }
    };

    // Loop through each record in userDataArray
    for (let i = 0; i < userDataArray.length; i++) {
      const userData = userDataArray[i];

      const userDataWithFields = {};
      // Copy original keys/values to userDataWithFields, excluding 'Id'
      Object.entries(userData).forEach(([key, value]) => {
        if (key !== 'Id') {
          // If the key exists in the fieldMap, update the key
          if (fieldMap[key]) {
            userDataWithFields[fieldMap[key]] = value;
          } else {
            // Otherwise, keep the original key
            userDataWithFields[key] = value;
          }
        }
      });

      if (userDataWithFields.cs_title) {
        const title = await getTitleById(userDataWithFields.cs_title);
        if (title) {
          userDataWithFields.cs_title = title;
        }
      }

      // Fetch facility data based on regId for each user
      const regId = userDataWithFields.cs_reg_cat_id;
      const workshop = parseInt(userDataWithFields.cs_workshop_category, 10);
      // const workshop = userData.cs_workshop_category;

      const [rows] = await pool.query(`
        SELECT fd.cs_facility_name, fc.cs_allow_count, fd.cs_facility_id
        FROM cs_os_facility_category fc
        JOIN cs_os_facility_detail fd ON fc.cs_facility_detail_id = fd.cs_facility_detail_id
        WHERE fc.cs_reg_cat_id = ? AND fd.cs_status = 1
      `, [regId]);

      // Initialize badgeData object for each user
      const badgeData = {};
      console.log("userDataWithFields.cs_reg_type", userDataWithFields.cs_reg_type);


      if (userDataWithFields.cs_reg_type && userDataWithFields.cs_reg_type !== "101") {
        console.log("Processing daywise data");

        for (const row of rows) {
          const facilityName = row.cs_facility_name;
          const allowCount = row.cs_allow_count;
          const facilityId = row.cs_facility_id;

          const [typeRows] = await pool.query(`
            SELECT cs_type 
            FROM cs_os_facilitytype 
            WHERE cs_facility_id = ?
          `, [facilityId]);

          const facilityType = typeRows[0]?.cs_type;

          if (facilityType === 'workshop') {
            const [workshopRows] = await pool.query(`
              SELECT cs_workshop_id 
              FROM cs_os_workshop 
              WHERE cs_facility_id = ? 
            `, [facilityId]);

            const workshopId = workshopRows[0]?.cs_workshop_id;
            if (workshopId === workshop) {
              badgeData[facilityName] = allowCount;
              badgeData[facilityName + '_status'] = "0";
            } else {
              badgeData[facilityName] = "0";
              badgeData[facilityName + '_status'] = "0";
            }
          } else {
            if (facilityName.includes(userDataWithFields.cs_reg_type) || !/\d$/.test(facilityName)) {
              // Facility matches, set the count fetched from the table
              badgeData[facilityName] = allowCount;
              // Set the status to "0" for each facility
              badgeData[facilityName + '_status'] = "0";
            } else {
              // Facility doesn't match, set count to 0
              badgeData[facilityName] = "0";
              // Set the status to "0" for each facility
              badgeData[facilityName + '_status'] = "0";
            }
          }
        }
      } else {
        console.log("Processing all-day data");

        for (const row of rows) {
          const facilityName = row.cs_facility_name;
          const allowCount = row.cs_allow_count;
          const facilityId = row.cs_facility_id;

          const [typeRows] = await pool.query(`
            SELECT cs_type 
            FROM cs_os_facilitytype 
            WHERE cs_facility_id = ?
          `, [facilityId]);

          const facilityType = typeRows[0]?.cs_type;

          if (facilityType === 'workshop') {
            const [workshopRows] = await pool.query(`
              SELECT cs_workshop_id 
              FROM cs_os_workshop 
              WHERE cs_facility_id = ? 
            `, [facilityId]);

            const workshopId = workshopRows[0]?.cs_workshop_id;
            if (workshopId === workshop) {
              badgeData[facilityName] = allowCount;
              badgeData[facilityName + '_status'] = "0";
            } else {
              badgeData[facilityName] = "0";
              badgeData[facilityName + '_status'] = "0";
            }
          } else {
            badgeData[facilityName] = allowCount;
            badgeData[facilityName + '_status'] = "0";
          }
        }
      }

      // let lastRegNo = 0; // Initialize regNo
      // let regNo = 0;
      // // Check if cs_regno already has a value
      // if (!userDataWithFields.cs_regno) {
      //   // Get the last inserted cs_regno from cs_os_users table
      //   // const [lastRegCatIdRow] = await pool.query('SELECT MAX(cs_regno) AS max_regno FROM cs_os_users');
      //   // const lastRegCatId = lastRegCatIdRow[0].max_regno || 0; // If no records exist, default to 0
      //   // regNo = lastRegCatId + 1;

      //   const siteSettingResult = await pool.query('SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter ="Admin Reg Start Number"');
      //   // console.log("siteSettingResult", siteSettingResult[0][0].cs_value);
      //   lastRegNo = siteSettingResult.length > 0 ? parseInt(siteSettingResult[0][0].cs_value, 10) : 0;
      //   console.log("lastRegNo", lastRegNo);
      //   // Step 2: Check if the incremented regNo already exists, if yes, find a unique one
      //   let regNoExists = true;
      //   while (regNoExists) {
      //     const existingRegNoResult = await pool.query('SELECT COUNT(*) AS count FROM cs_os_users WHERE cs_regno = ?', [lastRegNo]);
      //     console.log("existingRegNoResult", existingRegNoResult);
      //     const existingRegNoCount = existingRegNoResult[0][0].count || 0;
      //     if (existingRegNoCount > 0) {
      //       lastRegNo++;
      //     } else {
      //       regNoExists = false;
      //     }
      //   }

      //   let regNo = lastRegNo + 1;

      //   // Step 3: Update the cs_tbl_sitesetting table with the new regNo
      //   await pool.query('UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter ="Admin Reg Start Number"', [regNo]);
      //   userDataWithFields.cs_regno = lastRegNo;

      //   // Step 4: Now regNo is a unique value, use it in your userData
      //   userData.cs_regno = lastRegNo;
      // } else {
      //   // Use the existing value of cs_regno
      //   lastRegNo = userDataWithFields.cs_regno;
      //   userDataWithFields.cs_regno = lastRegNo;
      // }




      // Now regNo is either a newly generated unique value or the existing value, use it in your userData

      console.log('Registration number for user:', userDataWithFields.cs_reg_cat_id);
      console.log('Badge data for user:', badgeData);

      // Fetch cs_reg_category from cs_os_category based on cs_reg_cat_id
      const catId = userDataWithFields.cs_reg_cat_id;
      console.log('catId:', catId); // Add this line to log the catId
      const [categoryRows] = await pool.query('SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?', [catId]);
      console.log('categoryRows:', categoryRows); // Add this line to log the query results
      const csRegCategory = categoryRows[0]?.cs_reg_category;
      console.log('Category:', csRegCategory);

      // Assign the fetched cs_reg_category to userDataWithFields
      userDataWithFields.cs_reg_category = csRegCategory;

      // Map fields containing IDs to their corresponding values from different tables
      // await Promise.all([
      //   mapFieldById(userDataWithFields, 'cs_reg_category', 'cs_os_category', 'cs_reg_cat_id', 'cs_reg_category'),
      //   mapRegCategory(userDataWithFields) // Handle cs_reg_category and cs_reg_cat_id together
      // ]);

      // Insert the user data into the database
      const insertUserQuery = `
        INSERT INTO cs_os_users SET ?, cs_isconfirm = ?, cs_module = ?
      `;

      // await pool.query(insertUserQuery, [userDataWithFields, 1, currentTimestamp, currentTimestamp]);
      const [insertResult] = await pool.query(insertUserQuery, [userDataWithFields, 0, 1]);

      const newUserId = insertResult.insertId;

      const firstName = userDataWithFields.cs_first_name ? userDataWithFields.cs_first_name : 'Dammy';
      const lastName = userDataWithFields.cs_last_name ? userDataWithFields.cs_last_name : 'Dammy';

      // Function to remove special characters
      const sanitizeString = (str) => str.replace(/[^a-zA-Z0-9]/g, '');

      const sanitizedFirstName = sanitizeString(firstName.toLowerCase());
      const sanitizedLastNameInitial = sanitizeString(lastName[0].toLowerCase());
      const sanitizedLastName = sanitizeString(lastName.toLowerCase());
      const sanitizedFirstNameInitial = sanitizeString(firstName[0].toUpperCase());

      const username = `${sanitizedFirstName}${sanitizedLastNameInitial}${newUserId}`;
      // const password = `${sanitizedFirstNameInitial}${sanitizedLastName}@${newUserId}`;
      const password = `${sanitizedFirstNameInitial}${sanitizedLastName.substring(0, 5)}@${newUserId}`;




      const updateUserQuery = `
        UPDATE cs_os_users
        SET cs_username = ?, cs_password = ?
        WHERE id = ?
      `;

      await pool.query(updateUserQuery, [username, password, newUserId]);

      // Send email if email flag is true
      if (email) {
        try {
          const [userRow] = await pool.query('SELECT * FROM cs_os_users WHERE id = ?', [newUserId]);
          if (userRow.length > 0) {
            await sendEmail(userRow[0]);

            // Update cs_confirmmail to 1 after successfully sending the email
            await pool.query(
              'UPDATE cs_os_users SET cs_basicmail = ? WHERE id = ?',
              [1, newUserId]
            );
            console.log("cs_confirmmail updated successfully for UserId:", newUserId); // Log success
          }
        } catch (emailError) {
          console.error('Error sending email:', emailError);

          // Set cs_confirmmail to 0 if there is an error
          await pool.query(
            'UPDATE cs_os_users SET cs_basicmail = ? WHERE id = ?',
            [0, newUserId]
          );

          return res.status(500).json({ error: 'Error sending email' });
        }
      }


      console.log('Inserted User ID:', newUserId);
    }

    // Return success message after completing the process
    res.status(200).json({ message: 'Users added successfully, and emails sent if applicable' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while adding users' });
  }
});

// Reuse Basic sendEmail function
const sendEmail = async (userData, userId) => {
  const templateQuery = `SELECT template_content, template_subject FROM cs_tbl_email_template WHERE template_id = ?`;
  const [templateData] = await pool.query(templateQuery, [1]);

  if (!templateData || templateData.length === 0) {
    console.log("No email template found");
    throw new Error('No email template found');
  }

  const userEmail = userData.cs_email;
  if (!userEmail) {
    console.log("User email is not defined");
    throw new Error('User email is not defined');
  }

  let emailBody = templateData[0].template_content;
  const emailSubject = templateData[0].template_subject;

  const replacePlaceholders = (template, data) => {
    return template.replace(/{{(\w+)}}/g, (_, key) => data[key] || '');
  };

  emailBody = replacePlaceholders(emailBody, userData);

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: userEmail,
    subject: emailSubject,
    html: emailBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${userEmail}`);
  } catch (error) {
    console.error(`Error sending email to ${userEmail}:`, error.message);
  }
};


//Confirm User Import with reg no.

router.get('/Confirmsamplefilewithregno', async (req, res) => {
  try {
    // Create a new workbook and add a worksheet
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Sample');




    const [dynamicFields] = await pool.query(`
      SELECT cs_field_label, cs_is_required
      FROM cs_os_field_data 
      WHERE cs_visible_reg_adminform = 1 AND cs_field_id != 12 OR cs_field_id = 13 
          ORDER BY 
              CASE 
                  WHEN cs_status = 1 THEN cs_field_order 
                  ELSE 999999 
              END
  `);

    const headerRow = [
      'Registration Number',
      ...dynamicFields.map(field => `${field.cs_field_label}`)
    ];




    // Add the header row to the worksheet
    // worksheet.addRow([]);

    const [mandatoryfields] = await pool.query(`
      SELECT cs_field_label, cs_is_required FROM cs_os_field_data WHERE cs_visible_add_user = 1 AND cs_is_required = 1 AND cs_field_id != 12;
`);

    worksheet.addRow(headerRow).font = { bold: true };


    const csvData = await workbook.csv.writeBuffer();

    // Send the generated CSV file to the client
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sample.csv');
    res.status(200).send(csvData);

    workbook.xlsx.write(res)
      .then(() => {
        res.end();
      })
      .catch(err => {
        console.error('Error generating sample Excel file:', err);
        res.status(500).send('Internal Server Error');
      });
  } catch (error) {
    console.error('Error fetching registration categories:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/ConfirmInstructionfilewithregno', async (req, res) => {
  try {
    // Create a new workbook and add a worksheet
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Sample');

    // Add the instructions and sample data to the worksheet
    const data = [
      ['Import User Template'],
      [],
      ['How to import your data'],
      ['Step 1:', 'Collect all your attendee information and when you are ready, add your data to the Import sample sheet.'],
      ['Step 2:', 'Add your content; the columns mention in the mandatory section are required.'],
      ['Step 3:', 'When you are done adding your content, upload this file through the "Select File" menu on Consoft Onsite admin.'],
      ['Step 4:', 'Your content will be selected. If there are any errors you will be notified.'],
      [],
      ['NOTE:', "Don't delete any columns from the sample sheet. If you aren't using a column, just leave it empty."],
      [],
      ['TIP:', 'Users in the template can be in any order'],
      ['TIP:', 'Using Registration Category for your users? Make sure the Category already exist before using their id here.'],
      [],
      ['Column Name', 'Column Descriptions', 'Column Examples'],
      ['Registration number', 'The unique identifier for the user (do not delete or change this value)', '1023'],
      ['Title', 'The title for the user', 'Mr.'],
      ['First Name*', 'The first name (first name) of the user', 'John'],
      ['Last Name*', 'The last name (last name) of the user', 'Smith'],
      ['Registration Category', 'The Attendee Registration Category of the users', '1'],
      ['Email', 'The email address the attendee used to register for the event.', 'dummy@gmail.com'],
      ['Company', 'The User Company Name', 'Socio'],
      ['Additional', 'Any Additional Question with value', 'X'],
      [],
      ['Questions?', 'If you have any questions or problems uploading your data, email us on info@consoftservices.com'],
      [],
      ['Registration Category', 'Value to need mention in import file']
    ];

    // Add data to worksheet
    data.forEach((row, index) => {
      worksheet.addRow(row);
      if (index === 0 || index === 2 || index === 4 || index === 6 || index === 8 || index === 10 || index === 12 || index === 14) {
        worksheet.getRow(index + 1).font = { bold: true };
      }
    });

    // Fetch registration categories from the database
    const [categories] = await pool.query(
      'SELECT cs_reg_category, cs_reg_cat_id FROM cs_os_category WHERE cs_status = 1 AND cs_reg_cat_id NOT IN (0, 1, 3)'
    );

    // Add the registration categories to the worksheet
    categories.forEach(category => {
      worksheet.addRow([category.cs_reg_category, category.cs_reg_cat_id]);
    });

    // Send the generated Excel file to the client
    const [fieldData] = await pool.query(`
          SELECT cs_field_name, cs_visible_reg_adminform 
          FROM cs_os_field_data 
          WHERE cs_field_name = 'cs_workshop_category' AND cs_visible_reg_adminform = 1
      `);

    // If the condition is met, fetch workshop data
    // if (fieldData.length > 0) {
    const [workshops] = await pool.query('SELECT cs_workshop_id, cs_workshop_name FROM cs_os_workshop');
    // Add workshop data to worksheet
    worksheet.addRow([]);
    worksheet.addRow(['Workshop Name', 'Workshop ID']);
    workshops.forEach(workshop => {
      worksheet.addRow([workshop.cs_workshop_name, workshop.cs_workshop_id]);
    });
    // }

    // const [fieldData1] = await pool.query(`
    //     SELECT cs_field_name, cs_visible_add_user 
    //     FROM cs_os_field_data 
    //     WHERE cs_field_name = 'cs_reg_type' AND cs_visible_add_user = 1
    // `);

    // if (fieldData.length > 0) {
    const [dayTypes] = await pool.query('SELECT cs_reg_daytype_id, cs_reg_daytype_name FROM cs_os_reg_daytype WHERE cs_status = 1');
    if (dayTypes.length > 0) {
      worksheet.addRow([]);
      worksheet.addRow(['Day Type Name', 'Day Type ID']);
      dayTypes.forEach(dayType => {
        worksheet.addRow([dayType.cs_reg_daytype_name, dayType.cs_reg_daytype_id]);
      });
    }
    // }

    const [prefixes] = await pool.query('SELECT cs_prefix, cs_prefix_id FROM cs_os_name_prefixes');
    if (prefixes.length > 0) {
      worksheet.addRow([]);
      worksheet.addRow(['Tittle', 'Tittle ID']);
      prefixes.forEach(prefix => {
        worksheet.addRow([prefix.cs_prefix, prefix.cs_prefix_id]);
      });
    }

    const [tickets] = await pool.query('SELECT ticket_id, ticket_title FROM cs_reg_tickets');
    console.log('Tickets:', tickets); // Debugging: log the fetched tickets
    if (tickets.length > 0) {
      worksheet.addRow([]); // Empty row for spacing
      worksheet.addRow(['Ticket', 'Ticket ID']);
      tickets.forEach(ticket => {
        console.log('Adding Ticket:', ticket.ticket_title); // Debugging: log each ticket being added
        worksheet.addRow([ticket.ticket_title, ticket.ticket_id]);
      });
    }

    const [addons] = await pool.query('SELECT addon_id, addon_title FROM cs_reg_add_ons');
    console.log('Add-ons:', addons); // Debugging: log the fetched add-ons
    if (addons.length > 0) {
      worksheet.addRow([]); // Empty row for spacing
      worksheet.addRow(['Add-on', 'Add-on ID']);
      addons.forEach(addon => {
        console.log('Adding Add-on:', addon.addon_title); // Debugging: log each add-on being added
        worksheet.addRow([addon.addon_title, addon.addon_id]);
      });
    }


    const [dynamicFields] = await pool.query(`
      SELECT cs_field_label, cs_is_required
      FROM cs_os_field_data 
      WHERE cs_visible_reg_adminform = 1 AND cs_field_id != 12 OR cs_field_id = 13
          ORDER BY 
              CASE 
                  WHEN cs_status = 1 THEN cs_field_order 
                  ELSE 999999 
              END
  `);

    // const headerRow = [
    //     'Registration Number',
    //     ...dynamicFields.map(field => `${field.cs_field_label}`)
    // ];




    // Add the header row to the worksheet
    worksheet.addRow([]);

    const [mandatoryfields] = await pool.query(`
      SELECT cs_field_label, cs_is_required FROM cs_os_field_data WHERE cs_visible_reg_adminform = 1 AND cs_is_required = 1 AND cs_field_id != 12 OR cs_field_id = 13;
`);

    worksheet.addRow(["Mandatory fields"]);
    worksheet.addRow(["Registration Number"]);
    mandatoryfields.forEach(field => {
      worksheet.addRow([field.cs_field_label]);
    });

    worksheet.addRow([]);
    worksheet.addRow([]);

    // worksheet.addRow(["Note- Before import file delete instructions Data"]).font = { color: { argb: 'FF0000' }, bold: true };
    // worksheet.addRow(headerRow).font = { bold: true };



    // Send the generated Excel file to the client
    // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    // res.setHeader('Content-Disposition', 'attachment; filename=sample.xlsx');

    const csvData = await workbook.csv.writeBuffer();

    // Send the generated CSV file to the client
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sample.csv');
    res.status(200).send(csvData);

    workbook.xlsx.write(res)
      .then(() => {
        res.end();
      })
      .catch(err => {
        console.error('Error generating sample Excel file:', err);
        res.status(500).send('Internal Server Error');
      });
  } catch (error) {
    console.error('Error fetching registration categories:', error);
    res.status(500).send('Internal Server Error');
  }

});



//fetch Roles data from the cs_os_users
router.get('/getRegno', verifyToken, async (req, res) => {
  try {
    // Specify the columns you want to fetch from the table
    const columnsToFetch = ['cs_regno'];

    // Construct the SQL query to fetch specific columns
    const query = `SELECT ${columnsToFetch.join(',')} FROM cs_os_users`;



    // Execute the query to fetch user data from the table
    const [userData] = await pool.query(query);

    // Send the user data as a response
    res.json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/ConfirmInstructionfilewithregno', async (req, res) => {
  try {
    // Create a new workbook and add a worksheet
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Sample');

    // Add the instructions and sample data to the worksheet
    const data = [
      ['Import User Template'],
      [],
      ['How to import your data'],
      ['Step 1:', 'Collect all your attendee information and when you are ready, add your data to the Import sample sheet.'],
      ['Step 2:', 'Add your content; the columns mention in the mandatory section are required.'],
      ['Step 3:', 'When you are done adding your content, upload this file through the "Select File" menu on Consoft Onsite admin.'],
      ['Step 4:', 'Your content will be selected. If there are any errors you will be notified.'],
      [],
      ['NOTE:', "Don't delete any columns from the sample sheet. If you aren't using a column, just leave it empty."],
      [],
      ['TIP:', 'Users in the template can be in any order'],
      ['TIP:', 'Using Registration Category for your users? Make sure the Category already exist before using their id here.'],
      [],
      ['Column Name', 'Column Descriptions', 'Column Examples'],
      ['Registration number', 'The unique identifier for the user (do not delete or change this value)', '1023'],
      ['Title', 'The title for the user', 'Mr.'],
      ['First Name*', 'The first name (first name) of the user', 'John'],
      ['Last Name*', 'The last name (last name) of the user', 'Smith'],
      ['Registration Category', 'The Attendee Registration Category of the users', '1'],
      ['Email', 'The email address the attendee used to register for the event.', 'dummy@gmail.com'],
      ['Company', 'The User Company Name', 'Socio'],
      ['Additional', 'Any Additional Question with value', 'X'],
      [],
      ['Questions?', 'If you have any questions or problems uploading your data, email us on info@consoftservices.com'],
      [],
      ['Registration Category', 'Value to need mention in import file']
    ];

    // Add data to worksheet
    data.forEach((row, index) => {
      worksheet.addRow(row);
      if (index === 0 || index === 2 || index === 4 || index === 6 || index === 8 || index === 10 || index === 12 || index === 14) {
        worksheet.getRow(index + 1).font = { bold: true };
      }
    });

    // Fetch registration categories from the database
    const [categories] = await pool.query(
      'SELECT cs_reg_category, cs_reg_cat_id FROM cs_os_category WHERE cs_status = 1 AND cs_reg_cat_id NOT IN (0, 1, 3)'
    );

    // Add the registration categories to the worksheet
    categories.forEach(category => {
      worksheet.addRow([category.cs_reg_category, category.cs_reg_cat_id]);
    });

    // Send the generated Excel file to the client
    const [fieldData] = await pool.query(`
          SELECT cs_field_name, cs_visible_reg_adminform 
          FROM cs_os_field_data 
          WHERE cs_field_name = 'cs_workshop_category' AND cs_visible_reg_adminform = 1
      `);

    // If the condition is met, fetch workshop data
    // if (fieldData.length > 0) {
    const [workshops] = await pool.query('SELECT cs_workshop_id, cs_workshop_name FROM cs_os_workshop');
    // Add workshop data to worksheet
    worksheet.addRow([]);
    worksheet.addRow(['Workshop Name', 'Workshop ID']);
    workshops.forEach(workshop => {
      worksheet.addRow([workshop.cs_workshop_name, workshop.cs_workshop_id]);
    });
    // }

    // const [fieldData1] = await pool.query(`
    //     SELECT cs_field_name, cs_visible_add_user 
    //     FROM cs_os_field_data 
    //     WHERE cs_field_name = 'cs_reg_type' AND cs_visible_add_user = 1
    // `);

    // if (fieldData.length > 0) {
    const [dayTypes] = await pool.query('SELECT cs_reg_daytype_id, cs_reg_daytype_name FROM cs_os_reg_daytype WHERE cs_status = 1');
    if (dayTypes.length > 0) {
      worksheet.addRow([]);
      worksheet.addRow(['Day Type Name', 'Day Type ID']);
      dayTypes.forEach(dayType => {
        worksheet.addRow([dayType.cs_reg_daytype_name, dayType.cs_reg_daytype_id]);
      });
    }
    // }

    const [prefixes] = await pool.query('SELECT cs_prefix, cs_prefix_id FROM cs_os_name_prefixes');
    if (prefixes.length > 0) {
      worksheet.addRow([]);
      worksheet.addRow(['Tittle', 'Tittle ID']);
      prefixes.forEach(prefix => {
        worksheet.addRow([prefix.cs_prefix, prefix.cs_prefix_id]);
      });
    }

    const [tickets] = await pool.query('SELECT ticket_id, ticket_title FROM cs_reg_tickets');
    console.log('Tickets:', tickets); // Debugging: log the fetched tickets
    if (tickets.length > 0) {
      worksheet.addRow([]); // Empty row for spacing
      worksheet.addRow(['Ticket', 'Ticket ID']);
      tickets.forEach(ticket => {
        console.log('Adding Ticket:', ticket.ticket_title); // Debugging: log each ticket being added
        worksheet.addRow([ticket.ticket_title, ticket.ticket_id]);
      });
    }

    const [addons] = await pool.query('SELECT addon_id, addon_title FROM cs_reg_add_ons');
    console.log('Add-ons:', addons); // Debugging: log the fetched add-ons
    if (addons.length > 0) {
      worksheet.addRow([]); // Empty row for spacing
      worksheet.addRow(['Add-on', 'Add-on ID']);
      addons.forEach(addon => {
        console.log('Adding Add-on:', addon.addon_title); // Debugging: log each add-on being added
        worksheet.addRow([addon.addon_title, addon.addon_id]);
      });
    }


    const [dynamicFields] = await pool.query(`
      SELECT cs_field_label, cs_is_required
      FROM cs_os_field_data 
      WHERE cs_visible_reg_adminform = 1 AND cs_field_id != 12 OR cs_field_id = 13
          ORDER BY 
              CASE 
                  WHEN cs_status = 1 THEN cs_field_order 
                  ELSE 999999 
              END
  `);

    // const headerRow = [
    //     'Registration Number',
    //     ...dynamicFields.map(field => `${field.cs_field_label}`)
    // ];




    // Add the header row to the worksheet
    worksheet.addRow([]);

    const [mandatoryfields] = await pool.query(`
      SELECT cs_field_label, cs_is_required FROM cs_os_field_data WHERE cs_visible_reg_adminform = 1 AND cs_is_required = 1 AND cs_field_id != 12 OR cs_field_id = 13;
`);

    worksheet.addRow(["Mandatory fields"]);
    worksheet.addRow(["Registration Number"]);
    mandatoryfields.forEach(field => {
      worksheet.addRow([field.cs_field_label]);
    });

    worksheet.addRow([]);
    worksheet.addRow([]);

    // worksheet.addRow(["Note- Before import file delete instructions Data"]).font = { color: { argb: 'FF0000' }, bold: true };
    // worksheet.addRow(headerRow).font = { bold: true };



    // Send the generated Excel file to the client
    // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    // res.setHeader('Content-Disposition', 'attachment; filename=sample.xlsx');

    const csvData = await workbook.csv.writeBuffer();

    // Send the generated CSV file to the client
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sample.csv');
    res.status(200).send(csvData);

    workbook.xlsx.write(res)
      .then(() => {
        res.end();
      })
      .catch(err => {
        console.error('Error generating sample Excel file:', err);
        res.status(500).send('Internal Server Error');
      });
  } catch (error) {
    console.error('Error fetching registration categories:', error);
    res.status(500).send('Internal Server Error');
  }

});

router.post('/addBulkConfirmUser', verifyToken, queueMiddleware, async (req, res) => {
  try {
    const userDataArray = req.body.data; // Array of user data objects
    const email = req.body.sendEmail; // Check if email flag is true


    // Filter out the 'Id' field from each user data object
    const filteredUserDataArray = userDataArray.map(userData => {
      const { Id, ...filteredUserData } = userData; // Destructure 'Id' field and exclude it
      return filteredUserData;
    });

    // Retrieve field names from the database based on keys
    const keys = Object.keys(filteredUserDataArray[0]); // Assuming all objects have the same keys
    console.log('Keys:', keys);

    const queryResult = await pool.query('SELECT cs_field_label, cs_field_name FROM cs_os_field_data WHERE cs_field_label IN (?)', [keys]);

    // Extract field labels and names from query result
    const fieldMap = {};
    queryResult[0].forEach(row => {
      fieldMap[row.cs_field_label] = row.cs_field_name;
    });

    console.log('Field Map:', fieldMap);

    // Prepare an array to hold all user data with fields
    const allUserDataWithFields = [];

    const getTitleById = async (id) => {
      const [rows] = await pool.query('SELECT cs_prefix FROM cs_os_name_prefixes WHERE cs_prefix_id = ?', [id]);
      if (rows.length > 0) {
        return rows[0].cs_prefix;
      } else {
        return null; // Return null if no title is found
      }
    };

    // Loop through each record in userDataArray
    for (let i = 0; i < userDataArray.length; i++) {
      const userData = userDataArray[i];

      const userDataWithFields = {};
      // Copy original keys/values to userDataWithFields, excluding 'Id'
      Object.entries(userData).forEach(([key, value]) => {
        if (key !== 'Id') {
          // If the key exists in the fieldMap, update the key
          if (fieldMap[key]) {
            userDataWithFields[fieldMap[key]] = value;
          } else {
            // Otherwise, keep the original key
            userDataWithFields[key] = value;
          }
        }
      });

      if (userDataWithFields.cs_title) {
        const title = await getTitleById(userDataWithFields.cs_title);
        if (title) {
          userDataWithFields.cs_title = title;
        }
      }

      // Fetch facility data based on regId for each user
      const regId = userDataWithFields.cs_reg_cat_id;
      const workshop = parseInt(userDataWithFields.cs_workshop_category, 10);
      // const workshop = userData.cs_workshop_category;

      const [rows] = await pool.query(`
        SELECT fd.cs_facility_name, fc.cs_allow_count, fd.cs_facility_id
        FROM cs_os_facility_category fc
        JOIN cs_os_facility_detail fd ON fc.cs_facility_detail_id = fd.cs_facility_detail_id
        WHERE fc.cs_reg_cat_id = ? AND fd.cs_status = 1
      `, [regId]);

      // Initialize badgeData object for each user
      const badgeData = {};
      console.log("userDataWithFields.cs_reg_type", userDataWithFields.cs_reg_type);


      if (userDataWithFields.cs_reg_type && userDataWithFields.cs_reg_type !== "101") {
        console.log("Processing daywise data");

        for (const row of rows) {
          const facilityName = row.cs_facility_name;
          const allowCount = row.cs_allow_count;
          const facilityId = row.cs_facility_id;

          const [typeRows] = await pool.query(`
            SELECT cs_type 
            FROM cs_os_facilitytype 
            WHERE cs_facility_id = ?
          `, [facilityId]);

          const facilityType = typeRows[0]?.cs_type;

          if (facilityType === 'workshop') {
            const [workshopRows] = await pool.query(`
              SELECT cs_workshop_id 
              FROM cs_os_workshop 
              WHERE cs_facility_id = ? 
            `, [facilityId]);

            const workshopId = workshopRows[0]?.cs_workshop_id;
            if (workshopId === workshop) {
              badgeData[facilityName] = allowCount;
              badgeData[facilityName + '_status'] = "0";
            } else {
              badgeData[facilityName] = "0";
              badgeData[facilityName + '_status'] = "0";
            }
          } else {
            if (facilityName.includes(userDataWithFields.cs_reg_type) || !/\d$/.test(facilityName)) {
              // Facility matches, set the count fetched from the table
              badgeData[facilityName] = allowCount;
              // Set the status to "0" for each facility
              badgeData[facilityName + '_status'] = "0";
            } else {
              // Facility doesn't match, set count to 0
              badgeData[facilityName] = "0";
              // Set the status to "0" for each facility
              badgeData[facilityName + '_status'] = "0";
            }
          }
        }
      } else {
        console.log("Processing all-day data");

        for (const row of rows) {
          const facilityName = row.cs_facility_name;
          const allowCount = row.cs_allow_count;
          const facilityId = row.cs_facility_id;

          const [typeRows] = await pool.query(`
            SELECT cs_type 
            FROM cs_os_facilitytype 
            WHERE cs_facility_id = ?
          `, [facilityId]);

          const facilityType = typeRows[0]?.cs_type;

          if (facilityType === 'workshop') {
            const [workshopRows] = await pool.query(`
              SELECT cs_workshop_id 
              FROM cs_os_workshop 
              WHERE cs_facility_id = ? 
            `, [facilityId]);

            const workshopId = workshopRows[0]?.cs_workshop_id;
            if (workshopId === workshop) {
              badgeData[facilityName] = allowCount;
              badgeData[facilityName + '_status'] = "0";
            } else {
              badgeData[facilityName] = "0";
              badgeData[facilityName + '_status'] = "0";
            }
          } else {
            badgeData[facilityName] = allowCount;
            badgeData[facilityName + '_status'] = "0";
          }
        }
      }

      // let lastRegNo = 0; // Initialize regNo
      // let regNo = 0;
      // // Check if cs_regno already has a value
      // if (!userDataWithFields.cs_regno) {
      //   // Get the last inserted cs_regno from cs_os_users table
      //   // const [lastRegCatIdRow] = await pool.query('SELECT MAX(cs_regno) AS max_regno FROM cs_os_users');
      //   // const lastRegCatId = lastRegCatIdRow[0].max_regno || 0; // If no records exist, default to 0
      //   // regNo = lastRegCatId + 1;

      //   const siteSettingResult = await pool.query('SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter ="Admin Reg Start Number"');
      //   // console.log("siteSettingResult", siteSettingResult[0][0].cs_value);
      //   lastRegNo = siteSettingResult.length > 0 ? parseInt(siteSettingResult[0][0].cs_value, 10) : 0;
      //   console.log("lastRegNo", lastRegNo);
      //   // Step 2: Check if the incremented regNo already exists, if yes, find a unique one
      //   let regNoExists = true;
      //   while (regNoExists) {
      //     const existingRegNoResult = await pool.query('SELECT COUNT(*) AS count FROM cs_os_users WHERE cs_regno = ?', [lastRegNo]);
      //     console.log("existingRegNoResult", existingRegNoResult);
      //     const existingRegNoCount = existingRegNoResult[0][0].count || 0;
      //     if (existingRegNoCount > 0) {
      //       lastRegNo++;
      //     } else {
      //       regNoExists = false;
      //     }
      //   }

      //   let regNo = lastRegNo + 1;

      //   // Step 3: Update the cs_tbl_sitesetting table with the new regNo
      //   await pool.query('UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter ="Admin Reg Start Number"', [regNo]);
      //   userDataWithFields.cs_regno = lastRegNo;

      //   // Step 4: Now regNo is a unique value, use it in your userData
      //   userData.cs_regno = lastRegNo;
      // } else {
      //   // Use the existing value of cs_regno
      //   lastRegNo = userDataWithFields.cs_regno;
      //   userDataWithFields.cs_regno = lastRegNo;
      // }




      // Now regNo is either a newly generated unique value or the existing value, use it in your userData

      console.log('Registration number for user:', userDataWithFields.cs_reg_cat_id);
      console.log('Badge data for user:', badgeData);

      // Fetch cs_reg_category from cs_os_category based on cs_reg_cat_id
      const catId = userDataWithFields.cs_reg_cat_id;
      console.log('catId:', catId); // Add this line to log the catId
      const [categoryRows] = await pool.query('SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?', [catId]);
      console.log('categoryRows:', categoryRows); // Add this line to log the query results
      const csRegCategory = categoryRows[0]?.cs_reg_category;
      console.log('Category:', csRegCategory);

      // Assign the fetched cs_reg_category to userDataWithFields
      userDataWithFields.cs_reg_category = csRegCategory;

      // Map fields containing IDs to their corresponding values from different tables
      // await Promise.all([
      //   mapFieldById(userDataWithFields, 'cs_reg_category', 'cs_os_category', 'cs_reg_cat_id', 'cs_reg_category'),
      //   mapRegCategory(userDataWithFields) // Handle cs_reg_category and cs_reg_cat_id together
      // ]);

      // Insert the user data into the database
      const insertUserQuery = `
        INSERT INTO cs_os_users SET ?, cs_isconfirm = ?, cs_module = ?
      `;

      // await pool.query(insertUserQuery, [userDataWithFields, 1, currentTimestamp, currentTimestamp]);
      const [insertResult] = await pool.query(insertUserQuery, [userDataWithFields, 1, 1]);

      const newUserId = insertResult.insertId;

      const firstName = userDataWithFields.cs_first_name ? userDataWithFields.cs_first_name : 'Dammy';
      const lastName = userDataWithFields.cs_last_name ? userDataWithFields.cs_last_name : 'Dammy';

      // Function to remove special characters
      const sanitizeString = (str) => str.replace(/[^a-zA-Z0-9]/g, '');

      const sanitizedFirstName = sanitizeString(firstName.toLowerCase());
      const sanitizedLastNameInitial = sanitizeString(lastName[0].toLowerCase());
      const sanitizedLastName = sanitizeString(lastName.toLowerCase());
      const sanitizedFirstNameInitial = sanitizeString(firstName[0].toUpperCase());

      const username = `${sanitizedFirstName}${sanitizedLastNameInitial}${newUserId}`;
      // const password = `${sanitizedFirstNameInitial}${sanitizedLastName}@${newUserId}`;
      const password = `${sanitizedFirstNameInitial}${sanitizedLastName.substring(0, 5)}@${newUserId}`;




      const updateUserQuery = `
        UPDATE cs_os_users
        SET cs_username = ?, cs_password = ?
        WHERE id = ?
      `;


      await pool.query(updateUserQuery, [username, password, newUserId]);

      // Send email if email flag is true
      if (email) {
        try {
          const [userRow] = await pool.query('SELECT * FROM cs_os_users WHERE id = ?', [newUserId]);
          if (userRow.length > 0) {
            await sendConfirmEmail(userRow[0]);

            // Update cs_confirmmail to 1 after successfully sending the email
            await pool.query(
              'UPDATE cs_os_users SET cs_confirmmail = ? WHERE id = ?',
              [1, newUserId]
            );
            console.log("cs_confirmmail updated successfully for UserId:", newUserId); // Log success
          }
        } catch (emailError) {
          console.error('Error sending email:', emailError);

          // Set cs_confirmmail to 0 if there is an error
          await pool.query(
            'UPDATE cs_os_users SET cs_confirmmail = ? WHERE id = ?',
            [0, newUserId]
          );

          return res.status(500).json({ error: 'Error sending email' });
        }
      }



      console.log('Inserted User ID:', newUserId);
    }

    // Return success message after completing the process
    res.status(200).json({ message: 'Users added successfully, and emails sent if applicable' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while adding users' });
  }
});

// Reuse Basic sendEmail function
const sendConfirmEmail = async (userData, userId) => {
  const templateQuery = `SELECT template_content, template_subject FROM cs_tbl_email_template WHERE template_id = ?`;
  const [templateData] = await pool.query(templateQuery, [7]);

  if (!templateData || templateData.length === 0) {
    console.log("No email template found");
    throw new Error('No email template found');
  }

  const userEmail = userData.cs_email;
  if (!userEmail) {
    console.log("User email is not defined");
    throw new Error('User email is not defined');
  }

  let emailBody = templateData[0].template_content;
  const emailSubject = templateData[0].template_subject;

  const replacePlaceholders = (template, data) => {
    return template.replace(/{{(\w+)}}/g, (_, key) => data[key] || '');
  };

  emailBody = replacePlaceholders(emailBody, userData);

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: userEmail,
    subject: emailSubject,
    html: emailBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${userEmail}`);
  } catch (error) {
    console.error(`Error sending email to ${userEmail}:`, error.message);
  }
};



// router.post('/addBulkConfirmUser', verifyToken, async (req, res) => {
//   try {
//     const bulkUsers = req.body; // Assuming req.body contains the array of users to be added
//     console.log(bulkUsers);


//     // Function to get category name by ID
//     const getCategoryNameById = async (id) => {
//       const [rows] = await pool.query('SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?', [id]);
//       if (rows.length > 0) {
//         return rows[0].cs_reg_category;
//       } else {
//         throw new Error(`Category with ID ${id} not found`);
//       }
//     };

//     // Function to get title name by ID
//     const getTitleNameById = async (id) => {
//       const [rows] = await pool.query('SELECT cs_prefix FROM cs_os_name_prefixes WHERE cs_prefix_id = ?', [id]);
//       if (rows.length > 0) {
//         return rows[0].cs_prefix;
//       } else {
//         throw new Error(`Title with ID ${id} not found`);
//       }
//     };

//     // Function to trim and process user fields
//     const processUserFields = async (user) => {
//       const trimmedUser = {};
//       for (const [key, value] of Object.entries(user)) {
//         // Check if the value is a string before trimming
//         if (typeof value === 'string') {
//           trimmedUser[key] = value.trim();
//         } else {
//           trimmedUser[key] = value;
//         }
//       }

//       // If Title is provided and it's a valid number, fetch the title name
//       if (trimmedUser['Title'] && !isNaN(trimmedUser['Title'])) {
//         trimmedUser['Title'] = await getTitleNameById(trimmedUser['Title']);
//       } else {
//         // If Title is missing or invalid, set it to null
//         trimmedUser['Title'] = null;
//       }

//       // Get category name by ID
//       trimmedUser['Registration Category'] = await getCategoryNameById(trimmedUser['Registration Category ID']);

//       return trimmedUser;
//     };

//     // Insert each user and then update the password
//     for (const user of bulkUsers) {
//       // Create a processed version of the user
//       const processedUser = await processUserFields(user);

//       // Function to remove special characters
//       const sanitize = (str) => str.replace(/[^a-zA-Z0-9]/g, '');

//       const firstName = processedUser['First Name'];
//       const lastName = processedUser['Last Name'];

//       // Insert the user without the password and username
//       const insertUserQuery = `
//         INSERT INTO cs_os_users (cs_regno, cs_title, cs_first_name, cs_last_name, cs_phone, cs_email, cs_reg_category, cs_reg_cat_id, cs_isconfirm)
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `;

//       const [result] = await pool.query(insertUserQuery, [
//         processedUser['Registration Number'],
//         processedUser['Title'],
//         firstName,
//         lastName,
//         processedUser['Phone'],
//         processedUser['Email'],
//         processedUser['Registration Category'],
//         processedUser['Registration Category ID'],
//         1 // Example default value for cs_status
//       ]);

//       const newUserId = result.insertId;

//       // Function to remove special characters
//       const sanitizeString = (str) => str.replace(/[^a-zA-Z0-9]/g, '');

//       // Function to capitalize the first letter
//       // const capitalizeFirstLetter = (str) => {
//       //   return str.charAt(0).toUpperCase() + str.slice(1);
//       // };

//       // Sanitize and format the first and last names
//       const sanitizedFirstName = sanitizeString(firstName.toLowerCase());
//       const sanitizedLastNameInitial = sanitizeString(lastName[0].toLowerCase());
//       const sanitizedLastName = sanitizeString(lastName.toLowerCase());
//       const sanitizedFirstNameInitial = sanitizeString(firstName[0].toUpperCase());

//       // Generate username and password
//       const username = `${sanitizedFirstName}${sanitizedLastNameInitial}${newUserId}`;
//       const password = `${sanitizedFirstNameInitial}${sanitizedLastName}@${newUserId}`;

//       console.log("Username:", username);
//       console.log("Password:", password);




//       // Update the user's username and password
//       const updateUserQuery = `
//         UPDATE cs_os_users
//         SET cs_username = ?, cs_password = ?
//         WHERE id = ?
//       `;

//       await pool.query(updateUserQuery, [username, password, newUserId]);
//     }

//     res.status(200).json({ success: true, message: 'Bulk users added successfully' });
//   } catch (error) {
//     console.error('Error adding bulk users:', error);
//     res.status(500).json({ success: false, error: 'Failed to add bulk users' });
//   }
// });




//fetch Roles data from the cs_os_users
router.get('/getMand', verifyToken, async (req, res) => {
  try {
    // Specify the columns you want to fetch from the table
    const columnsToFetch = ['cs_field_name', 'cs_field_label', 'cs_is_required', 'cs_field_type'];

    // Construct the SQL query to fetch specific columns
    const query = `SELECT ${columnsToFetch.join(',')} FROM cs_os_field_data WHERE cs_is_required = 1`;

    // Execute the query to fetch user data from the table
    const [userData] = await pool.query(query);

    // Send the user data as a response
    res.json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//Registration number
router.get('/getRegno', verifyToken, async (req, res) => {
  try {
    // Specify the columns you want to fetch from the table
    const columnsToFetch = ['cs_regno'];

    // Construct the SQL query to fetch specific columns
    const query = `SELECT ${columnsToFetch.join} FROM cs_os_users `;

    // Execute the query to fetch user data from the table
    const [userData] = await pool.query(query);

    // Send the user data as a response
    res.json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/getMaxNo', verifyToken, async (req, res) => {
  try {
    // Define the SQL query to fetch the maximum registration number
    // const query = 'SELECT MAX(cs_regno) AS maxNo FROM cs_os_users';
    const query = ' SELECT cs_value  AS maxNo FROM cs_tbl_sitesetting WHERE cs_parameter ="Admin Reg Start Number"';




    // Execute the query to fetch the maximum registration number from the table
    const [result] = await pool.query(query);

    // Extract the maximum registration number from the query result
    const maxNo = result[0].maxNo;

    // Send the maximum registration number as a response
    res.send(String(maxNo)); // Convert to string if needed
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});




router.post('/fetchuserdetail', verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    const { catId } = req.body;

    console.log(catId);


    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
      SELECT *
      FROM cs_os_users
      WHERE id = ${catId};
      `;


    // Execute the query to fetch pages data for the specified role_id
    const [pagesData] = await pool.query(query, [catId]);
    console.log("pagesData", pagesData);

    // Send the pages data as a response
    res.json(pagesData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// router.post('/editUser', async (req, res) => {
//   const { ...userData } = req.body;

//   console.log('userData' , userData);
//   console.log(req.body);


//   const days = userData.cs_reg_type;
//   const regId = userData.cs_reg_category;

//   const query = `SELECT * FROM cs_os_user WHERE cs_regno = ?`;

//   // Execute the query to fetch user data from the table
//   const [userData] = await pool.query(query);




// });

// router.post('/editUser', async (req, res) => {
//   const { ...userData } = req.body;
//   console.log('Exsting data', userData);
//   const cs_regno = req.body.catId; // Accessing catId directly from req.body

//   const regId = userData.cs_reg_category;
//   console.log(regId);
//   const query = `SELECT * FROM cs_os_users WHERE cs_regno = ?`;
//   const categoryQuery = `SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?`;

//    

// router.post('/editUser', verifyToken, async (req, res) => {
//   const { ...userData } = req.body;

//   const cs_regno = req.body.cs_regno; // Ensure the client sends cs_regno in the request body

//   const days = userData.cs_reg_type;
//   const regId = userData.cs_reg_category;
//   console.log(regId);

//   const query = `SELECT * FROM cs_os_users WHERE cs_regno = ?`;
//   const categoryQuery = `SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?`;

//   try {
//     // Execute the query to fetch category name based on category ID
//     const [categoryResult] = await pool.query(categoryQuery, [regId]);
//     console.log('categoryResult', categoryResult);

//     // Execute the query to fetch existing user data from the table
//     const [OlduserData] = await pool.query(query, [cs_regno]);
//     console.log('userData.cs_reg_category', userData.cs_reg_category);

//     if (OlduserData.length === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Check if category ID has changed


//     await Promise.all([
//       // mapFieldById(userData, 'cs_title', 'cs_os_name_prefixes', 'cs_prefix_id', 'cs_title'),
//       // mapFieldById(userData, 'cs_state', 'cs_tbl_states', 'cs_state_id', 'cs_state'),
//       // mapFieldById(userData, 'cs_country', 'cs_tbl_country', 'cs_country_id', 'cs_country'),
//       mapFieldById(userData, 'cs_reg_category', 'cs_os_category', 'cs_reg_cat_id', 'cs_reg_category'),
//       mapRegCategory(userData) // Handle cs_reg_category and cs_reg_cat_id together

//       // mapFieldById(userData, 'cs_tshirt', 'cs_os_field_option', 'cs_reg_cat_id', 'cs_reg_category')
//       // Add more mappings as needed for other fields
//     ]);
//     // Update user data
//     console.log('Existing data', userData);
//     const updateQuery = `
//         UPDATE cs_os_users 
//         SET ? 
//         WHERE cs_regno = ?
//       `;

//     await pool.query(updateQuery, [
//       userData, // Replace with actual columns
//       cs_regno,
//     ]);

//     if (OlduserData[0].cs_reg_category !== userData.cs_reg_category || OlduserData[0].cs_reg_type !== userData.cs_reg_type || OlduserData[0].cs_workshop_category !== userData.cs_workshop_category) {
//       const [rows, fields] = await pool.query(`
//         SELECT fd.cs_facility_name, fc.cs_allow_count
//         FROM cs_os_facility_category fc
//         JOIN cs_os_facility_detail fd ON fc.cs_facility_detail_id = fd.cs_facility_detail_id
//         WHERE fc.cs_reg_cat_id = ? AND fd.cs_status = 1
//     `, [regId]);

//       // Initialize badgeData object
//       const badgeData = {};

//       // Check if cs_reg_type is available and not equal to "101"
//       if (userData.cs_reg_type && userData.cs_reg_type !== "101") {
//         const reg_daytype = days;

//         // Check if the query was successful
//         if (rows) {
//           // Loop through the results and construct the badge data
//           rows.forEach(row => {
//             const facilityName = row.cs_facility_name;
//             const allowCount = row.cs_allow_count;

//             // Check if the facility name matches the cs_reg_type and has no numbers at the end
//             if (facilityName.includes(reg_daytype) || !/\d$/.test(facilityName)) {
//               // Facility matches, set the count fetched from the table
//               badgeData[facilityName] = allowCount;
//               // Set the status to "0" for each facility
//               badgeData[facilityName + '_status'] = "0";
//             } else {
//               // Facility doesn't match, set count to 0
//               badgeData[facilityName] = "0";
//               // Set the status to "0" for each facility
//               badgeData[facilityName + '_status'] = "0";
//             }
//           });
//         } else {
//           // Query failed
//           console.error("Error executing query:", error);
//         }
//       } else {
//         // cs_reg_type not available, set count to 0 for all facilities
//         if (rows) {
//           rows.forEach(row => {
//             const facilityName = row.cs_facility_name;
//             const allowCount = row.cs_allow_count;

//             badgeData[facilityName] = allowCount;
//             // Set the status to "0" for each facility
//             badgeData[facilityName + '_status'] = "0";
//           });
//         } else {
//           // Query failed
//           console.error("Error executing query:", error);
//         }
//       }

//       console.log("badgeData", badgeData);

//       const updateBadgeQuery = `
//   UPDATE cs_os_badges
//   SET cs_reg_cat_id= ? ,cs_badge_data = ?, updated_at = CURRENT_TIMESTAMP
//   WHERE cs_regno = ?`;
//       await pool.query(updateBadgeQuery, [regId, JSON.stringify(badgeData), cs_regno]);
//     }






//     // console.log('User data updated successfully', updateQuery);


//     res.status(200).json({ message: 'User data updated successfully', userData });

//   } catch (error) {
//     console.error('Error fetching or updating user data:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });



router.post('/editUser', verifyToken, async (req, res) => {
  const { ...userData } = req.body;

  console.log(req.body);

  const cs_regno = req.body.cs_regno; // Ensure the client sends cs_regno in the request body

  const days = userData.cs_reg_type;
  const regId = userData.cs_reg_category;
  const workshop = parseInt(userData.cs_workshop_category, 10);
  console.log("workshop", workshop);

  console.log("regId", regId);


  const query = `SELECT * FROM cs_os_users WHERE cs_regno = ?`;
  const categoryQuery = `SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?`;

  try {
    // Execute the query to fetch category name based on category ID
    const [categoryResult] = await pool.query(categoryQuery, [regId]);
    console.log('categoryResult', categoryResult);

    // Execute the query to fetch existing user data from the table
    const [OlduserData] = await pool.query(query, [cs_regno]);
    console.log('cs_reg_category', userData.cs_reg_category);

    if (OlduserData.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if category ID has changed
    await Promise.all([
      mapFieldById(userData, 'cs_reg_category', 'cs_os_category', 'cs_reg_cat_id', 'cs_reg_category'),
      mapRegCategory(userData) // Handle cs_reg_category and cs_reg_cat_id together
    ]);

    // Update user data
    console.log('Existing data', userData);
    const updateQuery = `
      UPDATE cs_os_users 
      SET ?
      WHERE cs_regno = ?
    `;

    await pool.query(updateQuery, [
      userData, // Replace with actual columns
      cs_regno,
    ]);

    try {
      if (OlduserData[0].cs_reg_category !== userData.cs_reg_category || OlduserData[0].cs_reg_type !== userData.cs_reg_type || OlduserData[0].cs_workshop_category !== userData.cs_workshop_category) {
        const [rows, fields] = await pool.query(`
          SELECT fd.cs_facility_name, fc.cs_allow_count, fd.cs_facility_id
          FROM cs_os_facility_category fc
          JOIN cs_os_facility_detail fd ON fc.cs_facility_detail_id = fd.cs_facility_detail_id
          WHERE fc.cs_reg_cat_id = ? AND fd.cs_status = 1
        `, [regId]);

        const badgeData = {};

        if (userData.cs_reg_type && userData.cs_reg_type !== '101') {
          const reg_daytype = days;

          if (rows) {
            for (const row of rows) {
              const { cs_facility_name, cs_allow_count, cs_facility_id } = row;
              console.log("facilityId", cs_facility_id);

              const [typeRows, typeFields] = await pool.query(`
                SELECT cs_type 
                FROM cs_os_facilitytype 
                WHERE cs_facility_id = ?
              `, [cs_facility_id]);
              const facilityType = typeRows[0].cs_type;

              if (facilityType === 'workshop') {
                const [workshopRows, workshopFields] = await pool.query(`
                  SELECT cs_workshop_id 
                  FROM cs_os_workshop 
                  WHERE cs_facility_id = ? 
                `, [cs_facility_id]);
                const workshopId = workshopRows[0].cs_workshop_id;

                console.log("workshopId", workshopId);

                if (workshopId === workshop) {
                  badgeData[cs_facility_name] = cs_allow_count;
                  badgeData[cs_facility_name + '_status'] = "0";
                } else {
                  badgeData[cs_facility_name] = "0";
                  badgeData[cs_facility_name + '_status'] = "0";
                }
              } else {
                if (cs_facility_name.includes(reg_daytype) || !/\d$/.test(cs_facility_name)) {
                  badgeData[cs_facility_name] = cs_allow_count;
                  badgeData[cs_facility_name + '_status'] = "0";
                } else {
                  badgeData[cs_facility_name] = "0";
                  badgeData[cs_facility_name + '_status'] = "0";
                }
              }
            }
          } else {
            console.error("Error executing facility query");
          }
        } else {
          console.log("i am here in all day");
          if (rows) {
            for (const row of rows) {
              const { cs_facility_name, cs_allow_count, cs_facility_id } = row;
              console.log("facilityId", cs_facility_id);

              const [typeRows, typeFields] = await pool.query(`
                SELECT cs_type 
                FROM cs_os_facilitytype 
                WHERE cs_facility_id = ?
              `, [cs_facility_id]);
              const facilityType = typeRows[0].cs_type;

              if (facilityType === 'workshop') {
                const [workshopRows, workshopFields] = await pool.query(`
                  SELECT cs_workshop_id 
                  FROM cs_os_workshop 
                  WHERE cs_facility_id = ? 
                `, [cs_facility_id]);
                const workshopId = workshopRows[0].cs_workshop_id;

                if (workshopId === workshop) {
                  badgeData[cs_facility_name] = cs_allow_count;
                  badgeData[cs_facility_name + '_status'] = "0";
                } else {
                  badgeData[cs_facility_name] = "0";
                  badgeData[cs_facility_name + '_status'] = "0";
                }
              } else {
                badgeData[cs_facility_name] = cs_allow_count;
                badgeData[cs_facility_name + '_status'] = "0";
              }
            }
          } else {
            console.error("Error executing facility query");
          }
        }

        console.log("badgeData", badgeData);

        const updateBadgeQuery = `
          UPDATE cs_os_badges
          SET cs_reg_cat_id = ?, cs_badge_data = ?
          WHERE cs_regno = ?
        `;
        await pool.query(updateBadgeQuery, [regId, JSON.stringify(badgeData), cs_regno]);
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }

    res.status(200).json({ message: 'User data updated successfully', userData });

  } catch (error) {
    console.error('Error fetching or updating user data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//Confirm without reg no.

router.get('/Confirmsamplefilewithoutregno', async (req, res) => {
  try {
    // Create a new workbook and add a worksheet
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Sample');




    const [dynamicFields] = await pool.query(`
      SELECT cs_field_label, cs_is_required
      FROM cs_os_field_data 
      WHERE cs_visible_reg_adminform = 1 AND cs_field_id != 12 OR cs_field_id = 13
          ORDER BY 
              CASE 
                  WHEN cs_status = 1 THEN cs_field_order 
                  ELSE 999999 
              END
  `);

    const headerRow = [
      ...dynamicFields.map(field => `${field.cs_field_label}`)
    ];




    // Add the header row to the worksheet
    // worksheet.addRow([]);

    const [mandatoryfields] = await pool.query(`
      SELECT cs_field_label, cs_is_required FROM cs_os_field_data WHERE cs_visible_add_user = 1 AND cs_is_required = 1 AND cs_field_id != 12;
`);

    worksheet.addRow(headerRow).font = { bold: true };


    const csvData = await workbook.csv.writeBuffer();

    // Send the generated CSV file to the client
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sample.csv');
    res.status(200).send(csvData);

    workbook.xlsx.write(res)
      .then(() => {
        res.end();
      })
      .catch(err => {
        console.error('Error generating sample Excel file:', err);
        res.status(500).send('Internal Server Error');
      });
  } catch (error) {
    console.error('Error fetching registration categories:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/ConfirmInstructionfilewithoutregno', async (req, res) => {
  try {
    // Create a new workbook and add a worksheet
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Sample');

    // Add the instructions and sample data to the worksheet
    const data = [
      ['Import User Template'],
      [],
      ['How to import your data'],
      ['Step 1:', 'Collect all your attendee information and when you are ready, add your data to the Import sample sheet.'],
      ['Step 2:', 'Add your content; the columns mention in the mandatory section are required.'],
      ['Step 3:', 'When you are done adding your content, upload this file through the "Select File" menu on Consoft Onsite admin.'],
      ['Step 4:', 'Your content will be selected. If there are any errors you will be notified.'],
      [],
      ['NOTE:', "Don't delete any columns from the sample sheet. If you aren't using a column, just leave it empty."],
      [],
      ['TIP:', 'Users in the template can be in any order'],
      ['TIP:', 'Using Registration Category for your users? Make sure the Category already exist before using their id here.'],
      [],
      ['Column Name', 'Column Descriptions', 'Column Examples'],
      ['Registration number', 'The unique identifier for the user (do not delete or change this value)', '1023'],
      ['Title', 'The title for the user', 'Mr.'],
      ['First Name*', 'The first name (first name) of the user', 'John'],
      ['Last Name*', 'The last name (last name) of the user', 'Smith'],
      ['Registration Category', 'The Attendee Registration Category of the users', '1'],
      ['Email', 'The email address the attendee used to register for the event.', 'dummy@gmail.com'],
      ['Company', 'The User Company Name', 'Socio'],
      ['Additional', 'Any Additional Question with value', 'X'],
      [],
      ['Questions?', 'If you have any questions or problems uploading your data, email us on info@consoftservices.com'],
      [],
      ['Registration Category', 'Value to need mention in import file']
    ];

    // Add data to worksheet
    data.forEach((row, index) => {
      worksheet.addRow(row);
      if (index === 0 || index === 2 || index === 4 || index === 6 || index === 8 || index === 10 || index === 12 || index === 14) {
        worksheet.getRow(index + 1).font = { bold: true };
      }
    });

    // Fetch registration categories from the database
    const [categories] = await pool.query(
      'SELECT cs_reg_category, cs_reg_cat_id FROM cs_os_category WHERE cs_status = 1 AND cs_reg_cat_id NOT IN (0, 1, 3)'
    );

    // Add the registration categories to the worksheet
    categories.forEach(category => {
      worksheet.addRow([category.cs_reg_category, category.cs_reg_cat_id]);
    });

    // Send the generated Excel file to the client
    const [fieldData] = await pool.query(`
          SELECT cs_field_name, cs_visible_reg_adminform 
          FROM cs_os_field_data 
          WHERE cs_field_name = 'cs_workshop_category' AND cs_visible_reg_adminform = 1
      `);

    // If the condition is met, fetch workshop data
    // if (fieldData.length > 0) {
    const [workshops] = await pool.query('SELECT cs_workshop_id, cs_workshop_name FROM cs_os_workshop');
    // Add workshop data to worksheet
    worksheet.addRow([]);
    worksheet.addRow(['Workshop Name', 'Workshop ID']);
    workshops.forEach(workshop => {
      worksheet.addRow([workshop.cs_workshop_name, workshop.cs_workshop_id]);
    });
    // }

    // const [fieldData1] = await pool.query(`
    //     SELECT cs_field_name, cs_visible_add_user 
    //     FROM cs_os_field_data 
    //     WHERE cs_field_name = 'cs_reg_type' AND cs_visible_add_user = 1
    // `);

    // if (fieldData.length > 0) {
    const [dayTypes] = await pool.query('SELECT cs_reg_daytype_id, cs_reg_daytype_name FROM cs_os_reg_daytype WHERE cs_status = 1');
    if (dayTypes.length > 0) {
      worksheet.addRow([]);
      worksheet.addRow(['Day Type Name', 'Day Type ID']);
      dayTypes.forEach(dayType => {
        worksheet.addRow([dayType.cs_reg_daytype_name, dayType.cs_reg_daytype_id]);
      });
    }
    // }

    const [prefixes] = await pool.query('SELECT cs_prefix, cs_prefix_id FROM cs_os_name_prefixes');
    if (prefixes.length > 0) {
      worksheet.addRow([]);
      worksheet.addRow(['Tittle', 'Tittle ID']);
      prefixes.forEach(prefix => {
        worksheet.addRow([prefix.cs_prefix, prefix.cs_prefix_id]);
      });
    }

    const [tickets] = await pool.query('SELECT ticket_id, ticket_title FROM cs_reg_tickets');
    console.log('Tickets:', tickets); // Debugging: log the fetched tickets
    if (tickets.length > 0) {
      worksheet.addRow([]); // Empty row for spacing
      worksheet.addRow(['Ticket', 'Ticket ID']);
      tickets.forEach(ticket => {
        console.log('Adding Ticket:', ticket.ticket_title); // Debugging: log each ticket being added
        worksheet.addRow([ticket.ticket_title, ticket.ticket_id]);
      });
    }

    const [addons] = await pool.query('SELECT addon_id, addon_title FROM cs_reg_add_ons');
    console.log('Add-ons:', addons); // Debugging: log the fetched add-ons
    if (addons.length > 0) {
      worksheet.addRow([]); // Empty row for spacing
      worksheet.addRow(['Add-on', 'Add-on ID']);
      addons.forEach(addon => {
        console.log('Adding Add-on:', addon.addon_title); // Debugging: log each add-on being added
        worksheet.addRow([addon.addon_title, addon.addon_id]);
      });
    }


    const [dynamicFields] = await pool.query(`
      SELECT cs_field_label, cs_is_required
      FROM cs_os_field_data 
      WHERE cs_visible_reg_adminform = 1 AND cs_field_id != 12 OR cs_field_id = 13
          ORDER BY 
              CASE 
                  WHEN cs_status = 1 THEN cs_field_order 
                  ELSE 999999 
              END
  `);

    // const headerRow = [
    //     'Registration Number',
    //     ...dynamicFields.map(field => `${field.cs_field_label}`)
    // ];




    // Add the header row to the worksheet
    worksheet.addRow([]);

    const [mandatoryfields] = await pool.query(`
      SELECT cs_field_label, cs_is_required FROM cs_os_field_data WHERE cs_visible_reg_adminform = 1 AND cs_is_required = 1 AND cs_field_id != 12 OR cs_field_id = 13;
`);

    worksheet.addRow(["Mandatory fields"]);
    worksheet.addRow(["Registration Number"]);
    mandatoryfields.forEach(field => {
      worksheet.addRow([field.cs_field_label]);
    });

    worksheet.addRow([]);
    worksheet.addRow([]);

    // worksheet.addRow(["Note- Before import file delete instructions Data"]).font = { color: { argb: 'FF0000' }, bold: true };
    // worksheet.addRow(headerRow).font = { bold: true };



    // Send the generated Excel file to the client
    // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    // res.setHeader('Content-Disposition', 'attachment; filename=sample.xlsx');

    const csvData = await workbook.csv.writeBuffer();

    // Send the generated CSV file to the client
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sample.csv');
    res.status(200).send(csvData);

    workbook.xlsx.write(res)
      .then(() => {
        res.end();
      })
      .catch(err => {
        console.error('Error generating sample Excel file:', err);
        res.status(500).send('Internal Server Error');
      });
  } catch (error) {
    console.error('Error fetching registration categories:', error);
    res.status(500).send('Internal Server Error');
  }

});

router.post('/addBulkConfirmUserwithputreg', verifyToken, queueMiddleware, async (req, res) => {
  try {
    const userDataArray = req.body.data; // Array of user data objects
    const email = req.body.sendEmail; // Check if email flag is true


    // Filter out the 'Id' field from each user data object
    const filteredUserDataArray = userDataArray.map(userData => {
      const { Id, ...filteredUserData } = userData; // Destructure 'Id' field and exclude it
      return filteredUserData;
    });

    // Retrieve field names from the database based on keys
    const keys = Object.keys(filteredUserDataArray[0]); // Assuming all objects have the same keys
    console.log('Keys:', keys);

    const queryResult = await pool.query('SELECT cs_field_label, cs_field_name FROM cs_os_field_data WHERE cs_field_label IN (?)', [keys]);

    // Extract field labels and names from query result
    const fieldMap = {};
    queryResult[0].forEach(row => {
      fieldMap[row.cs_field_label] = row.cs_field_name;
    });

    console.log('Field Map:', fieldMap);

    // Prepare an array to hold all user data with fields
    const allUserDataWithFields = [];

    const getTitleById = async (id) => {
      const [rows] = await pool.query('SELECT cs_prefix FROM cs_os_name_prefixes WHERE cs_prefix_id = ?', [id]);
      if (rows.length > 0) {
        return rows[0].cs_prefix;
      } else {
        return null; // Return null if no title is found
      }
    };

    // Loop through each record in userDataArray
    for (let i = 0; i < userDataArray.length; i++) {
      const userData = userDataArray[i];

      const userDataWithFields = {};
      // Copy original keys/values to userDataWithFields, excluding 'Id'
      Object.entries(userData).forEach(([key, value]) => {
        if (key !== 'Id') {
          // If the key exists in the fieldMap, update the key
          if (fieldMap[key]) {
            userDataWithFields[fieldMap[key]] = value;
          } else {
            // Otherwise, keep the original key
            userDataWithFields[key] = value;
          }
        }
      });

      if (userDataWithFields.cs_title) {
        const title = await getTitleById(userDataWithFields.cs_title);
        if (title) {
          userDataWithFields.cs_title = title;
        }
      }

      // Fetch facility data based on regId for each user
      const regId = userDataWithFields.cs_reg_cat_id;
      const workshop = parseInt(userDataWithFields.cs_workshop_category, 10);
      // const workshop = userData.cs_workshop_category;

      const [rows] = await pool.query(`
        SELECT fd.cs_facility_name, fc.cs_allow_count, fd.cs_facility_id
        FROM cs_os_facility_category fc
        JOIN cs_os_facility_detail fd ON fc.cs_facility_detail_id = fd.cs_facility_detail_id
        WHERE fc.cs_reg_cat_id = ? AND fd.cs_status = 1
      `, [regId]);

      // Initialize badgeData object for each user
      const badgeData = {};
      console.log("userDataWithFields.cs_reg_type", userDataWithFields.cs_reg_type);


      if (userDataWithFields.cs_reg_type && userDataWithFields.cs_reg_type !== "101") {
        console.log("Processing daywise data");

        for (const row of rows) {
          const facilityName = row.cs_facility_name;
          const allowCount = row.cs_allow_count;
          const facilityId = row.cs_facility_id;

          const [typeRows] = await pool.query(`
            SELECT cs_type 
            FROM cs_os_facilitytype 
            WHERE cs_facility_id = ?
          `, [facilityId]);

          const facilityType = typeRows[0]?.cs_type;

          if (facilityType === 'workshop') {
            const [workshopRows] = await pool.query(`
              SELECT cs_workshop_id 
              FROM cs_os_workshop 
              WHERE cs_facility_id = ? 
            `, [facilityId]);

            const workshopId = workshopRows[0]?.cs_workshop_id;
            if (workshopId === workshop) {
              badgeData[facilityName] = allowCount;
              badgeData[facilityName + '_status'] = "0";
            } else {
              badgeData[facilityName] = "0";
              badgeData[facilityName + '_status'] = "0";
            }
          } else {
            if (facilityName.includes(userDataWithFields.cs_reg_type) || !/\d$/.test(facilityName)) {
              // Facility matches, set the count fetched from the table
              badgeData[facilityName] = allowCount;
              // Set the status to "0" for each facility
              badgeData[facilityName + '_status'] = "0";
            } else {
              // Facility doesn't match, set count to 0
              badgeData[facilityName] = "0";
              // Set the status to "0" for each facility
              badgeData[facilityName + '_status'] = "0";
            }
          }
        }
      } else {
        console.log("Processing all-day data");

        for (const row of rows) {
          const facilityName = row.cs_facility_name;
          const allowCount = row.cs_allow_count;
          const facilityId = row.cs_facility_id;

          const [typeRows] = await pool.query(`
            SELECT cs_type 
            FROM cs_os_facilitytype 
            WHERE cs_facility_id = ?
          `, [facilityId]);

          const facilityType = typeRows[0]?.cs_type;

          if (facilityType === 'workshop') {
            const [workshopRows] = await pool.query(`
              SELECT cs_workshop_id 
              FROM cs_os_workshop 
              WHERE cs_facility_id = ? 
            `, [facilityId]);

            const workshopId = workshopRows[0]?.cs_workshop_id;
            if (workshopId === workshop) {
              badgeData[facilityName] = allowCount;
              badgeData[facilityName + '_status'] = "0";
            } else {
              badgeData[facilityName] = "0";
              badgeData[facilityName + '_status'] = "0";
            }
          } else {
            badgeData[facilityName] = allowCount;
            badgeData[facilityName + '_status'] = "0";
          }
        }
      }

      let lastRegNo = 0; // Initialize regNo
      let regNo = 0;
      // Check if cs_regno already has a value
      if (!userDataWithFields.cs_regno) {
        // Get the last inserted cs_regno from cs_os_users table
        // const [lastRegCatIdRow] = await pool.query('SELECT MAX(cs_regno) AS max_regno FROM cs_os_users');
        // const lastRegCatId = lastRegCatIdRow[0].max_regno || 0; // If no records exist, default to 0
        // regNo = lastRegCatId + 1;

        const siteSettingResult = await pool.query('SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter ="Admin Reg Start Number"');
        // console.log("siteSettingResult", siteSettingResult[0][0].cs_value);
        lastRegNo = siteSettingResult.length > 0 ? parseInt(siteSettingResult[0][0].cs_value, 10) : 0;
        console.log("lastRegNo", lastRegNo);
        // Step 2: Check if the incremented regNo already exists, if yes, find a unique one
        let regNoExists = true;
        while (regNoExists) {
          const existingRegNoResult = await pool.query('SELECT COUNT(*) AS count FROM cs_os_users WHERE cs_regno = ?', [lastRegNo]);
          console.log("existingRegNoResult", existingRegNoResult);
          const existingRegNoCount = existingRegNoResult[0][0].count || 0;
          if (existingRegNoCount > 0) {
            lastRegNo++;
          } else {
            regNoExists = false;
          }
        }

        let regNo = lastRegNo + 1;

        // Step 3: Update the cs_tbl_sitesetting table with the new regNo
        await pool.query('UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter ="Admin Reg Start Number"', [regNo]);
        userDataWithFields.cs_regno = lastRegNo;

        // Step 4: Now regNo is a unique value, use it in your userData
        userData.cs_regno = lastRegNo;
      } else {
        // Use the existing value of cs_regno
        lastRegNo = userDataWithFields.cs_regno;
        userDataWithFields.cs_regno = lastRegNo;
      }




      // Now regNo is either a newly generated unique value or the existing value, use it in your userData

      console.log('Registration number for user:', userDataWithFields.cs_reg_cat_id);
      console.log('Badge data for user:', badgeData);

      // Fetch cs_reg_category from cs_os_category based on cs_reg_cat_id
      const catId = userDataWithFields.cs_reg_cat_id;
      console.log('catId:', catId); // Add this line to log the catId
      const [categoryRows] = await pool.query('SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?', [catId]);
      console.log('categoryRows:', categoryRows); // Add this line to log the query results
      const csRegCategory = categoryRows[0]?.cs_reg_category;
      console.log('Category:', csRegCategory);

      // Assign the fetched cs_reg_category to userDataWithFields
      userDataWithFields.cs_reg_category = csRegCategory;

      // Map fields containing IDs to their corresponding values from different tables
      // await Promise.all([
      //   mapFieldById(userDataWithFields, 'cs_reg_category', 'cs_os_category', 'cs_reg_cat_id', 'cs_reg_category'),
      //   mapRegCategory(userDataWithFields) // Handle cs_reg_category and cs_reg_cat_id together
      // ]);

      // Insert the user data into the database
      const insertUserQuery = `
        INSERT INTO cs_os_users SET ?, cs_isconfirm = ?, cs_module = ?
      `;

      // await pool.query(insertUserQuery, [userDataWithFields, 1, currentTimestamp, currentTimestamp]);
      const [insertResult] = await pool.query(insertUserQuery, [userDataWithFields, 1, 1]);

      const newUserId = insertResult.insertId;

      const firstName = userDataWithFields.cs_first_name ? userDataWithFields.cs_first_name : 'Dammy';
      const lastName = userDataWithFields.cs_last_name ? userDataWithFields.cs_last_name : 'Dammy';

      // Function to remove special characters
      const sanitizeString = (str) => str.replace(/[^a-zA-Z0-9]/g, '');

      const sanitizedFirstName = sanitizeString(firstName.toLowerCase());
      const sanitizedLastNameInitial = sanitizeString(lastName[0].toLowerCase());
      const sanitizedLastName = sanitizeString(lastName.toLowerCase());
      const sanitizedFirstNameInitial = sanitizeString(firstName[0].toUpperCase());

      const username = `${sanitizedFirstName}${sanitizedLastNameInitial}${newUserId}`;
      // const password = `${sanitizedFirstNameInitial}${sanitizedLastName}@${newUserId}`;
      const password = `${sanitizedFirstNameInitial}${sanitizedLastName.substring(0, 5)}@${newUserId}`;




      const updateUserQuery = `
        UPDATE cs_os_users
        SET cs_username = ?, cs_password = ?
        WHERE id = ?
      `;


      await pool.query(updateUserQuery, [username, password, newUserId]);

      // Send email if email flag is true
      if (email) {
        try {
          const [userRow] = await pool.query('SELECT * FROM cs_os_users WHERE id = ?', [newUserId]);
          if (userRow.length > 0) {
            await sendConfirmEmail(userRow[0]);

            // Update cs_confirmmail to 1 after successfully sending the email
            await pool.query(
              'UPDATE cs_os_users SET cs_confirmmail = ? WHERE id = ?',
              [1, newUserId]
            );
            console.log("cs_confirmmail updated successfully for UserId:", newUserId); // Log success
          }
        } catch (emailError) {
          console.error('Error sending email:', emailError);

          // Set cs_confirmmail to 0 if there is an error
          await pool.query(
            'UPDATE cs_os_users SET cs_confirmmail = ? WHERE id = ?',
            [0, newUserId]
          );

          return res.status(500).json({ error: 'Error sending email' });
        }
      }

      console.log('Inserted User ID:', newUserId);
    }

    // Return success message after completing the process
    res.status(200).json({ message: 'Users added successfully, and emails sent if applicable' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while adding users' });
  }
});


//Import Faculty

router.get('/facultyimportsamplefile', async (req, res) => {
  try {
    // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sample');

    // Add the instructions and sample data to the worksheet
    const data = [
      ['Title', 'First Name', 'Last Name', 'Email', 'Phone', 'Faculty Type']
    ];

    // Add data to worksheet
    data.forEach((row) => {
      worksheet.addRow(row);
    });

    // Convert workbook to CSV and send to client
    const csvData = await workbook.csv.writeBuffer();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sample.csv');
    res.status(200).send(csvData);
  } catch (error) {
    console.error('Error generating sample CSV file:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/facultyimportinstructionfile', async (req, res) => {
  try {
    // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sample');

    // // Fetch registration categories from the database excluding cs_reg_cat_id 1 and 2
    // const [categories] = await pool.query(`
    //     SELECT cs_reg_category, cs_reg_cat_id 
    //     FROM cs_os_category 
    //     WHERE cs_status = 1  AND cs_reg_cat_id = 3
    //   `);

    const [faculty] = await pool.query(`
      SELECT facultytype_id, type_title
      FROM cs_app_facultytype 
      WHERE status = 1
    `);


    const [prefixes] = await pool.query(`
        SELECT cs_prefix, cs_prefix_id 
        FROM cs_os_name_prefixes 
        WHERE cs_status = 1
      `);

    // Prepare the dynamic category data
    // const categoryHeader = ['Registration Category', 'Value to need mention in import file'];
    // const dynamicCategories = categories.map(category => [category.cs_reg_category, category.cs_reg_cat_id]);

    // Prepare the dynamic prefix data
    const prefixHeader = ['Title Prefix', 'Prefix ID'];
    const dynamicPrefixes = prefixes.map(prefix => [prefix.cs_prefix, prefix.cs_prefix_id]);

    // Prepare the dynamic prefix data
    const facultyHeader = ['Faculty Type', 'Faculty type ID'];
    const facultyPrefixes = faculty.map(faculty => [faculty.type_title, faculty.facultytype_id]);

    // Add the instructions and sample data to the worksheet
    const data = [
      ['Import Faculty Template'],
      [],
      ['How to import your data'],
      ['Step 1:', 'Collect all your attendee information and when you are ready, add your data to the Import sample sheet.'],
      ['Step 2:', 'Add your content; the columns mentioned in the mandatory section are required.'],
      ['Step 3:', 'When you are done adding your content, upload this file through the "Import" menu on Consoft Event App admin.'],
      ['Step 4:', 'Your content will be automatically imported. If there are any errors you will be notified.'],
      [],
      ['NOTE:', "Don't delete any columns from the sample sheet. If you aren't using a column, just leave it empty."],
      [],
      ['TIP:', 'Users in the template can be in any order'],
      // ['TIP:', 'Using Registration Category for your users? Make sure the Category already exists before using their id here.'],
      [],
      ['Column Name', 'Column Descriptions', 'Column Examples'],
      ['Title', 'The title for the user', '1'],
      ['First Name*', 'The first name of the user', 'John'],
      ['Last Name*', 'The last name of the user', 'Smith'],
      ['Phone Number', 'Phone Number of the Attendee'],
      // ['Registration Category ID', 'The Attendee Registration Category of the users', '1'],
      ['Email', 'The email address the attendee used to register for the event.', 'dummy@gmail.com'],
      ['Username', 'Username will be auto generated'],
      ['Password', 'Password will be auto generated'],
      [],
      ['Questions?', 'If you have any questions or problems uploading your data, email us on info@consoftservices.com'],
      [],
      facultyHeader,
      ...facultyPrefixes,
      [],
      prefixHeader,
      ...dynamicPrefixes,
      [],
      ['Mandatory fields'],
      ['First Name'],
      ['Last Name'],
      ['Faculty Type'],

      [],
      // ['Note- Before import file delete instructions Data with note line'],
      // ['Title', 'First Name', 'Last Name', 'Email', 'Phone', 'Registration Category ID']
    ];

    // Add data to worksheet
    data.forEach((row) => {
      worksheet.addRow(row);
    });

    // Convert workbook to CSV and send to client
    const csvData = await workbook.csv.writeBuffer();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sample.csv');
    res.status(200).send(csvData);
  } catch (error) {
    console.error('Error generating sample CSV file:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/importfaculty', verifyToken, async (req, res) => {
  try {
    const bulkUsers = req.body.data; // Assuming req.body contains the array of users to be added
    const email = req.body.sendEmail; // Check if email flag is true


    // Function to get category name by ID
    const getCategoryNameById = async (id) => {
      const [rows] = await pool.query('SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?', [id]);
      if (rows.length > 0) {
        return rows[0].cs_reg_category;
      } else {
        throw new Error(`Category with ID ${id} not found`);
      }
    };

    // Function to get title name by ID
    const getTitleNameById = async (id) => {
      const [rows] = await pool.query('SELECT cs_prefix FROM cs_os_name_prefixes WHERE cs_prefix_id = ?', [id]);
      if (rows.length > 0) {
        return rows[0].cs_prefix;
      } else {
        throw new Error(`Title with ID ${id} not found`);
      }
    };

    // Function to trim all string fields in a user object
    const trimUserFields = (user) => {
      const trimmedUser = {};
      Object.keys(user).forEach(key => {
        // Check if the value is a string before trimming
        trimmedUser[key] = typeof user[key] === 'string' ? user[key].trim() : user[key];
      });
      return trimmedUser;
    };

    // Fetch the last registration number from settings
    const siteSettingResult = await pool.query('SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Admin Reg Start Number"');
    let lastRegNo = siteSettingResult.length > 0 ? parseInt(siteSettingResult[0][0].cs_value, 10) : 0;
    console.log("lastRegNo", lastRegNo);

    // Insert each user and then update the password
    for (const user of bulkUsers) {
      // Create a trimmed version of the user
      const trimmedUser = trimUserFields(user);

      const categoryName = 'Faculty';
      const categoryId = 3;

      // Get the title name by ID if the title is an ID
      let title = trimmedUser['Title'];
      if (title && !isNaN(title)) { // Ensure title is not empty and is a number
        title = await getTitleNameById(title);
      } else {
        title = null; // Set to null if invalid
      }

      // Get the faculty type
      let facultyType = trimmedUser['Faculty Type'];

      // Generate unique registration number if not provided
      let regNo = trimmedUser['Registration Number'];
      if (!regNo) {
        let regNoExists = true;
        while (regNoExists) {
          const existingRegNoResult = await pool.query('SELECT COUNT(*) AS count FROM cs_os_users WHERE cs_regno = ?', [lastRegNo]);
          const existingRegNoCount = existingRegNoResult[0][0].count || 0;
          if (existingRegNoCount > 0) {
            lastRegNo++;
          } else {
            regNoExists = false;
          }
        }
        regNo = lastRegNo;
        lastRegNo++;
      }

      // Insert the user without the password and username
      const insertUserQuery = `
      INSERT INTO cs_os_users (cs_regno, cs_title, cs_first_name, cs_last_name, cs_phone, cs_email, cs_reg_category, cs_reg_cat_id, cs_isconfirm, cs_isfaculty, cs_module)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;


      const [result] = await pool.query(insertUserQuery, [
        regNo,
        title, // Use the title name here
        trimmedUser['First Name'],
        trimmedUser['Last Name'],
        trimmedUser['Phone'],
        trimmedUser['Email'],
        categoryName,
        categoryId,
        1, // Example default value for cs_status
        1, // Example default value for cs_isconfir
        1,
      ]);

      const newUserId = result.insertId;

      // Function to remove special characters
      const sanitizeString = (str) => str.replace(/[^a-zA-Z0-9]/g, '');

      // Sanitize and format the first and last names
      const sanitizedFirstName = sanitizeString(trimmedUser['First Name'].toLowerCase());
      const sanitizedLastNameInitial = sanitizeString(trimmedUser['Last Name'][0].toLowerCase());
      const sanitizedLastName = sanitizeString(trimmedUser['Last Name'].toLowerCase());
      const sanitizedFirstNameInitial = sanitizeString(trimmedUser['First Name'][0].toUpperCase());

      // Generate username and password
      const username = `${sanitizedFirstName}${sanitizedLastNameInitial}${newUserId}`;
      // const password = `${sanitizedFirstNameInitial}${sanitizedLastName}@${newUserId}`;
      const password = `${sanitizedFirstNameInitial}${sanitizedLastName.substring(0, 5)}@${newUserId}`;

      console.log("Username:", username);
      console.log("Password:", password);

      // Generate username with the pattern FirstName + First letter of LastName + newUserId
      // const username = `${trimmedUser['First Name'].toLowerCase()}${trimmedUser['Last Name'][0].toLowerCase()}${newUserId}`;
      // const password = `${trimmedUser['First Name'][0].toUpperCase()}${trimmedUser['Last Name'].toLowerCase()}@${newUserId}`;

      // Update the user's username and password
      const updateUserQuery = `
        UPDATE cs_os_users
        SET cs_username = ?, cs_password = ?
        WHERE id = ?
      `;

      await pool.query(updateUserQuery, [username, password, newUserId]);

      // Send email if email flag is true
      if (email) {
        try {
          const [userRow] = await pool.query('SELECT * FROM cs_os_users WHERE id = ?', [newUserId]);
          if (userRow.length > 0) {
            await sendConfirmEmail(userRow[0]);

            // Update cs_confirmmail to 1 after successfully sending the email
            await pool.query(
              'UPDATE cs_os_users SET cs_confirmmail = ? WHERE id = ?',
              [1, newUserId]
            );
            console.log("cs_confirmmail updated successfully for UserId:", newUserId); // Log success
          }
        } catch (emailError) {
          console.error('Error sending email:', emailError);

          // Set cs_confirmmail to 0 if there is an error
          await pool.query(
            'UPDATE cs_os_users SET cs_confirmmail = ? WHERE id = ?',
            [0, newUserId]
          );

          return res.status(500).json({ error: 'Error sending email' });
        }
      }

      console.log('Inserted User ID:', newUserId);

      // Insert the faculty information
      const [[{ maxOrder }]] = await pool.query('SELECT MAX(faculty_order) as maxOrder FROM cs_app_faculties');
      const newOrder = (maxOrder || 0) + 1;

      const insertFacultyQuery = `
        INSERT INTO cs_app_faculties (user_id, facultytype_id, faculty_order, ntitle, fname, lname, contact1, email1, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await pool.query(insertFacultyQuery, [
        newUserId,
        facultyType,
        newOrder, // Use the incremented order here
        title, // Use the title name here for faculty
        trimmedUser['First Name'],
        trimmedUser['Last Name'],
        trimmedUser['Phone'],
        trimmedUser['Email'],
        1 // Example default value for status
      ]);

      // Update the cs_tbl_sitesetting table with the new regNo
      await pool.query('UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter = "Admin Reg Start Number"', [lastRegNo]);
    }

    res.status(200).json({ success: true, message: 'Bulk users added successfully' });
  } catch (error) {
    console.error('Error adding bulk users:', error);
    res.status(500).json({ success: false, error: 'Failed to add bulk users' });
  }
});


router.put('/UpdateStatus', verifyToken, async (req, res) => {
  try {
    const { regno, status } = req.body;


    // Update cs_status in cs_os_users
    const updateQuery = `UPDATE cs_os_users SET cs_status = ? WHERE id = ?`;
    await pool.query(updateQuery, [status, regno]);

    // Update cs_status in cs_os_badges
    // const updateQuery1 = `UPDATE cs_os_badges SET cs_status = ? WHERE cs_regno = ?`;
    // await pool.query(updateQuery1, [status, regno]);


    return res.status(200).json({ message: 'Status Updates successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/CancelStatus', verifyToken, async (req, res) => {
  try {
    const { Id, status, sendEmail, temp_id } = req.body;
    console.log("Data", req.body);

    // Update cs_status in cs_os_users
    const updateQuery = `UPDATE cs_os_users SET cs_status = ? WHERE id = ?`;
    await pool.query(updateQuery, [status, Id]);

    // Update cs_reg_payment based on the status
    const updatePaymentQuery = `UPDATE cs_reg_payment SET status = ?, is_cancel = ? WHERE user_id = ?`;
    if (status === 2) {
      await pool.query(updatePaymentQuery, [0, 1, Id]);
    } else {
      await pool.query(updatePaymentQuery, [1, 0, Id]);
    }

    // Sending changed package mail
    if (sendEmail) {
      try {
        const [userRow] = await pool.query('SELECT * FROM cs_os_users WHERE id = ?', [Id]);
        if (userRow.length > 0) {
          await sendCancellationEmail(userRow[0], temp_id);

          console.log("Changed package mail send successfully for UserId:", Id); // Log success
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);

        return res.status(500).json({ error: 'Error sending email' });
      }
    }


    return res.status(200).json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Reuse Basic sendEmail function
const sendCancellationEmail = async (userData, tempId) => {
  const templateQuery = `SELECT template_content, template_subject FROM cs_tbl_email_template WHERE template_id = ?`;
  const [templateData] = await pool.query(templateQuery, tempId);

  if (!templateData || templateData.length === 0) {
    console.log("No email template found");
    throw new Error('No email template found');
  }

  const userEmail = userData.cs_email;
  if (!userEmail) {
    console.log("User email is not defined");
    throw new Error('User email is not defined');
  }

  let emailBody = templateData[0].template_content;
  const emailSubject = templateData[0].template_subject;

  const replacePlaceholders = (template, data) => {
    return template.replace(/{{(\w+)}}/g, (_, key) => data[key] || '');
  };

  emailBody = replacePlaceholders(emailBody, userData);

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: userEmail,
    subject: emailSubject,
    html: emailBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${userEmail}`);
  } catch (error) {
    console.error(`Error sending email to ${userEmail}:`, error.message);
  }
};



router.put('/BulkUpdateStatus', verifyToken, async (req, res) => {
  try {
    const { Id, status } = req.body;

    console.log("Body", req.body);

    // Ensure Id is an array
    if (!Array.isArray(Id) || Id.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty Id list' });
    }

    // Construct the query with placeholders for the IDs
    const placeholders = Id.map(() => '?').join(',');
    let updateQuery;
    const queryParams = [];

    // Define the update logic based on the status value
    switch (status) {
      case 0:
        updateQuery = `UPDATE cs_os_users SET cs_status = ? WHERE id IN (${placeholders})`;
        queryParams.push(0, ...Id);
        break;
      case 1:
        updateQuery = `UPDATE cs_os_users SET cs_status = ? WHERE id IN (${placeholders})`;
        queryParams.push(1, ...Id);
        break;
      case 2:
        updateQuery = `UPDATE cs_os_users SET cs_status = ?, cs_isduplicate = ? WHERE id IN (${placeholders})`;
        queryParams.push(1, 0, ...Id);
        break;
      case 3:
        updateQuery = `UPDATE cs_os_users SET cs_status = ?, cs_isduplicate = ? WHERE id IN (${placeholders})`;
        queryParams.push(0, 1, ...Id);
        break;
      default:
        // Set cs_status to other values without changing cs_isduplicate
        updateQuery = `UPDATE cs_os_users SET cs_status = ? WHERE id IN (${placeholders})`;
        queryParams.push(status, ...Id);
    }

    // Execute the update query
    await pool.query(updateQuery, queryParams);

    return res.status(200).json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.put('/UpdateDuplicate', verifyToken, async (req, res) => {
  try {
    const { Id, duplicate } = req.body;

    console.log("ID", req.body);


    // Update cs_status in cs_os_users
    const updateQuery = `UPDATE cs_os_users SET cs_isduplicate = ? WHERE id = ?`;
    await pool.query(updateQuery, [duplicate, Id]);

    // Update cs_status in cs_os_badges
    // const updateQuery1 = `UPDATE cs_os_badges SET cs_status = ? WHERE cs_regno = ?`;
    // await pool.query(updateQuery1, [status, regno]);


    return res.status(200).json({ message: 'Status Updates successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.put('/DiscardEntry', verifyToken, async (req, res) => {
  try {
    const { Temp_Id, Discard } = req.body;

    console.log("Temp_Id", req.body);


    // Update cs_status in cs_os_users
    const updateQuery = `UPDATE cs_reg_temp_payment SET is_discarded = ? WHERE temppayment_id  = ?`;
    await pool.query(updateQuery, [Discard, Temp_Id]);

    // Update cs_status in cs_os_badges
    // const updateQuery1 = `UPDATE cs_os_badges SET cs_status = ? WHERE cs_regno = ?`;
    // await pool.query(updateQuery1, [status, regno]);


    return res.status(200).json({ message: 'Discarded entry successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/check-username/:username', verifyToken, async (req, res) => {
  const { username } = req.params;
  try {
      const query = 'SELECT COUNT(*) AS count FROM cs_os_users WHERE cs_username = ?';
      const [rows] = await pool.execute(query, [username]);

      if (rows[0].count > 0) {
          return res.status(200).json({ exists: true });
      } else {
          return res.status(200).json({ exists: false });
      }
  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Database error' });
  }
});












module.exports = router;