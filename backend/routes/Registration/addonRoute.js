const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const verifyToken = require('../api/middleware/authMiddleware');


router.get('/getDropdownData', verifyToken, async (req, res) => {
    try {
      // Specify the columns you want to fetch from each table
      console.log("hello");
      const facilitytype = ['cs_type'];
      const prefix = ['cs_prefix', 'cs_prefix_id'];
      const country = ['cs_country', 'cs_countryCode'];
      const states = ['cs_state_name', 'cs_state_id', 'cs_country_id'];
      const reg_cat = ['cs_reg_category', 'cs_reg_cat_id'];
      const work_cat = ['cs_workshop_name', 'cs_workshop_id','cs_workshoptype_id'];
      const day_type = ['cs_reg_daytype_name', 'cs_reg_daytype_id'];
      const facultytype= ['type_title', 'facultytype_id'];
      const registrationtype=['reg_typeid','cs_reg_type_name'];
      const tickets=['ticket_id','ticket_title'];
      const workshop_type = ['workshoptype_name', 'id'];

  
      const custom_data = ['cs_field_option', 'cs_field_option_value, cs_field_option_id, cs_field_id'];
  
  
      // Execute each query to fetch data from respective tables
      const [facilitytypeData] = await pool.query(`SELECT ${facilitytype.join(',')} FROM cs_os_facilitytype`);
      const [prefixData] = await pool.query(`SELECT ${prefix.join(',')} FROM cs_os_name_prefixes`);
      const [countryData] = await pool.query(`SELECT ${country.join(',')} FROM cs_tbl_country`);
      const [statesData] = await pool.query(`SELECT ${states.join(',')} FROM cs_tbl_states`);
      const [regCatData] = await pool.query(`SELECT ${reg_cat.join(',')} FROM cs_os_category WHERE cs_status = 1`);
      const [registrationcategory] = await pool.query(`SELECT ${registrationtype.join(',')} FROM cs_reg_type WHERE status = 1`);
      const [workshopData] = await pool.query(`SELECT ${work_cat.join(',')} FROM cs_os_workshop WHERE cs_status = 1`);
      const [dayTypeData] = await pool.query(`SELECT ${day_type.join(',')} FROM cs_os_reg_daytype WHERE cs_status = 1`);
      const [facultytypeData] = await pool.query(`SELECT ${facultytype.join(',')} FROM cs_app_facultytype WHERE status = 1`);
      const [ticketData] = await pool.query(`SELECT ${tickets.join(',')} FROM cs_reg_tickets`);
  
      const [customData] = await pool.query(`SELECT ${custom_data.join(',')} FROM cs_os_field_option WHERE cs_status = 1`);
      const [workshoptypeData] = await pool.query(`SELECT ${workshop_type.join(',')} FROM cs_os_workshop_type WHERE cs_status = 1`);
      console.log("workshoptypeData",workshoptypeData);
  
  
  
      // Construct the response object
      const responseData = {
        // facilityType: facilitytypeData,
        prefix: prefixData,
        country: countryData,
        states: statesData,
        regCategory: regCatData,
        workshop: workshopData,
        dayType: dayTypeData,
        facultytype:facultytypeData,
        custom: customData,
        regtype :registrationcategory,
        tickets : ticketData,
        workshoptype: workshoptypeData
      };
  
      // Send the response containing data from all queries
      res.json(responseData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  router.post('/addaddon', verifyToken, async (req, res) => {
    try {
        // Extract fields from the request body
        const {
            tickets, // This will be an array, e.g., [1]
            addonTitle,
            addonDescription,
            addonCategory,
            workshopDetails,
            accompanySeatType,
            accpseatNumber,
            seatType,
            seatCount,
            ticketStatus,
            durations,
            isVisible,
            priceType,
            addonTicketIds,
            workshoptype,
        } = req.body;

        console.log("addon",req.body);

        // Convert tickets array to a string in the format {1}
        const ticketString = `{${tickets.join(',')}}`;

        // Construct the SQL query to insert a new addon
        const addonQuery = `
            INSERT INTO cs_reg_add_ons (
                addon_title,
                addon_description,
                addon_cat_type,
                addon_workshop_id,
                addon_accper_type,
                addon_accper_limit,
                addon_type,
                addon_count,
                addon_ispaid,
                addon_status,
                addon_visiblility,
                addon_ticket_ids,
                addon_workshoprtype_id
               
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)
        `;

        // Execute the query to insert the addon
        const [addonResult] = await pool.query(addonQuery, [
            addonTitle,
            addonDescription,
            addonCategory,
            workshopDetails,
            accompanySeatType,
            accpseatNumber,
            seatType,
            seatCount,
            priceType =="Free" ? 0 : 1, // Assuming 'Open' means ispaid = 1; adapt as necessary
            ticketStatus,
            isVisible ? 1 : 0, // Visibility (1 if checked, 0 if not)
            ticketString, // Include the addon_ticket_ids in the query
            workshoptype,
        ]);
      
        // If durations exist, insert them into the cs_reg_addon_duration table
        if (durations && durations.length > 0) {
            const durationQuery = `
                INSERT INTO cs_reg_addon_duration (
                    addon_id,
                    addon_duration_name,
                    addon_duration_start_date,
                    addon_duration_till_date,
                    addon_amount,
                    addon_currency,
                    status,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?,?, ?, ?, NOW(), NOW())
            `;

            // Loop through each duration and insert it
            const durationPromises = durations.map(duration => {
                return pool.query(durationQuery, [
                    addonResult.insertId, // Use the newly created addon ID
                    duration.name, // Assuming duration.name maps to addon_duration_name
                    duration.startDate,
                    duration.endDate, // Assuming duration.endDate maps to addon_duration_till_date
                    duration.amount, // Assuming duration.amount maps to addon_amount
                    duration.currency, // Assuming duration.currency maps to addon_currency
                    1, // Assuming status is 1 (active) by default
                ]);
            });

            // Wait for all duration inserts to complete
            await Promise.all(durationPromises);
        }

        // Return a success response
        res.status(201).json({ success: true, message: 'addon added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/getAddon',verifyToken, async (req, res) => {
    try {
      // Extract page number, page size, and search query from request query parameters
      const { page = 1, pageSize = 10, search = '', sortColumn = 'addon_id ', sortOrder = 'DESC' } = req.query;
      const offset = (page - 1) * pageSize;
  
      const validColumns = ['addon_id ', 'addon_title', 'addon_visiblility'];  // Add all valid column names here
      const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'addon_id ';
  
  
      const columnsToFetch = ['*'];
  
      // Construct the SQL query to fetch specific columns with pagination and search
      let query = `
      SELECT ${columnsToFetch}
      FROM cs_reg_add_ons
    `;
  
      // Append search condition if search query is provided
      if (search) {
        query += `
          WHERE addon_title LIKE '%${search}%'
        `;
      }
  
      // Append pagination
      query += `
        ORDER BY ${columnToSortBy} ${sortOrder}
        LIMIT ${pageSize} OFFSET ${offset}
      `;
  
      // Execute the query to fetch user data from the table
      const [userData] = await pool.query(query);
  
      // Send the user data as a response along with pagination metadata
      let totalItems = 0;
      let totalPages = 0;
  
      if (!search) {
        const totalCountQuery = 'SELECT COUNT(*) AS total FROM cs_reg_add_ons';
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

  router.get('/getDuration', async (req, res) => {
    try {
        const { addonId } = req.query; // Retrieving addonId from query parameters

        if (!addonId) {
            return res.status(400).json({ error: "addonId is required" });
        }

        // Query the cs_reg_addon_duration table based on the addonId
        const query = `SELECT * FROM cs_reg_addon_duration WHERE addon_id = ? AND status = 1`; // Fetch only active durations
        const [rows] = await pool.execute(query, [addonId]);

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching addon duration:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/editaddon', verifyToken, async (req, res) => {
  try {
      // Extract fields from the request body
      const {
          addonId, // The ID of the addon to edit
          tickets, // This will be an array, e.g., [1]
          addonTitle,
          addonDescription,
          addonCategory,
          workshopDetails,
          accompanySeatType,
          accpseatNumber,
          seatType,
          seatCount,
          ticketStatus,
          durations,
          isVisible,
          priceType,
          workshoptype,
      } = req.body;

      console.log("addon", req.body);

      // Convert tickets array to a string in the format {1}
      const ticketString = `{${tickets.join(',')}}`;

      // Construct the SQL query to update the existing addon
      const updateAddonQuery = `
          UPDATE cs_reg_add_ons
          SET
              addon_title = ?,
              addon_description = ?,
              addon_cat_type = ?,
              addon_workshop_id = ?,
              addon_accper_type = ?,
              addon_accper_limit = ?,
              addon_type = ?,
              addon_count = ?,
              addon_ispaid = ?,
              addon_status = ?,
              addon_visiblility = ?,
              addon_ticket_ids = ?,
              addon_workshoprtype_id = ?
          WHERE addon_id = ?
      `;

      // Execute the query to update the addon
      const [addonResult] = await pool.query(updateAddonQuery, [
          addonTitle,
          addonDescription,
          addonCategory,
          workshopDetails,
          accompanySeatType,
          accpseatNumber,
          seatType,
          seatCount,
          priceType === "Free" ? 0 : 1, // isPaid = 0 if Free, otherwise 1
          ticketStatus,
          isVisible ? 1 : 0, // Visibility (1 if checked, 0 if not)
          ticketString, // Include the addon_ticket_ids in the query
          workshoptype,
          addonId, // Use the addonId to update the correct record
      ]);

      // Handle durations: Delete old durations and insert new ones
      if (durations && durations.length > 0) {
          // First, delete the existing durations for this addon
          const deleteDurationsQuery = `
              DELETE FROM cs_reg_addon_duration WHERE addon_id = ?
          `;
          await pool.query(deleteDurationsQuery, [addonId]);

          // Now, insert the new durations
          const durationInsertQuery = `
              INSERT INTO cs_reg_addon_duration (
                  addon_id,
                  addon_duration_name,
                  addon_duration_start_date,
                  addon_duration_till_date,
                  addon_amount,
                  addon_currency,
                  status,
                  created_at,
                  updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `;

          // Loop through each duration and insert it
          const durationPromises = durations.map(duration => {
              return pool.query(durationInsertQuery, [
                  addonId, // Use the addonId to associate the durations
                  duration.name, // Assuming duration.name maps to addon_duration_name
                  duration.startDate,
                  duration.endDate, // Assuming duration.endDate maps to addon_duration_till_date
                  duration.amount, // Assuming duration.amount maps to addon_amount
                  duration.currency, // Assuming duration.currency maps to addon_currency
                  1, // Assuming status is 1 (active) by default
              ]);
          });

          // Wait for all duration inserts to complete
          await Promise.all(durationPromises);
      }

      // Return a success response
      res.status(200).json({ success: true, message: 'Addon updated successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
  }
});


router.put('/toggleVisibility', verifyToken, async (req, res) => {
    try {
        // Extract TicketId and status from the request body
        console.log("Request Body:", req.body);
        const { TicketId, status } = req.body;

        // Validate inputs if necessary
        if (typeof TicketId !== 'number' || typeof status !== 'number') {
            return res.status(400).json({ error: 'Invalid input' });
        }

        // Update visibility in the database
        const updateQuery = `UPDATE cs_reg_add_ons SET addon_visiblility = ? WHERE addon_id = ?`;
        await pool.query(updateQuery, [status, TicketId]);

        // Send success response
        return res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error updating status:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// router.delete('/deleteaddon', verifyToken, async (req, res) => {
//     console.log("Request Body:", req.body);
//     const { ticketId } = req.body;
  
  
//     try {
//       // Delete from cs_os_workshop table
//       const deleteQuery = 'DELETE FROM cs_reg_add_ons WHERE addon_id = ?';
//       await pool.query(deleteQuery, [ticketId]);
  
//       res.status(200).json({ message: 'Addon deleted successfully' });
//     } catch (error) {
//       console.error('Error deleting addon:', error);
//       res.status(500).json({ message: 'Internal server error' });
//     }
//   });

router.delete('/deleteaddon', verifyToken, async (req, res) => {
  console.log("Request Body:", req.body);
  const { ticketId } = req.body; // Extract addon ID from the request body

  try {
    // Step 1: Check if the addon is referenced in cs_addons
    const checkQuery = 'SELECT COUNT(*) AS count FROM cs_os_users WHERE FIND_IN_SET(?, cs_addons)';
    const ticketIdAsString = String(ticketId); // Ensure addon ID is treated as a string
    const [checkResult] = await pool.query(checkQuery, [ticketIdAsString]);

    console.log("checkResult", checkResult);

    if (checkResult[0].count > 0) {
      // If addon is referenced, return error response
      return res.status(400).json({
        message: 'Cannot delete addon. There are already users registerd for this addon',
      });
    }

    // Step 2: Delete addon from cs_reg_add_ons table
    const deleteAddonQuery = 'DELETE FROM cs_reg_add_ons WHERE addon_id = ?';
    await pool.query(deleteAddonQuery, [ticketId]);

    // Step 3: Delete addon duration from cs_reg_addon_duration table
    const deleteDurationQuery = 'DELETE FROM cs_reg_addon_duration WHERE addon_id = ?';
    await pool.query(deleteDurationQuery, [ticketId]);

    // Step 4: Respond with success
    res.status(200).json({ message: 'Addon deleted successfully' });
  } catch (error) {
    console.error('Error deleting addon:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



  router.get('/fetchaddonData/:addonId', verifyToken, async(req, res) => {
    const addonId = req.params.addonId;
    console.log('Route hit, Ticket ID received:', addonId);
  
    if (!addonId) {
      return res.status(400).json({ error: 'Addon ID is required' });
    }
  
    const connection = await pool.getConnection();
  
    try {
      // Fetch ticket data from cs_reg_tickets
      const addonQuery = 'SELECT * FROM cs_reg_add_ons WHERE addon_id = ?';
      const [addonData] = await connection.query(addonQuery, [addonId]);
  
      if (addonData.length === 0) {
        return res.status(404).json({ error: 'Addon not found' });
      }
  
      // Fetch associated duration data from cs_reg_ticket_duration
      const durationQuery = 'SELECT * FROM cs_reg_addon_duration WHERE addon_id = ?';
      const [durationData] = await connection.query(durationQuery, [addonId]);
  
      console.log('Addon data:', addonData);
      console.log('Duration data:', durationData);
  
      // Return ticket data along with its associated duration data
      res.json({
        addon: addonData[0],        // Send the ticket data
        durations: durationData       // Send the associated durations
      });
  
    } catch (error) {
      console.error('Error fetching addon data:', error);
      res.status(500).json({ message: 'Internal server error' });
    } finally {
      connection.release();
    }
  });










module.exports = router;