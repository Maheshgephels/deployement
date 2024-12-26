const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const moment = require('moment-timezone');
const verifyToken = require('../api/middleware/authMiddleware');
const queueMiddleware = require('../api/middleware/queueMiddleware');



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


router.get('/getUser', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = '', catID, sortColumn = 'id', sortOrder = 'DESC', selectedColumns, column, workId } = req.query;
    const offset = (page - 1) * pageSize;

    console.log(req.query);

    // Convert selectedColumns back into an array
    const columnsArray = selectedColumns ? selectedColumns.split(',') : [];


    const allDataQuery = `
      SELECT cs_field_name, cs_field_label
      FROM cs_os_field_data
      WHERE cs_status IN (1, 2) AND cs_visible_add_user = 1
      OR cs_field_id = 1
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

    const validColumns = ['id', 'cs_regno', 'cs_first_name', 'cs_last_name', 'cs_reg_category', 'cs_title', 'cs_workshop_category', 'cs_country', 'cs_state', 'cs_city', 'cs_email', 'cs_address', 'cs_phone', 'cs_company_name', 'cs_reg_type', 'cs_status']; // Add all valid column names here
    const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'id';

    let query = `
      SELECT ${columnsToFetch}, id, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at, cs_status
      FROM cs_os_users
      WHERE cs_isconfirm = 1 
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

    if (column) {
      query += ` AND ${column} = ${workId}`;
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


    const fieldType13Query = `
SELECT cs_field_name
FROM cs_os_field_data
WHERE cs_field_type = 13
`;

    const [fieldsType13] = await pool.query(fieldType13Query);

    // Map the field names into an array for later processing
    const dynamicWorkshopFields = fieldsType13.map(row => row.cs_field_name);

    // Iterate over each user and dynamically fetch the workshop names for all matching fields
    for (let user of userData) {
      try {
        for (let field of dynamicWorkshopFields) {
          const workshopQuery = `
      SELECT cs_workshop_name
      FROM cs_os_workshop
      WHERE cs_workshop_id = ?
    `;

          const [workshopData] = await pool.query(workshopQuery, [user[field]]);
          if (workshopData.length > 0 && workshopData[0].cs_workshop_name) {
            user[field] = workshopData[0].cs_workshop_name; // Replace the ID with the workshop name
          }
        }
      } catch (error) {
        console.error(`Error fetching workshop data for user ID ${user.id}:`, error);
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

    if (column) {
      totalCountQuery += ` AND ${column} = ${workId}`;
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






router.get('/getFeedbackData', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = '', catID, sortColumn = 'id', sortOrder = 'DESC', selectedColumns, column, workId } = req.query;
    const offset = (page - 1) * pageSize;

    console.log(req.query);

    // Convert selectedColumns back into an array
    const columnsArray = selectedColumns ? selectedColumns.split(',') : [];


    const allDataQuery = `
      SELECT cs_field_name, cs_field_label
      FROM cs_os_cert_field_data
      WHERE cs_status IN (1, 2) AND cs_visible_feedback = 1
      OR cs_field_id = 1
      ORDER BY cs_field_order
    `;

    const [alldata] = await pool.query(allDataQuery);

    const allColumns = alldata.map(row => ({
      cs_field_name: row.cs_field_name,
      cs_field_label: row.cs_field_label
    }));

    const fieldDataQuery = `
      SELECT cs_field_name
      FROM cs_os_cert_field_data
      WHERE cs_status IN (1, 2) AND cs_visible_feedback = 1 OR cs_field_id = 1
      ORDER BY cs_field_order
    `;

    const [fieldData] = await pool.query(fieldDataQuery);
    const columnsToFetch = fieldData.map(row => row.cs_field_name).join(', ');

    console.log('fieldData', columnsToFetch);

    const validColumns = ['id', 'cs_regno', 'cs_first_name', 'cs_last_name', 'cs_reg_category', 'cs_title', 'cs_workshop_category', 'cs_country', 'cs_state', 'cs_city', 'cs_email', 'cs_address', 'cs_phone', 'cs_company_name', 'cs_reg_type', 'cs_status']; // Add all valid column names here
    const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'id';

    let query = `
      SELECT ${columnsToFetch}, id, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
      FROM cs_os_feedback_form_data
      WHERE 1 
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


    if (column) {
      query += ` AND ${column} = ${workId}`;
    }

    query += `
      ORDER BY ${columnToSortBy} ${sortOrder}
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const [userData] = await pool.query(query);

   
    let totalCountQuery = `
      SELECT COUNT(*) AS total
      FROM cs_os_feedback_form_data
      WHERE 1 
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


    if (column) {
      totalCountQuery += ` AND ${column} = ${workId}`;
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











router.get('/getField', verifyToken, async (req, res) => {
  try {
    const columnsToFetch = 'cs_os_field_data.*, cs_os_field_type.field_type_name';

    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
            SELECT ${columnsToFetch}
            FROM cs_os_field_data
            LEFT JOIN cs_os_field_type ON cs_os_field_data.cs_field_type = cs_os_field_type.cs_field_type
            WHERE cs_os_field_data.cs_status IN (1, 2) AND cs_visible_add_user = 1
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


router.get('/getDropdownData', verifyToken, async (req, res) => {
  try {
    // Specify the columns you want to fetch from each table
    const facilitytype = ['cs_type'];
    const prefix = ['cs_prefix', 'cs_prefix_id'];
    const country = ['cs_country', 'cs_country_id'];
    const states = ['cs_state_name', 'cs_state_id', 'cs_country_id'];
    const reg_cat = ['cs_reg_category', 'cs_reg_cat_id'];
    const work_cat = ['cs_workshop_name', 'cs_workshop_id', 'cs_workshoptype_id'];
    const day_type = ['cs_reg_daytype_name', 'cs_reg_daytype_id'];
    const workshop_type = ['workshoptype_name', 'id'];

    const custom_data = ['cs_field_option', 'cs_field_option_value, cs_field_option_id, cs_field_id'];


    // Execute each query to fetch data from respective tables
    const [facilitytypeData] = await pool.query(`SELECT ${facilitytype.join(',')} FROM cs_os_facilitytype`);
    const [prefixData] = await pool.query(`SELECT ${prefix.join(',')} FROM cs_os_name_prefixes`);
    const [countryData] = await pool.query(`SELECT ${country.join(',')} FROM cs_tbl_country`);
    const [statesData] = await pool.query(`SELECT ${states.join(',')} FROM cs_tbl_states`);
    const [regCatData] = await pool.query(`SELECT ${reg_cat.join(',')} FROM cs_os_category WHERE cs_status = 1`);
    const [workshopData] = await pool.query(`SELECT ${work_cat.join(',')} FROM cs_os_workshop WHERE cs_status = 1`);
    const [workshoptypeData] = await pool.query(`SELECT ${workshop_type.join(',')} FROM cs_os_workshop_type WHERE cs_status = 1`);
    const [dayTypeData] = await pool.query(`SELECT ${day_type.join(',')} FROM cs_os_reg_daytype WHERE cs_status = 1 ORDER BY cs_reg_daytype_id ASC`);
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
      custom: customData,
      workshoptype: workshoptypeData
    };

    // Send the response containing data from all queries
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// router.post('/addUser',verifyToken, async (req, res) => {
//   try {
//     // Extract all properties from the request body
//     const { ...userData } = req.body;

//     console.log(req.body);

//     const days = userData.cs_reg_type;
//     const regId = userData.cs_reg_category;
//     const workshop  = userData.cs_workshop_category;
//     // Fetch facility data based on regId
//     const [rows, fields] = await pool.query(`
//           SELECT fd.cs_facility_name, fc.cs_allow_count
//           FROM cs_os_facility_category fc
//           JOIN cs_os_facility_detail fd ON fc.cs_facility_detail_id = fd.cs_facility_detail_id
//           WHERE fc.cs_reg_cat_id = ? AND fd.cs_status = 1
//       `, [regId]);



//     // Initialize badgeData object
//     const badgeData = {};

//     // Check if cs_reg_type is available and not equal to "101"
//     if (userData.cs_reg_type && userData.cs_reg_type !== "101") {
//       const reg_daytype = days;

//       // Check if the query was successful
//       if (rows) {
//         // Loop through the results and construct the badge data
//         rows.forEach(row => {
//           const facilityName = row.cs_facility_name;
//           const allowCount = row.cs_allow_count;

//           // Check if the facility name matches the cs_reg_type and has no numbers at the end
//           if (facilityName.includes(reg_daytype) || !/\d$/.test(facilityName)) {
//             // Facility matches, set the count fetched from the table
//             badgeData[facilityName] = allowCount;
//             // Set the status to "0" for each facility
//             badgeData[facilityName + '_status'] = "0";
//           } else {
//             // Facility doesn't match, set count to 0
//             badgeData[facilityName] = "0";
//             // Set the status to "0" for each facility
//             badgeData[facilityName + '_status'] = "0";
//           }
//         });
//       } else {
//         // Query failed
//         console.error("Error executing query:", error);
//       }
//     } else {
//       // cs_reg_type not available, set count to 0 for all facilities
//       if (rows) {
//         rows.forEach(row => {
//           const facilityName = row.cs_facility_name;
//           const allowCount = row.cs_allow_count;

//           badgeData[facilityName] = allowCount;
//           // Set the status to "0" for each facility
//           badgeData[facilityName + '_status'] = "0";
//         });
//       } else {
//         // Query failed
//         console.error("Error executing query:", error);
//       }
//     }




// console.log(badgeData);



// Get the last inserted cs_regno from cs_os_users table
//     const lastRegNoResult = await pool.query('SELECT cs_regno FROM cs_os_users ORDER BY cs_regno DESC LIMIT 1');
//     let lastRegNo = lastRegNoResult.length > 0 ? lastRegNoResult[0][0].cs_regno : 0;
//     let regNo = lastRegNo + 1;

//     // Check if the incremented regNo already exists, if yes, find a unique one
//     let regNoExists = true;
//     while (regNoExists) {
//       const existingRegNoResult = await pool.query('SELECT COUNT(*) AS count FROM cs_os_users WHERE cs_regno = ?', [regNo]);
//       const existingRegNoCount = existingRegNoResult[0].count || 0;
//       if (existingRegNoCount > 0) {
//         regNo++;
//       } else {
//         regNoExists = false;
//       }
//     }

//     // Now regNo is a unique value, use it in your userData
//     userData.cs_regno = regNo;

//     // Map fields containing IDs to their corresponding values from different tables
//     await Promise.all([
//       // mapFieldById(userData, 'cs_title', 'cs_os_name_prefixes', 'cs_prefix_id', 'cs_title'),
//       // mapFieldById(userData, 'cs_state', 'cs_tbl_states', 'cs_state_id', 'cs_state'),
//       // mapFieldById(userData, 'cs_country', 'cs_tbl_country', 'cs_country_id', 'cs_country'),
//       mapFieldById(userData, 'cs_reg_category', 'cs_os_category', 'cs_reg_cat_id', 'cs_reg_category'),
//       mapRegCategory(userData) // Handle cs_reg_category and cs_reg_cat_id together

//       // mapFieldById(userData, 'cs_tshirt', 'cs_os_field_option', 'cs_reg_cat_id', 'cs_reg_category')
//       // Add more mappings as needed for other fields
//     ]);

//     // Perform insertion into cs_os_users table with current timestamp for created_at and updated_at
//     const insertUserQuery = `
//   INSERT INTO cs_os_users SET ?, created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
// `;
//     await pool.query(insertUserQuery, userData);

//     const insertBadgeQuery = `
//     INSERT INTO cs_os_badges (cs_regno, cs_reg_cat_id, cs_badge_data, created_at, updated_at)
//     VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
//   `;
//     await pool.query(insertBadgeQuery, [regNo, regId, JSON.stringify(badgeData)]);

//     // Send response or perform further operations
//     res.status(200).json({ success: true, message: "User added successfully", data: userData });
//   } catch (error) {
//     console.error('Error adding user:', error);
//     res.status(500).json({ success: false, message: "Error adding user", error: error.message });
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

    const fieldQuery = `SELECT cs_field_name FROM cs_os_field_data WHERE cs_field_type = ?`;
    const [fieldResults] = await pool.query(fieldQuery, ['13']);
    console.log("fieldResults", fieldResults);

    // Extract field names from the query result
    const additionalFields = fieldResults.map(row => row.cs_field_name);
    console.log("additionalFields", additionalFields);

    const additionalFieldValues = {};

    // Loop through each field in additionalFields to retrieve its userData
    additionalFields.forEach(field => {
      additionalFieldValues[field] = userData[field];
    });

    console.log("additionalFieldValues", additionalFieldValues);



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
                    // if (workshopId === workshop) {
                    if (Object.values(additionalFieldValues).includes(workshopId)) {
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
                    // if (workshopId === workshop) {
                    if (Object.values(additionalFieldValues).includes(workshopId)) {
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
      INSERT INTO cs_os_users SET ?, cs_isconfirm = ?, cs_module = ? ,cs_isbadge_created = ?
    `;
    const insertResult = await pool.query(insertUserQuery, [userData, 1, 3, 1]);
    console.log('Insert result:', insertResult);
    const newUserId = insertResult[0].insertId;

    // const newUserId = insertResult.insertId;

    if (!newUserId) {
      throw new Error("Failed to retrieve new user ID");
    }

    const sanitizeString = (str) => str.replace(/[^a-zA-Z0-9]/g, '');

    // Sanitize and format the first and last names
    const sanitizedFirstName = sanitizeString(firstName.toLowerCase());
    const sanitizedLastNameInitial = sanitizeString(lastName[0].toLowerCase());
    const sanitizedLastName = sanitizeString(lastName.toLowerCase());
    const sanitizedFirstNameInitial = sanitizeString(firstName[0].toUpperCase());

    // Construct the username and password
    const username = `${sanitizedFirstName}${sanitizedLastNameInitial}${newUserId}`;
    const password = `${sanitizedFirstNameInitial}${sanitizedLastName.substring(0, 5)}@${newUserId}`;



    // const username = `${firstName.toLowerCase()}${lastName[0].toLowerCase()}${newUserId}`;
    // const password = `${firstName[0].toUpperCase()}${lastName.substring(0, 5).toLowerCase()}@${newUserId}`;


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



//Bulk Import

// router.post('/addBulkUser', verifyToken, async (req, res) => {
//   try {
//     const userDataArray = req.body; // Array of user data objects

//     // Filter out the 'Id' field from each user data object
//     const filteredUserDataArray = userDataArray.map(userData => {
//       const { Id, ...filteredUserData } = userData; // Destructure 'Id' field and exclude it
//       return filteredUserData;
//     });

//     // Retrieve field names from the database based on keys
//     const keys = Object.keys(filteredUserDataArray[0]); // Assuming all objects have the same keys
//     console.log('Keys:', keys);

//     const queryResult = await pool.query('SELECT cs_field_label, cs_field_name FROM cs_os_field_data WHERE cs_field_label IN (?)', [keys]);

//     // Extract field labels and names from query result
//     const fieldMap = {};
//     queryResult[0].forEach(row => {
//       fieldMap[row.cs_field_label] = row.cs_field_name;
//     });

//     console.log('Field Map:', fieldMap);

//     // Prepare an array to hold all user data with fields
//     const allUserDataWithFields = [];

//     // Loop through each record in userDataArray
//     for (let i = 0; i < userDataArray.length; i++) {
//       const userData = userDataArray[i];

//       const userDataWithFields = {};
//       // Copy original keys/values to userDataWithFields, excluding 'Id'
//       Object.entries(userData).forEach(([key, value]) => {
//         if (key !== 'Id') {
//           // If the key exists in the fieldMap, update the key
//           if (fieldMap[key]) {
//             userDataWithFields[fieldMap[key]] = value;
//           } else {
//             // Otherwise, keep the original key
//             userDataWithFields[key] = value;
//           }
//         }
//       });





//       // Fetch facility data based on regId for each user
//       const regId = userDataWithFields.cs_reg_cat_id;
//       const workshop = parseInt(userData.cs_workshop_category, 10);

//       // console.log('regId:', regId);

//       const [rows, fields] = await pool.query(`
//           SELECT fd.cs_facility_name, fc.cs_allow_count
//           FROM cs_os_facility_category fc
//           JOIN cs_os_facility_detail fd ON fc.cs_facility_detail_id = fd.cs_facility_detail_id
//           WHERE fc.cs_reg_cat_id = ? AND fd.cs_status = 1
//       `, [regId]);

//       // Initialize badgeData object for each user
//       const badgeData = {};

//       // Check if cs_reg_type is available and not equal to "101"
//       // if (userDataWithFields.cs_reg_type && userDataWithFields.cs_reg_type !== "101") {
//       //   const reg_daytype = days;

//       //   // Check if the query was successful
//       //   if (rows) {
//       //     // Loop through the results and construct the badge data
//       //     rows.forEach(row => {
//       //       const facilityName = row.cs_facility_name;
//       //       const allowCount = row.cs_allow_count;

//       //       // Check if the facility name matches the cs_reg_type and has no numbers at the end
//       //       if (facilityName.includes(reg_daytype) || !/\d$/.test(facilityName)) {
//       //         // Facility matches, set the count fetched from the table
//       //         badgeData[facilityName] = allowCount;
//       //         // Set the status to "0" for each facility
//       //         badgeData[facilityName + '_status'] = "0";
//       //       } else {
//       //         // Facility doesn't match, set count to 0
//       //         badgeData[facilityName] = "0";
//       //         // Set the status to "0" for each facility
//       //         badgeData[facilityName + '_status'] = "0";
//       //       }
//       //     });
//       //   } else {
//       //     // Query failed
//       //     console.error("Error executing query:", error);
//       //   }
//       // } else {
//       //   // cs_reg_type not available, set count to 0 for all facilities
//       //   if (rows) {
//       //     rows.forEach(row => {
//       //       const facilityName = row.cs_facility_name;
//       //       const allowCount = row.cs_allow_count;

//       //       badgeData[facilityName] = allowCount;
//       //       // Set the status to "0" for each facility
//       //       badgeData[facilityName + '_status'] = "0";
//       //     });
//       //   } else {
//       //     // Query failed
//       //     console.error("Error executing query:", error);
//       //   }
//       // }



//       if (userDataWithFields.cs_reg_type && userDataWithFields.cs_reg_type !== 101) {
//         console.log("i am in daywise");
//         const reg_daytype = days;

//         // Check if the query was successful
//         if (rows) {
//           // Loop through the results and construct the badge data
//           rows.forEach(row => {
//             const facilityName = row.cs_facility_name;
//             const allowCount = row.cs_allow_count;
//             const facilityId = row.cs_facility_id;

//             // Fetch facility type
//             const facilityTypeQuery = `
//               SELECT cs_type 
//               FROM cs_os_facilitytype 
//               WHERE cs_facility_id = ?
//             `;
//             pool.query(facilityTypeQuery, [facilityId])
//               .then(([typeRows, typeFields]) => {
//                 const facilityType = typeRows[0].cs_type;

//                 // If facility type is workshop, further check for workshop category
//                 if (facilityType === 'workshop') {
//                   const workshopQuery = `
//                     SELECT cs_workshop_id 
//                     FROM cs_os_workshop 
//                     WHERE cs_facility_id = ? 
//                   `;
//                   pool.query(workshopQuery, [facilityId])
//                     .then(([workshopRows, workshopFields]) => {
//                       const workshopId = workshopRows[0].cs_workshop_id;
//                       // If workshop category matches, set the count fetched from the table
//                       if (workshopId === workshop) {
//                         badgeData[facilityName] = allowCount;
//                         badgeData[facilityName + '_status'] = "0";
//                       } else {
//                         badgeData[facilityName] = "0";
//                         badgeData[facilityName + '_status'] = "0";
//                       }
//                     })
//                     .catch(error => {
//                       console.error("Error executing workshop query:", error);
//                     });
//                 } else {
//                   // If facility type is not workshop, set count to 0
//                   if (facilityName.includes(reg_daytype) || !/\d$/.test(facilityName)) {
//                     // Facility matches, set the count fetched from the table
//                     badgeData[facilityName] = allowCount;
//                     // Set the status to "0" for each facility
//                     badgeData[facilityName + '_status'] = "0";
//                   } else {
//                     // Facility doesn't match, set count to 0
//                     badgeData[facilityName] = "0";
//                     // Set the status to "0" for each facility
//                     badgeData[facilityName + '_status'] = "0";
//                   }
//                 }
//               })
//               .catch(error => {
//                 console.error("Error executing facility type query:", error);
//               });
//           });
//         } else {
//           // Query failed
//           console.error("Error executing facility query");
//         }
//       } else {
//         // cs_reg_type not available, set count to 0 for all facilities

//         console.log("i am here in all day")
//         if (rows) {
//           rows.forEach(row => {
//             const facilityName = row.cs_facility_name;
//             const allowCount = row.cs_allow_count;
//             const facilityId = row.cs_facility_id;

//             // Fetch facility type
//             const facilityTypeQuery = `
//               SELECT cs_type 
//               FROM cs_os_facilitytype 
//               WHERE cs_facility_id = ?
//             `;
//             pool.query(facilityTypeQuery, [facilityId])
//               .then(([typeRows, typeFields]) => {
//                 const facilityType = typeRows[0].cs_type;

//                 // If facility type is workshop, further check for workshop category
//                 if (facilityType === 'workshop') {
//                   const workshopQuery = `
//                     SELECT cs_workshop_id 
//                     FROM cs_os_workshop 
//                     WHERE cs_facility_id = ? 
//                   `;
//                   pool.query(workshopQuery, [facilityId])
//                     .then(([workshopRows, workshopFields]) => {
//                       const workshopId = workshopRows[0].cs_workshop_id;
//                       // If workshop category matches, set the count fetched from the table
//                       if (workshopId === workshop) {
//                         badgeData[facilityName] = allowCount;
//                         badgeData[facilityName + '_status'] = "0";
//                       }
//                       else {
//                         badgeData[facilityName] = "0";
//                         badgeData[facilityName + '_status'] = "0";


//                       }
//                     })
//                     .catch(error => {
//                       console.error("Error executing workshop query:", error);
//                     });
//                 } else {
//                   // If facility type is not workshop, set count to 0


//                   badgeData[facilityName] = allowCount;
//                   // Set the status to "0" for each facility
//                   badgeData[facilityName + '_status'] = "0";
//                 }


//               })
//               .catch(error => {
//                 console.error("Error executing facility type query:", error);
//               });
//           });
//         } else {
//           // Query failed
//           console.error("Error executing facility query");
//         }
//       }




//       let regNo = 0; // Initialize regNo

//       // Check if cs_regno already has a value
//       if (!userDataWithFields.cs_regno) {
//         // Get the last inserted cs_regno from cs_os_users table
//         const [lastRegCatIdRow] = await pool.query('SELECT MAX(cs_regno) AS max_regno FROM cs_os_users');
//         const lastRegCatId = lastRegCatIdRow[0].max_regno || 0; // If no records exist, default to 0
//         regNo = lastRegCatId + 1;
//       } else {
//         // Use the existing value of cs_regno
//         regNo = userDataWithFields.cs_regno;
//       }

//       // Now regNo is either a newly generated unique value or the existing value, use it in your userData
//       userDataWithFields.cs_regno = regNo;

//       console.log('Registration number for user:', userDataWithFields.cs_reg_cat_id);
//       console.log('Badge data for user:', badgeData);



//       // Fetch cs_reg_category from cs_os_category based on cs_reg_cat_id
//       const [categoryRow] = await pool.query('SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?', [userDataWithFields.cs_reg_cat_id]);
//       const csRegCategory = categoryRow[0].cs_reg_category;

//       userDataWithFields.cs_reg_category = csRegCategory;

//       // Insert the user data into the database
//       const insertUserQuery = `
//         INSERT INTO cs_os_users SET ?, created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
//       `;

//       await pool.query(insertUserQuery, userDataWithFields);

//       const insertBadgeQuery = `
//       INSERT INTO cs_os_badges (cs_regno, cs_reg_cat_id, cs_badge_data, created_at, updated_at)
//       VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
//     `;
//       await pool.query(insertBadgeQuery, [regNo, regId, JSON.stringify(badgeData)]);

//       allUserDataWithFields.push(userDataWithFields);
//     }

//     // Respond with appropriate status or result
//     res.status(200).json({ success: true, message: 'Users added successfully.', userDataWithFields: allUserDataWithFields });
//   } catch (error) {
//     console.error('Error adding bulk users:', error);
//     res.status(500).json({ success: false, message: 'Internal server error.' });
//   }
// });


router.post('/addBulkUser', verifyToken, queueMiddleware, async (req, res) => {
  try {
    const userDataArray = req.body; // Array of user data objects

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

      const fieldQuery = `SELECT cs_field_name FROM cs_os_field_data WHERE cs_field_type = ?`;
      const [fieldResults] = await pool.query(fieldQuery, ['13']);
      console.log("fieldResults", fieldResults);

      // Extract field names from the query result
      const additionalFields = fieldResults.map(row => row.cs_field_name);
      console.log("additionalFields", additionalFields);

      const additionalFieldValues = {};

      // Loop through each field in additionalFields to retrieve its userData
      additionalFields.forEach(field => {
        additionalFieldValues[field] = parseInt(userDataWithFields[field], 10);
      });

      console.log("additionalFieldValues", additionalFieldValues);


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
            // if (workshopId === workshop) {
            if (Object.values(additionalFieldValues).includes(workshopId)) {
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
            // if (workshopId === workshop) {
            if (Object.values(additionalFieldValues).includes(workshopId)) {
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
        INSERT INTO cs_os_users SET ?, cs_isconfirm = ?, cs_module = ? , cs_isbadge_created = ?
      `;

      // await pool.query(insertUserQuery, [userDataWithFields, 1, currentTimestamp, currentTimestamp]);
      const [insertResult] = await pool.query(insertUserQuery, [userDataWithFields, 1, 3, 1]);

      const newUserId = insertResult.insertId;

      const firstName = userDataWithFields.cs_first_name ? userDataWithFields.cs_first_name : 'Dammy';
      const lastName = userDataWithFields.cs_last_name ? userDataWithFields.cs_last_name : 'Dammy';

      // Function to remove special characters
      const sanitizeString = (str) => str.replace(/[^a-zA-Z0-9]/g, '');

      // Sanitize and format the first and last names
      const sanitizedFirstName = sanitizeString(firstName.toLowerCase());
      const sanitizedLastNameInitial = sanitizeString(lastName[0].toLowerCase());
      const sanitizedLastName = sanitizeString(lastName.toLowerCase());
      const sanitizedFirstNameInitial = sanitizeString(firstName[0].toUpperCase());

      const username = `${sanitizedFirstName}${sanitizedLastNameInitial}${newUserId}`;
      const password = `${sanitizedFirstNameInitial}${sanitizedLastName.substring(0, 5)}@${newUserId}`;




      const updateUserQuery = `
        UPDATE cs_os_users
        SET cs_username = ?, cs_password = ?
        WHERE id = ?
      `;

      await pool.query(updateUserQuery, [username, password, newUserId]);


      const insertBadgeQuery = `
        INSERT INTO cs_os_badges (cs_regno, cs_reg_cat_id, cs_badge_data)
        VALUES (?, ?, ?)
      `;
      await pool.query(insertBadgeQuery, [lastRegNo, regId, JSON.stringify(badgeData)]);

      allUserDataWithFields.push(userDataWithFields);
    }

    // Respond with appropriate status or result
    res.status(200).json({ success: true, message: 'Users added successfully.', userDataWithFields: allUserDataWithFields });
  } catch (error) {
    console.error('Error adding bulk users:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
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


//fetch Roles data from the cs_os_users
router.get('/getMand', verifyToken, async (req, res) => {
  try {
    // Specify the columns you want to fetch from the table
    const columnsToFetch = ['cs_field_name', 'cs_field_label', 'cs_is_required', 'cs_field_type'];

    // Construct the SQL query to fetch specific columns
    const query = `SELECT ${columnsToFetch.join(',')} FROM cs_os_field_data WHERE cs_is_required = 1 AND cs_status IN (1, 2)`;

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
      WHERE cs_regno = ${catId};
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

        const fieldQuery = `SELECT cs_field_name FROM cs_os_field_data WHERE cs_field_type = ?`;
        const [fieldResults] = await pool.query(fieldQuery, ['13']);
        console.log("fieldResults", fieldResults);

        // Extract field names from the query result
        const additionalFields = fieldResults.map(row => row.cs_field_name);
        console.log("additionalFields", additionalFields);

        const additionalFieldValues = {};

        // Loop through each field in additionalFields to retrieve its userData
        additionalFields.forEach(field => {
          additionalFieldValues[field] = userData[field];
        });

        console.log("additionalFieldValues", additionalFieldValues);

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

                // if (workshopId === workshop) {
                if (Object.values(additionalFieldValues).includes(workshopId)) {
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

                // if (workshopId === workshop) {
                if (Object.values(additionalFieldValues).includes(workshopId)) {
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


router.put('/BulkUpdateStatus', verifyToken, async (req, res) => {
  try {
    const { Id, status } = req.body;

    // Ensure Id is an array
    if (!Array.isArray(Id) || Id.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty Id list' });
    }

    // Construct the query with placeholders for the IDs
    const placeholders = Id.map(() => '?').join(',');
    const updateQuery = `UPDATE cs_os_users SET cs_status = ? WHERE id IN (${placeholders})`;

    // Execute the query
    await pool.query(updateQuery, [status, ...Id]);

    return res.status(200).json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});












module.exports = router;