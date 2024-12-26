// user.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database'); // Import the database db
const verifyToken = require('./middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const queueMiddleware = require('../api/middleware/queueMiddleware');

// app.use(cors());



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'app-icon/'); // Save uploaded files to the 'app-icon' directory
  },
  filename: (req, file, cb) => {
    const dName = req.body.dName.replace(/\s+/g, '').toLowerCase(); // Extract the name from the request body
    const dateTime = new Date().toLocaleString('en-US', { hour12: false }).replace(/[^\w\s]/gi, '').replace(/ /g, '_'); // Get current date and time in a formatted string without AM/PM
    let filename;
    if (file.fieldname === 'brightModeIcon') {
      filename = `${dName}-brightmode-${dateTime}${path.extname(file.originalname)}`;
    } else if (file.fieldname === 'darkModeIcon') {
      filename = `${dName}-darkmode-${dateTime}${path.extname(file.originalname)}`;
    } else {
      filename = `${dName}-${dateTime}${path.extname(file.originalname)}`;
    }
    cb(null, filename);
  },
});

const upload = multer({ storage: storage });







// Endpoint to handle single file upload for both brightModeIcon and darkModeIcon
// router.post('/fileupload', upload.fields([{ name: 'brightModeIcon', maxCount: 1 }, { name: 'darkModeIcon', maxCount: 1 }]), (req, res) => {
//   try {
//     if (!req.files || !req.files['brightModeIcon'] || !req.files['darkModeIcon']) {
//       return res.status(400).json({ message: 'Missing file(s)' });
//     }

//     const brightModeIcon = req.files['brightModeIcon'][0];
//     const darkModeIcon = req.files['darkModeIcon'][0];

//     // Further processing with the files (e.g., saving to disk, saving file paths to database, etc.)

//     res.json({ success: true });
//   } catch (error) {
//     console.error('Error uploading file:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });




// ----------------- 
// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     if (!email || !password) {
//       return res.status(400).json({ message: 'Api Username and password are required' });
//     }

//     const [users] = await pool.query('SELECT * FROM login_details WHERE username = ?', [email]);
//     const user = users[0];

//     if (!user || user.password !== password) {
//       return res.status(401).json({ message: 'Invalid username or password' });
//     }


//      // Retrieve user's role information
//      const [roles] = await pool.query('SELECT role_name FROM dash_roles WHERE role_id = ?', [user.role_id]);
//   const roleName = roles[0].role_name;

//     // Generate JWT token
//     // const token = jwt.sign({ username: user.username, id: user.id }, process.env.SECRET_KEY, { expiresIn: '1h' });
//     const token = jwt.sign({ username: user.username, id: user.id, role: roleName }, process.env.SECRET_KEY, { expiresIn: '1h' });
//     res.status(200).json({ message: 'Login successful', token: token });
//   } catch (error) {
//     console.error('Database error:', error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// });

// Define the route to fetch user data from the cs_user table
// router.get('/getuser', async (req, res) => {
//   try {
//       // Specify the columns you want to fetch from the table
//       const columnsToFetch = ['*'];

//       // Construct the SQL query to fetch specific columns
//       const query = `SELECT ${columnsToFetch.join(',')} FROM cs_users`;

//       // Execute the query to fetch user data from the table
//       const [userData] = await pool.query(query);

//       // Send the user data as a response
//       res.json(userData);
//   } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Internal server error' });
//   }
// });

// Define the route to fetch user data from the cs_user table
router.get('/getuser', verifyToken, async (req, res) => {
  try {
    // Specify the columns you want to fetch from the table
    const columnsToFetch = ['*'];

    // Construct the SQL query to fetch specific columns
    const query = `SELECT ${columnsToFetch.join(',')} FROM cs_os_users WHERE cs_isconfirm = 1`;

    // Execute the query to fetch user data from the table
    const [userData] = await pool.query(query);

    // Send the user data as a response
    res.json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT endpoint to update user data
router.put('/update/:userId', verifyToken, async (req, res) => {
  const userId = req.params.userId; // Extract userId from URL path
  const updatedUserData = req.body; // New user data to be updated

  try {
    // Construct the SQL query to update user data
    const query = `UPDATE cs_os_users SET ? WHERE id = ?`;

    // Execute the query to update user data in the database
    await pool.query(query, [updatedUserData, userId]);

    res.json({ message: 'User data updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// GET endpoint for fetching all rows from cs_os_badgeapp_userlogin based on role_id
router.get('/checkrole/:roleId', verifyToken, async (req, res) => {
  const roleId = req.params.roleId;

  try {
    // Construct the SQL query to fetch all rows from cs_os_badgeapp_userlogin where role_id matches
    const query = 'SELECT * FROM cs_os_badgeapp_userlogin WHERE cs_role_id = ?';

    // Execute the query
    const result = await pool.query(query, [roleId]);

    // Return the result as JSON
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching users with role_id from cs_os_badgeapp_userlogin:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// router.delete('/deleterole/:roleId', async (req, res) => {
//   const roleId = req.params.roleId;

//   try {
//     const replacementRoleId = req.body.replacementRoleId;

//     // Update cs_os_badgeapp_userlogin table
//     const updateQuery = 'UPDATE cs_os_badgeapp_userlogin SET cs_role_id = ? WHERE cs_role_id = ?';
//     await pool.query(updateQuery, [replacementRoleId, roleId]);

//     // Delete from cs_os_roles table
//     const deleteRolesQuery = 'DELETE FROM cs_os_roles WHERE cs_role_id = ?';
//     await pool.query(deleteRolesQuery, [roleId]);

//     // Delete from cs_os_access_status table
//     const deleteAccessQuery = 'DELETE FROM cs_os_access_status WHERE cs_role_id = ?';
//     await pool.query(deleteAccessQuery, [roleId]);

//     res.status(200).json({ message: `Role with ID ${roleId} deleted successfully.` });
//     console.log(`Role with ID ${roleId} deleted successfully.`);
//   } catch (error) {
//     console.error('Error deleting role:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });



router.put('/updateuserrole/:userId', verifyToken, async (req, res) => {
  const userId = req.params.userId;
  const { role_id } = req.body;

  try {
    // Construct the SQL query to update the role_id for the user
    const query = `UPDATE cs_os_badgeapp_userlogin SET cs_role_id = ? WHERE user_id = ?`;

    // Execute the query to update the role_id
    await pool.query(query, [role_id, userId]);

    res.status(200).json({ message: `Role updated successfully for user ID ${userId}.` });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});





// // DELETE endpoint for deleting a role by ID
// router.delete('/deleterole/:roleId', async (req, res) => {
//   const roleId = req.params.roleId;

//   try {
//       // Construct the SQL query to delete the role from the database
//       const query = `DELETE FROM cs_os_roles WHERE role_id = ?`;

//       // Execute the query to delete the role
//       await pool.query(query, [roleId]);

//       res.status(200).json({ message: `Role with ID ${roleId} deleted successfully.` });
//   } catch (error) {
//       console.error('Error deleting role:', error);
//       res.status(500).json({ message: 'Internal server error' });
//   }
// });                                 

// PUT endpoint to update user data
router.put('/updateStatus/:userId', verifyToken, async (req, res) => {
  const userId = req.params.userId; // Extract userId from URL path
  const newStatus = req.body.status; // Extract new status from request body

  try {
    // Construct the SQL query to update user status
    const query = `UPDATE cs_users SET status = ? WHERE id = ?`;

    // Execute the query to update user status in the database
    await pool.query(query, [newStatus, userId]);

    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// // Define the route to fetch Roles data from the cs_os_roles
// router.get('/getroles', async (req, res) => {
//   try {
//     // Specify the columns you want to fetch from the table
//     const columnsToFetch = ['*'];

//     // Construct the SQL query to fetch specific columns
//     const query = `SELECT ${columnsToFetch.join(',')} FROM cs_os_roles`;

//     // Execute the query to fetch user data from the table
//     const [userData] = await pool.query(query);

//     // Send the user data as a response
//     res.json(userData);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });



router.post('/addrole', verifyToken,async (req, res) => {
  try {
    const { role_name, role_description, permissions } = req.body;

    // Check if role_name, role_description, and permissions are provided
    if (!role_name || !role_description || !permissions) {
      return res.status(400).json({ message: 'Role name, description, and permissions are required.' });
    }

    // Construct the SQL query to insert a new role into the cs_os_roles table
    const insertRoleQuery = `
        INSERT INTO cs_os_roles (cs_role_name, role_description)
        VALUES (?, ?)
      `;

    // Execute the query to insert the new role into the cs_os_roles table
    await pool.query(insertRoleQuery, [role_name, role_description]);

    // Retrieve the last inserted role_id
    const roleIdResult = await pool.query('SELECT LAST_INSERT_ID() AS cs_role_id FROM cs_os_roles');
    const roleId = roleIdResult[0][0].cs_role_id;

    // Construct the SQL query to insert the new role_id and corresponding access status into the cs_os_access_status table
    const insertAccessQuery = `
      INSERT INTO cs_os_access_status (cs_role_id, cs_facility_id, cs_read_search, cs_validate, cs_add, cs_edit, cs_delete, cs_print, cs_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Iterate over the permissions array and insert access status for each facility
    for (const permission of permissions) {
      const { cs_facility_id, cs_read_search, cs_validate, cs_add, cs_edit, cs_delete, cs_print, cs_count } = permission;
      await pool.query(insertAccessQuery, [roleId, cs_facility_id, cs_read_search, cs_validate, cs_add, cs_edit, cs_delete, cs_print, cs_count]);
    }

    res.status(201).json({ message: 'Role and corresponding access status added successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
});





// Define the route to update permissions for a role
router.put('/updateRole/:facilityId', verifyToken, async (req, res) => {
  try {
    const facilityId = req.params.facilityId;
    const { cs_read_search, cs_validate, cs_add, cs_edit, cs_delete, cs_print, cs_count } = req.body;

    // Construct the SQL query to update permissions for the specified role
    const query = `
      UPDATE cs_os_access_status 
      SET 
        cs_read_search = ?, 
        cs_validate = ?, 
        cs_add = ?, 
        cs_edit = ?, 
        cs_delete = ?, 
        cs_print = ?, 
        cs_count = ? 
      WHERE 
        facility_id = ?
    `;

    // Execute the query to update permissions for the role
    await pool.query(query, [cs_read_search, cs_validate, cs_add, cs_edit, cs_delete, cs_print, cs_count, facilityId]);

    res.status(200).json({ message: 'Permissions updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});





// router.post('/getpages', async (req, res) => {
//   try {
//       const { roleId } = req.body;

//       // Specify the columns you want to fetch from the table
//       const columnsToFetch = ['*'];

//       // Construct the SQL query to fetch specific columns
//       const query = `SELECT ${columnsToFetch.join(',')} FROM cs_os_access_status WHERE role_Id = ?`;

//       // Execute the query with roleId as a parameter
//       const [userData] = await pool.query(query, [roleId]);

//       // Send the user data as a response
//       res.json(userData);
//   } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Internal server error' });
//   }
// });


router.post('/getpages', verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    const { roleId } = req.body;

    // Specify the columns you want to fetch from the tables
    const columnsToFetch = ['cs_os_access_status.*', 'cs_os_facilitytype.cs_display_name'];

    const query = `
      SELECT ${columnsToFetch.join(',')}
      FROM cs_os_access_status
      INNER JOIN cs_os_facilitytype ON cs_os_access_status.cs_facility_id = cs_os_facilitytype.cs_facility_id
      WHERE cs_os_access_status.cs_role_id = ? 
      AND cs_os_facilitytype.cs_status IN (1, 2)
      ORDER BY cs_os_facilitytype.cs_status ASC
    `;

    // Execute the query to fetch pages data for the specified role_id
    const [pagesData] = await pool.query(query, [roleId]);

    // Send the pages data as a response
    res.json(pagesData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// // Define the route to fetch Roles data from the cs_os_roles
// router.get('/getpermission', async (req, res) => {
//   try {
//     // Specify the columns you want to fetch from the table
//     const columnsToFetch = ['*'];

//     // Construct the SQL query to fetch specific columns
//     const query = `SELECT ${columnsToFetch.join(',')} FROM cs_os_facilitytype WHERE cs_os_facilitytype.cs_status IN (1, 2)
//         ORDER BY cs_os_facilitytype.cs_status ASC `;

//     // Execute the query to fetch user data from the table
//     const [userData] = await pool.query(query);

//     // Send the user data as a response
//     res.json(userData);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });





// router.put('/updatepermission', async (req, res) => {
//   const { userId, pageId, field, value, facilityId } = req.body;

//   try {
//       // Construct the SQL query to update the specified field for a specific user and page
//         // Now you can use these values as needed
//         console.log('Received update request:');
//         console.log('User ID:', userId);
//         console.log('Field:', field);
//         console.log('Updated Value:', value);
//         console.log('Facility ID:', facilityId);



//         await db('cs_os_access_status')
//         .where({ role_id: userId, facility_id: facilityId })
//         .update({ [field]: value });


//       // const query = `
//       //     UPDATE cs_os_access_status
//       //     SET ${field} = ?
//       //     WHERE facility_id = ? AND role_id = ?
//       // `;

//       // Execute the query to update the specified field in the database
//       // await pool.query(query, [value, pageId, userId, facilityId]);

//       res.json({ message: `${field} updated successfully` });
//   } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Internal server error' });
//   }
// });


//---------------
router.post('/updatepermission', verifyToken, async (req, res) => {
  const { userId, pageId, field, value, facilityId } = req.body;

  try {
    // Log the received request data for debugging
    console.log('Received update request:');
    console.log('User ID:', userId);
    console.log('Page ID:', pageId);
    console.log('Field:', field);
    console.log('Updated Value:', value);
    console.log('Facility ID:', facilityId);

    // Perform data validation if necessary
    if (!userId || !field || !value || !facilityId) {
      throw new Error('Missing required fields');
    }

    // Construct the SQL query to update the specified field for a specific user and facility
    const query = `
        UPDATE cs_os_access_status
        SET ${field} = ?
        WHERE cs_role_id = ? AND cs_facility_id = ?
    `;

    // Execute the query to update the specified field in the database
    const result = await pool.query(query, [value, userId, facilityId]);

    // Send a success response
    res.json({ message: `${field} updated successfully` });
  } catch (error) {
    // Log any errors that occur
    console.error('Error updating permission:', error);

    // Send an error response
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/getfacility', verifyToken, async (req, res) => {
  try {
    // Extract page number, page size, and search query from request query parameters
    const { page = 1, pageSize = 10, search = '', sortColumn = 'cs_facility_id', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * pageSize;

    const validColumns = ['cs_facility_id', 'cs_display_name', 'cs_type', 'cs_status'];  // Add all valid column names here
    const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'cs_facility_id';

    // Specify the columns you want to fetch from the table
    const columnsToFetch = ['*'];

    // Construct the base SQL query
    let query = `
      SELECT ${columnsToFetch.join(',')}
      FROM cs_os_facilitytype
      WHERE cs_status != 2
    `;

    // Append search condition if search query is provided
    let searchCondition = '';
    if (search) {
      searchCondition = `
        AND (
          cs_name LIKE '%${search}%' OR 
          cs_display_name LIKE '%${search}%' OR 
          cs_type LIKE '%${search}%' OR 
          cs_logo_darkmode_image_name LIKE '%${search}%' OR 
          cs_logo_darkmode_image_url LIKE '%${search}%' OR 
          cs_daywise LIKE '%${search}%'
        )
      `;
      query += searchCondition;
    }

    // Append pagination
    query += `
      ORDER BY ${columnToSortBy} ${sortOrder}
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    // Execute the query to fetch facility data from the table
    const [facilityData] = await pool.query(query);

    console.log(facilityData);

    // Construct the SQL query to count total items with the same search condition
    let totalCountQuery = `
      SELECT COUNT(*) AS total 
      FROM cs_os_facilitytype
      WHERE cs_status != 2
    `;
    if (searchCondition) {
      totalCountQuery += searchCondition;
    }

    // Execute the query to get the total count
    const [totalCountResult] = await pool.query(totalCountQuery);
    const totalItems = totalCountResult[0].total;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Send the facility data as a response along with pagination metadata
    res.json({ facilities: facilityData, currentPage: parseInt(page), totalPages, pageSize, totalItems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



//Update Status
// router.put('/UpdateStatus', async (req, res) => {
//   try {
//     // Extract role_id from the request body
//     const { id, status, Name } = req.body;

//     // Define the update queries for cs_os_facilitytype and cs_os_facility_detail
//     const updateQuery1 = `UPDATE cs_os_facilitytype SET cs_status = ? WHERE cs_facility_id = ?`;
//     const updateQuery5 = `UPDATE cs_os_workshop SET cs_status = ? WHERE cs_workshop_name = ?`;
//     await pool.query(updateQuery5, [status, Name]);

//     const updateQuery2 = `UPDATE cs_os_facility_detail SET cs_status = ? WHERE cs_facility_id = ?`;

//     // Execute the first update query for cs_os_facilitytype
//     await pool.query(updateQuery1, [status, id]);

//     // Retrieve cs_facility_detail_id from cs_os_facility_detail
//     const selectQuery = `SELECT cs_facility_detail_id FROM cs_os_facility_detail WHERE cs_facility_id = ?`;
//     const [detailIdResults] = await pool.query(selectQuery, [id]);

//     // Extract cs_facility_detail_id values from the result
//     const csFacilityDetailIds = detailIdResults.map(result => result.cs_facility_detail_id);

//     // Execute the second update query for cs_os_facility_detail for each cs_facility_detail_id
//     for (const csFacilityDetailId of csFacilityDetailIds) {
//       await pool.query(updateQuery2, [status, id]);

//       // Update cs_status in cs_os_facility_category based on current csFacilityDetailId
//       const updateQuery3 = `UPDATE cs_os_facility_category SET cs_status = ? WHERE cs_facility_detail_id = ?`;
//       await pool.query(updateQuery3, [status, csFacilityDetailId]);
//     }

//     return res.status(200).json({ message: 'Status Updates successfully' });
//   } catch (error) {
//     console.error('Error updating status:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// });

// router.put('/UpdateStatus', async (req, res) => {
//   try {
//     // Extract role_id from the request body
//     const { id, status, Name } = req.body;

//     console.log('status' , status);

//     // Define the update queries for cs_os_facilitytype and cs_os_facility_detail
//     const updateQuery1 = `UPDATE cs_os_facilitytype SET cs_status = ? WHERE cs_facility_id = ?`;
//     const updateQuery5 = `UPDATE cs_os_workshop SET cs_status = ? WHERE cs_workshop_name = ?`;
//     await pool.query(updateQuery5, [status, Name]);

//     const updateQuery2 = `UPDATE cs_os_facility_detail SET cs_status = ? WHERE cs_facility_id = ?`;

//     // Execute the first update query for cs_os_facilitytype
//     await pool.query(updateQuery1, [status, id]);

//     // Retrieve cs_facility_detail_id from cs_os_facility_detail
//     const selectQuery = `SELECT cs_facility_detail_id FROM cs_os_facility_detail WHERE cs_facility_id = ?`;
//     const [detailIdResults] = await pool.query(selectQuery, [id]);

//     // Extract cs_facility_detail_id values from the result
//     const csFacilityDetailIds = detailIdResults.map(result => result.cs_facility_detail_id);

//     // Execute the second update query for cs_os_facility_detail for each cs_facility_detail_id
//     for (const csFacilityDetailId of csFacilityDetailIds) {
//       await pool.query(updateQuery2, [status, id]);

//       // Update cs_status in cs_os_facility_category based on current csFacilityDetailId
//       const updateQuery3 = `UPDATE cs_os_facility_category SET cs_status = ? WHERE cs_facility_detail_id = ?`;

//       await pool.query(updateQuery3, [status, csFacilityDetailId]);

//     }

//     const facilityNameQuery = 'SELECT cs_facility_detail_id, cs_facility_name FROM cs_os_facility_detail WHERE cs_facility_id = ?';
//     const facilityNameResult = await pool.query(facilityNameQuery, [id]);
    
//     console.log("facilityNameResult", facilityNameResult);
    
//     if (facilityNameResult && facilityNameResult.length > 0 && facilityNameResult[0].length > 0) {
//       for (const row of facilityNameResult[0]) {
//           const facilityName = row.cs_facility_name;
//           const cs_facility_detail_id = row.cs_facility_detail_id;
//           console.log('Facility Name:', facilityName);
//         // Log the value of cs_reg_cat_id
          
//           // Your code for updating badge data goes here
//           const badgeDataQuery = 'SELECT cs_regno,cs_reg_cat_id, cs_badge_data FROM cs_os_badges';
//           const badgeDataResult = await pool.query(badgeDataQuery);
//           const badgeData = badgeDataResult[0][0].cs_badge_data;

//           console.log('cs_reg_cat_id:',  badgeDataResult[0][0].cs_reg_cat_id); 

  
//           // Parsing the badge data
//           const parsedBadgeData = JSON.parse(badgeData);

  
//           // Check if the facilityName exists in the parsed JSON data
//           // Check if the facilityName exists in the parsed JSON data
// if (status == 0) {
//   if (facilityName && parsedBadgeData.hasOwnProperty(facilityName)) {
//       // Update the corresponding value with cs_allow_count
//       parsedBadgeData[facilityName] = '0';
//       const updatedBadgeData = JSON.stringify(parsedBadgeData);
  
//       // Update cs_badge_data in the cs_os_badges table
//       const updateBadgeQuery = `UPDATE cs_os_badges SET cs_badge_data = ? `;
//       await pool.query(updateBadgeQuery, [updatedBadgeData]);
//   } else {
//       console.log(`Facility ${facilityName} not found in badge data`);
//   }
// } else {
//   // Loop through each badge entry in badgeDataResult
//   for (const badgeEntry of badgeDataResult[0]) {
//       // Extract cs_reg_cat_id and cs_badge_data from each badge entry
//       // console.log('cs_facility_detail_id' , cs_facility_detail_id);
//       const { cs_regno, cs_reg_cat_id, cs_badge_data } = badgeEntry;

      
//       // Parse the badge data
//       const parsedBadgeData = JSON.parse(cs_badge_data);

//       const userQuery = `SELECT cs_reg_type FROM cs_os_user WHERE cs_regno = ?`;
//       const [userResults] = await pool.query(userQuery, [cs_regno]);

//       if (userResults.length > 0) {
//         const { cs_reg_type } = userResults[0];
//         console.log('cs_reg_type:', cs_reg_type);
//       }
     
//       // Check if the facilityName exists in the parsed JSON data
//       if (facilityName && parsedBadgeData.hasOwnProperty(facilityName)) {
//           const selectQuery = `
//               SELECT cs_allow_count
//               FROM cs_os_facility_category
//               WHERE cs_facility_detail_id = ? AND cs_reg_cat_id = ?
//           `;
//           const selectValues = [cs_facility_detail_id, cs_reg_cat_id];

//           try {
//             const result = await pool.query(selectQuery, selectValues);
            
//             if (result.length > 0) {
//               const { cs_allow_count } = result[0][0]; // Access cs_allow_count from the first element of the result array
//                 // Update the corresponding value with cs_allow_count
//                 // console.log('result:', result); // Log the entire result object
//                 // console.log('cs_allow_count:', cs_allow_count); // Log cs_allow_count separately
//                 parsedBadgeData[facilityName] = cs_allow_count;
//                  console.log("parsedBadgeData" , parsedBadgeData);
//                  const updatedBadgeData = JSON.stringify(parsedBadgeData);
  
//                  // Update cs_badge_data in the cs_os_badges table
//                  const updateBadgeQuery = `UPDATE cs_os_badges SET cs_badge_data = ? `;
//                  await pool.query(updateBadgeQuery, [updatedBadgeData]);

                
//             } else {
//                 console.log(`No data found for facility ${facilityName} and cs_reg_cat_id ${cs_reg_cat_id}`);
//             }
//         } catch (error) {
//             console.error("Error fetching cs_allow_count:", error);
//         }
//       } else {
//           console.log(`Facility ${facilityName} not found in badge data`);
//       }
//   }
// }

  
//           // Convert the updated badge data back to JSON string

//       }
//   } else {
//       console.error('Facility names not found for the given id:', id);
//   }
  
    
 




//     return res.status(200).json({ message: 'Status Updates successfully' });
//   } catch (error) {
//     console.error('Error updating status:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// });



// router.put('/UpdateStatus', async (req, res) => {
//   try {
//     // Extract role_id from the request body
//     const { id, status, Name } = req.body;

//     console.log('status', status);

//     // Define the update queries for cs_os_facilitytype and cs_os_facility_detail
//     const updateQuery1 = `UPDATE cs_os_facilitytype SET cs_status = ? WHERE cs_facility_id = ?`;
//     const updateQuery5 = `UPDATE cs_os_workshop SET cs_status = ? WHERE cs_workshop_name = ?`;
//     await pool.query(updateQuery5, [status, Name]);

//     const updateQuery2 = `UPDATE cs_os_facility_detail SET cs_status = ? WHERE cs_facility_id = ?`;

//     // Execute the first update query for cs_os_facilitytype
//     await pool.query(updateQuery1, [status, id]);

//     // Retrieve cs_facility_detail_id from cs_os_facility_detail
//     const selectQuery = `SELECT cs_facility_detail_id FROM cs_os_facility_detail WHERE cs_facility_id = ?`;
//     const [detailIdResults] = await pool.query(selectQuery, [id]);

//     // Extract cs_facility_detail_id values from the result
//     const csFacilityDetailIds = detailIdResults.map(result => result.cs_facility_detail_id);

//     // Execute the second update query for cs_os_facility_detail for each cs_facility_detail_id
//     for (const csFacilityDetailId of csFacilityDetailIds) {
//       await pool.query(updateQuery2, [status, id]);

//       // Update cs_status in cs_os_facility_category based on current csFacilityDetailId
//       const updateQuery3 = `UPDATE cs_os_facility_category SET cs_status = ? WHERE cs_facility_detail_id = ?`;
//       await pool.query(updateQuery3, [status, csFacilityDetailId]);
//     }

//     const facilityNameQuery = 'SELECT cs_facility_detail_id, cs_facility_name FROM cs_os_facility_detail WHERE cs_facility_id = ?';
//     const facilityNameResult = await pool.query(facilityNameQuery, [id]);


//     const facilityTypeQuery = 'SELECT cs_type  FROM cs_os_facilitytype WHERE cs_facility_id = ?';
//     const facilityTypeResult = await pool.query(facilityTypeQuery, [id]);
//     console.log("facilityTypeResult" , facilityTypeResult[0][0].cs_type);



//     console.log("facilityNameResult", facilityNameResult);

//     if (facilityNameResult && facilityNameResult.length > 0 && facilityNameResult[0].length > 0) {
//       for (const row of facilityNameResult[0]) {
//         const facilityName = row.cs_facility_name;
//         const cs_facility_detail_id = row.cs_facility_detail_id;
//         console.log('Facility Name:', facilityName);

//         // Your code for updating badge data goes here
//         const badgeDataQuery = 'SELECT cs_regno, cs_reg_cat_id, cs_badge_data FROM cs_os_badges';
//         const badgeDataResult = await pool.query(badgeDataQuery);

//         // Loop through each badge entry in badgeDataResult
//         for (const badgeEntry of badgeDataResult[0]) {
//           // Extract cs_reg_cat_id, cs_badge_data, and cs_regno from each badge entry
//           const { cs_regno, cs_reg_cat_id, cs_badge_data } = badgeEntry;

//           // Parse the badge data
//           const parsedBadgeData = JSON.parse(cs_badge_data);

//           // Fetch cs_reg_type from cs_os_user table
//           const userQuery = `SELECT cs_reg_type,cs_workshop_category FROM cs_os_users WHERE cs_regno = ?`;
//           const [userResults] = await pool.query(userQuery, [cs_regno]);

//           if (userResults.length > 0) {
//             const { cs_reg_type, cs_workshop_category} = userResults[0];
//             // console.log('cs_reg_type:', cs_reg_type);

//             // Check if status is 0
//             if (status == 0) {
//               if (facilityName && parsedBadgeData.hasOwnProperty(facilityName)) {
//                 parsedBadgeData[facilityName] = '0';
//                 const updatedBadgeData = JSON.stringify(parsedBadgeData);

//                 // Update cs_badge_data in the cs_os_badges table
//                 const updateBadgeQuery = `UPDATE cs_os_badges SET cs_badge_data = ? `;
//                 await pool.query(updateBadgeQuery, [updatedBadgeData]);
//               } else {
//                 console.log(`Facility ${facilityName} not found in badge data`);
//               }
//             } else {
//               // Process the badge data based on cs_reg_type
//               const selectAllowCountQuery = `
//                 SELECT cs_allow_count
//                 FROM cs_os_facility_category
//                 WHERE cs_facility_detail_id = ? AND cs_reg_cat_id = ?
//               `;
//               const selectValues = [cs_facility_detail_id, cs_reg_cat_id];
//               const [allowCountResults] = await pool.query(selectAllowCountQuery, selectValues);

//               if (allowCountResults.length > 0) {
//                 allowCountResults.forEach(row => {
//                   const { cs_allow_count } = row;
//                   // if (cs_reg_type && cs_reg_type !== "101") {
                   
//                   //   const reg_daytype = cs_reg_type;
//                   //   if (facilityName.includes(reg_daytype) || !/\d$/.test(facilityName)) {
//                   //     parsedBadgeData[facilityName] = cs_allow_count;
//                   //     parsedBadgeData[`${facilityName}_status`] = "0";
//                   //   } else {
//                   //     parsedBadgeData[facilityName] = "0";
//                   //     parsedBadgeData[`${facilityName}_status`] = "0";
//                   //   }
//                   // } else {
//                   //   parsedBadgeData[facilityName] = cs_allow_count;
//                   //   parsedBadgeData[`${facilityName}_status`] = "0";
//                   // }

//                   if (cs_reg_type && cs_reg_type !== "101") {
//                     const reg_daytype = cs_reg_type;
//                     console.log("reg_daytype", reg_daytype);
//                     const workshop = parseInt(cs_workshop_category, 10);
//                     if (facilityType === 'workshop') {
//                       const [workshopRows] = await pool.query(`
//                           SELECT cs_workshop_id 
//                           FROM cs_os_workshop 
//                           WHERE cs_facility_id = ? 
//                         `, [facilityId]);
                
//                       const workshopId = workshopRows[0]?.cs_workshop_id;
//                       if (workshopId === workshop) {
//                         parsedBadgeData[facilityName] = updatedAllowCount;
//                         parsedBadgeData[facilityName + '_status'] = "0";
//                       } else {
//                         parsedBadgeData[facilityName] = "0";
//                         parsedBadgeData[facilityName + '_status'] = "0";
//                       }
                
//                     } else {
//                       if (facilityName.includes(reg_daytype) || !/\d$/.test(facilityName)) {
//                         parsedBadgeData[facilityName] = updatedAllowCount;
//                         parsedBadgeData[`${facilityName}_status`] = "0";
//                       } else {
//                         parsedBadgeData[facilityName] = "0";
//                         parsedBadgeData[`${facilityName}_status`] = "0";
//                       }
//                     }
//                   } else {
//                     if (facilityType === 'workshop') {
//                       const [workshopRows] = await pool.query(`
//                           SELECT cs_workshop_id 
//                           FROM cs_os_workshop 
//                           WHERE cs_facility_id = ? 
//                         `, [facilityId]);
            
//                         const workshop = parseInt(cs_workshop_category, 10);
                
//                       const workshopId = workshopRows[0]?.cs_workshop_id;
//                       if (workshopId === workshop) {
//                         parsedBadgeData[facilityName] = updatedAllowCount;
//                         parsedBadgeData[facilityName + '_status'] = "0";
//                       } else {
//                         parsedBadgeData[facilityName] = "0";
//                         parsedBadgeData[facilityName + '_status'] = "0";
//                       }
                
//                     } else {
//                       console.log("I am in All day");
//                       parsedBadgeData[facilityName] = updatedAllowCount;
//                       parsedBadgeData[`${facilityName}_status`] = "0";
//                     }
//                   }


                  
//                 });

//                 const updatedBadgeData = JSON.stringify(parsedBadgeData);
//                 const updateBadgeQuery = `UPDATE cs_os_badges SET cs_badge_data = ? `;
//                 await pool.query(updateBadgeQuery, [updatedBadgeData]);
//               } else {
//                 console.log(`No data found for facility ${facilityName} and cs_reg_cat_id ${cs_reg_cat_id}`);
//               }
//             }
//           } else {
//             console.log(`User not found with cs_regno ${cs_regno}`);
//           }
//         }
//       }
//     } else {
//       console.error('Facility names not found for the given id:', id);
//     }

//     return res.status(200).json({ message: 'Status updated successfully' });
//   } catch (error) {
//     console.error('Error updating status:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// });


router.put('/UpdateStatus', verifyToken, async (req, res) => {
  try {
    const { id, status, Name } = req.body;
    console.log('status', status);

   
    // Update cs_os_workshop
    const updateQuery5 = `UPDATE cs_os_workshop SET cs_status = ? WHERE cs_workshop_name = ?`;
    await pool.query(updateQuery5, [status, Name]);

    // Update cs_os_facilitytype
    const updateQuery1 = `UPDATE cs_os_facilitytype SET cs_status = ? WHERE cs_facility_id = ?`;
    await pool.query(updateQuery1, [status, id]);

    // Retrieve cs_facility_detail_id from cs_os_facility_detail
    const selectQuery = `SELECT cs_facility_detail_id FROM cs_os_facility_detail WHERE cs_facility_id = ?`;
    const [detailIdResults] = await pool.query(selectQuery, [id]);
    const csFacilityDetailIds = detailIdResults.map(result => result.cs_facility_detail_id);

    // Update cs_os_facility_detail and cs_os_facility_category
    const updateQuery2 = `UPDATE cs_os_facility_detail SET cs_status = ? WHERE cs_facility_id = ?`;
    const updateQuery3 = `UPDATE cs_os_facility_category SET cs_status = ? WHERE cs_facility_detail_id = ?`;

    for (const csFacilityDetailId of csFacilityDetailIds) {
      await pool.query(updateQuery2, [status, id]);
      await pool.query(updateQuery3, [status, csFacilityDetailId]);
    }

    // Get facility names and types
    const facilityNameQuery = 'SELECT cs_facility_detail_id, cs_facility_name FROM cs_os_facility_detail WHERE cs_facility_id = ?';
    const [facilityNameResult] = await pool.query(facilityNameQuery, [id]);

    const facilityTypeQuery = 'SELECT cs_type FROM cs_os_facilitytype WHERE cs_facility_id = ?';
    const [facilityTypeResult] = await pool.query(facilityTypeQuery, [id]);
    const facilityType = facilityTypeResult[0]?.cs_type;
    console.log("facilityType" , facilityType);

    if (facilityNameResult.length > 0) {
      for (const row of facilityNameResult) {
        const { cs_facility_name: facilityName, cs_facility_detail_id: csFacilityDetailId } = row;

        // Update badge data
        const badgeDataQuery = 'SELECT cs_regno, cs_reg_cat_id, cs_badge_data FROM cs_os_badges';
        const [badgeDataResult] = await pool.query(badgeDataQuery);

        for (const badgeEntry of badgeDataResult) {
          const { cs_regno, cs_reg_cat_id, cs_badge_data } = badgeEntry;
          const parsedBadgeData = JSON.parse(cs_badge_data);

          // const userQuery = `SELECT cs_reg_type, cs_workshop_category FROM cs_os_users WHERE cs_regno = ?`;
          // const [userResults] = await pool.query(userQuery, [cs_regno]);
          const fieldQuery = `SELECT cs_field_name FROM cs_os_field_data WHERE cs_field_type = ?`;
          const [fieldResults] = await pool.query(fieldQuery, ['13']);
          console.log("fieldResults",fieldResults);
      
          // Extract field names from the query result
          const additionalFields = fieldResults.map(row => row.cs_field_name);
          console.log("additionalFields",additionalFields);
      
          const userQueryFields = ['cs_reg_type', 'cs_workshop_category', ...additionalFields].join(', ');
          const userQuery = `SELECT ${userQueryFields} FROM cs_os_users WHERE cs_regno = ?`;
      
          // Execute the dynamically created query
          const [userResults] = await pool.query(userQuery, [cs_regno]);
          console.log("userResults", userResults);

          if (userResults.length > 0) {
            const { cs_reg_type, cs_workshop_category } = userResults[0];

            const additionalFieldValues = {};

            // Loop through each field in additionalFields to retrieve its userData
            additionalFields.forEach(field => {
              additionalFieldValues[field] =parseInt(userResults[0][field], 10);
            });
            
            console.log("additionalFieldValues", additionalFieldValues);

            if (status == 0) {
              if (facilityName in parsedBadgeData) {
                parsedBadgeData[facilityName] = '0';
                const updatedBadgeData = JSON.stringify(parsedBadgeData);
                const updateBadgeQuery = `UPDATE cs_os_badges SET cs_badge_data = ? WHERE cs_regno = ?`;
                await pool.query(updateBadgeQuery, [updatedBadgeData, cs_regno]);
              } else {
                console.log(`Facility ${facilityName} not found in badge data`);
              }
            } else {
              const selectAllowCountQuery = `
                SELECT cs_allow_count
                FROM cs_os_facility_category
                WHERE cs_facility_detail_id = ? AND cs_reg_cat_id = ?
              `;
              const selectValues = [csFacilityDetailId, cs_reg_cat_id];
              const [allowCountResults] = await pool.query(selectAllowCountQuery, selectValues);

              if (allowCountResults.length > 0) {
                allowCountResults.forEach(async (row) => {
                  const { cs_allow_count } = row;
                  const updatedAllowCount = cs_allow_count;

                  if (cs_reg_type && cs_reg_type !== "101") {
                    const reg_daytype = cs_reg_type;
                    console.log("cs_workshop_category" , cs_workshop_category);
                    // const workshop = cs_workshop_category
              
                    if (facilityType === 'workshop') {
                      const workshopQuery = `SELECT cs_workshop_id FROM cs_os_workshop WHERE cs_facility_id = ?`;
                      const [workshopRows] = await pool.query(workshopQuery, [id]);
                      const workshopId = workshopRows[0]?.cs_workshop_id;
                      console.log("workshopId", workshopId);

                      if (Object.values(additionalFieldValues).includes(workshopId)) {
                        parsedBadgeData[facilityName] = updatedAllowCount;
                        parsedBadgeData[`${facilityName}_status`] = "0";
                      } else {
                        parsedBadgeData[facilityName] = "0";
                        parsedBadgeData[`${facilityName}_status`] = "0";
                      }
                    } else {
                      if (facilityName.includes(reg_daytype) || !/\d$/.test(facilityName)) {
                        parsedBadgeData[facilityName] = updatedAllowCount;
                        parsedBadgeData[`${facilityName}_status`] = "0";
                      } else {
                        parsedBadgeData[facilityName] = "0";
                        parsedBadgeData[`${facilityName}_status`] = "0";
                      }
                    }
                   
                  } else {
                    if (facilityType === 'workshop') {
                      const workshopQuery = `SELECT cs_workshop_id FROM cs_os_workshop WHERE cs_facility_id = ?`;
                      const workshop = cs_workshop_category;
                      const [workshopRows] = await pool.query(workshopQuery, [id]);
                      console.log("cs_workshop_category" , cs_workshop_category);
                      const workshopId = workshopRows[0]?.cs_workshop_id;
                      console.log("workshopId", workshopId);

                      // if (workshopId === workshop) {
                        if (Object.values(additionalFieldValues).includes(workshopId)) {
                        parsedBadgeData[facilityName] = updatedAllowCount;
                        parsedBadgeData[`${facilityName}_status`] = "0";
                      } else {
                        parsedBadgeData[facilityName] = "0";
                        parsedBadgeData[`${facilityName}_status`] = "0";
                      }
                    } else {
                      parsedBadgeData[facilityName] = updatedAllowCount;
                      parsedBadgeData[`${facilityName}_status`] = "0";
                    }
                
                  }
                  console.log("parsedBadgeData" , parsedBadgeData);
                  const updatedBadgeData = JSON.stringify(parsedBadgeData);
                  const updateBadgeQuery = `UPDATE cs_os_badges SET cs_badge_data = ? WHERE cs_regno = ?`;
                  await pool.query(updateBadgeQuery, [updatedBadgeData, cs_regno]);
                });
              } else {
                console.log(`No data found for facility ${facilityName} and cs_reg_cat_id ${cs_reg_cat_id}`);
              }
            }
          } else {
            console.log(`User not found with cs_regno ${cs_regno}`);
          }
        }
      }
    } else {
      console.error('Facility names not found for the given id:', id);
    }

    return res.status(200).json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});




//Update Daywise
// router.put('/UpdateDaywise', async (req, res) => {
//   try {
//     // Extract facility ID and daywise status from the request body
//     const { id, daywise } = req.body;

//     // Update the daywise status in the database
//     const updateQuery = `UPDATE cs_os_facilitytype SET cs_daywise = ? WHERE cs_facility_id = ?`;
//     await pool.query(updateQuery, [daywise, id]);

//     // Send a success response
//     res.status(200).json({ message: 'Daywise status updated successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

//Second user.js
router.put('/UpdateDaywise', verifyToken,queueMiddleware, async (req, res) => {
  try {
    // Extract facility ID and daywise status from the request body

    console.log("i am started now for second");
    const { id, daywise } = req.body;

    // Update the daywise status in the database
    const updateQuery = `UPDATE cs_os_facilitytype SET cs_daywise = ? WHERE cs_facility_id = ?`;
    await pool.query(updateQuery, [daywise, id]);

    console.log('daywise', daywise);

    // Select all data from cs_os_facility_detail table where cs_facility_id = id
    const selectDetailQuery = `SELECT cs_facility_detail_id, cs_facility_name FROM cs_os_facility_detail WHERE cs_facility_id = ?`;
    const facilityDetails = await pool.query(selectDetailQuery, [id]);

    console.log('facilityDetails', facilityDetails[0][0].cs_type);

    // Delete each record from cs_os_facility_detail table
    const deleteDetailQuery = `DELETE FROM cs_os_facility_detail WHERE cs_facility_detail_id = ?`;

    for (const detail of facilityDetails) {
      for (const detailObj of detail) {
        const { cs_facility_detail_id, cs_facility_name } = detailObj;
        

        console.log('cs_facility_detail_id', cs_facility_detail_id);

        // Delete data from cs_os_facility_category table where cs_facility_detail_id = detail.cs_facility_detail_id
        const deleteCategoryQuery = `DELETE FROM cs_os_facility_category WHERE cs_facility_detail_id = ?`;
        await pool.query(deleteCategoryQuery, [cs_facility_detail_id]);

        // Delete data from cs_os_facility_detail table where cs_facility_detail_id = detail.cs_facility_detail_id
        await pool.query(deleteDetailQuery, [cs_facility_detail_id]);

        // Use cs_facility_name to delete badge data
        const badgesData = await pool.query('SELECT * FROM cs_os_badges');
        for (const badge of badgesData) {
          for (const badgeObj of badge) {
            const { cs_reg_cat_id, cs_badge_data, cs_badge_id } = badgeObj;

            try {
              if (typeof cs_badge_data !== 'undefined') {
                const parsedBadgeData = JSON.parse(cs_badge_data);

                // Remove the facilityName and ${facilityName}_status entries
                delete parsedBadgeData[cs_facility_name];
                delete parsedBadgeData[`${cs_facility_name}_status`];

                const updatedBadgeDataString = JSON.stringify(parsedBadgeData);
                const updateQuery = `UPDATE cs_os_badges SET cs_badge_data = ? WHERE cs_badge_id = ?`;
                const updateValues = [updatedBadgeDataString, cs_badge_id];
                await pool.query(updateQuery, updateValues);
              } else {
                console.log('cs_badge_data is undefined, skipping update');
              }
            } catch (error) {
              console.error("Error updating cs_badge_data:", error);
            }
          }
        }
      }
    }

    // Further actions based on the daywise status
    const lastInsertedTypeResult = await pool.query('SELECT cs_name, cs_daywise, cs_facility_id FROM cs_os_facilitytype WHERE cs_facility_id = ?', [id]);
    const facilityId = lastInsertedTypeResult[0][0];

    console.log('facilityData', facilityId);
    const facilityCounts = [];
    let facilityName;

    if (daywise === 'Yes') {
      const daycountResult = await pool.query("SELECT cs_value FROM cs_tbl_sitesetting WHERE id = '38'");
      const daycount = parseInt(daycountResult[0][0].cs_value);

      for (let i = 1; i <= daycount; i++) {
        facilityName = `cs_${facilityId.cs_name}${i}`;
        facilityCounts.push(facilityName);
      }


    } else {
      // Additional actions if daywise is not Yes
      facilityName = `cs_${facilityId.cs_name}`;
      facilityCounts.push(facilityName);
    }
    console.log("Facility Counts:", facilityCounts);

    const updatequery = `INSERT INTO cs_os_facility_detail (cs_facility_name, cs_status, cs_facility_id) VALUES (?, ?, ?)`;

    for (const facilityName of facilityCounts) {
      try {
        await pool.query(updatequery, [facilityName, 1, facilityId.cs_facility_id]);
      } catch (error) {
        console.error("Error inserting facility name:", error);
      }
    }

    // Check if inactiveroleIdResult has results before proceeding
    

    // Active Category
    const catIdQuery = `SELECT cs_reg_cat_id FROM cs_os_category WHERE cs_status = 1`;
    const catIdResult = await pool.query(catIdQuery);
    if (catIdResult.length > 0 && catIdResult[0].length > 0) {
      const catIds = catIdResult.flatMap(result => result.map(row => row.cs_reg_cat_id));
      const filteredCatIds = catIds.filter(catId => catId !== undefined);

      const facilityIdQuery = `SELECT cs_facility_detail_id FROM cs_os_facility_detail WHERE cs_facility_id = ${facilityId.cs_facility_id}`;
      const facilityIdResult = await pool.query(facilityIdQuery);

      // Check if facilityIdResult has results before proceeding
      if (facilityIdResult.length > 0 && facilityIdResult[0].length > 0) {
        const facilityIds = facilityIdResult[0].map(row => row.cs_facility_detail_id);

        for (const facilityId of facilityIds) {
          const detailquery1 = `
              INSERT INTO cs_os_facility_category (cs_facility_detail_id, cs_reg_cat_id, cs_allow_count, cs_status)
              VALUES 
              ${filteredCatIds.map(catId => `(${facilityId}, ${catId}, 0, 1)`).join(',\n')}
          `;

          try {
            await pool.query(detailquery1);
            console.log("Detail Query for", facilityId, ":", detailquery1);
          } catch (error) {
            console.error("Error inserting facility category:", error);
          }
        }
      }
    }

    try {
      const queryFacilityId = facilityId.cs_facility_id;
      const facilityDetailQuery = `SELECT cs_facility_detail_id, cs_facility_id, cs_facility_name FROM cs_os_facility_detail WHERE cs_facility_id = ?`;
      const facilityDetailData = await pool.query(facilityDetailQuery, [queryFacilityId]);

      for (const facilityDetail of facilityDetailData) {
        for (const detailObj of facilityDetail) {
          
          const { cs_facility_detail_id, cs_facility_name } = detailObj;
          if (typeof cs_facility_detail_id !== 'undefined') {
          const badgesData = await pool.query('SELECT * FROM cs_os_badges');

          for (const badge of badgesData) {
            for (const badgeObj of badge) {
              const { cs_reg_cat_id, cs_badge_data, cs_badge_id } = badgeObj;

              try {
                console.log("cs_badge_data:", cs_badge_data); // Log cs_badge_data
                if (typeof cs_badge_data !== 'undefined') {
                  const parsedBadgeData = JSON.parse(cs_badge_data);
                  parsedBadgeData[cs_facility_name] = '0'; // Initialize with '0' value
                  parsedBadgeData[`${cs_facility_name}_status`] = '0'; // Initialize status
                  const updatedBadgeDataString = JSON.stringify(parsedBadgeData);

                  // Update cs_os_badges table with updated data
                  const updateQuery = `
                              UPDATE cs_os_badges
                              SET cs_badge_data = ?
                              WHERE cs_badge_id = ?
                          `;
                  const updateValues = [updatedBadgeDataString, cs_badge_id];
                  await pool.query(updateQuery, updateValues);
                } else {
                  console.log('cs_badge_data is undefined, skipping update');
                }
              } catch (error) {
                console.error("Error updating cs_badge_data:", error);
              }
            }
          }
        }
      }
      }
    } catch (error) {
      console.error("Error:", error);
    }
    res.status(200).json({ message: 'Daywise status updated successfully' });
    // Send a success response
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



//Delete Facility
router.delete('/deleteFacility/:facilityId', verifyToken, async (req, res) => {
  const { facilityId } = req.params;

  try {
    const deleteQuery = 'DELETE FROM cs_os_workshop WHERE cs_facility_id = ?';
    await pool.query(deleteQuery, [facilityId]);
    // Delete from cs_os_workshop table
    const deleteQuery1 = 'DELETE FROM cs_os_facilitytype WHERE cs_facility_id = ?';
    await pool.query(deleteQuery1, [facilityId]);

    // Delete from cs_os_access_status table
    const deleteQuery4 = 'DELETE FROM cs_os_access_status WHERE cs_facility_id = ?';
    await pool.query(deleteQuery4, [facilityId]);

    // Delete from cs_os_facility_detail table
    const deleteQuery2 = `DELETE FROM cs_os_facility_detail WHERE cs_facility_id = ?`;


    // Retrieve cs_facility_detail_id from cs_os_facility_detail
    const selectQuery = `SELECT cs_facility_detail_id FROM cs_os_facility_detail WHERE cs_facility_id = ?`;
    const [detailIdResults] = await pool.query(selectQuery, [facilityId]);

    // Extract cs_facility_detail_id values from the result
    const csFacilityDetailIds = detailIdResults.map(result => result.cs_facility_detail_id);

    console.log(csFacilityDetailIds);

    // Delete from cs_os_facility_category table based on cs_facility_detail_id
    const deleteQuery3 = `DELETE FROM cs_os_facility_category WHERE cs_facility_detail_id = ?`;
    for (const csFacilityDetailId of csFacilityDetailIds) {
      await pool.query(deleteQuery2, [facilityId]);
      await pool.query(deleteQuery3, [csFacilityDetailId]);
    }



    console.log(`Facility with ID ${facilityId} deleted successfully.`);
    res.status(200).json({ message: 'Facility deleted successfully' });
  } catch (error) {
    console.error('Error deleting facility:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});




// Define the route to fetch Roles data from the cs_os_roles
router.get('/getfacilityType', verifyToken, async (req, res) => {
  try {
    // Specify the columns you want to fetch from the table
    const columnsToFetch = ['cs_type'];

    // Construct the SQL query to fetch specific columns
    const query = `SELECT ${columnsToFetch.join(',')} FROM cs_os_facilitytype`;

    // Execute the query to fetch user data from the table
    const [userData] = await pool.query(query);

    // Send the user data as a response
    res.json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//Edit Facility

router.post('/editfacility/:facilityId', verifyToken, async (req, res) => {
  const { facilityId } = req.params;

  try {

    const columnsToFetch = ['*'];

    const query = `
      SELECT ${columnsToFetch.join(',')}
      FROM cs_os_facilitytype
      WHERE cs_facility_id = ? 
    `;

    // Execute the query to fetch pages data for the specified role_id
    const [facilityData] = await pool.query(query, [facilityId]);


    console.log(facilityData);
    // Send the pages data as a response
    res.json(facilityData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


//Create Facility
const requestQueue = [];
let isProcessing = false;

router.post('/storeFacilityType', upload.fields([{ name: 'brightModeIcon', maxCount: 1 }]), async (req, res) => {
  try {
    // Push the current request to the queue
    requestQueue.push({ req, res });

    // If no request is being processed, start processing
    if (!isProcessing) {
      await processRequest();
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

async function processRequest() {
  // Set the processing flag to true
  isProcessing = true;

  // Dequeue the request
  const { req, res } = requestQueue.shift();

  try {
    const { dName, datetime, daywise, facilityType } = req.body;
    const name = dName.toLowerCase().replace(/\s/g, '');

    if (!req.files || !req.files['brightModeIcon']) {
      res.status(400).json({ message: 'Missing file(s)' });
      if (requestQueue.length > 0) {
        await processRequest();
      } else {
        isProcessing = false;
      }
      return;
    }

    const brightModeIcon = req.files['brightModeIcon'][0];

    const query = `
      INSERT INTO cs_os_facilitytype 
      (cs_name, cs_display_name, cs_daywise, cs_type, cs_logo_image_name, cs_logo_image_url) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await pool.query(query, [name, dName, daywise, facilityType, brightModeIcon.filename, brightModeIcon.path]);

    const lastInsertedTypeResult = await pool.query('SELECT cs_name, cs_daywise, cs_facility_id FROM cs_os_facilitytype ORDER BY cs_facility_id DESC LIMIT 1');
    const facilityId = lastInsertedTypeResult[0][0];

    console.log(facilityId);

    const daycountResult = await pool.query("SELECT cs_value FROM cs_tbl_sitesetting WHERE id = '38'");
    const daycount = parseInt(daycountResult[0][0].cs_value);

    const facilityCounts = [];
    let facilityName;

    if (facilityId.cs_daywise === 'Yes') {
      for (let i = 1; i <= daycount; i++) {
        facilityName = `cs_${facilityId.cs_name}${i}`;
        facilityCounts.push(facilityName);
      }
    } else if (facilityId.cs_daywise === 'No') {
      facilityName = `cs_${facilityId.cs_name}`;
      facilityCounts.push(facilityName);
    }

    console.log("Facility Counts:", facilityCounts);

    const updatequery = `INSERT INTO cs_os_facility_detail (cs_facility_name, cs_status, cs_facility_id) VALUES (?, ?, ?)`;

    for (const facilityName of facilityCounts) {
      try {
        await pool.query(updatequery, [facilityName, 1, facilityId.cs_facility_id]);
      } catch (error) {
        console.error("Error inserting facility name:", error);
      }
    }

    const roleIdQuery = `SELECT cs_role_id FROM cs_os_roles WHERE cs_status = 1`;
    const roleIdResult = await pool.query(roleIdQuery);
    if (roleIdResult.length > 0 && roleIdResult[0].length > 0) {
      const roleIds = roleIdResult.flatMap(result => result.map(row => row.cs_role_id));
      const filteredRoleIds = roleIds.filter(roleId => roleId !== undefined);

      const updateaccess1 = `INSERT INTO cs_os_access_status 
        (cs_role_id, cs_facility_id, cs_read_search, cs_validate, cs_add, cs_edit, cs_delete, cs_print, cs_count, cs_status) 
        VALUES  
        ${filteredRoleIds.map(roleId => `(${roleId}, ${facilityId.cs_facility_id}, 'No', 'No', 'No', 'No', 'No', 'No', 'No', 1)`).join(',\n')}`;
      await pool.query(updateaccess1);
    }

    const inactiveroleIdQuery = `SELECT cs_role_id FROM cs_os_roles WHERE cs_status = 0`;
    const inactiveroleIdResult = await pool.query(inactiveroleIdQuery);

    if (inactiveroleIdResult.length > 0 && inactiveroleIdResult[0].length > 0) {
      const inactiveroleIds = inactiveroleIdResult.flatMap(result => result.map(row => row.cs_role_id));
      const inactivefilteredRoleIds = inactiveroleIds.filter(roleId => roleId !== undefined);

      const updateaccess2 = `INSERT INTO cs_os_access_status 
        (cs_role_id, cs_facility_id, cs_read_search, cs_validate, cs_add, cs_edit, cs_delete, cs_print, cs_count, cs_status) 
        VALUES  
        ${inactivefilteredRoleIds.map(inactiveroleIds => `(${inactiveroleIds}, ${facilityId.cs_facility_id}, 'No', 'No', 'No', 'No', 'No', 'No', 'No', 0)`).join(',\n')}`;
      await pool.query(updateaccess2);
    }

    const catIdQuery = `SELECT cs_reg_cat_id FROM cs_os_category`;
    const catIdResult = await pool.query(catIdQuery);
    if (catIdResult.length > 0 && catIdResult[0].length > 0) {
      const catIds = catIdResult.flatMap(result => result.map(row => row.cs_reg_cat_id));
      const filteredCatIds = catIds.filter(catId => catId !== undefined);

      const facilityIdQuery = `SELECT cs_facility_detail_id FROM cs_os_facility_detail WHERE cs_facility_id = ${facilityId.cs_facility_id}`;
      const facilityIdResult = await pool.query(facilityIdQuery);

      if (facilityIdResult.length > 0 && facilityIdResult[0].length > 0) {
        const facilityIds = facilityIdResult[0].map(row => row.cs_facility_detail_id);

        for (const facilityId of facilityIds) {
          const detailquery1 = `
              INSERT INTO cs_os_facility_category (cs_facility_detail_id, cs_reg_cat_id, cs_allow_count, cs_status)
              VALUES 
              ${filteredCatIds.map(catId => `(${facilityId}, ${catId}, 0, 1)`).join(',\n')}
          `;

          try {
            await pool.query(detailquery1);
            console.log("Detail Query for", facilityId, ":", detailquery1);
          } catch (error) {
            console.error("Error inserting facility category:", error);
          }
        }
      }
    }

    // try {
    //   const queryFacilityId = facilityId.cs_facility_id;
    //   const facilityDetailQuery = `SELECT cs_facility_detail_id, cs_facility_id, cs_facility_name FROM cs_os_facility_detail WHERE cs_facility_id = ?`;
    //   const facilityDetailData = await pool.query(facilityDetailQuery, [queryFacilityId]);

    //   for (const facilityDetail of facilityDetailData) {
    //     for (const detailObj of facilityDetail) {
    //       const { cs_facility_detail_id, cs_facility_name } = detailObj;
    //       if (typeof cs_facility_detail_id !== 'undefined') {
    //         const badgesData = await pool.query('SELECT * FROM cs_os_badges');

    //         for (const badge of badgesData) {
    //           for (const badgeObj of badge) {
    //             const { cs_reg_cat_id, cs_badge_data, cs_badge_id } = badgeObj;

    //             try {
    //               if (typeof cs_badge_data !== 'undefined') {
    //                 const parsedBadgeData = JSON.parse(cs_badge_data);
    //                 parsedBadgeData[cs_facility_name] = '0';
    //                 parsedBadgeData[`${cs_facility_name}_status`] = '0';
    //                 const updatedBadgeDataString = JSON.stringify(parsedBadgeData);

    //                 const updateQuery = `
    //                   UPDATE cs_os_badges
    //                   SET cs_badge_data = ?
    //                   WHERE cs_badge_id = ?
    //                 `;
    //                 const updateValues = [updatedBadgeDataString, cs_badge_id];
    //                 await pool.query(updateQuery, updateValues);
    //               } else {
    //                 console.log('cs_badge_data is undefined, skipping update');
    //               }
    //             } catch (error) {
    //               console.error("Error updating cs_badge_data:", error);
    //             }
    //           }
    //         }
    //       }
    //     }
    //   }
    // } catch (error) {
    //   console.error("Error:", error);
    // }

    res.json({ success: true, message: 'Facility created successfully!' });

    // After processing, check if there are more requests in the queue
    if (requestQueue.length > 0) {
      await processRequest();
    } else {
      isProcessing = false;
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });

    // Continue processing the next request even if there is an error
    if (requestQueue.length > 0) {
      await processRequest();
    } else {
      isProcessing = false;
    }
  }
}



// router.post('/storeFacilityType', upload.fields([{ name: 'brightModeIcon', maxCount: 1 }]), async (req, res) => {
//   try {
  
//       const { dName, datetime, daywise, facilityType } = req.body;
//       const name = dName.toLowerCase().replace(/\s/g, '');
  
//       if (!req.files || !req.files['brightModeIcon']) {
//         return res.status(400).json({ message: 'Missing file(s)' });
//       }
  
//       const brightModeIcon = req.files['brightModeIcon'][0];
  
//       const query = `
//         INSERT INTO cs_os_facilitytype 
//         (cs_name, cs_display_name, created_at, updated_at, cs_daywise, cs_type, cs_logo_image_name, cs_logo_image_url) 
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//       `;
//       await pool.query(query, [name, dName, datetime, datetime, daywise, facilityType, brightModeIcon.filename, brightModeIcon.path]);
  
//       const lastInsertedTypeResult = await pool.query('SELECT cs_name, cs_daywise, cs_facility_id FROM cs_os_facilitytype ORDER BY cs_facility_id DESC LIMIT 1');
//       const facilityId = lastInsertedTypeResult[0][0];
  
//       // Send immediate response
//       // res.json({ success: true, message: 'Facility created successfully! Background processing is ongoing.' });
  
//       // Start background processing
    

//     console.log(facilityId);

//     const daycountResult = await pool.query("SELECT cs_value FROM cs_tbl_sitesetting WHERE id = '38'");
//     const daycount = parseInt(daycountResult[0][0].cs_value);

//     const facilityCounts = [];
//     let facilityName;

//     if (facilityId.cs_daywise === 'Yes') {
//       for (let i = 1; i <= daycount; i++) {
//         facilityName = `cs_${facilityId.cs_name}${i}`;
//         facilityCounts.push(facilityName);
//       }
//     } else if (facilityId.cs_daywise === 'No') {
//       facilityName = `cs_${facilityId.cs_name}`;
//       facilityCounts.push(facilityName);
//     }

//     console.log("Facility Counts:", facilityCounts);

//     const updatequery = `INSERT INTO cs_os_facility_detail (cs_facility_name, cs_status, cs_facility_id) VALUES (?, ?, ?)`;

//     for (const facilityName of facilityCounts) {
//       try {
//         await pool.query(updatequery, [facilityName, 1, facilityId.cs_facility_id]);
//       } catch (error) {
//         console.error("Error inserting facility name:", error);
//       }
//     }

//     // Check if roleIdResult has results before proceeding
//     const roleIdQuery = `SELECT cs_role_id FROM cs_os_roles WHERE cs_status = 1`;
//     const roleIdResult = await pool.query(roleIdQuery);
//     if (roleIdResult.length > 0 && roleIdResult[0].length > 0) {
//       const roleIds = roleIdResult.flatMap(result => result.map(row => row.cs_role_id));
//       const filteredRoleIds = roleIds.filter(roleId => roleId !== undefined);

//       const updateaccess1 = `INSERT INTO cs_os_access_status 
//         (cs_role_id, cs_facility_id, cs_read_search, cs_validate, cs_add, cs_edit, cs_delete, cs_print, cs_count, cs_status) 
//         VALUES  
//         ${filteredRoleIds.map(roleId => `(${roleId}, ${facilityId.cs_facility_id}, 'No', 'No', 'No', 'No', 'No', 'No', 'No', 1)`).join(',\n')}`;
//       await pool.query(updateaccess1);
//     }

//     const inactiveroleIdQuery = `SELECT cs_role_id FROM cs_os_roles WHERE cs_status = 0`;
//     const inactiveroleIdResult = await pool.query(inactiveroleIdQuery);

//     // Check if inactiveroleIdResult has results before proceeding
//     if (inactiveroleIdResult.length > 0 && inactiveroleIdResult[0].length > 0) {
//       const inactiveroleIds = inactiveroleIdResult.flatMap(result => result.map(row => row.cs_role_id));
//       const inactivefilteredRoleIds = inactiveroleIds.filter(roleId => roleId !== undefined);

//       const updateaccess2 = `INSERT INTO cs_os_access_status 
//         (cs_role_id, cs_facility_id, cs_read_search, cs_validate, cs_add, cs_edit, cs_delete, cs_print, cs_count, cs_status) 
//         VALUES  
//         ${inactivefilteredRoleIds.map(inactiveroleIds => `(${inactiveroleIds}, ${facilityId.cs_facility_id}, 'No', 'No', 'No', 'No', 'No', 'No', 'No', 0)`).join(',\n')}`;
//       await pool.query(updateaccess2);
//     }

//     // Active Category
//     const catIdQuery = `SELECT cs_reg_cat_id FROM cs_os_category WHERE cs_status = 1`;
//     const catIdResult = await pool.query(catIdQuery);
//     if (catIdResult.length > 0 && catIdResult[0].length > 0) {
//       const catIds = catIdResult.flatMap(result => result.map(row => row.cs_reg_cat_id));
//       const filteredCatIds = catIds.filter(catId => catId !== undefined);

//       const facilityIdQuery = `SELECT cs_facility_detail_id FROM cs_os_facility_detail WHERE cs_facility_id = ${facilityId.cs_facility_id}`;
//       const facilityIdResult = await pool.query(facilityIdQuery);

//       // Check if facilityIdResult has results before proceeding
//       if (facilityIdResult.length > 0 && facilityIdResult[0].length > 0) {
//         const facilityIds = facilityIdResult[0].map(row => row.cs_facility_detail_id);

//         for (const facilityId of facilityIds) {
//           const detailquery1 = `
//               INSERT INTO cs_os_facility_category (cs_facility_detail_id, cs_reg_cat_id, cs_allow_count, cs_status)
//               VALUES 
//               ${filteredCatIds.map(catId => `(${facilityId}, ${catId}, 0, 1)`).join(',\n')}
//           `;

//           try {
//             await pool.query(detailquery1);
//             console.log("Detail Query for", facilityId, ":", detailquery1);
//           } catch (error) {
//             console.error("Error inserting facility category:", error);
//           }
//         }
//       }
//     }

//     try {
//       const queryFacilityId = facilityId.cs_facility_id;
//       const facilityDetailQuery = `SELECT cs_facility_detail_id, cs_facility_id, cs_facility_name FROM cs_os_facility_detail WHERE cs_facility_id = ?`;
//       const facilityDetailData = await pool.query(facilityDetailQuery, [queryFacilityId]);

//       for (const facilityDetail of facilityDetailData) {
//         for (const detailObj of facilityDetail) {
//           const { cs_facility_detail_id, cs_facility_name } = detailObj;
//           if (typeof cs_facility_detail_id !== 'undefined') {

//           const badgesData = await pool.query('SELECT * FROM cs_os_badges');

//           for (const badge of badgesData) {
//             for (const badgeObj of badge) {
//               const { cs_reg_cat_id, cs_badge_data, cs_badge_id } = badgeObj;

//               try {
               
//                 if (typeof cs_badge_data !== 'undefined') {
//                   const parsedBadgeData = JSON.parse(cs_badge_data);
//                   parsedBadgeData[cs_facility_name] = '0'; // Initialize with '0' value
//                   parsedBadgeData[`${cs_facility_name}_status`] = '0'; // Initialize status
//                   const updatedBadgeDataString = JSON.stringify(parsedBadgeData);

//                   // Update cs_os_badges table with updated data
//                   const updateQuery = `
//                               UPDATE cs_os_badges
//                               SET cs_badge_data = ?
//                               WHERE cs_badge_id = ?
//                           `;
//                   const updateValues = [updatedBadgeDataString, cs_badge_id];
//                   await pool.query(updateQuery, updateValues);
//                 } else {
//                   console.log('cs_badge_data is undefined, skipping update');
//                 }
//               } catch (error) {
//                 console.error("Error updating cs_badge_data:", error);
//               }
//             }
//           }
//         }
//         }
//       }
//     } catch (error) {
//       console.error("Error:", error);
//     }








//     res.json({ success: true , message: 'Facility created successfully!' });
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ success: false, message: 'Internal server error' });
//   }


// });

// router.post('/storeFacilityType', upload.fields([{ name: 'brightModeIcon', maxCount: 1 }, { name: 'darkModeIcon', maxCount: 1 }]), async (req, res) => {
//   try {
//     const { dName, datetime, daywise, facilityType } = req.body;

//     const name = dName.toLowerCase().replace(/\s/g, '');

//     if (!req.files || !req.files['brightModeIcon'] || !req.files['darkModeIcon']) {
//       return res.status(400).json({ message: 'Missing file(s)' });
//     }

//     const brightModeIcon = req.files['brightModeIcon'][0];
//     const darkModeIcon = req.files['darkModeIcon'][0];

//     const query = `INSERT INTO cs_os_facilitytype (cs_name, cs_display_name, created_at, updated_at, cs_daywise, cs_type, cs_logo_image_name, cs_logo_image_url, cs_logo_darkmode_image_name, cs_logo_darkmode_image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
//     await pool.query(query, [name, dName, datetime, datetime, daywise, facilityType, brightModeIcon.filename, brightModeIcon.path, darkModeIcon.filename, darkModeIcon.path]);

//     const lastInsertedTypeResult = await pool.query('SELECT cs_name, cs_daywise, cs_facility_id FROM cs_os_facilitytype ORDER BY cs_facility_id DESC LIMIT 1');
//     const facilityId = lastInsertedTypeResult[0][0];

//     console.log(facilityId);

//     const daycountResult = await pool.query("SELECT cs_value FROM cs_tbl_sitesetting WHERE id = '38'");
//     const daycount = parseInt(daycountResult[0][0].cs_value);

//     const facilityCounts = [];
//     let facilityName;

//     if (facilityId.cs_daywise === 'Yes') {
//       for (let i = 1; i <= daycount; i++) {
//         facilityName = `cs_${facilityId.cs_name}${i}`;
//         facilityCounts.push(facilityName);
//       }
//     } else if (facilityId.cs_daywise === 'No') {
//       facilityName = `cs_${facilityId.cs_name}`;
//       facilityCounts.push(facilityName);
//     }

//     console.log("Facility Counts:", facilityCounts);

//     const updatequery = `INSERT INTO cs_os_facility_detail (cs_facility_name, cs_status, cs_facility_id) VALUES (?, ?, ?)`;

//     for (const facilityName of facilityCounts) {
//       try {
//         await pool.query(updatequery, [facilityName, 1, facilityId.cs_facility_id]);
//       } catch (error) {
//         console.error("Error inserting facility name:", error);
//       }
//     }



//     const roleIdQuery = `SELECT cs_role_id FROM cs_os_roles WHERE cs_status = 1`;
//     const roleIdResult = await pool.query(roleIdQuery);

//     // Check if roleIdResult has results before proceeding
//     if (roleIdResult.length > 0 && roleIdResult[0].length > 0) {
//       const roleIds = roleIdResult.flatMap(result => result.map(row => row.cs_role_id));
//       const filteredRoleIds = roleIds.filter(roleId => roleId !== undefined);

//       const updateaccess1 = `INSERT INTO cs_os_access_status 
//         (cs_role_id, cs_facility_id, cs_read_search, cs_validate, cs_add, cs_edit, cs_delete, cs_print, cs_count, cs_status) 
//         VALUES  
//         ${filteredRoleIds.map(roleId => `(${roleId}, ${facilityId.cs_facility_id}, 'No', 'No', 'No', 'No', 'No', 'No', 'No', 1)`).join(',\n')}`;
//       await pool.query(updateaccess1);
//     }

//     const inactiveroleIdQuery = `SELECT cs_role_id FROM cs_os_roles WHERE cs_status = 0`;
//     const inactiveroleIdResult = await pool.query(inactiveroleIdQuery);

//     // Check if inactiveroleIdResult has results before proceeding
//     if (inactiveroleIdResult.length > 0 && inactiveroleIdResult[0].length > 0) {
//       const inactiveroleIds = inactiveroleIdResult.flatMap(result => result.map(row => row.cs_role_id));
//       const inactivefilteredRoleIds = inactiveroleIds.filter(roleId => roleId !== undefined);

//       const updateaccess2 = `INSERT INTO cs_os_access_status 
//         (cs_role_id, cs_facility_id, cs_read_search, cs_validate, cs_add, cs_edit, cs_delete, cs_print, cs_count, cs_status) 
//         VALUES  
//         ${inactivefilteredRoleIds.map(inactiveroleIds => `(${inactiveroleIds}, ${facilityId.cs_facility_id}, 'No', 'No', 'No', 'No', 'No', 'No', 'No', 0)`).join(',\n')}`;
//       await pool.query(updateaccess2);
//     }

// // Active Category
// const catIdQuery = `SELECT cs_reg_cat_id FROM cs_os_category WHERE cs_status = 1`;
// const catIdResult = await pool.query(catIdQuery);
// const catIds = catIdResult.flatMap(result => result.map(row => row.cs_reg_cat_id));
// const filteredCatIds = catIds.filter(catId => catId !== undefined);

// // Inactive Category
// const inactivecatIdQuery = `SELECT cs_reg_cat_id FROM cs_os_category WHERE cs_status = 0`;
// const inactivecatIdResult = await pool.query(inactivecatIdQuery);
// const inactivecatIds = inactivecatIdResult.flatMap(result => result.map(row => row.cs_reg_cat_id));
// const inactivefilteredCatIds = inactivecatIds.filter(catId => catId !== undefined);

// const facilityIdQuery = `SELECT cs_facility_detail_id FROM cs_os_facility_detail WHERE cs_facility_id = ${facilityId.cs_facility_id}`;
// const facilityIdResult = await pool.query(facilityIdQuery);

// // Check if facilityIdResult has results before proceeding
// if (facilityIdResult.length > 0 && facilityIdResult[0].length > 0) {
//     const facilityIds = facilityIdResult[0].map(row => row.cs_facility_detail_id);

//     for (const facilityId of facilityIds) {
//         const detailquery1 = `
//             INSERT INTO cs_os_facility_category (cs_facility_detail_id, cs_reg_cat_id, cs_allow_count, cs_status)
//             VALUES 
//             ${filteredCatIds.map(catId => `(${facilityId}, ${catId}, 0, 1)`).join(',\n')}
//         `;

//         const detailquery2 = `
//             INSERT INTO cs_os_facility_category (cs_facility_detail_id, cs_reg_cat_id, cs_allow_count, cs_status)
//             VALUES 
//             ${inactivefilteredCatIds.map(inactivecatId => `(${facilityId}, ${inactivecatId}, 0, 0)`).join(',\n')}
//         `;

//         try {
//             await pool.query(detailquery1);
//             await pool.query(detailquery2);
//             console.log("Detail Query for", facilityId, ":", detailquery1);
//             console.log("Detail Query for", facilityId, ":", detailquery2);
//         } catch (error) {
//             console.error("Error inserting facility category:", error);
//         }
//     }


//     }

//     res.json({ success: true });
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// });

router.post('/updateFacility', verifyToken, upload.fields([{ name: 'brightModeIcon', maxCount: 1 }]), async (req, res) => {
  try {
    const { dName, Facility_id, facilityType } = req.body;

    if (!Facility_id) {
      return res.status(400).json({ message: 'Facility_id is required' });
    }

    const updateFields = [];
    const queryParams = [];

    if (dName) {
      updateFields.push('cs_display_name = ?');
      queryParams.push(dName);
    }

    if (facilityType) {
      updateFields.push('cs_type = ?');
      queryParams.push(facilityType);
    }

    if (req.files && req.files['brightModeIcon']) {
      const brightModeIcon = req.files['brightModeIcon'][0];
      updateFields.push('cs_logo_image_name = ?', 'cs_logo_image_url = ?');
      queryParams.push(brightModeIcon.filename, brightModeIcon.path);
    }

    queryParams.push(Facility_id); // where condition

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    // Update cs_os_facilitytype table
    const queryFacilityType = `UPDATE cs_os_facilitytype 
                               SET ${updateFields.join(', ')}
                               WHERE cs_facility_id = ?`;

    await pool.query(queryFacilityType, queryParams);

    // Update cs_os_workshop table for cs_workshop_name
    if (dName) {
      const queryWorkshop = `UPDATE cs_os_workshop 
                             SET cs_workshop_name = ? 
                             WHERE cs_facility_id = ?`;

      const workshopParams = [dName, Facility_id];
      await pool.query(queryWorkshop, workshopParams);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});




// router.post('/updateFacility', upload.fields([{ name: 'brightModeIcon', maxCount: 1 }, { name: 'darkModeIcon', maxCount: 1 }]), async (req, res) => {
//   try {
//     const { dName, facilityType, Facility_id } = req.body;

//     console.log(req.body);

//     // Initialize parameters for the query
//     const queryParams = [];
//     let queryValues = [];

//     // Add dynamic data to parameters
//     queryParams.push(cs_display_name);
//     queryParams.push(new Date());
//     queryParams.push(cs_type);

//     // Process each uploaded file
//     for (const fieldName in req.files) {
//       const file = req.files[fieldName][0];
//       queryParams.push(file.filename);
//       queryParams.push(file.path);
//       queryValues.push(`cs_logo_${fieldName}_image_name = ?, cs_logo_${fieldName}_image_url = ?,`);
//     }

//     // Construct the update query dynamically
//     let query = `UPDATE cs_os_facilitytype SET cs_display_name = ?, updated_at = ?, cs_type = ?`;
//     if (queryValues.length > 0) {
//       query += `, ${queryValues.join(' ')}`;
//     }
//     query += ` WHERE cs_facility_id = ?`; // Ensure the correct field name for the facility ID
//     queryParams.push(Facility_id);

//     // Execute the query
//     await pool.query(query, queryParams);

//     // Send success response
//     res.json({ success: true });
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// });







// ------------------------------


//App User Login API










// router.post('/checkemail', async (req, res) => {
//   const { email } = req.body;

//   // Basic email validation
//   if (!isValidEmail(email)) {
//       return res.status(400).json({ error: 'Invalid email format' });
//   }

//   try {
//       // Query the database to fetch all emails
//       const result = await pool.query('SELECT email FROM cs_os_badgeapp_userlogin');

//       // Check if the entered email already exists
//       const emailExists = result.some(row => row.email === email);

//       // Send the response
//       res.json({ available: !emailExists });
//   } catch (error) {
//       console.error('Error checking email availability:', error);
//       res.status(500).json({ error: 'Internal server error' });
//   }
// });


// // Endpoint to check if an email exists
// router.post('/check-email', (req, res) => {
//   const { email } = req.body;
//   const exists = users.some(user => user.email === email);
//   res.json({ exists });
// });


router.post('/check-email', verifyToken, async (req, res) => {
  const { email } = req.body;
  try {
    // Execute SQL query to check if email exists in the database
    const [users] = await pool.query('SELECT * FROM cs_os_badgeapp_userlogin WHERE cs_email = ?', [email]);

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

router.post('/check-username', verifyToken, async (req, res) => {
  const { email } = req.body;
  try {
    // Execute SQL query to check if email exists in the database
    const [users] = await pool.query('SELECT * FROM cs_os_badgeapp_userlogin WHERE cs_username = ?', [email]);

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



















// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     if (!email || !password) {
//       return res.status(400).json({ message: 'Api Username and password are required' });
//     }

//     // Query the database to check if the user with the provided email and password exists
//     const [users] = await pool.query('SELECT * FROM login_details WHERE email = ? AND password = ?', [email, password]);
//     const user = users[0];

//     if (!user) {
//       return res.status(401).json({ message: 'Invalid email or password' });
//     }

//     // Retrieve user's role information
//     const [roles] = await pool.query('SELECT role_name FROM dash_roles WHERE role_id = ?', [user.role_id]);
//     const roleName = roles[0].role_name;

//     // Generate JWT token including the role
//     const token = jwt.sign({ email: user.email, id: user.id, role: roleName }, process.env.SECRET_KEY, { expiresIn: '1h' });
//     res.status(200).json({ message: 'Login successful', token: token });
//   } catch (error) {
//     console.error('Database error:', error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// });



// ----------------- 

router.post('/check-email', verifyToken, async (req, res) => {
  const { email } = req.body;

  try {
    const [users] = await pool.query('SELECT * FROM login_details WHERE email = ?', [email]);
    res.status(200).json({ available: users.length === 0 });
  } catch (error) {
    console.error('Error checking email availability:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// Endpoint to fetch items for admin users
router.get('/admin/items', verifyToken, async (req, res) => {
  try {
    // Ensure that the user's role is 'admin'
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
    }

    // Dummy data for admin items
    const dummyItems = [
      { id: 1, name: 'Admin Item 1', description: 'Description for Admin Item 1' },
      { id: 2, name: 'Admin Item 2', description: 'Description for Admin Item 2' },
      // Add more dummy items as needed
    ];

    res.json(dummyItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Define the route to fetch column names
router.get('/formfields', verifyToken, async (req, res) => {
  try {
    // Execute a query to fetch the form fields from the table
    const [formFields] = await pool.query('SELECT * FROM cs_tbl_formfields');

    // Send the form fields data as a response
    res.json(formFields);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//10/06/2024
// router.post('/saveBadgeDesign', async (req, res) => {
//   const badgeDesign = req.body;
//   // Extract badge element settings from badgeDesign object
//   const { badgeSize, orientation, components } = badgeDesign;
//   // Loop through components and insert them into the database
//   try {
//     for (const component of components) {
//       // Insert component data into the database table
//       await pool.query('INSERT INTO cs_tbl_badgeElements (formfield_id, formfield_name, type, content, position_x, position_y, badge_width, badge_height, font_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
//         component.formfield_id,
//         component.formfield_name,
//         component.type,
//         component.content,
//         component.position.left,
//         component.position.top,
//         component.size.width,
//         component.size.height,
//         component.textFontSize
//       ]);
//     }
//     res.status(200).json({ message: 'Badge design saved successfully' });
//   } catch (error) {
//     console.error('Error saving badge element:', error);
//     res.status(500).json({ error: 'Failed to save badge element' });
//   }
// });



// router.post('/saveBadgeDesign', async (req, res) => {
//   const badgeDesign = req.body;
//   const { badgeWidth, badgeHeight, orientation, components } = badgeDesign;
//   try {
//     for (const component of components) {
//       // Insert component data into the database table
//         await pool.query('INSERT INTO cs_tbl_badgeelements (formfield_id, type, content, position_x, position_y, badge_width, badge_height, font_size, formfield_name, badge_id, orientation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
//           component.formfield_id,
//           component.type,
//           component.content,
//           component.position.left,
//           component.position.top,
//           component.size.width,
//           component.size.height,
//           component.textFontSize ,
//           component.formfield_name,
//           component.badge_id ,
//           orientation 
//     ]);
//     }
//     res.status(200).json({ message: 'Badge design saved successfully' });
//   } catch (error) {
//     console.error('Error saving badge element:', error);
//     res.status(500).json({ error: 'Failed to save badge element' });
//   }
// });



// router.get('/', verifyToken, async (req, res) => {
//   try {
//     const users = await pool.query('SELECT * FROM users');
//     res.json(users);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });



// ... other API endpoints for specific user operations

module.exports = router;