const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const moment = require('moment-timezone');
// const verifyToken = require('./middleware/authMiddleware');
const verifyToken = require('../api/middleware/authMiddleware');
const queueMiddleware = require('../api/middleware/queueMiddleware');

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
      const facultytype= ['type_title', 'facultytype_id'];
      const registrationtype=['reg_typeid','cs_reg_type_name'];
      const ticket = ['ticket_id', 'ticket_title', 'ticket_type', 'ticket_category'];
      const custom_data = ['cs_field_option', 'cs_field_option_value, cs_field_option_id, cs_field_id'];
      const currency = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "currency"`;
    const processinginclded = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "processing_fee_IncludeExclude"`;
    const processingfeeornot = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "processing_fees"`;
    const processingfeein = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "processing_fees_in"`;
    const gstinclded = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "GST_Include"`;
    const gstfee = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "GST"`;
    const IGSTfee = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "IGST"`;
    const processingFeesQuery = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Processing fee in %"`;
  
  
      // Execute each query to fetch data from respective tables
      const [facilitytypeData] = await pool.query(`SELECT ${facilitytype.join(',')} FROM cs_os_facilitytype`);
      const [prefixData] = await pool.query(`SELECT ${prefix.join(',')} FROM cs_os_name_prefixes`);
      const [countryData] = await pool.query(`SELECT ${country.join(',')} FROM cs_tbl_country`);
      const [statesData] = await pool.query(`SELECT ${states.join(',')} FROM cs_tbl_states`);
      const [regCatData] = await pool.query(`SELECT ${reg_cat.join(',')} FROM cs_os_category WHERE cs_status = 1 AND cs_show_conference_form = 1`);
      const [registrationcategory] = await pool.query(`SELECT ${registrationtype.join(',')} FROM cs_reg_type WHERE status = 1`);
      const [ticketData] = await pool.query(`SELECT ${ticket.join(',')} FROM cs_reg_tickets WHERE ticket_visibility = 1`);
      const [workshopData] = await pool.query(`SELECT ${work_cat.join(',')} FROM cs_os_workshop WHERE cs_status = 1`);
      const [dayTypeData] = await pool.query(`SELECT ${day_type.join(',')} FROM cs_os_reg_daytype WHERE cs_status = 1`);
      const [facultytypeData] = await pool.query(`SELECT ${facultytype.join(',')} FROM cs_app_facultytype WHERE status = 1`);
  
      const [customData] = await pool.query(`SELECT ${custom_data.join(',')} FROM cs_os_field_option WHERE cs_status = 1`);
      const [processingFeesData] = await pool.query(processingFeesQuery);
      const [processingincldedData] = await pool.query(processinginclded);
      const [CurrencyData] = await pool.query(currency);
      const [processingfeeornotData] = await pool.query(processingfeeornot);
      const [gstincldedData] = await pool.query(gstinclded);
      const [gstfeeData] = await pool.query(gstfee);
      const [processingfeeinData] = await pool.query(processingfeein);
      const [gstamount] = await pool.query(IGSTfee);

  
  
  
  
      // Construct the response object
      const responseData = {
        // facilityType: facilitytypeData,
        prefix: prefixData,
        country: countryData,
        states: statesData,
        regCategory: regCatData,
        ticket: ticketData,
        workshop: workshopData,
        dayType: dayTypeData,
        facultytype:facultytypeData,
        custom: customData,
        regtype :registrationcategory ,
        currency: CurrencyData,
        gstfee: gstfeeData,
        gstinclded: gstincldedData,
        processingfeein: processingfeeinData,
        processinginclded: processingincldedData,
        processingfeeornot: processingfeeornotData,
        gstamount: gstamount,
        processingFees: processingFeesData, // Added processing fees to response
      };
  
      // Send the response containing data from all queries
      res.json(responseData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  router.post('/addticket', verifyToken, async (req, res) => {
    const {
      ticketTitle,
      ticketDescription,
      regtype,
      ticketStatus,
      seatType,
      seatCount,
      registrationCategory,
      isManualApproval,
      priceType,
      durations,
      isVisible,
      isPrivate,
      maxBuyingLimit,
      mailDescription,
      selectedAccommodation,
    } = req.body;
  
    const connection = await pool.getConnection();


  
    try {
      await connection.beginTransaction();
      const registrationCategoryJson = JSON.stringify(registrationCategory);
      
  
      // Insert into cs_reg_tickets
      // const [result] = await connection.query(
      //   `INSERT INTO cs_reg_tickets (
      //     ticket_title, ticket_description, ticket_category, reg_typeid, ticket_type,
      //     ticket_count, ticket_isapprove_by_admin, ticket_ispaid, ticket_visibility,
      //     ticket_status, ticket_max_limit, ticket_mail_description
      //   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      //   [
      //     ticketTitle, ticketDescription, registrationCategoryJson, regtype, seatType,
      //     seatCount, isManualApproval ? '1' : '0', priceType === 'Paid' ? '1' : '0',
      //     isVisible ? '1' : '0', ticketStatus, maxBuyingLimit, mailDescription
      //   ]
      // );

      const [result] = await connection.query(
        `INSERT INTO cs_reg_tickets (
          ticket_title, ticket_description, ticket_category, reg_typeid, ticket_type,
          ticket_count, ticket_isapprove_by_admin, ticket_ispaid, ticket_visibility,
          ticket_status, ticket_max_limit, ticket_mail_description,ticket_isprivate,residentional_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,?,?)`,
        [
          ticketTitle, ticketDescription, registrationCategoryJson, regtype, seatType,
          seatType === 'Unlimited' ? null : seatCount, // handle seatType
          isManualApproval ? '1' : '0', priceType === 'Paid' ? '1' : '0',
          isVisible ? '1' : '0', ticketStatus, maxBuyingLimit, mailDescription,isPrivate ? '1' : '0',selectedAccommodation
          
        ]
      );
  
      const ticketId = result.insertId;
  
      // Insert into tick_duration for each duration
      if (durations && durations.length) {
        const durationPromises = durations.map(duration => {
          const startDate = new Date(duration.startDate).toISOString().split('T')[0]; // YYYY-MM-DD
          const endDate = new Date(duration.endDate).toISOString().split('T')[0];     // YYYY-MM-DD
            // return connection.query(
            //     `INSERT INTO cs_reg_ticket_duration (
            //         ticket_id, tick_duration_name, tick_duration_start_date, tick_duration_till_date, tick_amount, tick_currency
            //     ) VALUES (?, ?, ?, ?, ?, ?)`,
            //     [
            //         ticketId, duration.name, startDate, endDate, duration.amount, duration.currency
            //     ]
            // );

            return connection.query(
              `INSERT INTO cs_reg_ticket_duration (
                ticket_id, tick_duration_name, tick_duration_start_date, tick_duration_till_date, 
                tick_amount, tick_currency
              ) VALUES (?, ?, ?, ?, ?, ?)`,
              [
                ticketId, duration.name, startDate, endDate, duration.amount, duration.currency
                // Timestamps for the cs_reg_ticket_duration table
              ]
            );
        });
        await Promise.all(durationPromises);
      }
  
      await connection.commit();
      res.status(201).json({ success: true, message: 'Ticket added successfully' });
    } catch (error) {
      await connection.rollback();
      console.error('Error adding ticket:', error);
      res.status(500).json({ message: 'Internal server error' });
    } finally {
      connection.release();
    }
  });

  router.get('/getTicket',verifyToken, async (req, res) => {
    try {
      // Extract page number, page size, and search query from request query parameters
      const { page = 1, pageSize = 10, search = '', sortColumn = 'ticket_id', sortOrder = 'DESC' } = req.query;
      const offset = (page - 1) * pageSize;
  
      const validColumns = ['ticket_id', 'ticket_title', 'ticket_visibility', 'userCount', 'ticket_status', 'ticket_count', 'ticket_ispaid', 'ticket_type'];  // Add all valid column names here
      const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'ticket_id';
  
  
      const columnsToFetch = ['cs_reg_tickets.*', 'COUNT(DISTINCT cs_os_users.id) AS userCount'];
  
      // Construct the SQL query to fetch specific columns with pagination and search
      let query = `
      SELECT ${columnsToFetch}
      FROM cs_reg_tickets
      LEFT JOIN cs_os_users on cs_reg_tickets.ticket_id = cs_os_users.cs_ticket
      WHERE 1
    `;
  
      // Append search condition if search query is provided
      if (search) {
        query += `
          WHERE ticket_title LIKE '%${search}%'
        `;
      }
  
      // Append pagination
      query += `
        GROUP BY cs_reg_tickets.ticket_id
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
        const totalCountQuery = 'SELECT COUNT(*) AS total FROM cs_reg_tickets';
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
        const updateQuery = `UPDATE cs_reg_tickets SET ticket_visibility = ? WHERE ticket_id = ?`;
        await pool.query(updateQuery, [status, TicketId]);

        // Send success response
        return res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error updating status:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// router.delete('/deleteticket', verifyToken, async (req, res) => {
//   console.log("Request Body:", req.body);
//   const { ticketId } = req.body;


//   try {
//     // Delete from cs_os_workshop table
//     const deleteQuery = 'DELETE FROM cs_reg_tickets WHERE ticket_id = ?';
//     await pool.query(deleteQuery, [ticketId]);

//     res.status(200).json({ message: 'Notification deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting workshop:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });


router.delete('/deleteticket', verifyToken, async (req, res) => {
  console.log("Request Body:", req.body);
  const { ticketId } = req.body;

  try {
      // Check if the ticket is referenced in cs_os_users
      const checkQuery = 'SELECT COUNT(*) AS count FROM cs_os_users WHERE cs_ticket = ?';
      const ticketIdAsString = String(ticketId); // Convert ticketId to string
      const [checkResult] = await pool.query(checkQuery, [ticketIdAsString]);
      
      console.log("checkResult", checkResult);


      if (checkResult[0].count > 0) {
        // Ticket is referenced in cs_os_users, cannot delete
        return res.status(400).json({ message: 'Cannot delete ticket.There are already users registerd for this ticket' });
    }

      // Delete from cs_reg_tickets table
      const deleteQuery = 'DELETE FROM cs_reg_tickets WHERE ticket_id = ?';
      await pool.query(deleteQuery, [ticketId]);

      const deleteDurationQuery = 'DELETE FROM cs_reg_ticket_duration WHERE ticket_id = ?';
      await pool.query(deleteDurationQuery, [ticketId]);


      res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (error) {
      console.error('Error deleting ticket:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/fetchticketData/:ticketId', verifyToken, async(req, res) => {
  const ticketId = req.params.ticketId;
  console.log('Route hit, Ticket ID received:', ticketId);

  if (!ticketId) {
    return res.status(400).json({ error: 'Ticket ID is required' });
  }

  const connection = await pool.getConnection();

  try {
    // Fetch ticket data from cs_reg_tickets
    const ticketQuery = 'SELECT * FROM cs_reg_tickets WHERE ticket_id = ?';
    const [ticketData] = await connection.query(ticketQuery, [ticketId]);

    if (ticketData.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Fetch associated duration data from cs_reg_ticket_duration
    const durationQuery = 'SELECT * FROM cs_reg_ticket_duration WHERE ticket_id = ?';
    const [durationData] = await connection.query(durationQuery, [ticketId]);

    console.log('Ticket data:', ticketData);
    console.log('Duration data:', durationData);

    // Return ticket data along with its associated duration data
    res.json({
      ticket: ticketData[0],        // Send the ticket data
      durations: durationData       // Send the associated durations
    });

  } catch (error) {
    console.error('Error fetching ticket data:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
});

router.get('/getDuration', async (req, res) => {
  try {
      const { ticketId } = req.query; // Retrieving addonId from query parameters

      if (!ticketId) {
          return res.status(400).json({ error: "ticketId is required" });
      }

      // Query the cs_reg_addon_duration table based on the addonId
      const query = `SELECT * FROM cs_reg_ticket_duration WHERE ticket_id = ? AND status = 1`; // Fetch only active durations
      const [rows] = await pool.execute(query, [ticketId]);

      res.status(200).json(rows);
  } catch (error) {
      console.error('Error fetching addon duration:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/editticket', verifyToken, async (req, res) => {
  const {
    ticketId, // The ID of the ticket to edit
    ticketTitle,
    ticketDescription,
    regtype,
    ticketStatus,
    seatType,
    seatCount,
    registrationCategory,
    isManualApproval,
    priceType,
    durations,
    isVisible,
    isPrivate,
    maxBuyingLimit,
    mailDescription,
    selectedAccommodation
  } = req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const registrationCategoryJson = JSON.stringify(registrationCategory);

    // Update existing ticket in cs_reg_tickets
    const updateTicketQuery = `
      UPDATE cs_reg_tickets
      SET
        ticket_title = ?,
        ticket_description = ?,
        ticket_category = ?,
        reg_typeid = ?,
        ticket_type = ?,
        ticket_count = ?,
        ticket_isapprove_by_admin = ?,
        ticket_ispaid = ?,
        ticket_visibility = ?,
        ticket_status = ?,
        ticket_max_limit = ?,
        ticket_mail_description = ?,
        ticket_isprivate = ?,
        residentional_type = ?
      WHERE ticket_id = ?
    `;

    await connection.query(updateTicketQuery, [
      ticketTitle,
      ticketDescription,
      registrationCategoryJson,
      regtype,
      seatType,
      seatType === 'Unlimited' ? null : seatCount, // handle seatType
      isManualApproval ? '1' : '0',
      priceType === 'Paid' ? '1' : '0',
      isVisible ? '1' : '0',
      ticketStatus,
      maxBuyingLimit,
      mailDescription,
      isPrivate ? '1' : '0',
      selectedAccommodation,
      ticketId
    ]);

    // Handle ticket durations: delete old durations and insert new ones
    if (durations && durations.length > 0) {
      // First, delete the existing durations for this ticket
      const deleteDurationsQuery = `
        DELETE FROM cs_reg_ticket_duration WHERE ticket_id = ?
      `;
      await connection.query(deleteDurationsQuery, [ticketId]);

      // Now, insert the new durations
      const insertDurationQuery = `
        INSERT INTO cs_reg_ticket_duration (
          ticket_id, tick_duration_name, tick_duration_start_date, 
          tick_duration_till_date, tick_amount, tick_currency
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      const durationPromises = durations.map(duration => {
        const startDate = new Date(duration.startDate).toISOString().split('T')[0];
        const endDate = new Date(duration.endDate).toISOString().split('T')[0];
        
        return connection.query(insertDurationQuery, [
          ticketId,
          duration.name,
          startDate,
          endDate,
          duration.amount,
          duration.currency
        ]);
      });

      await Promise.all(durationPromises);
    }

    await connection.commit();
    res.status(200).json({ success: true, message: 'Ticket updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating ticket:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
});







 
  
  
  
module.exports = router;