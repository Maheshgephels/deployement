const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const moment = require('moment-timezone');
const verifyToken = require('../api/middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

router.get('/getProgramday', verifyToken, async (req, res) => {
    try {
      // Extract page number, page size, and search query from request query parameters
      const { page = 1, pageSize = 10, search = '', sortColumn = 'prog_id', sortOrder = 'DESC' } = req.query;
      const offset = (page - 1) * pageSize;

      const validColumns = ['prog_id', 'prog_name', 'from_date', 'start_time', 'end_time', 'status'];  // Add all valid column names here
      const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'prog_id';
  
      const columnsToFetch = ['*'];
  
      // Construct the base SQL query to fetch specific columns
      let query = `
        SELECT ${columnsToFetch.join(', ')}
        FROM cs_app_program
      `;
  
      // Append search condition if search query is provided
      if (search) {
        query += `
          WHERE prog_name LIKE '%${search}%'
        `;
      }
  
      // Append ordering
      query += `
        ORDER BY ${columnToSortBy} ${sortOrder}
      `;
  
      // Append pagination
      query += `
        LIMIT ${pageSize} OFFSET ${offset}
      `;
  
      // Execute the query to fetch user data from the table
      const [userData] = await pool.query(query);
  
      // Send the user data as a response along with pagination metadata
      let totalItems = 0;
      let totalPages = 0;
  
      if (!search) {
        const totalCountQuery = 'SELECT COUNT(*) AS total FROM cs_app_program';
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


  router.put('/UpdateStatus',verifyToken, async (req, res) => {
    try {
      // Extract workshopId, status, and Name from the request body
      console.log("req.body" , req.body);
      const {ProgramdayId, status} = req.body;
  
  
  
      // Update cs_status in cs_os_workshop
      const updateQuery = `UPDATE cs_app_program SET status = ? WHERE prog_id = ?`;
      await pool.query(updateQuery, [status,  ProgramdayId]);
  
      // Update cs_status in cs_os_facilitytyp
      return res.status(200).json({ message: 'Status Updates successfully' });
    } catch (error) {
      console.error('Error updating status:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.delete('/deleteProgramday', verifyToken, async (req, res) => {
    const { ProgramdayId } = req.body;
  
    try {
      // Delete from cs_app_program table
      const deleteProgramQuery = 'DELETE FROM cs_app_program WHERE prog_id = ?';
      await pool.query(deleteProgramQuery, [ProgramdayId]);
  
      // Delete from cs_app_session table
      const deleteSessionQuery = 'DELETE FROM cs_app_session WHERE prog_id = ?';
      await pool.query(deleteSessionQuery, [ProgramdayId]);
  
      // Delete from cs_app_session_role_details table
      const deleteSessionRoleDetailsQuery = 'DELETE FROM cs_app_session_role_details WHERE prog_id = ?';
      await pool.query(deleteSessionRoleDetailsQuery, [ProgramdayId]);
  
      // Delete from cs_app_subsessions table
      const deleteSubsessionsQuery = 'DELETE FROM cs_app_subsessions WHERE prog_id = ?';
      await pool.query(deleteSubsessionsQuery, [ProgramdayId]);
  
      // Delete from cs_app_subsessions_role_details table
      const deleteSubsessionsRoleDetailsQuery = 'DELETE FROM cs_app_subsessios_role_details WHERE prog_id = ?';
      await pool.query(deleteSubsessionsRoleDetailsQuery, [ProgramdayId]);
  
      res.status(200).json({ message: 'Program day and related data deleted successfully' });
    } catch (error) {
      console.error('Error deleting program day:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });


  router.get('/get-session-date', verifyToken, async (req, res) => {
    try {
        // Query to fetch cs_value for id 38 from cs_tbl_sitesetting table
        console.log("hello");
        const query = "SELECT cs_parameter,cs_value FROM cs_tbl_sitesetting WHERE cs_parameter IN ('Event Start Date','event_end_date','session_length')";
    
        // Execute the query
        const [results] = await pool.query(query);
    
        if (results.length === 0) {
          return res.status(404).json({ message: 'Settings not found' });
        }
    
        //   const csValue = results.cs_value;
        console.log(results);
        res.json({ setting: results });
      } catch (error) {
        console.error('Error fetching settings value:', error);
        res.status(500).json({ message: 'Internal server error' });
      }

});


router.post('/addProgramday',verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    console.log(req.body);
    const { dName,programDate,startTime, endTime } = req.body;
     

    // Construct the SQL query to insert a new role into the cs_tbl_roles table
    const insertQuery = `
        INSERT INTO cs_app_program (prog_name,from_date,to_date,start_time,end_time)
        VALUES (?, ?, ?, ?, ?)
      `;

    // Execute the query to insert the new role into the cs_tbl_roles table
    await pool.query(insertQuery, [dName,programDate,programDate,startTime,endTime]);


    return res.status(200).json({ message: 'Workshop Created succesffuly' });
  } catch (error) {
    console.error('Error updating workshop:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/editProgramday',verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    const { ProgramdayId } = req.body;

    console.log(ProgramdayId);


    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
      SELECT *
      FROM cs_app_program
      WHERE prog_id = ${ProgramdayId};
      `;


    // Execute the query to fetch pages data for the specified role_id
    const [pagesData] = await pool.query(query, [ProgramdayId]);

    console.log(pagesData);

    // Send the pages data as a response
    res.json(pagesData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/updateProgramday',verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    console.log(req.body);
    const { prog_name,to_date, ProgramdayId,startTime,endTime} = req.body;


    const updateQuery = `UPDATE cs_app_program SET prog_name = ?, from_date = ? ,to_date = ? ,start_time = ?, end_time = ? WHERE prog_id = ?`;
    await pool.query(updateQuery, [prog_name,to_date,to_date,startTime,endTime, ProgramdayId]);

    

    if (to_date) {
      const updateSessionDateQuery = `
        UPDATE cs_app_session
        SET session_date = ?
        WHERE prog_id = ?;
      `;
      await pool.query(updateSessionDateQuery, [to_date, ProgramdayId]);

      // Update SESSION_DATE in cs_app_subsessions table
      const updateSubsessionsDateQuery = `
        UPDATE cs_app_subsessions
        SET subsession_date = ?
        WHERE prog_id = ?;
      `;
      await pool.query(updateSubsessionsDateQuery, [to_date, ProgramdayId]);
    }
    return res.status(200).json({ message: 'Workshop Updates succesffuly' });
  } catch (error) {
    console.error('Error updating workshop:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/check-date', verifyToken, async (req, res) => {
  console.log( req.query);
  const { date } = req.query; // Use req.query for URL parameters

  try {
      // Execute SQL query to check if the date exists in the database
      const [results] = await pool.query('SELECT * FROM cs_app_program WHERE to_date = ?', [date]);

      // Check if any program with the provided date exists
      if (results.length > 0) {
          // Date already exists in the database
          res.status(200).json({ isAvailable: false });
      } else {
          // Date is available
          res.status(200).json({ isAvailable: true });
      }
  } catch (error) {
      console.error('Error checking program date availability:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});


  
  


module.exports = router;