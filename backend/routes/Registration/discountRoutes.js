
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const verifyToken = require('../api/middleware/authMiddleware');

router.post('/adddiscount', verifyToken, async (req, res) => {
    const {
        discode,
        discountType,
        flatAmount,
        maxDiscount,
        percentage,
        seatType,
        seatCount,
        tickets,
        startDateTime,
        endDateTime,
        guestList,
    } = req.body;

    // Construct the SQL query to insert the discount
    const discountTarget = req.body.discountTarget === 'all' ? 1 : 2;
    const userEligibility= req.body.userEligibility === 'all' ? 1 : 2;
    const redemptionLevel= req.body.redemptionLevel === 'entireOrder' ? 1 : 2;
    const ticketValues = Array.isArray(tickets) ? tickets.map(ticket => ticket.value) : [];
    const ticketString = `{${ticketValues.join(',')}}`; // Format as a string


    const guestEmails = Array.isArray(guestList) ? `{${guestList.join(',')}}` : '';

    const discountQuery = `
        INSERT INTO cs_reg_discounts (
            discount_code,
            discount_type,
            discount_amount,
            discount_percentage,
            discount_max_limit,
            discount_applyto,
            discount_ticket_ids,
            discount_eligibility,
            discount_redemption_level,
            discount_start_datetime,
            discount_end_datetime,
            discount_seat_type,
            discount_count,
            discount_emails

        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?)
    `;

    const values = [
        discode,
        discountType,
        flatAmount,
        percentage,
        maxDiscount,
        discountTarget,
        ticketString,
        userEligibility,
        redemptionLevel,
        startDateTime,
        endDateTime,
        seatType,
        seatCount,
        guestEmails // Add the comma-separated email string here
    ];

    try {
        const [discountResult] = await pool.query(discountQuery, values); // Using pool.query for the database operation
        
        // If the insertion is successful, send a response back
        res.status(201).json({ success: true, message: 'Discount added successfully', discountId: discountResult.insertId });
    } catch (error) {
        console.error('Error inserting discount:', error);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
});


router.get('/getdiscount',verifyToken, async (req, res) => {
    try {
      // Extract page number, page size, and search query from request query parameters
      const { page = 1, pageSize = 10, search = '', sortColumn = 'discount_id', sortOrder = 'DESC' } = req.query;
      const offset = (page - 1) * pageSize;
  
      const validColumns = ['discount_id ', 'discount_code', 'status'];  // Add all valid column names here
      const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'discount_id';
  
  
      const columnsToFetch = ['*'];
  
      // Construct the SQL query to fetch specific columns with pagination and search
      let query = `
      SELECT ${columnsToFetch}
      FROM  cs_reg_discounts
    `;
  
      // Append search condition if search query is provided
      if (search) {
        query += `
          WHERE discount_code LIKE '%${search}%'
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
        const totalCountQuery = 'SELECT COUNT(*) AS total FROM cs_reg_discounts';
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


  // Discount update route
router.post('/editdiscount', verifyToken, async (req, res) => {
  const {
      discountId,    // Ensure this is passed from the frontend
      discode,
      discountType,
      flatAmount,
      maxDiscount,
      percentage,
      seatType,
      seatCount,
      tickets,
      startDateTime,
      endDateTime,
      guestList,
  } = req.body;

  // Construct necessary values
  const discountTarget = req.body.discountTarget === 'all' ? 1 : 2;
  const userEligibility = req.body.userEligibility === 'all' ? 1 : 2;
  const redemptionLevel = req.body.redemptionLevel === 'entireOrder' ? 1 : 2;
  const ticketValues = Array.isArray(tickets) ? tickets.map(ticket => ticket.value) : [];
  const ticketString = `{${ticketValues.join(',')}}`; // Format as a string for SQL array
  const guestEmails = Array.isArray(guestList) ? `{${guestList.join(',')}}` : '';

  // Update query instead of insert
  const updateQuery = `
      UPDATE cs_reg_discounts
      SET
          discount_code = ?,
          discount_type = ?,
          discount_amount = ?,
          discount_max_limit = ?,
          discount_percentage = ?,
          discount_applyto = ?,
          discount_ticket_ids = ?,
          discount_eligibility = ?,
          discount_redemption_level = ?,
          discount_start_datetime = ?,
          discount_end_datetime = ?,
          discount_seat_type = ?,
          discount_count = ?,
          discount_emails = ?
      WHERE discount_id = ?  -- Use discountId for updating the specific discount
  `;

  const values = [
      discode,
      discountType,
      flatAmount,
      maxDiscount,
      percentage,
      discountTarget,
      ticketString,
      userEligibility,
      redemptionLevel,
      startDateTime,
      endDateTime,
      seatType,
      seatCount,
      guestEmails,
      discountId  // Discount ID for the WHERE clause
  ];

  try {
      const [result] = await pool.query(updateQuery, values); // Execute the update query
      
      if (result.affectedRows > 0) {
          res.status(200).json({ success: true, message: 'Discount updated successfully' });
      } else {
          res.status(404).json({ success: false, message: 'Discount not found or no changes were made' });
      }
  } catch (error) {
      console.error('Error updating discount:', error);
      res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

router.delete('/deletediscount', verifyToken, async (req, res) => {
  console.log("Request Body:", req.body);
  const { ticketId } = req.body;


  try {
    // Delete from cs_os_workshop table
    const deleteQuery = 'DELETE FROM cs_reg_discounts WHERE discount_id = ?';
    await pool.query(deleteQuery, [ticketId]);

    res.status(200).json({ message: 'Discount deleted successfully' });
  } catch (error) {
    console.error('Error deleting Discount:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/UpdateStatus', verifyToken, async (req, res) => {
  try {
    // Extract workshopId, status, and Name from the request body
    console.log(req.body);
    const { discountId, status } = req.body;


    // Update cs_status in cs_os_workshop
    const updateQuery = `UPDATE cs_reg_discounts SET status = ? WHERE discount_id = ?`;
    await pool.query(updateQuery, [status, discountId]);

    // Update cs_status in cs_os_facilitytyp
    return res.status(200).json({ message: 'Status Updates successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/fetchdiscountData/:discountId', verifyToken, async(req, res) => {
  const discountId = req.params.discountId;
  console.log('Route hit, Ticket ID received:', discountId);

  if (!discountId) {
    return res.status(400).json({ error: 'Discount ID is required' });
  }

  const connection = await pool.getConnection();

  try {
    // Fetch ticket data from cs_reg_tickets
    const discountQuery = 'SELECT * FROM cs_reg_discounts WHERE discount_id = ?';
    const [discountData] = await connection.query(discountQuery, [discountId]);

    if (discountData.length === 0) {
      return res.status(404).json({ error: 'Addon not found' });
    }

    // Return ticket data along with its associated duration data
    res.json({
      discount: discountData[0],        // Send the ticket data
    });

  } catch (error) {
    console.error('Error fetching discount data:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
});


module.exports = router;