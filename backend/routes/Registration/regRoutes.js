const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const moment = require('moment-timezone');
// const verifyToken = require('./middleware/authMiddleware');
const verifyToken = require('../api/middleware/authMiddleware');
const queueMiddleware = require('../api/middleware/queueMiddleware');


//Category Access API
// Define the route to fetch Facility data from the cs_os_badgeapp_userlogin
router.get('/getCategory', verifyToken, async (req, res) => {
  try {
    // Extract page number, page size, and search query from request query parameters
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const offset = (page - 1) * pageSize;

    const columnsToFetch = ['*'];

    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
      SELECT ${columnsToFetch}
      FROM cs_os_category
      WHERE cs_status = 1
    `;

    // Append search condition if search query is provided
    if (search) {
      query += `
        AND cs_reg_category LIKE '%${search}%' 
      `;
    }


    // Append pagination
    query += `
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    // Execute the query to fetch category data from the table
    const [categoryData] = await pool.query(query);

    // Construct the total count query
    let totalCountQuery = `
      SELECT COUNT(*) AS total
      FROM cs_os_category
      WHERE cs_status = 1
    `;

    // Append search condition if search query is provided
    if (search) {
      totalCountQuery += `
        AND cs_reg_category LIKE '%${search}%'
      `;
    }

    // Execute the total count query
    const [totalCountResult] = await pool.query(totalCountQuery);
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
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});




router.get('/getDaysCount', verifyToken, async (req, res) => {
  try {
    // Query to fetch cs_value for id 38 from cs_tbl_sitesetting table
    const query = `SELECT cs_value FROM cs_tbl_sitesetting WHERE id = 38`;

    // Execute the query
    const [results] = await pool.query(query);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Settings not found' });
    }

    const csValue = results[0].cs_value;
    res.json({ cs_value: csValue });
  } catch (error) {
    console.error('Error fetching settings value:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// router.put('/updateCount/:id',verifyToken, async (req, res) => {
//   const { id } = req.params;
//   const { cs_allow_count, catId } = req.body;

//   console.log('ID:', id);
//   console.log('Count:', cs_allow_count);
//   console.log('CatId:', catId);

//   try {
//     // Update cs_allow_count in the cs_os_facility_category table
//     const updateQuery = `UPDATE cs_os_facility_category SET cs_allow_count = ? WHERE cs_facility_detail_id = ? AND cs_reg_cat_id = ?`;
//     await pool.query(updateQuery, [cs_allow_count, id, catId]);

//     // Fetch cs_facility_name from cs_os_facility_detail table based on cs_facility_detail_id
//     const facilityNameQuery = 'SELECT cs_facility_name FROM cs_os_facility_detail WHERE cs_facility_detail_id = ?';
//     const facilityNameResult = await pool.query(facilityNameQuery, [id]);
//     const facilityName = facilityNameResult[0][0].cs_facility_name;

//     console.log('Facility Name:', facilityName);

//     // Fetch cs_badge_data from cs_os_badges table based on catId
//     const badgeDataQuery = 'SELECT cs_regno, cs_reg_cat_id,cs_badge_data FROM cs_os_badges WHERE cs_reg_cat_id = ?';
//     const badgeDataResult = await pool.query(badgeDataQuery, [catId]);
//     // const badgeData = badgeDataResult[0][0].cs_badge_data;




//     // Parse the JSON data
//     // const parsedBadgeData = JSON.parse(badgeData);

//     // // Check if the facilityName exists in the parsed JSON data
//     // if (parsedBadgeData.hasOwnProperty(facilityName)) {
//     //   // Update the corresponding value with cs_allow_count
//     //   parsedBadgeData[facilityName] = cs_allow_count;
//     // } else {
//     //   // If facilityName does not exist, you can handle it here
//     //   // For example, you could choose to log a message or take other actions
//     //   console.log(`Facility ${facilityName} not found in badge data`);
//     // }

//     for (const badgeEntry of badgeDataResult[0]) {
//       // Extract cs_reg_cat_id, cs_badge_data, and cs_regno from each badge entry
//       const { cs_regno, cs_reg_cat_id, cs_badge_data } = badgeEntry;

//       // Parse the badge data
//       const parsedBadgeData = JSON.parse(cs_badge_data);

//       // Fetch cs_reg_type from cs_os_user table
//       const userQuery = `SELECT cs_reg_type FROM cs_os_users WHERE cs_regno = ?`;
//       const [userResults] = await pool.query(userQuery, [cs_regno]);

//       if (userResults.length > 0) {
//         const { cs_reg_type } = userResults[0];
//         console.log('cs_reg_type:', cs_reg_type);

//         // Check if status is 0

//           // Process the badge data based on cs_reg_type
//           const selectAllowCountQuery = `
//             SELECT cs_allow_count
//             FROM cs_os_facility_category
//             WHERE cs_facility_detail_id = ? AND cs_reg_cat_id = ?
//           `;
//           const selectValues = [id, catId];

//           const [allowCountResults] = await pool.query(selectAllowCountQuery, selectValues);



//           if (allowCountResults.length > 0) {
//             allowCountResults.forEach(row => {
//               const { cs_allow_count } = row;
//               console.log('cs_allow_count:', cs_allow_count);
//               if (cs_reg_type && cs_reg_type !== "101") {

//                 const reg_daytype = cs_reg_type;
//                 console.log("reg_daytype" , reg_daytype);
//                 if (facilityName.includes(reg_daytype) || !/\d$/.test(facilityName)) {
//                   parsedBadgeData[facilityName] = cs_allow_count;
//                   parsedBadgeData[`${facilityName}_status`] = "0";
//                 } else {
//                   parsedBadgeData[facilityName] = "0";
//                   parsedBadgeData[`${facilityName}_status`] = "0";
//                 }
//               } else {
//                 console.log("I am in All day");
//                 parsedBadgeData[facilityName] = cs_allow_count;
//                 parsedBadgeData[`${facilityName}_status`] = "0";
//               }
//             });

//             const updatedBadgeData = JSON.stringify(parsedBadgeData);
//             console.log("updatedBadgeData",updatedBadgeData);
//             const updateBadgeQuery = `UPDATE cs_os_badges SET cs_badge_data = ? `;
//             await pool.query(updateBadgeQuery, [updatedBadgeData]);
//           } else {
//             console.log(`No data found for facility ${facilityName} and cs_reg_cat_id ${cs_reg_cat_id}`);
//           }
//       } else {
//         console.log(`User not found with cs_regno ${cs_regno}`);
//       }
//     }


//     // Convert the modified JSON data back to string




//     // Update cs_badge_data in the cs_os_badges tab



//     return res.status(200).json({ message: 'Category count and badge data updated successfully' });
//   } catch (error) {
//     console.error('Error updating category count and badge data:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// });


// router.put('/updateCount/:id', verifyToken, async (req, res) => {
//   const { id } = req.params;
//   const { cs_allow_count, catId } = req.body;

//   console.log('ID:', id);
//   console.log('Count:', cs_allow_count);
//   console.log('CatId:', catId);

//   try {
//     // Update cs_allow_count in the cs_os_facility_category table
//     const updateQuery = `
//       UPDATE cs_os_facility_category 
//       SET cs_allow_count = ? 
//       WHERE cs_facility_detail_id = ? AND cs_reg_cat_id = ?`;
//     await pool.query(updateQuery, [cs_allow_count, id, catId]);

//     // Fetch cs_facility_name from cs_os_facility_detail table based on cs_facility_detail_id
//     const facilityNameQuery = `
//       SELECT cs_facility_name 
//       FROM cs_os_facility_detail 
//       WHERE cs_facility_detail_id = ?`;
//     const [facilityNameResult] = await pool.query(facilityNameQuery, [id]);
//     const facilityName = facilityNameResult[0]?.cs_facility_name;

//     if (!facilityName) {
//       return res.status(404).json({ error: 'Facility name not found' });
//     }

//     console.log('Facility Name:', facilityName);

//     // Fetch cs_badge_data from cs_os_badges table based on catId
//     const badgeDataQuery = `
//       SELECT cs_regno, cs_reg_cat_id, cs_badge_data 
//       FROM cs_os_badges 
//       WHERE cs_reg_cat_id = ?`;
//     const [badgeDataResult] = await pool.query(badgeDataQuery, [catId]);

//     if (badgeDataResult.length === 0) {
//       return res.status(404).json({ error: 'No badge data found' });
//     }

//     for (const badgeEntry of badgeDataResult) {
//       const { cs_regno, cs_badge_data } = badgeEntry;

//       // Parse the badge data
//       let parsedBadgeData;
//       try {
//         parsedBadgeData = JSON.parse(cs_badge_data);
//       } catch (err) {
//         console.error('Error parsing badge data:', err);
//         return res.status(500).json({ error: 'Internal server error' });
//       }

//       // Fetch cs_reg_type from cs_os_user table
//       const userQuery = `
//         SELECT cs_reg_type 
//         FROM cs_os_users 
//         WHERE cs_regno = ?`;
//       const [userResults] = await pool.query(userQuery, [cs_regno]);

//       if (userResults.length === 0) {
//         console.log(`User not found with cs_regno ${cs_regno}`);
//         continue;
//       }

//       const { cs_reg_type } = userResults[0];
//       console.log('cs_reg_type:', cs_reg_type);

//       // Fetch the updated cs_allow_count
//       const selectAllowCountQuery = `
//         SELECT cs_allow_count 
//         FROM cs_os_facility_category 
//         WHERE cs_facility_detail_id = ? AND cs_reg_cat_id = ?`;
//       const [allowCountResults] = await pool.query(selectAllowCountQuery, [id, catId]);

//       if (allowCountResults.length === 0) {
//         console.log(`No data found for facility ${facilityName} and cs_reg_cat_id ${catId}`);
//         continue;
//       }

//       const updatedAllowCount = allowCountResults[0].cs_allow_count;

//       if (cs_reg_type && cs_reg_type !== "101") {
//         const reg_daytype = cs_reg_type;
//         console.log("reg_daytype", reg_daytype);

//         if (facilityName.includes(reg_daytype) || !/\d$/.test(facilityName)) {
//           parsedBadgeData[facilityName] = updatedAllowCount;
//           parsedBadgeData[`${facilityName}_status`] = "0";
//         } else {
//           parsedBadgeData[facilityName] = "0";
//           parsedBadgeData[`${facilityName}_status`] = "0";
//         }
//       } else {
//         console.log("I am in All day");
//         parsedBadgeData[facilityName] = updatedAllowCount;
//         parsedBadgeData[`${facilityName}_status`] = "0";
//       }

//       const updatedBadgeData = JSON.stringify(parsedBadgeData);
//       console.log("updatedBadgeData", updatedBadgeData);

//       const updateBadgeQuery = `
//         UPDATE cs_os_badges 
//         SET cs_badge_data = ? 
//         WHERE cs_regno = ? AND cs_reg_cat_id = ?`;
//       await pool.query(updateBadgeQuery, [updatedBadgeData, cs_regno, catId]);
//     }

//     return res.status(200).json({ message: 'Category count and badge data updated successfully' });
//   } catch (error) {
//     console.error('Error updating category count and badge data:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// });


// router.put('/updateCount/:id', verifyToken, async (req, res) => {
//   const { id } = req.params;
//   const { cs_allow_count, catId } = req.body;

//   console.log('ID:', id);
//   console.log('Count:', cs_allow_count);
//   console.log('CatId:', catId);

//   try {
//     // Update cs_allow_count in the cs_os_facility_category table
//     const updateQuery = `
//       UPDATE cs_os_facility_category 
//       SET cs_allow_count = ? 
//       WHERE cs_facility_detail_id = ? AND cs_reg_cat_id = ?`;
//     await pool.query(updateQuery, [cs_allow_count, id, catId]);

//     // Fetch cs_facility_name from cs_os_facility_detail table based on cs_facility_detail_id
//     const facilityNameQuery = `
//       SELECT cs_facility_name,cs_facility_id
//       FROM cs_os_facility_detail 
//       WHERE cs_facility_detail_id = ?`;
//     const [facilityNameResult] = await pool.query(facilityNameQuery, [id]);
//     const facilityName = facilityNameResult[0]?.cs_facility_name;
//     const facilityId = facilityNameResult[0]?.cs_facility_id;

//     if (!facilityName) {
//       return res.status(200).json({ error: 'Facility name not found' });
//     }

//     // console.log('Facility Name:', facilityName);

//     const [typeRows] = await pool.query(`
//             SELECT cs_type 
//             FROM cs_os_facilitytype 
//             WHERE cs_facility_id = ?
//           `, [facilityId]);

//           const facilityType = typeRows[0]?.cs_type;

//     // Fetch cs_badge_data from cs_os_badges table based on catId
//     const badgeDataQuery = `
//       SELECT cs_regno, cs_reg_cat_id, cs_badge_data 
//       FROM cs_os_badges 
//       WHERE cs_reg_cat_id = ?`;
//     const [badgeDataResult] = await pool.query(badgeDataQuery, [catId]);

//     if (badgeDataResult.length === 0) {
//       return res.status(200).json({ error: 'No badge data found' });
//     }

//     for (const badgeEntry of badgeDataResult) {
//       const { cs_regno, cs_badge_data } = badgeEntry;

//       // Parse the badge data
//       let parsedBadgeData;
//       try {
//         parsedBadgeData = JSON.parse(cs_badge_data);
//       } catch (err) {
//         console.error('Error parsing badge data:', err);
//         return res.status(200).json({ error: 'Internal server error' });
//       }

//       // Fetch cs_reg_type from cs_os_user table
//       const userQuery = `
//         SELECT cs_reg_type, cs_workshop_category
//         FROM cs_os_users 
//         WHERE cs_regno = ?`;
//       const [userResults] = await pool.query(userQuery, [cs_regno]);

//       if (userResults.length === 0) {
//         console.log(`User not found with cs_regno ${cs_regno}`);
//         return res.status(404).json({ error: `User not found with cs_regno ${cs_regno}` });
//       }

//       const { cs_reg_type, cs_workshop_category } = userResults[0];
//       // console.log('cs_reg_type:', cs_reg_type);

//       // Fetch the updated cs_allow_count
//       const selectAllowCountQuery = `
//         SELECT cs_allow_count 
//         FROM cs_os_facility_category 
//         WHERE cs_facility_detail_id = ? AND cs_reg_cat_id = ?`;
//       const [allowCountResults] = await pool.query(selectAllowCountQuery, [id, catId]);

//       if (allowCountResults.length === 0) {
//         console.log(`No data found for facility ${facilityName} and cs_reg_cat_id ${catId}`);
//         continue;
//       }

//       const updatedAllowCount = allowCountResults[0].cs_allow_count;

//       if (cs_reg_type && cs_reg_type !== "101") {
//         const reg_daytype = cs_reg_type;
//         // console.log("reg_daytype", reg_daytype);
//         const workshop = parseInt(cs_workshop_category, 10);
//         if (facilityType === 'workshop') {
//           const [workshopRows] = await pool.query(`
//               SELECT cs_workshop_id 
//               FROM cs_os_workshop 
//               WHERE cs_facility_id = ? 
//             `, [facilityId]);

//           const workshopId = workshopRows[0]?.cs_workshop_id;
//           if (workshopId === workshop) {
//             parsedBadgeData[facilityName] = updatedAllowCount;
//             if (!parsedBadgeData.hasOwnProperty(`${facilityName}_status`)) {
//               parsedBadgeData[`${facilityName}_status`] = '0';
//             }

//           } else {
//             parsedBadgeData[facilityName] = "0";
//             if (!parsedBadgeData.hasOwnProperty(`${facilityName}_status`)) {
//               parsedBadgeData[`${facilityName}_status`] = '0';
//             }

//           }

//         } else {
//           if (facilityName.includes(reg_daytype) || !/\d$/.test(facilityName)) {
//             parsedBadgeData[facilityName] = updatedAllowCount;
//             if (!parsedBadgeData.hasOwnProperty(`${facilityName}_status`)) {
//               parsedBadgeData[`${facilityName}_status`] = '0';
//             }

//           } else {
//             parsedBadgeData[facilityName] = "0";
//             if (!parsedBadgeData.hasOwnProperty(`${facilityName}_status`)) {
//               parsedBadgeData[`${facilityName}_status`] = '0';
//             }
//           }
//         }
//       } else {
//         if (facilityType === 'workshop') {
//           const [workshopRows] = await pool.query(`
//               SELECT cs_workshop_id 
//               FROM cs_os_workshop 
//               WHERE cs_facility_id = ? 
//             `, [facilityId]);

//             const workshop = parseInt(cs_workshop_category, 10);

//           const workshopId = workshopRows[0]?.cs_workshop_id;
//           if (workshopId === workshop) {
//             parsedBadgeData[facilityName] = updatedAllowCount;
//             if (!parsedBadgeData.hasOwnProperty(`${facilityName}_status`)) {
//               parsedBadgeData[`${facilityName}_status`] = '0';
//             }

//           } else {
//             parsedBadgeData[facilityName] = "0";
//             if (!parsedBadgeData.hasOwnProperty(`${facilityName}_status`)) {
//               parsedBadgeData[`${facilityName}_status`] = '0';
//             }

//           }

//         } else {
//           console.log("I am in All day");
//           parsedBadgeData[facilityName] = updatedAllowCount;
//           if (!parsedBadgeData.hasOwnProperty(`${facilityName}_status`)) {
//             parsedBadgeData[`${facilityName}_status`] = '0';
//           }

//         }
//       }


//       if (!parsedBadgeData.hasOwnProperty(facilityName)) {
//         parsedBadgeData[facilityName] = updatedAllowCount;
//         parsedBadgeData[`${facilityName}_status`] = '0';
//       }

//       const updatedBadgeData = JSON.stringify(parsedBadgeData);
//       // console.log("updatedBadgeData", updatedBadgeData);

//       const updateBadgeQuery = `
//         UPDATE cs_os_badges 
//         SET cs_badge_data = ? 
//         WHERE cs_regno = ? AND cs_reg_cat_id = ?`;
//       await pool.query(updateBadgeQuery, [updatedBadgeData, cs_regno, catId]);
//     }


//     return res.status(200).json({ message: 'Category count and badge data updated successfully' });
//   } catch (error) {
//     console.error('Error updating category count and badge data:', error);
//     return res.status(200).json({ error: 'Internal server error' });
//   }
// });
const requestQueue = [];
let isProcessing = false;

router.put('/updateCount/:id', verifyToken, queueMiddleware, async (req, res) => {
  try {
    requestQueue.push({ req, res });

    if (!isProcessing) {
      await processRequest();
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

async function processRequest() {
  if (requestQueue.length === 0) {
    isProcessing = false;
    return;
  }

  isProcessing = true;
  const { req, res } = requestQueue.shift();

  const { id } = req.params;
  const { cs_allow_count, catId } = req.body;

  try {
    // Update cs_allow_count in the cs_os_facility_category table
    const updateQuery = `
        UPDATE cs_os_facility_category 
        SET cs_allow_count = ? 
        WHERE cs_facility_detail_id = ? AND cs_reg_cat_id = ?`;
    await pool.query(updateQuery, [cs_allow_count, id, catId]);

    // Fetch cs_facility_name and cs_facility_id from cs_os_facility_detail table
    const facilityNameQuery = `
        SELECT cs_facility_name, cs_facility_id
        FROM cs_os_facility_detail 
        WHERE cs_facility_detail_id = ?`;
    const [facilityNameResult] = await pool.query(facilityNameQuery, [id]);
    const facilityName = facilityNameResult[0]?.cs_facility_name;
    const facilityId = facilityNameResult[0]?.cs_facility_id;

    if (!facilityName) {
      res.status(200).json({ error: 'Facility name not found' });
      return await processNextRequest();
    }

    console.log('Facility Name:', facilityName);
    console.log('Facility ID:', facilityId);

    // Fetch cs_type from cs_os_facilitytype table
    const [typeRows] = await pool.query(`
        SELECT cs_type 
        FROM cs_os_facilitytype 
        WHERE cs_facility_id = ?
      `, [facilityId]);
    const facilityType = typeRows[0]?.cs_type;

    const numericPart = extractNumericPart(facilityName);
    console.log("numericPart", numericPart);
    let badgeDataResult;
    if (numericPart == null) {
      const badgeDataQuery = `
      SELECT cs_regno, cs_reg_cat_id, cs_badge_data 
      FROM cs_os_badges 
      WHERE cs_reg_cat_id = ?`;
      [badgeDataResult] = await pool.query(badgeDataQuery, [catId]);
    } else {


      const badgeDataQuery = `
      SELECT DISTINCT b.cs_regno, b.cs_reg_cat_id, b.cs_badge_data, u.cs_reg_type 
      FROM cs_os_badges b
      JOIN cs_os_users u ON b.cs_regno = u.cs_regno
      WHERE b.cs_reg_cat_id = ? AND (u.cs_reg_type = ? OR u.cs_reg_type = 101 OR u.cs_reg_type IS NULL);`;
      [badgeDataResult] = await pool.query(badgeDataQuery, [catId, numericPart]);
    }

    if (badgeDataResult.length === 0) {
      res.status(200).json({ error: 'No badge data found' });
      return await processNextRequest();
    }

    const chunkSize = 500;
    const numChunks = Math.ceil(badgeDataResult.length / chunkSize);

    for (let i = 0; i < numChunks; i++) {
      const startIdx = i * chunkSize;
      const endIdx = Math.min(startIdx + chunkSize, badgeDataResult.length);
      const chunk = badgeDataResult.slice(startIdx, endIdx);

      await processBadgeDataChunk(chunk, id, catId, facilityName, facilityId, facilityType, cs_allow_count);
    }

    res.status(200).json({ message: 'Category count and badge data updated successfully' });
  } catch (error) {
    console.error('Error updating category count and badge data:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await processNextRequest();
  }
}

async function processNextRequest() {
  if (requestQueue.length > 0) {
    await processRequest();
  } else {
    isProcessing = false;
  }
}



async function processBadgeDataChunk(chunk, id, catId, facilityName, facilityId, facilityType, updatedAllowCount) {
  console.log("additionalFields");
  try {
    const updatePromises = chunk.map(badgeEntry => {
      const { cs_regno } = badgeEntry;
      return updateBadgeData(cs_regno, catId, facilityType, facilityId, facilityName, updatedAllowCount);
    });

    await Promise.all(updatePromises);

    console.log('Batch update completed successfully');
  } catch (error) {
    console.error('Error processing badge data:', error);
  }
}

async function updateBadgeData(cs_regno, catId, facilityType, facilityId, facilityName, updatedAllowCount) {
  try {
    const query = `
      UPDATE cs_os_badges b
      JOIN cs_os_users u ON b.cs_regno = u.cs_regno
      LEFT JOIN cs_os_workshop w ON w.cs_facility_id = ? AND w.cs_workshop_id = u.cs_workshop_category
      SET b.cs_badge_data = JSON_SET(
        b.cs_badge_data,
        CONCAT('$.', ?),
        CASE 
          WHEN u.cs_reg_type IS NOT NULL AND u.cs_reg_type != '101' THEN
            CASE 
              WHEN ? = 'workshop' THEN
                CASE 
                  WHEN w.cs_facility_id IS NOT NULL AND w.cs_workshop_id = u.cs_workshop_category THEN ?
                  ELSE JSON_UNQUOTE(JSON_EXTRACT(b.cs_badge_data, CONCAT('$.', ?)))
                END
              ELSE
                CASE 
                  WHEN ? LIKE CONCAT('%', u.cs_reg_type, '%') OR ? NOT REGEXP '\\d$' THEN ?
                  ELSE JSON_UNQUOTE(JSON_EXTRACT(b.cs_badge_data, CONCAT('$.', ?)))
                END
            END
          ELSE
            CASE 
              WHEN ? = 'workshop' THEN
                CASE 
                  WHEN w.cs_facility_id IS NOT NULL AND w.cs_workshop_id = u.cs_workshop_category THEN ?
                  ELSE JSON_UNQUOTE(JSON_EXTRACT(b.cs_badge_data, CONCAT('$.', ?)))
                END
              ELSE ?
            END
        END
      )
      WHERE b.cs_reg_cat_id = ? AND b.cs_regno = ?
        AND (JSON_UNQUOTE(JSON_EXTRACT(b.cs_badge_data, CONCAT('$.', CONCAT(?, '_status')))) IS NULL
             OR JSON_UNQUOTE(JSON_EXTRACT(b.cs_badge_data, CONCAT('$.', CONCAT(?, '_status')))) = '0');
    `;

    const params = [
      facilityId, facilityName, facilityType, String(updatedAllowCount), facilityName,
      facilityName, facilityName, String(updatedAllowCount), facilityName,
      facilityType, String(updatedAllowCount), facilityName, String(updatedAllowCount),
      String(catId), String(cs_regno), facilityName, facilityName
    ];

    console.log('SQL Query:', query);
    console.log('Parameters:', params);

    await pool.query(query, params);

    console.log(`Updated badge data for user ${cs_regno}`);
  } catch (error) {
    console.error(`Error updating badge data for user ${cs_regno}:`, error);
    throw error; // Rethrow the error to handle it at a higher level
  }
}




function extractNumericPart(facilityName) {
  const numericPart = facilityName.match(/\d+/);
  if (numericPart) {
    return numericPart[0];
  }
  return null;
}


// async function processBadgeDataChunk(chunk, id, catId, facilityName, facilityId, facilityType, updatedAllowCount) {
//   const updateQueries = chunk.map(async (badgeEntry) => {
//     const { cs_regno, cs_badge_data } = badgeEntry;

//     updatedAllowCount = String(updatedAllowCount);

//     let parsedBadgeData;
//     try {
//       parsedBadgeData = JSON.parse(cs_badge_data);
//     } catch (err) {
//       console.error('Error parsing badge data:', err);
//       return;
//     }

//     const userQuery = `
//         SELECT cs_reg_type, cs_workshop_category
//         FROM cs_os_users 
//         WHERE cs_regno = ?`;
//     const [userResults] = await pool.query(userQuery, [cs_regno]);

//     if (userResults.length === 0) {
//       return;
//     }

//     const { cs_reg_type, cs_workshop_category } = userResults[0];
//     const reg_daytype = cs_reg_type;
//     const workshop = parseInt(cs_workshop_category, 10);

//     if (cs_reg_type && cs_reg_type !== "101") {

//               const reg_daytype = cs_reg_type;
//               console.log("reg_daytype", reg_daytype);
//               const workshop = parseInt(cs_workshop_category, 10);
//               if (facilityType === 'workshop') {
//                 const [workshopRows] = await pool.query(`
//                     SELECT cs_workshop_id 
//                     FROM cs_os_workshop 
//                     WHERE cs_facility_id = ? 
//                   `, [facilityId]);

//                 const workshopId = workshopRows[0]?.cs_workshop_id;
//                 if (workshopId === workshop) {
//                   parsedBadgeData[facilityName] = updatedAllowCount;
//                   if (!parsedBadgeData.hasOwnProperty(`${facilityName}_status`)) {
//                     parsedBadgeData[`${facilityName}_status`] = '0';
//                   }

//                 } else {
//                   parsedBadgeData[facilityName] = "0";
//                   if (!parsedBadgeData.hasOwnProperty(`${facilityName}_status`)) {
//                     parsedBadgeData[`${facilityName}_status`] = '0';
//                   }

//                 }

//               } else {
//                 if (facilityName.includes(reg_daytype) || !/\d$/.test(facilityName)) {
//                   parsedBadgeData[facilityName] = updatedAllowCount;
//                   if (!parsedBadgeData.hasOwnProperty(`${facilityName}_status`)) {
//                     parsedBadgeData[`${facilityName}_status`] = '0';
//                   }

//                 } else {
//                   parsedBadgeData[facilityName] = "0";
//                   if (!parsedBadgeData.hasOwnProperty(`${facilityName}_status`)) {
//                     parsedBadgeData[`${facilityName}_status`] = '0';
//                   }
//                 }
//               }
//             } else {
//               if (facilityType === 'workshop') {
//                 const [workshopRows] = await pool.query(`
//                     SELECT cs_workshop_id 
//                     FROM cs_os_workshop 
//                     WHERE cs_facility_id = ? 
//                   `, [facilityId]);

//                   const workshop = parseInt(cs_workshop_category, 10);

//                 const workshopId = workshopRows[0]?.cs_workshop_id;
//                 if (workshopId === workshop) {
//                   parsedBadgeData[facilityName] = updatedAllowCount;
//                   if (!parsedBadgeData.hasOwnProperty(`${facilityName}_status`)) {
//                     parsedBadgeData[`${facilityName}_status`] = '0';
//                   }

//                 } else {
//                   parsedBadgeData[facilityName] = "0";
//                   if (!parsedBadgeData.hasOwnProperty(`${facilityName}_status`)) {
//                     parsedBadgeData[`${facilityName}_status`] = '0';
//                   }

//                 }

//               } else {
//                 console.log("I am in All day");
//                 parsedBadgeData[facilityName] = updatedAllowCount;
//                 if (!parsedBadgeData.hasOwnProperty(`${facilityName}_status`)) {
//                   parsedBadgeData[`${facilityName}_status`] = '0';
//                 }

//               }
//             }


//     if (!parsedBadgeData.hasOwnProperty(`${facilityName}_status`)) {
//       parsedBadgeData[`${facilityName}_status`] = '0';
//     }

//     const updatedBadgeData = JSON.stringify(parsedBadgeData);
//     const updateBadgeQuery = `
//         UPDATE cs_os_badges 
//         SET cs_badge_data = ? 
//         WHERE cs_regno = ? AND cs_reg_cat_id = ?`;
//     await pool.query(updateBadgeQuery, [updatedBadgeData, cs_regno, catId]);
//   });

//   await Promise.all(updateQueries);
//   console.log(`Chunk processing completed.`);
// }




// async function processBadgeDataChunk(chunk, id, catId, facilityName, facilityId, facilityType, updatedAllowCount) {
//   const updateQueries = chunk.map(async (badgeEntry) => {
//     const { cs_regno } = badgeEntry;

//     updatedAllowCount = String(updatedAllowCount);

//     const userQuery = `
//       SELECT cs_reg_type, cs_workshop_category
//       FROM cs_os_users 
//       WHERE cs_regno = ?`;
//     const [userResults] = await pool.query(userQuery, [cs_regno]);

//     if (userResults.length === 0) {
//       return;
//     }

//     const { cs_reg_type, cs_workshop_category } = userResults[0];
//     const reg_daytype = cs_reg_type;
//     const workshop = parseInt(cs_workshop_category, 10);

//     let typeWithStatus = `${facilityName}_status`;
//     let valueToUpdate = '0'; // Default value

//     if (cs_reg_type && cs_reg_type !== "101") {
//       if (facilityType === 'workshop') {
//         const [workshopRows] = await pool.query(`
//           SELECT cs_workshop_id 
//           FROM cs_os_workshop 
//           WHERE cs_facility_id = ?`, [facilityId]);

//         const workshopId = workshopRows[0]?.cs_workshop_id;
//         if (workshopId === workshop) {
//           valueToUpdate = updatedAllowCount;
//         }
//       } else {
//         if (facilityName.includes(reg_daytype) || !/\d$/.test(facilityName)) {
//           valueToUpdate = updatedAllowCount;
//         }
//       }
//     } else {
//       if (facilityType === 'workshop') {
//         const [workshopRows] = await pool.query(`
//           SELECT cs_workshop_id 
//           FROM cs_os_workshop 
//           WHERE cs_facility_id = ?`, [facilityId]);

//         const workshopId = workshopRows[0]?.cs_workshop_id;
//         if (workshopId === workshop) {
//           valueToUpdate = updatedAllowCount;
//         }
//       } else {
//         valueToUpdate = updatedAllowCount;
//       }
//     }

//     // Retrieve the current cs_badge_data for the user
//     const badgeQuery = `
//       SELECT cs_badge_data
//       FROM cs_os_badges 
//       WHERE cs_regno = ? AND cs_reg_cat_id = ?`;
//     const [badgeResults] = await pool.query(badgeQuery, [cs_regno, catId]);

//     if (badgeResults.length === 0) {
//       return;
//     }

//     const currentBadgeData = badgeResults[0].cs_badge_data;
//     let badgeDataJson = {};

//     try {
//       badgeDataJson = JSON.parse(currentBadgeData);
//     } catch (e) {
//       console.error('Error parsing JSON:', e);
//       return;
//     }

//     // Check if the status is already present in the JSON data
//     if (badgeDataJson[typeWithStatus] === undefined) {
//       console.log("without status");
//       const query = `
//         UPDATE cs_os_badges 
//         SET cs_badge_data = JSON_SET(cs_badge_data, ?, ?, ?, '0')
//         WHERE cs_regno = ? AND cs_reg_cat_id = ?`;

//       const params = [
//         `$.${facilityName}`, updatedAllowCount,
//         `$.${typeWithStatus}`,
//         cs_regno, catId
//       ];

//       await pool.query(query, params);
//     }
//     else{
//       console.log("with status");
//       const query = `
//       UPDATE cs_os_badges 
//       SET cs_badge_data = JSON_SET(cs_badge_data, ?, ?)
//       WHERE cs_regno = ? AND cs_reg_cat_id = ?`;

//     const params = [
//       `$.${facilityName}`, updatedAllowCount,
//       cs_regno, catId
//     ];

//     await pool.query(query, params);
//     }
//   });

//   await Promise.all(updateQueries);
// }










router.post('/getCategoryAccess', verifyToken, async (req, res) => {
  try {
    // Extract catId from the request body
    const { catId } = req.body;

    // Specify the columns you want to fetch from the tables
    const columnsToFetch = [
      'cs_os_facility_category.*',
      'cs_os_facilitytype.cs_display_name',
      'cs_os_facility_detail.cs_facility_name'
    ];

    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
    SELECT ${columnsToFetch.join(',')}
    FROM cs_os_facility_category 
    LEFT JOIN cs_os_facility_detail ON cs_os_facility_category.cs_facility_detail_id = cs_os_facility_detail.cs_facility_detail_id
    LEFT JOIN cs_os_facilitytype ON cs_os_facility_detail.cs_facility_id = cs_os_facilitytype.cs_facility_id
    WHERE cs_os_facility_category.cs_reg_cat_id = ${catId} 
    AND cs_os_facility_category.cs_status = 1
    AND cs_os_facilitytype.cs_status = 1;
    `;
    // Execute the query to fetch data
    const [pagesData] = await pool.query(query, [catId]);

    console.log(pagesData);
    // Send the data as a response
    res.json(pagesData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


//resetfacilityUser rj


// router.post('/resetfacilityUser', verifyToken, async (req, res) => {
//   try {
//     // Extract cs_regno from the request body
//     const { cs_regno } = req.body;

//     console.log("cs_regno:", cs_regno);

//     // Query to fetch cs_facility_name where cs_status is 1
//     const facilityQuery = `SELECT cs_facility_name FROM cs_os_facility_detail WHERE cs_status = 1`;

//     // Query to fetch cs_badge_data where cs_regno matches provided cs_regno
//     const badgeQuery = `SELECT cs_badge_data FROM cs_os_badges WHERE cs_regno = ?`;

//     // Execute both queries
//     const [facilityRows] = await pool.query(facilityQuery);
//     const [badgeRows] = await pool.query(badgeQuery, [cs_regno]);

//     // Parse the JSON data from cs_badge_data
//     const badgeData = JSON.parse(badgeRows[0].cs_badge_data);

//     // Create an array containing facility names and their status from badge data
//     const facilities = facilityRows.map(({ cs_facility_name }) => {
//       // Check if the facility name is present in badgeData
//       if (badgeData.hasOwnProperty(cs_facility_name)) {
//         return {
//           name: cs_facility_name,
//           allow_count: badgeData[cs_facility_name],
//           status: badgeData[cs_facility_name + '_status'],
//           cs_date: 'N/A',
//           cs_time: 'N/A'
//         };
//       }
//     }).filter(Boolean); // Remove undefined entries

//     console.log("facilities:", facilities);

//     // Send the array as a response
//     res.status(200).json(facilities);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });


router.post('/resetfacilityUser', verifyToken, async (req, res) => {
  try {
    // Extract cs_regno from the request body
    const { cs_regno } = req.body;

    console.log("cs_regno:", cs_regno);

    // Query to fetch cs_facility_name where cs_status is 1
    const facilityQuery = `SELECT cs_facility_name FROM cs_os_facility_detail WHERE cs_status = 1`;

    // Query to fetch cs_badge_data where cs_regno matches provided cs_regno
    const badgeQuery = `SELECT cs_badge_data FROM cs_os_badges WHERE cs_regno = ?`;

    // Query to fetch cs_date and cs_time based on cs_facility_name
    const badgeRecordQuery = `SELECT cs_type AS cs_facility_name, cs_date, cs_time FROM cs_os_badgerecords WHERE cs_type IN (SELECT cs_facility_name FROM cs_os_facility_detail WHERE cs_status = 1) AND cs_regno = ?`;

    // Execute all queries
    const [facilityRows] = await pool.query(facilityQuery);
    const [badgeRows] = await pool.query(badgeQuery, [cs_regno]);
    const [badgeRecordRows] = await pool.query(badgeRecordQuery, [cs_regno]);

    // Parse the JSON data from cs_badge_data
    const badgeData = JSON.parse(badgeRows[0].cs_badge_data);

    // Create a map for quick lookup of badge records
    const badgeRecordMap = badgeRecordRows.reduce((map, record) => {
      map[record.cs_facility_name] = { cs_date: record.cs_date, cs_time: record.cs_time };
      return map;
    }, {});

    // Create an array containing facility names and their status from badge data
    const facilities = facilityRows.map(({ cs_facility_name }) => {
      if (badgeData.hasOwnProperty(cs_facility_name)) {
        const badgeRecord = badgeRecordMap[cs_facility_name] || { cs_date: 'N/A', cs_time: 'N/A' };
        return {
          name: cs_facility_name,
          allow_count: badgeData[cs_facility_name],
          status: badgeData[cs_facility_name + '_status'],
          cs_date: badgeRecord.cs_date,
          cs_time: badgeRecord.cs_time
        };
      }
    }).filter(Boolean); // Remove undefined entries

    console.log("facilities:", facilities);

    // Send the array as a response
    res.status(200).json(facilities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



//---
router.put('/updateFacilityCount', verifyToken, async (req, res) => {
  try {
    const { cs_regno, cs_allow_count, facilityName, cs_user_status } = req.body;
    const adminUsername = "admin";

    // Update the facility count for the specified facilityName directly in the database

    const selectQuery = `
      SELECT JSON_UNQUOTE(JSON_EXTRACT(cs_badge_data, CONCAT('$.', ?))) AS currentCount
      FROM cs_os_badges
      WHERE cs_regno = ?
    `;
    const [rows] = await pool.query(selectQuery, [facilityName, cs_regno]);

    console.log("rows", rows[0].currentCount);


    const updateQuery = `
      UPDATE cs_os_badges 
      SET cs_badge_data = JSON_SET(cs_badge_data, CONCAT('$.', ?), ?)
      WHERE cs_regno = ?
    `;
    await pool.query(updateQuery, [facilityName, cs_allow_count, cs_regno]);

    // const updateQuery = `
    //   UPDATE cs_os_badges 
    //   SET cs_badge_data = JSON_SET(
    //     cs_badge_data, 
    //     CONCAT('$.${facilityName}_status'), 
    //     ?
    //   ),
    //   cs_badge_data = JSON_SET(
    //     cs_badge_data, 
    //     CONCAT('$.${facilityName}'), 
    //     ?
    //   )
    //   WHERE cs_regno = ?
    // `;
    // await pool.query(updateQuery, [cs_user_status, cs_allow_count, cs_regno]);

    // Send a success response
    cs_user_status = parseInt(cs_user_status, 10);

    if (rows[0].currentCount !== cs_user_status) {
      const insertStatusLogQuery = `
        INSERT INTO cs_os_reset_facility_log (cs_regno, cs_facility_type, cs_old_value, cs_new_value, datetime, cs_admin_username)
        VALUES (?, ?, ?, ?, NOW(), ?)
      `;
      await pool.query(insertStatusLogQuery, [cs_regno, facilityName, rows[0].currentCount, cs_allow_count, adminUsername]);
    }
    res.status(200).json({ message: 'Facility count updated successfully' });
  } catch (error) {
    console.error('Error updating facility count:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/resetFacility', verifyToken, async (req, res) => {
  // console.log("hii i am here");
  try {
    const { cs_regno, facilityName, cs_user_status } = req.body;

    console.log(req.body);
    console.log(cs_regno);
    console.log(facilityName);
    console.log(cs_user_status);

    // Subtract 1 from cs_user_status
    const updatedCsUserStatus = cs_user_status - 1;

    // Update the facility count for the specified facilityName directly in the database
    const updateQuery = `
      UPDATE cs_os_badges 
      SET cs_badge_data = JSON_SET(
        cs_badge_data, 
        CONCAT('$.${facilityName}_status'), 
        ?
      )
      WHERE cs_regno = ?
    `;
    await pool.query(updateQuery, [updatedCsUserStatus, cs_regno]);


    const insertLogQuery = `
    INSERT INTO cs_os_reset_facility_log (cs_regno, cs_facility_type, cs_old_value, cs_new_value, datetime, cs_admin_username)
    VALUES (?, ?, ?, ?, NOW(), ?)
  `;
    const adminUsername = "admin"; // Assuming the admin username is extracted from the request
    const facilityType = `${facilityName}_status`;
    await pool.query(insertLogQuery, [cs_regno, facilityType, cs_user_status, updatedCsUserStatus, adminUsername]);

    const deleteRecordQuery = `
  DELETE FROM cs_os_badgerecords
  WHERE cs_regno = ? AND cs_type = ?
`;
    await pool.query(deleteRecordQuery, [cs_regno, facilityName]);

    // Send a success response
    res.status(200).json({ message: 'Facility count updated successfully' });
  } catch (error) {
    console.error('Error updating facility count:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});





router.post('/resetBadgeData', verifyToken, async (req, res) => {
  try {
    const { catIds } = req.body;

    // Validate catIds
    if (!Array.isArray(catIds) || catIds.length === 0) {
      return res.status(400).json({ message: 'Invalid catIds provided.' });
    }

    // Fetch cs_badge_data from cs_os_badges table based on catId
    const badgeDataQuery = 'SELECT cs_reg_cat_id, cs_badge_data FROM cs_os_badges WHERE cs_reg_cat_id IN (?)';
    const [badgeDataResults] = await pool.query(badgeDataQuery, [catIds]);

    // Check if any badge data was returned
    if (!badgeDataResults.length) {
      return res.status(404).json({ message: 'No badge data found for the given catIds.' });
    }

    // Delete all records from cs_os_badgerecords table
    const deleteBadgeQuery = 'DELETE FROM cs_os_badgerecords WHERE 1';
    await pool.query(deleteBadgeQuery);

    let totalChangesCount = 0; // Initialize total changes count

    // Iterate over each badge data result to process each user's data
    for (const badgeDataResult of badgeDataResults) {
      const { cs_reg_cat_id, cs_badge_data } = badgeDataResult;

      // Parse the JSON data
      let parsedBadgeData;
      try {
        parsedBadgeData = JSON.parse(cs_badge_data);
      } catch (parseError) {
        console.error(`Error parsing JSON data for catId ${cs_reg_cat_id}:`, parseError);
        continue; // Skip this entry if parsing fails
      }

      let changesCount = 0; // Initialize changes count for this record

      // Iterate through the keys of Badge Data
      for (const key in parsedBadgeData) {
        if (key.includes('_status') && parsedBadgeData[key] !== '0') {
          parsedBadgeData[key] = '0';
          changesCount++;
        }
      }

      if (changesCount > 0) {
        // Convert the modified JSON data back to string
        const updatedBadgeData = JSON.stringify(parsedBadgeData);

        // Update cs_badge_data in the cs_os_badges table
        const updateBadgeQuery = `UPDATE cs_os_badges SET cs_badge_data = ? WHERE cs_reg_cat_id = ?`;
        await pool.query(updateBadgeQuery, [updatedBadgeData, cs_reg_cat_id]);

        totalChangesCount += changesCount; // Accumulate total changes count
      }
    }

    if (totalChangesCount === 0) {
      return res.status(200).json({ message: 'No data to update.' });
    }

    return res.status(200).json({ message: `Updated ${totalChangesCount} entries successfully.` });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error', error });
  }
});


//Categories API

// router.get('/getCategories', async (req, res) => {
//   try {
//     // Extract page number, page size, and search query from request query parameters
//     const { page = 1, pageSize = 10, search = '' } = req.query;
//     const offset = (page - 1) * pageSize;

//     // Define the columns to fetch including the count of cs_designation_id and cs_reg_cat_id
//     const columnsToFetch = [
//       'cs_os_category.*',
//       'COUNT(DISTINCT cs_os_users.id) AS userCount', // Changed to userCount for accurate counting
//       'COUNT(DISTINCT cs_tbl_category_designation.cs_designation_id) AS designationCount'
//     ];

//     // Construct the SQL query to fetch specific columns with pagination, search, and counts
//     let query = `
//       SELECT ${columnsToFetch.join(', ')}
//       FROM cs_os_category
//       LEFT JOIN cs_os_users ON cs_os_category.cs_reg_cat_id = cs_os_users.cs_reg_cat_id
//       LEFT JOIN cs_tbl_category_designation ON cs_os_category.cs_reg_cat_id = cs_tbl_category_designation.cs_reg_cat_id
//       WHERE 1
//     `;

//     // Append search condition if search query is provided
//     if (search) {
//       query += `
//         AND cs_os_category.cs_reg_category LIKE '%${search}%'
//       `;
//     }

//     // Group by category to get counts for each category
//     query += `
//       GROUP BY cs_os_category.cs_reg_cat_id
//     `;

//     // Append pagination
//     query += `
//       LIMIT ${pageSize} OFFSET ${offset}
//     `;

//     // Execute the query to fetch category data from the table
//     const [categoryData] = await pool.query(query);

//     // Construct the total count query with the search condition
//     const totalCountQuery = `
//       SELECT COUNT(*) AS totalCount
//       FROM cs_os_category
//       WHERE 1
//     `;

//     // Append search condition if search query is provided
//     if (search) {
//       totalCountQuery += `
//       AND cs_os_category.cs_reg_category LIKE '%${search}%'
//       `;
//     }

//     // Execute the total count query
//     const [totalCountResult] = await pool.query(totalCountQuery);
//     const totalItems = totalCountResult[0].totalCount;

//     // Log the count of users and designations for each category to the console
//     categoryData.forEach(category => {
//       console.log(`Category: ${category.cs_reg_category}, User Count: ${category.userCount}, Designation Count: ${category.designationCount}`);
//     });

//     // Send the category data and total count of items as a response
//     res.json({ categories: categoryData, totalItems, currentPage: parseInt(page), pageSize });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

router.get('/getCategories', verifyToken, async (req, res) => {
  try {
    // Extract page number, page size, and search query from request query parameters
    const { sortColumn = 'cs_reg_cat_id', sortOrder = 'DESC' } = req.query;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * pageSize;

    const validColumns = ['cs_reg_cat_id', 'cs_reg_category', 'cs_status', 'userCount'];  // Add all valid column names here
    const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'cs_reg_cat_id';

    // Define the columns to fetch including the count of cs_designation_id and cs_reg_cat_id
    const columnsToFetch = [
      'cs_os_category.*',
      'COUNT(DISTINCT cs_os_users.id) AS userCount',
      'COUNT(DISTINCT cs_tbl_category_designation.cs_designation_id) AS designationCount'
    ];

    // Construct the SQL query to fetch specific columns with pagination, search, and counts
    let query = `
      SELECT ${columnsToFetch.join(', ')}
      FROM cs_os_category
      LEFT JOIN cs_os_users ON cs_os_category.cs_reg_cat_id = cs_os_users.cs_reg_cat_id
      LEFT JOIN cs_tbl_category_designation ON cs_os_category.cs_reg_cat_id = cs_tbl_category_designation.cs_reg_cat_id
       WHERE 1
    `;

    // Append search condition if search query is provided
    if (search) {
      query += `
        AND cs_os_category.cs_reg_category LIKE ?
      `;
    }

    // Group by category to get counts for each category
    query += `
      GROUP BY cs_os_category.cs_reg_cat_id
      ORDER BY ${columnToSortBy} ${sortOrder}

    `;

    // Append pagination
    query += `
      LIMIT ? OFFSET ?
    `;

    // Prepare query parameters
    const queryParams = [];
    if (search) {
      queryParams.push(`%${search}%`);
    }
    queryParams.push(pageSize, offset);

    // Execute the query to fetch category data from the table
    const [categoryData] = await pool.query(query, queryParams);

    // Construct the total count query with the search condition
    let totalCountQuery = `
      SELECT COUNT(*) AS totalCount
      FROM cs_os_category
       WHERE cs_status = 1
    `;

    // Append search condition if search query is provided
    if (search) {
      totalCountQuery += `
        AND cs_os_category.cs_reg_category LIKE ?
      `;
    }

    // Prepare count query parameters
    const countQueryParams = [];
    if (search) {
      countQueryParams.push(`%${search}%`);
    }

    // Execute the total count query
    const [totalCountResult] = await pool.query(totalCountQuery, countQueryParams);
    const totalItems = totalCountResult[0].totalCount;

    // Log the count of users and designations for each category to the console
    categoryData.forEach(category => {
      console.log(`Category: ${category.cs_reg_category}, User Count: ${category.userCount}, Designation Count: ${category.designationCount}`);
    });

    // Send the category data and total count of items as a response
    res.json({ categories: categoryData, totalItems, currentPage: page, pageSize });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});







router.post('/addcategory', verifyToken, async (req, res) => {
  try {
    const { catName, onsite, registration } = req.body;

    console.log(req.body);

    // Construct the SQL query to insert a new category into the cs_os_category table
    const insertCategoryQuery = `
      INSERT INTO cs_os_category (cs_reg_category, cs_show_conference_form, cs_show_spot_form)
      VALUES (?, ?, ?)
    `;

    // Execute the query to insert the new category into the cs_os_category table
    await pool.query(insertCategoryQuery, [catName, registration, onsite]);

    // // Retrieve the last inserted category_id
    const catIdResult = await pool.query('SELECT LAST_INSERT_ID() AS cs_reg_cat_id FROM cs_os_category');
    const catId = catIdResult[0][0].cs_reg_cat_id;

    console.log(catId);

    const insertAccessquery = `INSERT INTO cs_app_access (cs_reg_cat_id, page_id) VALUES (?, ?)`;

    await pool.query(insertAccessquery, [catId, 1]);



    // // Construct the SQL query to insert the new category_id and corresponding designation into the cs_tbl_category_designation table
    // const insertDesignationQuery = `
    //   INSERT INTO cs_tbl_category_designation (cs_reg_cat_id, cs_designation_name, created_at, updated_at)
    //   VALUES (?, ?, NOW(), NOW())
    // `;

    // // Iterate over the designations array and insert each designation for the category
    // for (const designation of designations) {
    //   await pool.query(insertDesignationQuery, [catId, designation]);
    // }

    // // Retrieve facility IDs from the cs_os_facility_detail table
    // const facilityIdQuery = `SELECT cs_facility_detail_id FROM cs_os_facility_detail`;
    // const facilityIdResult = await pool.query(facilityIdQuery);
    // const facilityIds = facilityIdResult[0].map(row => row.cs_facility_detail_id);

    // // Construct the detailquery for each facility and execute the INSERT statement
    // for (const facilityId of facilityIds) {
    //   const insertFacilityCategoryQuery = `
    //     INSERT INTO cs_os_facility_category (cs_facility_detail_id, cs_reg_cat_id, cs_allow_count, cs_status)
    //     VALUES (?, ?, 0, ?)
    //   `;
    //   await pool.query(insertFacilityCategoryQuery, [facilityId, catId, status]);
    // }

    res.status(201).json({ message: 'Category and corresponding designations added successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
});



router.post('/check-category', verifyToken, async (req, res) => {
  const { catName } = req.body;

  console.log(catName);
  try {
    // Execute SQL query to check if email exists in the database
    const [users] = await pool.query('SELECT * FROM cs_os_category WHERE cs_reg_category = ?', [catName]);

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


router.post('/editcategory', verifyToken, async (req, res) => {
  try {
    // Extract catId from the request body
    const { catId } = req.body;

    // Construct the SQL query with a join operation
    let query = `
    SELECT DISTINCT cs_os_category.*, cs_tbl_category_designation.cs_designation_name, cs_tbl_category_designation.cs_designation_id
    FROM cs_os_category
    LEFT JOIN cs_tbl_category_designation ON cs_os_category.cs_reg_cat_id = cs_tbl_category_designation.cs_reg_cat_id
    WHERE cs_os_category.cs_reg_cat_id = ${catId};
    `;


    // Execute the query to fetch data
    const [categoryData] = await pool.query(query);

    // // Log cs_designation_name
    // categoryData.forEach(category => {
    //   console.log('cs_designation_name:', category.cs_designation_name);
    // });


    // Send the data as a response
    res.json(categoryData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/updatecategory', verifyToken, async (req, res) => {
  try {
    // Extract values, catId, and designations from the request body
    const { categoryName, onsite, registration, catId } = req.body;

    console.log(req.body);

    // Update the cs_os_category table
    const updateQuery = `
    UPDATE cs_os_category 
    SET 
      cs_reg_category = ?,
      cs_show_spot_form = ?,
      cs_show_conference_form = ?
      WHERE 
      cs_reg_cat_id = ?
  `;

    // Execute the update query for cs_os_category
    await pool.query(updateQuery, [categoryName, onsite, registration, catId]);

    //   // Construct the SQL query to insert the new category_id and corresponding designation into the cs_tbl_category_designation table
    //   const insertDesignationQuery = `
    //       INSERT INTO cs_tbl_category_designation (cs_reg_cat_id, cs_designation_name, created_at, updated_at)
    //       VALUES (?, ?, NOW(), NOW())
    //     `;

    //   // Iterate over the designations array and insert each designation for the category
    //   for (const newdesignation of newdesignations) {
    //     await pool.query(insertDesignationQuery, [catId, newdesignation]);
    //   }

    //   const deleteDesignationQuery = `
    //   DELETE FROM cs_tbl_category_designation WHERE cs_designation_id = ?
    // `;

    //   // Iterate over the designations array and insert each designation for the category
    //   for (const deletedesignation of delDesignations) {
    //     await pool.query(deleteDesignationQuery, deletedesignation);
    //   }



    //   // Update the cs_tbl_category_designation table for each designation
    //   for (const designation of designations) {
    //     const { id, name } = designation;



    //     const updateDesignationQuery = `
    //     UPDATE cs_tbl_category_designation
    //     SET
    //       cs_designation_name = ?,
    //       updated_at = ?
    //     WHERE
    //       cs_designation_id = ? 
    //     `;
    //     await pool.query(updateDesignationQuery, [name, currentTimestamp, id]);
    //   }

    // Send success response
    return res.status(200).json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Error updating category:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});



router.delete('/deletecategory/:catId', verifyToken, async (req, res) => {
  const { catId } = req.params;

  try {
    // Delete from cs_os_workshop table
    const deleteQuery = 'DELETE FROM cs_os_category WHERE cs_reg_cat_id = ?';
    await pool.query(deleteQuery, [catId]);

    const deleteQuery1 = 'DELETE FROM cs_tbl_category_designation WHERE cs_reg_cat_id = ?';
    await pool.query(deleteQuery1, [catId]);

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting Category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// router.put('/UpdateStatus', async (req, res) => {
//   try {
//     // Extract role_id from the request body
//     const {Id ,newCatid, status } = req.body;

//     console.log(req.body);

//     const selectCatIdQuery = `SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?`;
//     const [catIdResult] = await pool.query(selectCatIdQuery, [Id]);

//     // Extract the category name
//     const categoryName = catIdResult[0].cs_reg_category;
//     console.log("Category Name:", categoryName);


//     const updateQuery = `UPDATE cs_os_category SET cs_status = ? WHERE cs_reg_cat_id = ?`;
//     await pool.query(updateQuery, [status, Id]);

//     const updateQuery1 = `UPDATE cs_os_access_status SET cs_status = ? WHERE cs_role_id = ?`;
//     await pool.query(updateQuery1, [status, Id]);


//         // Retrieve cs_facility_detail_id from cs_os_facility_detail
//         const selectQuery = `SELECT cs_facility_detail_id FROM cs_os_facility_category WHERE cs_reg_cat_id = ?`;
//         const [detailIdResults] = await pool.query(selectQuery, [Id]);

//         // Extract cs_facility_detail_id values from the result
//         const csFacilityDetailIds = detailIdResults.map(result => result.cs_facility_detail_id);

//         // Execute the second update query for cs_os_facility_detail for each cs_facility_detail_id
//         for (const csFacilityDetailId of csFacilityDetailIds) {
//           // Update cs_status in cs_os_facility_category based on current csFacilityDetailId
//           const updateQuery3 = `UPDATE cs_os_facility_category SET cs_status = ? WHERE cs_reg_cat_id = ?`;
//           await pool.query(updateQuery3, [status, Id]);
//         }

//         const selectUsersQuery = `SELECT cs_regno FROM cs_os_users WHERE cs_reg_cat_id = ?`;
//         const [users] = await pool.query(selectUsersQuery, [Id]);
//         for (const user of users) {
//           const cs_regno = user.cs_regno;
//           const selectBadgesQuery = `SELECT cs_badge_data FROM cs_os_badges WHERE cs_regno = ?`;
//       const [badgeResults] = await pool.query(selectBadgesQuery, [cs_regno]);
//         }   








//     return res.status(200).json({ message: 'Status Updates succesffuly' });
//   } catch (error) {
//     console.error('Error updating status:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// });


// router.put('/UpdateStatus',queueMiddleware,verifyToken, async (req, res) => {
//   try {
//     // Extract Id, newCatid, and status from the request body
//     const { Id, newCatid, status } = req.body;

//     console.log(req.body);



//     // Retrieve users from cs_os_users where cs_reg_cat_id = Id
//     const selectUsersQuery = `SELECT cs_regno,cs_reg_type,cs_workshop_category,cs_isbadge_created FROM cs_os_users WHERE cs_reg_cat_id = ?`;
//     const [users] = await pool.query(selectUsersQuery, [Id]);

//     // Update cs_status in cs_os_category based on Id
//     const updateCategoryQuery = `UPDATE cs_os_category SET cs_status = ? WHERE cs_reg_cat_id = ?`;
//     await pool.query(updateCategoryQuery, [status, Id]);

//     // Update cs_status in cs_os_access_status based on Id
//     const updateAccessStatusQuery = `UPDATE cs_os_access_status SET cs_status = ? WHERE cs_role_id = ?`;
//     await pool.query(updateAccessStatusQuery, [status, Id]);


//     if (status === 0) {
//       const selectCatIdQuery = `SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?`;
//       const [catIdResult] = await pool.query(selectCatIdQuery, [newCatid]);

//       // Extract the category name
//       const categoryName = catIdResult[0].cs_reg_category;
//       console.log("Category Name:", categoryName);

//       for (const user of users) {
//         const cs_regno = user.cs_regno;
//         const cs_reg_type = user.cs_reg_type;
//         const cs_workshop_category = user.cs_workshop_category;

//         // Update cs_reg_cat_id in cs_os_badges based on cs_regno
//         // const updateBadgesQuery = `UPDATE cs_os_badges SET cs_reg_cat_id = ? WHERE cs_regno = ?`;
//         // await pool.query(updateBadgesQuery, [newCatid, cs_regno]);

//         // Update badge data in cs_os_badges based on cs_regno
//         const selectBadgesQuery = `SELECT cs_badge_data FROM cs_os_badges WHERE cs_regno = ?`;
//         const [badgeResults] = await pool.query(selectBadgesQuery, [cs_regno]);

//         if (badgeResults.length > 0) {
//           const badgeDataresult = badgeResults[0].cs_badge_data;
//           let parsedBadgeData = {};

//           if (badgeDataresult) {
//             parsedBadgeData = JSON.parse(badgeDataresult);
//           }


//           const [rows] = await pool.query(`
//             SELECT fd.cs_facility_name, fc.cs_allow_count, fd.cs_facility_id
//             FROM cs_os_facility_category fc
//             JOIN cs_os_facility_detail fd ON fc.cs_facility_detail_id = fd.cs_facility_detail_id
//             WHERE fc.cs_reg_cat_id = ? AND fd.cs_status = 1
//           `, [newCatid]);

//           // Initialize badgeData object for each user
//           const badgeData = {};



//           if (cs_reg_type && cs_reg_type !== "101") {
//             console.log("Processing daywise data");

//             for (const row of rows) {
//               const facilityName = row.cs_facility_name;
//               const allowCount = row.cs_allow_count;
//               const facilityId = row.cs_facility_id;

//               const [typeRows] = await pool.query(`
//                 SELECT cs_type 
//                 FROM cs_os_facilitytype 
//                 WHERE cs_facility_id = ?
//               `, [facilityId]);

//               const facilityType = typeRows[0]?.cs_type;

//               if (facilityType === 'workshop') {
//                 const [workshopRows] = await pool.query(`
//                   SELECT cs_workshop_id 
//                   FROM cs_os_workshop 
//                   WHERE cs_facility_id = ? 
//                 `, [facilityId]);

//                 const workshopId = workshopRows[0]?.cs_workshop_id;
//                 if (workshopId === cs_workshop_category) {
//                   badgeData[facilityName] = allowCount;
//                   badgeData[facilityName + '_status'] = "0";
//                 } else {
//                   badgeData[facilityName] = "0";
//                   badgeData[facilityName + '_status'] = "0";
//                 }
//               } else {
//                 if (facilityName.includes(cs_reg_type) || !/\d$/.test(facilityName)) {
//                   // Facility matches, set the count fetched from the table
//                   badgeData[facilityName] = allowCount;
//                   // Set the status to "0" for each facility
//                   badgeData[facilityName + '_status'] = "0";
//                 } else {
//                   // Facility doesn't match, set count to 0
//                   badgeData[facilityName] = "0";
//                   // Set the status to "0" for each facility
//                   badgeData[facilityName + '_status'] = "0";
//                 }
//               }
//             }
//           } else {
//             console.log("Processing all-day data");

//             for (const row of rows) {
//               const facilityName = row.cs_facility_name;
//               const allowCount = row.cs_allow_count;
//               const facilityId = row.cs_facility_id;

//               const [typeRows] = await pool.query(`
//                 SELECT cs_type 
//                 FROM cs_os_facilitytype 
//                 WHERE cs_facility_id = ?
//               `, [facilityId]);

//               const facilityType = typeRows[0]?.cs_type;

//               if (facilityType === 'workshop') {
//                 const [workshopRows] = await pool.query(`
//                   SELECT cs_workshop_id 
//                   FROM cs_os_workshop 
//                   WHERE cs_facility_id = ? 
//                 `, [facilityId]);

//                 const workshopId = workshopRows[0]?.cs_workshop_id;
//                 if (workshopId === cs_workshop_category) {
//                   badgeData[facilityName] = allowCount;
//                   badgeData[facilityName + '_status'] = "0";
//                 } else {
//                   badgeData[facilityName] = "0";
//                   badgeData[facilityName + '_status'] = "0";
//                 }
//               } else {
//                 badgeData[facilityName] = allowCount;
//                 badgeData[facilityName + '_status'] = "0";
//               }
//             }
//           }

//           // const updatedBadgeDataString = JSON.stringify(parsedBadgeData);
//           const updateBadgeDataQuery = `UPDATE cs_os_badges SET cs_badge_data = ? WHERE cs_regno = ?`;
//           await pool.query(updateBadgeDataQuery, [JSON.stringify(badgeData), cs_regno]);



//         }
//         const updateUserQuery = `UPDATE cs_os_users SET cs_reg_cat_id = ?, cs_reg_category = ? WHERE cs_regno = ?`;
//           await pool.query(updateUserQuery, [newCatid, categoryName, cs_regno]);
//       }

//     }

//     return res.status(200).json({ message: 'Status updated successfully' });
//   } catch (error) {
//     console.error('Error updating status:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// });


router.put('/UpdateStatus', queueMiddleware, verifyToken, async (req, res) => {
  try {
    // Extract Id, newCatid, and status from the request body
    const { Id, newCatid, status } = req.body;

    console.log(req.body);

    // Retrieve users from cs_os_users where cs_reg_cat_id = Id
    const selectUsersQuery = `SELECT id,cs_regno, cs_reg_type, cs_workshop_category FROM cs_os_users WHERE cs_reg_cat_id = ?`;
    const [users] = await pool.query(selectUsersQuery, [Id]);

    // Update cs_status in cs_os_category based on Id
    const updateCategoryQuery = `UPDATE cs_os_category SET cs_status = ? WHERE cs_reg_cat_id = ?`;
    await pool.query(updateCategoryQuery, [status, Id]);

    // // Update cs_status in cs_os_access_status based on Id
    // const updateAccessStatusQuery = `UPDATE cs_os_access_status SET cs_status = ? WHERE cs_role_id = ?`;
    // await pool.query(updateAccessStatusQuery, [status, Id]);

    if (status === 0) {
      const selectCatIdQuery = `SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?`;
      const [catIdResult] = await pool.query(selectCatIdQuery, [newCatid]);

      // Extract the category name
      const categoryName = catIdResult[0].cs_reg_category;
      console.log("Category Name:", users);



      for (const user of users) {
        const cs_regno = user.cs_regno;
        const id = user.id;
        const cs_reg_type = user.cs_reg_type;
        const cs_workshop_category = user.cs_workshop_category;

        // Update badge data in cs_os_badges based on cs_regno
        const selectBadgesQuery = `SELECT cs_badge_data FROM cs_os_badges WHERE cs_regno = ?`;
        const [badgeResults] = await pool.query(selectBadgesQuery, [cs_regno]);

        let badgeData = {};

        if (badgeResults.length > 0) {
          const badgeDataresult = badgeResults[0].cs_badge_data;
          let parsedBadgeData = {};

          if (badgeDataresult) {
            parsedBadgeData = JSON.parse(badgeDataresult);
          }

          const [rows] = await pool.query(`
            SELECT fd.cs_facility_name, fc.cs_allow_count, fd.cs_facility_id
            FROM cs_os_facility_category fc
            JOIN cs_os_facility_detail fd ON fc.cs_facility_detail_id = fd.cs_facility_detail_id
            WHERE fc.cs_reg_cat_id = ? AND fd.cs_status = 1
          `, [newCatid]);

          if (cs_reg_type && cs_reg_type !== "101") {
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
                if (workshopId === cs_workshop_category) {
                  badgeData[facilityName] = allowCount;
                  badgeData[facilityName + '_status'] = "0";
                } else {
                  badgeData[facilityName] = "0";
                  badgeData[facilityName + '_status'] = "0";
                }
              } else {
                if (facilityName.includes(cs_reg_type) || !/\d$/.test(facilityName)) {
                  badgeData[facilityName] = allowCount;
                  badgeData[facilityName + '_status'] = "0";
                } else {
                  badgeData[facilityName] = "0";
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
                if (workshopId === cs_workshop_category) {
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

          const updateBadgeDataQuery = `UPDATE cs_os_badges SET cs_badge_data = ? WHERE cs_regno = ?`;
          await pool.query(updateBadgeDataQuery, [JSON.stringify(badgeData), cs_regno]);
          const updateUserQuery = `UPDATE cs_os_users SET cs_reg_cat_id = ?, cs_reg_category = ? WHERE cs_regno = ?`;
          await pool.query(updateUserQuery, [newCatid, categoryName, cs_regno]);
        } else {
          const updateUserQuery = `UPDATE cs_os_users SET cs_reg_cat_id = ?, cs_reg_category = ? WHERE id = ?`;
          await pool.query(updateUserQuery, [newCatid, categoryName, id]);
        }



        // Always update user details


      }

    } else {
      // Handle cases where status is not 0 if needed
    }

    return res.status(200).json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});



// Type from cs_os_field_type
router.get('/getCat', verifyToken, async (req, res) => {
  try {


    const columnsToFetch = ['*'];

    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
    SELECT ${columnsToFetch}
    FROM cs_os_category
    WHERE cs_status = 1 
      AND cs_reg_cat_id NOT IN (0)
  `;

    // Execute the query to fetch field data from the table
    const [catData] = await pool.query(query);

    let product =
      `SELECT product_id, cs_status
      FROM cs_ad_products
      WHERE cs_status = 1
    `;

    const [prodData] = await pool.query(product);



    res.json({ Types: catData, prodData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


























module.exports = router;