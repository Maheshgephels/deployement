
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const multer = require('multer');
const verifyToken = require('../api/middleware/authMiddleware');
const moment = require('moment-timezone');

/////////////////////////---------------------  export badge 

// router.get('/userlistforbadge', verifyToken, async (req, res) => {
//     try {
//         // Extract startReg and endReg values from request query parameters
//         const { startReg, endReg } = req.query;

//         // Define the base SQL query to fetch user data
//         let sqlQuery = `SELECT * FROM cs_os_users WHERE cs_isconfirm = 1`;

//         // Check if startReg and endReg are provided
//         if (startReg && endReg) {
//             // Extract the registration numbers from startReg and endReg objects
//             const startRegNo = startReg;
//             const endRegNo = endReg;

//             const columnsToFetch = ['u.*', 'r.cs_reg_daytype_name AS cs_reg_type', 'w.cs_workshop_name As cs_workshop_category'];

//             // Add WHERE clause to filter users within the specified range
//             sqlQuery = `SELECT ${columnsToFetch.join(', ')}
//         FROM cs_os_users u
//         LEFT JOIN cs_os_reg_daytype r ON u.cs_reg_type = r.cs_reg_daytype_id
//         LEFT JOIN cs_os_workshop w ON u.cs_workshop_category = w.cs_workshop_id
//         WHERE cs_regno BETWEEN ${startRegNo} AND ${endRegNo} AND cs_isconfirm = 1 `;
//         }

//         // Order the results by cs_regno in ascending order
//         sqlQuery += ` ORDER BY cs_regno ASC`;

//         // Query the database to fetch the user list
//         const userData = await pool.query(sqlQuery);

//         // Check if data is found
//         if (userData.length === 0) {
//             // Send a message indicating no data found
//             res.status(404).json({ message: 'No user data found' });
//         } else {
//             // Send the retrieved user data as a response
//             res.json(userData);
//         }
//     } catch (error) {
//         console.error('Error fetching user list:', error);
//         // Send an internal server error response
//         res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
//     }
// });

router.get('/userlistforbadge', verifyToken, async (req, res) => {
    try {
        // Extract startReg and endReg values from request query parameters
        const { startReg, endReg } = req.query;

        // Define the base SQL query to fetch user data
        let sqlQuery = `SELECT * FROM cs_os_users WHERE cs_isconfirm = 1`;

        // Check if startReg and endReg are provided
        if (startReg && endReg) {
            // Extract the registration numbers from startReg and endReg objects
            const startRegNo = startReg;
            const endRegNo = endReg;

            // Define the columns to fetch, using COALESCE to return a blank string if the value is NULL
            const columnsToFetch = [
                'u.*',
                'COALESCE(r.cs_reg_daytype_name, "") AS cs_reg_type',
                'COALESCE(w.cs_workshop_name, "") AS cs_workshop_category'
            ];

            // Add WHERE clause to filter users within the specified range
            sqlQuery = `
                SELECT ${columnsToFetch.join(', ')}
                FROM cs_os_users u
                LEFT JOIN cs_os_reg_daytype r ON u.cs_reg_type = r.cs_reg_daytype_id
                LEFT JOIN cs_os_workshop w ON u.cs_workshop_category = w.cs_workshop_id
                WHERE cs_regno BETWEEN ${startRegNo} AND ${endRegNo}
                AND cs_isconfirm = 1
            `;
        }

        // Order the results by cs_regno in ascending order
        sqlQuery += ` ORDER BY cs_regno ASC`;

        // Query the database to fetch the user list
        const userData = await pool.query(sqlQuery);

        // Check if data is found
        if (userData.length === 0) {
            // Send a message indicating no data found
            res.status(404).json({ message: 'No user data found' });
        } else {
            // Send the retrieved user data as a response
            res.json(userData);
        }
    } catch (error) {
        console.error('Error fetching user list:', error);
        // Send an internal server error response
        res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
    }
});


// router.get('/userlistforbadge2', verifyToken, async (req, res) => {
//     try {
//         // Extract startDate and endDate values from request query parameters
//         const { startDate, endDate } = req.query;

//         // Define the base SQL query to fetch user data
//         let sqlQuery = `SELECT cs_regno, cs_first_name, cs_last_name, cs_reg_category FROM cs_os_users WHERE cs_isconfirm = 1`;

//         // Check if startDate and endDate are provided
//         if (startDate && endDate) {
//             // Add WHERE clause to filter users within the specified date range
//             sqlQuery = `SELECT u.*, r.cs_reg_daytype_name AS cs_reg_type, w.cs_workshop_name AS cs_workshop_category
//                         FROM cs_os_users u
//                         LEFT JOIN cs_os_reg_daytype r ON u.cs_reg_type = r.cs_reg_daytype_id
//                         LEFT JOIN cs_os_workshop w ON u.cs_workshop_category = w.cs_workshop_id
//                         WHERE u.created_at BETWEEN ? AND ? AND cs_isconfirm = 1`;
            
//             // Execute the query with date parameters
//             const userData = await pool.query(sqlQuery, [startDate, endDate]);

//             // Check if data is found
//             if (userData.length === 0) {
//                 // Send a message indicating no data found
//                 res.status(404).json({ message: 'No user data found' });
//             } else {
//                 // Send the retrieved user data as a response
//                 res.json(userData);
//             }
//         } else {
//             // If no date range is provided, fetch all users
//             const userData = await pool.query(sqlQuery);

//             // Check if data is found
//             if (userData.length === 0) {
//                 // Send a message indicating no data found
//                 res.status(404).json({ message: 'No user data found' });
//             } else {
//                 // Send the retrieved user data as a response
//                 res.json(userData);
//             }
//         }
//     } catch (error) {
//         console.error('Error fetching user list:', error);
//         // Send an internal server error response
//         res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
//     }
// });

router.get('/userlistforbadge2', verifyToken, async (req, res) => {
    try {
        // Extract startDate and endDate values from request query parameters
        let { startDate, endDate } = req.query;

        // Define the base SQL query to fetch user data
        let sqlQuery = `SELECT cs_regno, cs_first_name, cs_last_name, cs_reg_category FROM cs_os_users WHERE cs_isconfirm = 1`;



        // Check if startDate and endDate are provided
        if (startDate && endDate) {
            // Define a SQL query with date range filtering and necessary joins
            const timeZoneQuery = `
            SELECT cs_value 
            FROM cs_tbl_sitesetting 
            WHERE cs_parameter = 'Time Zone'
            LIMIT 1
          `;
            const timeZoneResult = await pool.query(timeZoneQuery);
            const timezone = timeZoneResult[0][0].cs_value;
            
            startDate = moment.tz(startDate, timezone).startOf('day').format('YYYY-MM-DD HH:mm:ss');
            endDate = moment.tz(endDate, timezone).endOf('day').format('YYYY-MM-DD HH:mm:ss');

            sqlQuery = `SELECT u.*, 
                               COALESCE(r.cs_reg_daytype_name, '') AS cs_reg_type, 
                               COALESCE(w.cs_workshop_name, '') AS cs_workshop_category
                        FROM cs_os_users u
                        LEFT JOIN cs_os_reg_daytype r ON u.cs_reg_type = r.cs_reg_daytype_id
                        LEFT JOIN cs_os_workshop w ON u.cs_workshop_category = w.cs_workshop_id
                        WHERE u.created_at BETWEEN ? AND ? AND cs_isconfirm = 1`;
            
            // Execute the query with date parameters
            const userData = await pool.query(sqlQuery, [startDate, endDate]);

            // Check if data is found
            if (userData.length === 0) {
                res.status(404).json({ message: 'No user data found' });
            } else {
                res.json(userData);
            }
        } else {
            // If no date range is provided, fetch all users
            const userData = await pool.query(sqlQuery);

            // Check if data is found
            if (userData.length === 0) {
                res.status(404).json({ message: 'No user data found' });
            } else {
                res.json(userData);
            }
        }
    } catch (error) {
        console.error('Error fetching user list:', error);
        res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
    }
});


// router.get('/userlistforbadge2', verifyToken, async (req, res) => {
//     try {
//         // Extract startDate and endDate values from request query parameters
//         let { startDate, endDate } = req.query;

//         // Adjust endDate to include the full day (23:59:59)
//         if (startDate && endDate) {
//             // Assuming the timezone you want to use (e.g., 'America/New_York')
//             const timeZoneQuery = `
//             SELECT cs_value 
//             FROM cs_tbl_sitesetting 
//             WHERE cs_parameter = 'Time Zone'
//             LIMIT 1
//           `;
//             const timeZoneResult = await pool.query(timeZoneQuery);
//             const timezone = timeZoneResult[0][0].cs_value;
            
//             startDate = moment.tz(startDate, timezone).startOf('day').format('YYYY-MM-DD HH:mm:ss');
//             endDate = moment.tz(endDate, timezone).endOf('day').format('YYYY-MM-DD HH:mm:ss');

//             // Define a SQL query with date range filtering and necessary joins
//             let sqlQuery = `SELECT u.*, 
//                                    COALESCE(r.cs_reg_daytype_name, '') AS cs_reg_type, 
//                                    COALESCE(w.cs_workshop_name, '') AS cs_workshop_category
//                             FROM cs_os_users u
//                             LEFT JOIN cs_os_reg_daytype r ON u.cs_reg_type = r.cs_reg_daytype_id
//                             LEFT JOIN cs_os_workshop w ON u.cs_workshop_category = w.cs_workshop_id
//                             WHERE u.created_at BETWEEN ? AND ? AND cs_isconfirm = 1`;

//             // Execute the query with date parameters
//             const userData = await pool.query(sqlQuery, [startDate, endDate]);

//             // Check if data is found
//             if (userData.length === 0) {
//                 res.status(404).json({ message: 'No user data found' });
//             } else {
//                 res.json(userData);
//             }
//         } else {
//             // If no date range is provided, fetch all users
//             let sqlQuery = `SELECT cs_regno, cs_first_name, cs_last_name, cs_reg_category FROM cs_os_users WHERE cs_isconfirm = 1`;
//             const userData = await pool.query(sqlQuery);

//             // Check if data is found
//             if (userData.length === 0) {
//                 res.status(404).json({ message: 'No user data found' });
//             } else {
//                 res.json(userData);
//             }
//         }
//     } catch (error) {
//         console.error('Error fetching user list:', error);
//         res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
//     }
// });





router.get('/getDropdownData', verifyToken, async (req, res) => {

    try {

        // Specify the columns you want to fetch from each table

        const reg_cat = ['cs_reg_category', 'cs_reg_cat_id'];
        const Scanday_type = ['cs_reg_daytype_name', 'cs_reg_daytype_id'];

        // Execute each query to fetch data from respective tables

        const [regCatData] = await pool.query(`SELECT ${reg_cat.join(',')} FROM cs_os_category WHERE cs_status = 1`);
        const [ScandayTypeData] = await pool.query(`SELECT ${Scanday_type.join(',')} FROM cs_os_reg_daytype WHERE cs_status = 1`);

        // Construct the response object
        const responseData = {
            regCategory: regCatData,
            dayType: ScandayTypeData,
        };

        // Send the response containing data from all queries
        res.json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


//   router.post('/exportbadgeUsers', async (req, res) => {
//     try {
//         // Extract selected category and event day IDs from the request body
//         const { selectedCategory, selectedEventDay, csFieldNames } = req.body;

//         const filteredFieldNames = csFieldNames.filter(fieldName => fieldName.trim() !== '');
//         console.log('Selected Category:', selectedCategory);
//         console.log('Selected Event Day:', selectedEventDay);
//         console.log('CS Field Names:', csFieldNames);

//         // Construct the SQL query with only the required fields
//         let query = `
//             SELECT ${filteredFieldNames.join(', ')}
//             FROM cs_os_users
//             WHERE cs_reg_cat_id = ?
//         `;
//         let queryParams = [selectedCategory];

//         // If selected event day is provided, add it to the query
//         if (Array.isArray(selectedEventDay) && selectedEventDay.length > 0) {
//             console.log('Selected Event Day (after check):', selectedEventDay);
//             query += ` AND cs_reg_type = ?`;
//             queryParams.push(selectedEventDay[0]); // Assuming only one event day is selected
//         }
//         // Perform the database query
//         const userData = await pool.query(query, queryParams);
//         console.log('Retrieved User Data:', userData);

//         // Check if data is found
//         if (userData.length === 0) {
//             // Send a message indicating no data found
//             res.status(404).json({ message: 'No data found with the specified criteria' });
//         } else {
//             // Send the retrieved user data as a response
//             res.json(userData);
//         }
//     } catch (error) {
//         console.error('Error fetching user data:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });

//--170524

// router.post('/exportbadgeUsers', verifyToken, async (req, res) => {
//     try {
//         // Extract selected category and event day IDs from the request body
//         const { selectedCategory, selectedEventDay, csFieldNames } = req.body;

//         const filteredFieldNames = csFieldNames.filter(fieldName => fieldName.trim() !== '');
//         console.log('Selected Category:', selectedCategory);
//         console.log('Selected Event Day:', selectedEventDay);
//         console.log('CS Field Names:', csFieldNames);

//         // Construct the SQL query with only the required fields
//         let query = `
//             SELECT ${filteredFieldNames.join(', ')}
//             FROM cs_os_users
//             WHERE cs_reg_cat_id = ? AND cs_isconfirm = 1
//         `;
//         let queryParams = [selectedCategory];

//         // Check if 'fullname' is included in the csFieldNames
//         if (csFieldNames.includes('fullname')) {
//             query = `
//                 SELECT ${filteredFieldNames.filter(fieldName => fieldName !== 'fullname').join(', ')},
//                        CONCAT(IFNULL(u.cs_title, ''), ' ', u.cs_first_name, ' ', u.cs_last_name) AS fullname
//                 FROM cs_os_users u
//             `;
//         }

//         // Check if 'cs_reg_type' is needed and add the join with the `cs_reg_type` table
//         if (csFieldNames.includes('cs_reg_type')) {
//             query += `
//                 LEFT JOIN cs_os_reg_daytype rt ON u.cs_reg_type = rt.cs_reg_daytype_id
//             `;
//             query = query.replace('cs_reg_type', 'rt.cs_reg_daytype_name AS cs_reg_type'); // Replace ID with name
//         }

//         if (csFieldNames.includes('cs_workshop_category	')) {
//             query += `
//                 LEFT JOIN cs_os_workshop w ON u.cs_workshop_category = w.cs_workshop_id
//             `;
//             query = query.replace('cs_workshop_category', 'w.cs_workshop_name AS cs_workshop'); // Replace ID with workshop name
//         }

//         // Add the conditions to filter by category and event day
//         query += `
//             WHERE u.cs_reg_cat_id = ? AND u.cs_isconfirm = 1
//         `;
//         // If selected event day is provided, add it to the query
//         if (Array.isArray(selectedEventDay) && selectedEventDay.length > 0) {
//             console.log('Selected Event Day (after check):', selectedEventDay);
//             query += ` AND cs_reg_type = ?`;
//             queryParams.push(selectedEventDay[0]); // Assuming only one event day is selected
//         }
//         // Perform the database query
//         const userData = await pool.query(query, queryParams);
//         console.log('Retrieved User Data:', userData);

//         // Check if data is found
//         if (userData.length === 0) {
//             // Send a message indicating no data found
//             res.status(404).json({ message: 'No data found with the specified criteria' });
//         } else {
//             // Send the retrieved user data as a response
//             res.json(userData);
//         }
//     } catch (error) {
//         console.error('Error fetching user data:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });

router.post('/exportbadgeUsers', verifyToken, async (req, res) => {
    try {
        // Extract selected category and event day IDs from the request body
        const { selectedCategory, selectedEventDay, csFieldNames } = req.body;

        const filteredFieldNames = csFieldNames.filter(fieldName => fieldName.trim() !== '');
        console.log('Selected Category:', selectedCategory);
        console.log('Selected Event Day:', selectedEventDay);
        console.log('CS Field Names:', csFieldNames);

        // Construct the SQL query with only the required fields
        let query = `
            SELECT ${filteredFieldNames.join(', ')}
            FROM cs_os_users u
            WHERE u.cs_reg_cat_id = ? AND u.cs_isconfirm = 1
        `;
        let queryParams = [selectedCategory];

        // Check if 'fullname' is included in the csFieldNames
        if (csFieldNames.includes('fullname')) {
            query = `
                SELECT ${filteredFieldNames.filter(fieldName => fieldName !== 'fullname').join(', ')},
                       CONCAT(IFNULL(u.cs_title, ''), ' ', u.cs_first_name, ' ', u.cs_last_name) AS fullname
                FROM cs_os_users u
                WHERE u.cs_reg_cat_id = ? AND u.cs_isconfirm = 1
            `;
        }

        // Check if 'cs_reg_type' is needed and add the join with the `cs_reg_type` table
        if (csFieldNames.includes('cs_reg_type')) {
            query += `
                LEFT JOIN cs_os_reg_daytype rt ON u.cs_reg_type = rt.cs_reg_daytype_id
            `;
            query = query.replace('cs_reg_type', 'rt.cs_reg_daytype_name AS cs_reg_type'); // Replace ID with name
        }

        // Check if 'cs_workshop_category' is needed and add the join with the `cs_os_workshop` table
        if (csFieldNames.includes('cs_workshop_category')) {
            query += `
                LEFT JOIN cs_os_workshop w ON u.cs_workshop_category = w.cs_workshop_id
            `;
            query = query.replace('cs_workshop_category', 'w.cs_workshop_name AS cs_workshop'); // Replace ID with workshop name
        }

        // Add the condition to filter by event day if provided
        if (Array.isArray(selectedEventDay) && selectedEventDay.length > 0) {
            console.log('Selected Event Day (after check):', selectedEventDay);
            query += ` AND u.cs_reg_type = ?`;
            queryParams.push(selectedEventDay[0]); // Assuming only one event day is selected
        }

        // Perform the database query
        const userData = await pool.query(query, queryParams);
        console.log('Retrieved User Data:', userData);

        // Check if data is found
        if (userData.length === 0) {
            res.status(404).json({ message: 'No data found with the specified criteria' });
        } else {
            res.json(userData);
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});




// userdataforBadgePrinting 
router.get('/getsearchUserdata', verifyToken, async (req, res) => {
    try {
        const { query } = req.query; // Extract the search query from the request query parameters
        console.log("getsearchUserdata query", query);
        const searchQuery = `%${query}%`; // Construct a SQL query with wildcard for partial matches

        // const columnsToFetch = ['*'];
        const columnsToFetch = ['u.*', 'r.cs_reg_daytype_name AS cs_reg_type', 'w.cs_workshop_name As cs_workshop_category'];
        // Query the database to search for users matching the search query
        // const sql = `
        //     SELECT ${columnsToFetch.join(', ')}
        //     FROM cs_os_users u
        //     JOIN cs_os_reg_daytype r ON u.cs_reg_type = r.cs_reg_daytype_id
        //     WHERE u.cs_regno LIKE ? OR
        //           u.cs_first_name LIKE ? OR
        //           u.cs_last_name LIKE ?
        // `;

        const sql = `
        SELECT ${columnsToFetch.join(', ')}
        FROM cs_os_users u
        LEFT JOIN cs_os_reg_daytype r ON u.cs_reg_type = r.cs_reg_daytype_id
        LEFT JOIN cs_os_workshop w ON u.cs_workshop_category = w.cs_workshop_id
            WHERE (u.cs_regno LIKE ? OR
                   u.cs_first_name LIKE ? OR
                   u.cs_last_name LIKE ?)
              AND u.cs_isconfirm = 1
              
    `;
        const results = await pool.query(sql, [searchQuery, searchQuery, searchQuery]);

        console.log('Search results:', results); // Log the search results

        if (results.length > 0) {
            // If users are found, return the list of matching users
            res.json(results);
        } else {
            // If no users are found, return an empty array
            res.json([]);
        }
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: 'Internal server error', message: 'An error occurred while searching for users' });
    }
});

module.exports = router;