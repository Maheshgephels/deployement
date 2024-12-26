const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const moment = require('moment-timezone');
const verifyToken =require ('../api/middleware/authMiddleware');

// router.get('/scannedFacilityRecords', async (req, res) => {
//     try {
//         const query = `
//             SELECT 
//                 b.*,
//                 u.cs_title,
//                 u.cs_first_name,
//                 u.cs_last_name,
//                 u.cs_reg_category
//             FROM 
//                 cs_os_badgerecords b
//             INNER JOIN 
//                 cs_os_users u ON b.cs_regno = u.cs_regno
//         `;

//         const [rows, fields] = await db.execute(query);

//         // Assuming rows is an array of records
//         res.json(rows);
//     } catch (err) {
//         console.error("Error fetching scanned facility records:", err);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });

router.get('/scannedFacilityRecords', verifyToken, async (req, res) => {
    try {
      // Extract page number, page size, search query, and facility type from request query parameters
      const { page = 1, pageSize = 10, search = '', facilityType } = req.query;
      const offset = (page - 1) * pageSize;
  
      // Construct the base query to fetch data with a JOIN between the two tables
      let query = `
        SELECT 
          b.*, 
          u.cs_title, 
          u.cs_first_name, 
          u.cs_last_name, 
          u.cs_reg_category 
        FROM 
          cs_os_badgerecords b 
        INNER JOIN 
          cs_os_users u 
        ON 
          b.cs_regno = u.cs_regno
        WHERE 
          1 = 1
      `;
  
      const queryParams = [];
  
      // Append search conditions if search query is provided
      if (search) {
        query += `
          AND (
            u.cs_first_name LIKE ? 
            OR b.cs_regno LIKE ? 
            OR u.cs_last_name LIKE ? 
            OR u.cs_reg_category LIKE ? 
            OR u.cs_title LIKE ?
            OR b.cs_deviceid LIKE ?
          )
        `;
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      }
  
      // Append facilityType condition if it's provided
      if (facilityType) {
        query += ` AND b.cs_type = ? `;
        queryParams.push(facilityType);
      }
  
      // Append pagination to the query
      query += ` LIMIT ? OFFSET ? `;
      queryParams.push(parseInt(pageSize), offset);
  
      // Execute the main query to fetch the data
      const [userData] = await pool.query(query, queryParams);
  
      // Count total records for pagination (with/without search/filter)
      let totalItemsQuery = `
        SELECT COUNT(*) AS total 
        FROM cs_os_badgerecords b 
        INNER JOIN cs_os_users u ON b.cs_regno = u.cs_regno
        WHERE 1 = 1
      `;
  
      const countParams = [];
  
      // Apply the same conditions to the total count query
      if (search) {
        totalItemsQuery += `
          AND (
            u.cs_first_name LIKE ? 
            OR b.cs_regno LIKE ? 
            OR u.cs_last_name LIKE ? 
            OR u.cs_reg_category LIKE ? 
            OR u.cs_title LIKE ?
            OR b.cs_deviceid LIKE ?
          )
        `;
        const searchPattern = `%${search}%`;
        countParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      }
  
      if (facilityType) {
        totalItemsQuery += ` AND b.cs_type = ? `;
        countParams.push(facilityType);
      }
  
      // Execute the query to get the total number of items
      const [totalCountResult] = await pool.query(totalItemsQuery, countParams);
      const totalItems = totalCountResult[0].total;
      const totalPages = Math.ceil(totalItems / pageSize);
  
      // Send the response with fetched data and pagination info
      res.json({
        categories: userData,
        currentPage: parseInt(page),
        totalPages,
        pageSize,
        totalItems
      });
  
    } catch (error) {
      console.error('Query Error:', error); // Log query error for debugging
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  

module.exports = router;
