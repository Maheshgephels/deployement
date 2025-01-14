const express = require('express');
const router = express.Router();
const { pool, pool2 } = require('../../config/database');

// Middleware to verify token
const verifyToken = require('../api/middleware/authMiddleware');

router.get('/userCount', async (req, res) => {
  try {
    // Fetch user count
    const [userResults] = await pool.query('SELECT COUNT(*) AS userCount FROM cs_os_users');
    const userCount = userResults[0].userCount;

    const [userloggedinResults] = await pool.query('SELECT COUNT(*) AS userloggedinResults FROM cs_app_logedin_users');
    const userloggedinCount = userloggedinResults[0].userloggedinResults;

    res.json({ userCount, userloggedinCount });
  } catch (error) {
    console.error('Error fetching user count:', error);
    res.status(500).send('Server Error');
  }
});

router.get('/facultyCount', async (req, res) => {
  try {
    // Fetch total faculty count
    const [totalResults] = await pool.query('SELECT COUNT(*) AS totalFacultyCount FROM cs_app_faculties');
    const totalFacultyCount = totalResults[0].totalFacultyCount;

    // Fetch active faculty count
    const [activeResults] = await pool.query('SELECT COUNT(*) AS activeFacultyCount FROM cs_app_faculties WHERE status = 1');
    const activeFacultyCount = activeResults[0].activeFacultyCount;

    // Fetch inactive faculty count
    const [inactiveResults] = await pool.query('SELECT COUNT(*) AS inactiveFacultyCount FROM cs_app_faculties WHERE status = 0');
    const inactiveFacultyCount = inactiveResults[0].inactiveFacultyCount;

    res.json({ totalFacultyCount, activeFacultyCount, inactiveFacultyCount });
  } catch (error) {
    console.error('Error fetching faculty counts:', error);
    res.status(500).send('Server Error');
  }
});

// router.get('/getLoggedInUsers', async (req, res) => {
//     try {
//       const { page = 1, pageSize = 5, search = '' } = req.query;
//       const offset = (page - 1) * pageSize;

//       // Construct the SQL query with pagination and search
//       let query = `
//         SELECT id, username, device_id, token, login_time 
//         FROM cs_app_logedin_users
//       `;

//       // Array to hold query parameters
//       const queryParams = [];

//       // Add search condition if search query is provided
//       if (search) {
//         query += ` WHERE username LIKE ?`;
//         queryParams.push(`%${search}%`);
//       }

//       // Add LIMIT and OFFSET for pagination
//       query += ` LIMIT ? OFFSET ?`;
//       queryParams.push(parseInt(pageSize), parseInt(offset));

//       // Execute the query to fetch user data from the database
//       const [userData] = await pool.query(query, queryParams);

//       // Get total count of items for pagination metadata
//       let totalItems = 0;
//       let totalPages = 0;

//       // Construct the total count query
//       let totalCountQuery = 'SELECT COUNT(*) AS total FROM cs_app_logedin_users';
//       const totalCountParams = [];

//       // Add search condition to total count query if search query is provided
//       if (search) {
//         totalCountQuery += ' WHERE username LIKE ?';
//         totalCountParams.push(`%${search}%`);
//       }

//       // Execute the total count query
//       const [totalCountResult] = await pool.query(totalCountQuery, totalCountParams);
//       totalItems = totalCountResult[0].total;
//       totalPages = Math.ceil(totalItems / pageSize);

//       res.json({ users: userData, currentPage: parseInt(page), totalPages, pageSize, totalItems });
//     } catch (error) {
//       console.error('Error fetching logged in users:', error);
//       res.status(500).json({ message: 'Internal server error', error });
//     }
//   });


router.get('/getLoggedInUsers', async (req, res) => {
  try {
    const { page = 1, pageSize = 5, search = '' } = req.query;
    const offset = (page - 1) * pageSize;

    // Construct the SQL query with pagination and search
    let query = `
          SELECT 
              logins.id, 
              logins.username, 
              logins.device_id, 
              logins.token, 
              logins.login_time,
              users.cs_title, 
              users.cs_first_name, 
              users.cs_last_name, 
              users.cs_email, 
              users.cs_reg_category
          FROM 
              cs_app_logedin_users logins
          JOIN 
              cs_os_users users 
          ON 
              logins.username = users.cs_username
      `;

    // Array to hold query parameters
    const queryParams = [];

    // Add search condition if search query is provided
    if (search) {
      query += ` WHERE logins.username LIKE ? OR users.cs_first_name LIKE ? OR users.cs_last_name LIKE ?`;
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Add LIMIT and OFFSET for pagination
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(pageSize), parseInt(offset));

    // Execute the query to fetch user data from the database
    const [userData] = await pool.query(query, queryParams);

    // Get total count of items for pagination metadata
    let totalItems = 0;
    let totalPages = 0;

    // Construct the total count query
    let totalCountQuery = `
          SELECT COUNT(*) AS total 
          FROM cs_app_logedin_users logins
          JOIN cs_os_users users 
          ON logins.username = users.cs_username
      `;
    const totalCountParams = [];

    // Add search condition to total count query if search query is provided
    if (search) {
      totalCountQuery += ` WHERE logins.username LIKE ? OR users.cs_first_name LIKE ? OR users.cs_last_name LIKE ?`;
      totalCountParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Execute the total count query
    const [totalCountResult] = await pool.query(totalCountQuery, totalCountParams);
    totalItems = totalCountResult[0].total;
    totalPages = Math.ceil(totalItems / pageSize);

    res.json({ users: userData, currentPage: parseInt(page), totalPages, pageSize, totalItems });
  } catch (error) {
    console.error('Error fetching logged in users:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});



// Fetch the latest 5 basic users
router.get('/latestBasicUsers', async (req, res) => {
  try {
    // Construct the SQL query to fetch the latest 5 basic users
    const query = `
          SELECT 
              cs_title, 
              cs_first_name, 
              cs_last_name, 
              cs_email, 
              cs_phone, 
              cs_username, 
              created_at 
          FROM cs_os_users
          WHERE cs_reg_cat_id = 1 AND cs_status = 1
          ORDER BY id DESC
          LIMIT 5
      `;

    // Execute the query
    const [userData] = await pool.query(query);

    // Send the response
    res.json({ users: userData });
  } catch (error) {
    console.error('Error fetching latest basic users:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});



router.get('/userCountByDate', async (req, res) => {
  try {
    // Fetch user count by registration date
    const query = `
                    SELECT DATE(created_at) AS registration_date, COUNT(*) AS userCount
                    FROM cs_os_users
                    GROUP BY DATE(created_at)
                    ORDER BY DATE(created_at) ASC
                `;
    const [results] = await pool.query(query);

    res.json(results);
  } catch (error) {
    console.error('Error fetching user count by date:', error);
    res.status(500).send('Server Error');
  }
});

router.get('/getActiveUsers', async (req, res) => {
  try {
    // Construct the SQL query to fetch active user data grouped by login time
    let query = `
              SELECT DATE(login_time) AS login_date, COUNT(*) AS activeUsers
              FROM cs_app_logedin_users
              GROUP BY DATE(login_time)
              ORDER BY DATE(login_time) ASC
            `;

    // Execute the query to fetch active user data from the database
    const [activeUsersData] = await pool.query(query);

    // Format the login_date to 'YYYY-MM-DD'
    const formattedData = activeUsersData.map(item => ({
      ...item,
      login_date: new Date(item.login_date).toISOString().split('T')[0]
    }));

    res.json({ activeUsers: formattedData });
  } catch (error) {
    console.error('Error fetching active users:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});



router.get('/eventDetails', async (req, res) => {
  try {
    const query = `
                SELECT cs_parameter, cs_value 
                FROM cs_tbl_sitesetting 
                WHERE cs_parameter IN ('Event Name', 'event_venue', 'event_time', 'Event Start Date', 'event_end_date', 'event_image_url')
              `;
    const [eventDetails] = await pool.query(query);
    res.json({ eventDetails });
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});


module.exports = router;
