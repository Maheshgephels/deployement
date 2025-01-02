const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const verifyToken = require('../api/middleware/authMiddleware');


router.get('/getusers',verifyToken, async (req, res) => {
    try {
      // Extract page number, page size, and search query from request query parameters

      console.log("hiii");
      const { page = 1, pageSize = 10, search = '', sortColumn = 'ticket_id', sortOrder = 'DESC' } = req.query;
      const offset = (page - 1) * pageSize;
  
      const validColumns = ['id', 'cs_first_name', 'cs_last_name', 'cs_reg_category', 'cs_title', 'cs_workshop_category', 'cs_country', 'cs_state', 'cs_city', 'cs_email', 'cs_address', 'cs_phone', 'cs_company_name', 'cs_reg_type', 'cs_status']; // Add all valid column names here
      const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'id';
  
  
      const columnsToFetch = ['cs_first_name', 'cs_last_name','cs_city', 'cs_email' , 'cs_phone','cs_regno','cs_ticket','partner_assigned','COUNT(DISTINCT cs_os_users.id) AS userCount'];
  
      // Construct the SQL query to fetch specific columns with pagination and search
      let query = `
      SELECT ${columnsToFetch}, id, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at, cs_status, cs_isduplicate
      FROM cs_os_users
      WHERE cs_isconfirm = 1 AND is_twinsharing = 1
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
      // Append pagination
      query += `
        GROUP BY cs_os_users.id
        ORDER BY ${columnToSortBy} ${sortOrder}
        LIMIT ${pageSize} OFFSET ${offset}
      `;
  
      // Execute the query to fetch user data from the table
      const [userData] = await pool.query(query);

      // console.log("UserData", userData);

  
      // Send the user data as a response along with pagination metadata
      let totalItems = 0;
      let totalPages = 0;
  
      if (!search) {
        const totalCountQuery = 'SELECT COUNT(*) AS total FROM cs_os_users WHERE cs_isconfirm = 1 AND is_twinsharing = 1';
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


  router.post('/notassigneduser', verifyToken, async (req, res) => {
    try {
        // Extract the ticketId and userId from the request body
        const { ticketId, userid, allocated } = req.body;

        // Log the incoming request data
        console.log("Request Body:", req.body);
        console.log("ticketId:", ticketId);
        console.log("userid:", userid);
        console.log("allocated:", allocated);

        const columnsToFetch = ['cs_first_name', 'cs_last_name', 'cs_city', 'cs_email', 'cs_phone', 'cs_regno', 'cs_ticket', 'partner_assigned'];

        let query;
        let queryParams = [ticketId, userid];

        if (allocated === 1) {
            // Find the p2_userid from cs_reg_partner where p1_userid is the current userid
            const partnerQuery = `
                SELECT 
                    CASE 
                        WHEN p1_userid = ? THEN p2_userid
                        WHEN p2_userid = ? THEN p1_userid
                    END AS partner_id
                FROM cs_reg_partner
                WHERE p1_userid = ? OR p2_userid = ?
            `;
            
            console.log("Executing partnerQuery with parameters:", [userid, userid, userid, userid]);
            const [partnerData] = await pool.query(partnerQuery, [userid, userid, userid, userid]);

            console.log("partnerData:", partnerData);

            // If no partner found for the given userid, return an error
            if (partnerData.length === 0 || !partnerData[0].partner_id) {
                return res.status(404).json({ message: 'No partner assigned for the given user ID' });
            }

            // Get the partner_id from the query result (either p1_userid or p2_userid)
            const partnerId = partnerData[0].partner_id;
            console.log("partnerId:", partnerId);

            // Modify the main query to check for p2_userid and exclude the current userid
            query = `
                SELECT ${columnsToFetch}, id, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at, cs_status, cs_isduplicate
                FROM cs_os_users
                WHERE cs_isconfirm = 1 
                AND is_twinsharing = 1 
                AND partner_assigned = 0
                AND cs_ticket = ? 
                AND id != ? 
                OR id = ? 
            `;
            
            queryParams.push(partnerId); // Add partnerId to query parameters

        } else {
            // Default query when allocated is not 1
            query = `
                SELECT ${columnsToFetch}, id, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at, cs_status, cs_isduplicate
                FROM cs_os_users
                WHERE cs_isconfirm = 1 
                AND is_twinsharing = 1 
                AND partner_assigned = 0 
                AND cs_ticket = ? 
                AND id != ?
            `;
        }

        // Log the final query and parameters before execution
        console.log("Executing final query:", query);
        console.log("With query parameters:", queryParams);

        // Execute the final query
        const [userData] = await pool.query(query, queryParams);

        // Log user data for debugging
        console.log("userData:", userData);

        // If no users found, return a response indicating so
        if (userData.length === 0) {
            return res.status(404).json({ message: 'No users found for the given ticket ID' });
        }

        // Send the user data as a response
        res.json({ message: 'Ticket assigned successfully', data: userData });
    } catch (error) {
        console.error("Error in notassigneduser route:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



// router.post('/edit-allocatedpartner', verifyToken, async (req, res) => {
//   try {
//       const { userId, partner1, partner2 } = req.body;

//       console.log("User ID:", userId);

//       // SQL Queries
//       const insertOrUpdatePartnerQuery = `
//           INSERT INTO cs_reg_partner 
//           (p1_userid, p1_name, p1_city, p1_email, p1_phone, 
//            p2_userid, p2_name, p2_city, p2_email, p2_phone, Ticketid, cs_status) 
//           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//           ON DUPLICATE KEY UPDATE 
//               p1_userid = VALUES(p1_userid), 
//               p1_name = VALUES(p1_name), 
//               p1_city = VALUES(p1_city), 
//               p1_email = VALUES(p1_email), 
//               p1_phone = VALUES(p1_phone), 
//               p2_userid = VALUES(p2_userid), 
//               p2_name = VALUES(p2_name), 
//               p2_city = VALUES(p2_city), 
//               p2_email = VALUES(p2_email), 
//               p2_phone = VALUES(p2_phone), 
//               Ticketid = VALUES(Ticketid), 
//               cs_status = VALUES(cs_status);
//       `;

//       const updateUserPartnerAssignedQuery = `
//           UPDATE cs_os_users 
//           SET partner_assigned = 1 
//           WHERE id = ?;
//       `;

//       // Database Transaction
//       const connection = await pool.getConnection(); // Get database connection
//       await connection.beginTransaction(); // Start transaction

//       // Insert or update partner details
//       await connection.query(insertOrUpdatePartnerQuery, [
//           partner1.id,  `${partner1.cs_first_name} ${partner1.cs_last_name}`, partner1.cs_city, partner1.cs_email, partner1.cs_phone,
//           partner2.id, `${partner2.cs_first_name} ${partner2.cs_last_name}`, partner2.cs_city, partner2.cs_email, partner2.cs_phone,
//           partner1.cs_ticket, partner1.cs_status
//       ]);

//       // Update `partner_assigned` for both partners in `cs_os_users`
//       await connection.query(updateUserPartnerAssignedQuery, [partner1.id]);
//       await connection.query(updateUserPartnerAssignedQuery, [partner2.id]);

//       // Commit transaction
//       await connection.commit();

//       res.json({ message: 'Ticket assigned successfully' });
//   } catch (error) {
//       console.error('Error assigning partners:', error);

//       // Rollback transaction on error
//       if (connection) await pool.rollback();

//       res.status(500).json({ message: 'Internal server error' });
//   }
// });

router.post('/edit-allocatedpartner', verifyToken, async (req, res) => {
  let connection;
  try {
      const { userId, partner1, partner2 } = req.body;

      connection = await pool.getConnection(); // Get database connection

      // Check if the userId exists in p1_userid or p2_userid
      const checkUserQuery = `
          SELECT * 
          FROM cs_reg_partner 
          WHERE p1_userid = ? OR p2_userid = ?;
      `;
      const [existingPartner] = await connection.query(checkUserQuery, [userId, userId]);

      let removedPartnerId = null;

      if (existingPartner.length > 0) {
          // User ID already exists in the partners table
          const existingRecord = existingPartner[0];

          if (existingRecord.p1_userid === userId) {
              // Update partner 1 with partner2's new details
              removedPartnerId = existingRecord.p1_userid;
              existingRecord.p1_userid = partner2.id;
              existingRecord.p1_name = `${partner2.cs_first_name} ${partner2.cs_last_name}`;
              existingRecord.p1_city = partner2.cs_city;
              existingRecord.p1_email = partner2.cs_email;
              existingRecord.p1_phone = partner2.cs_phone;
          } else if (existingRecord.p2_userid === userId) {
              // Update partner 2 with partner1's new details
              removedPartnerId = existingRecord.p2_userid;
              existingRecord.p2_userid = partner1.id;
              existingRecord.p2_name = `${partner1.cs_first_name} ${partner1.cs_last_name}`;
              existingRecord.p2_city = partner1.cs_city;
              existingRecord.p2_email = partner1.cs_email;
              existingRecord.p2_phone = partner1.cs_phone;
          }

          // Update the partner details in the database
          const updatePartnerQuery = `
              UPDATE cs_reg_partner 
              SET 
                  p1_userid = ?, p1_name = ?, p1_city = ?, p1_email = ?, p1_phone = ?, 
                  p2_userid = ?, p2_name = ?, p2_city = ?, p2_email = ?, p2_phone = ?, 
                  Ticketid = ?, cs_status = ?
              WHERE p_id = ?;
          `;
          await connection.query(updatePartnerQuery, [
              existingRecord.p1_userid, existingRecord.p1_name, existingRecord.p1_city, existingRecord.p1_email, existingRecord.p1_phone,
              existingRecord.p2_userid, existingRecord.p2_name, existingRecord.p2_city, existingRecord.p2_email, existingRecord.p2_phone,
              partner1.cs_ticket, partner1.cs_status, existingRecord.p_id
          ]);
      } else {
          // Insert new partner details if no existing record is found
          const insertPartnerQuery = `
              INSERT INTO cs_reg_partner 
              (p1_userid, p1_name, p1_city, p1_email, p1_phone, 
               p2_userid, p2_name, p2_city, p2_email, p2_phone, Ticketid, cs_status) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
          `;
          await connection.query(insertPartnerQuery, [
              partner1.id, `${partner1.cs_first_name} ${partner1.cs_last_name}`, partner1.cs_city, partner1.cs_email, partner1.cs_phone,
              partner2.id, `${partner2.cs_first_name} ${partner2.cs_last_name}`, partner2.cs_city, partner2.cs_email, partner2.cs_phone,
              partner1.cs_ticket, partner1.cs_status
          ]);
      }

      // Update `partner_assigned` status in `cs_os_users`
      const updatePartnerAssignedQuery = `
          UPDATE cs_os_users 
          SET partner_assigned = CASE WHEN id = ? THEN 1 WHEN id = ? THEN 0 ELSE partner_assigned END 
          WHERE id IN (?, ?);
      `;
      await connection.query(updatePartnerAssignedQuery, [
          partner1.id, removedPartnerId, partner1.id, removedPartnerId
      ]);

      await connection.query(updatePartnerAssignedQuery, [
          partner2.id, removedPartnerId, partner2.id, removedPartnerId
      ]);

      // Commit the transaction
      await connection.commit();

      res.json({ message: 'Partner details updated successfully.' });
  } catch (error) {
      console.error('Error updating partner details:', error);

      if (connection) await connection.rollback();

      res.status(500).json({ message: 'Internal server error.' });
  } finally {
      if (connection) connection.release(); // Release the database connection
  }
});




router.get('/partners', verifyToken, async (req, res) => {
  try {
      // Query to get all data from the cs_reg_partner table
      // const [rows] = await pool.promise().query('SELECT * FROM cs_reg_partner');
      const totalCountQuery = 'SELECT * FROM cs_reg_partner';
      const [totalCountResult] = await pool.query(totalCountQuery);
      console.log("rows",totalCountResult);
      res.status(200).json(totalCountResult);
  } catch (error) {
      // Enhanced error logging
      console.error("Error fetching partners from cs_reg_partner table:", error.message);
      res.status(500).json({ message: "Error fetching partners data", error: error.message });
  }
});





  


module.exports = router;