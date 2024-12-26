const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const moment = require('moment-timezone');
const verifyToken = require('../api/middleware/authMiddleware');
const admin = require('../../firebase');


router.get('/getNotification', verifyToken, async (req, res) => {
  try {
    // Extract page number, page size, and search query from request query parameters
    const { page = 1, pageSize = 10, search = '', sortColumn = 'not_date', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * pageSize;

    const validColumns = ['not_id', 'not_date', 'heading', 'posted_by', 'status'];  // Add all valid column names here
    const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'not_date';

    console.log(req.query);
    console.log(columnToSortBy);
    console.log(sortOrder);


    const columnsToFetch = ['*'];


    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
      SELECT ${columnsToFetch}
      FROM cs_app_notification
    `;

    // Append search condition if search query is provided
    if (search) {
      query += ` 
          WHERE heading LIKE '%${search}%' OR posted_by LIKE '%${search}%'
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
      const totalCountQuery = 'SELECT COUNT(*) AS total FROM cs_app_notification';
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



router.post('/addNotification', verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    const { dName, description, publishby } = req.body;

    // Construct the SQL query to insert a new role into the cs_tbl_roles table
    const insertQuery = `
          INSERT INTO cs_app_notification (heading,description,posted_by)
          VALUES (?, ?, ?)
        `;

    // Execute the query to insert the new role into the cs_tbl_roles table
    await pool.query(insertQuery, [dName, description, publishby]);


    return res.status(200).json({ message: 'Workshop Created succesffuly' });
  } catch (error) {
    console.error('Error updating workshop:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.put('/UpdateStatus', verifyToken, async (req, res) => {
  try {
    // Extract workshopId, status, and Name from the request body
    console.log(req.body);
    const { NotificationId, status } = req.body;



    // Update cs_status in cs_os_workshop
    const updateQuery = `UPDATE cs_app_notification SET status = ? WHERE not_id = ?`;
    await pool.query(updateQuery, [status, NotificationId]);

    // Update cs_status in cs_os_facilitytyp
    return res.status(200).json({ message: 'Status Updates successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.delete('/deleteNotification', verifyToken, async (req, res) => {
  const { NotificationId } = req.body;


  try {
    // Delete from cs_os_workshop table
    const deleteQuery = 'DELETE FROM cs_app_notification WHERE not_id = ?';
    await pool.query(deleteQuery, [NotificationId]);

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting workshop:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/editNotification', verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    const { NotificationId } = req.body;

    console.log(NotificationId);


    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
        SELECT *
        FROM cs_app_notification
        WHERE not_id = ${NotificationId};
        `;


    // Execute the query to fetch pages data for the specified role_id
    const [pagesData] = await pool.query(query, [NotificationId]);

    console.log(pagesData);

    // Send the pages data as a response
    res.json(pagesData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/updateNotification', verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    console.log(req.body);
    const { values, NotificationId } = req.body;


    const updateQuery = `UPDATE cs_app_notification SET heading = ?, description = ?  WHERE not_id = ?`;
    await pool.query(updateQuery, [values.dName, values.Description, NotificationId]);




    return res.status(200).json({ message: 'Workshop Updates succesffuly' });
  } catch (error) {
    console.error('Error updating workshop:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

//   router.post('/send-notification', async (req, res) => {
//     try {
//       const { title, body } = req.body;
//       const message = {
//         'topic': 'news',
//         notification: { title, body }, // Replace with your topic name
//       };

//       // Send a message to devices subscribed to the topic
//       await admin.messaging().send(message);

//       res.status(200).send('Notification sent!');
//     } catch (error) {
//       console.error('Error sending notification:', error);
//       res.status(500).send('Error sending notification');
//     }
//   });




// module.exports = router;
router.post('/send-notification', async (req, res) => {
  try {
    const { title, body } = req.body; // Assuming token is passed in the request body
    const token = "ewgYokdaT-esfMynS6iu4P:APA91bFRoQ-Tj1ONa6IgrF-3N1Dsnp9q6V6Y4R54bCW521JPPVA0_bIEdj8J3iUijfYphq_7jOyxttiI4OOq_0jkcfLFGakh4dsEaQMHjWOIJAO9q7ol9xX3ajNtdMsA8yDg9uti4yjs";

    const message = {
      token: token, // FCM token of the device to which you want to send the notification
      notification: {
        title: title,
        body: body
      }
    };

    // Send a message to the device corresponding to the provided registration token
    const response = await admin.messaging().send(message);

    console.log('Successfully sent message:', response);
    res.status(200).send('Notification sent!');
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).send('Error sending notification');
  }
});

router.post('/resend-notification', async (req, res) => {
  const { not_id } = req.body;



  if (!not_id) {
    return res.status(400).json({ message: 'Notification ID is required.' });
  }

  try {


    // Update the not_date column with the current date and time
    const query = `
          UPDATE cs_app_notification
          SET not_date = NOW()
          WHERE not_id = ?
      `;

    const result = await pool.query(query, [not_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    // Retrieve the updated date to send it back in the response
    const getDateQuery = `
          SELECT not_date
          FROM cs_app_notification
          WHERE not_id = ?
      `;
    const [notification] = await pool.query(getDateQuery, [not_id]);

    if (notification.length === 0) {
      return res.status(404).json({ message: 'Notification not found after update.' });
    }

    const updatedDate = notification[0].not_date;

    return res.status(200).json({
      message: 'Notification date updated successfully.',
      newDate: updatedDate, // Send the updated date
    });
  } catch (error) {
    console.error('Error updating notification date:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});






module.exports = router;