const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); // Ensure you have this package installed
const { pool } = require('../../config/database'); // Adjust the path to your db configuration
const verifyToken = require('../api/middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // For file system operations
       
router.get('/getUserAndFieldData', verifyToken, async (req, res) => {
    try {
        const userId = req.query.user_id; // Get user_id from query parameters

        console.log("userId In getUserAndFieldData",userId); 


        // 1. Retrieve user data based on userId
        const userQuery = `
            SELECT *
            FROM cs_os_users
            WHERE id = ?
        `;
        const [userData] = await pool.query(userQuery, [userId]);

        if (userData.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 2. Fetch field data (this will give you field labels)
        const fieldQuery = `
            SELECT 
                cs_os_field_data.*, 
                cs_os_field_type.field_type_name 
            FROM cs_os_field_data
            LEFT JOIN cs_os_field_type ON cs_os_field_data.cs_field_type = cs_os_field_type.cs_field_type
            WHERE cs_os_field_data.cs_status = 1 
            AND cs_os_field_data.cs_visible_reg_basicform = 1
            AND cs_os_field_data.cs_visible_reg_userform = 1
            ORDER BY cs_os_field_data.cs_field_order;
        `;
        const [fieldData] = await pool.query(fieldQuery);

        // 3. Map field labels to corresponding values in the userData
        const mappedFields = fieldData.map(field => {
            // Dynamically get the value from userData using the field's label
            const fieldLabelKey = field.cs_field_name;
            const fieldValue = userData[0][fieldLabelKey] || 'N/A'; // Fetch user value or 'N/A' if not found
            return {
                field_label: field.cs_field_label,  // Label from field data
                field_value: fieldValue,            // Corresponding value from user data
                field_type: field.cs_field_type_name // Field type name for rendering purposes (optional)
            };
        });

        // 4. Send the mapped fields as the response
        res.json({ Fields: mappedFields, cs_profile: userData[0].cs_profile });
    } catch (error) {
        console.error('Error fetching user and field data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/getBasicField', verifyToken, async (req, res) => {
  try {
    const columnsToFetch = 'cs_os_field_data.*, cs_os_field_type.field_type_name';

    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
    SELECT ${columnsToFetch}
    FROM cs_os_field_data
    LEFT JOIN cs_os_field_type ON cs_os_field_data.cs_field_type = cs_os_field_type.cs_field_type
    WHERE cs_os_field_data.cs_status = 1 AND cs_visible_reg_basicform = 1
    ORDER BY cs_field_order; 
`;


    const [fieldData] = await pool.query(query);

    // Send the field data as a response
    res.json({ Fields: fieldData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// router.post('/edituser',verifyToken, async (req, res) => {
//     try {
//       // Extract role_id from the request body
//       const { userId } = req.body;
  
//       console.log(userId);
  
  
//       // Construct the SQL query to fetch specific columns with pagination and search
//       let query = `
//         SELECT *
//         FROM cs_os_users
//         WHERE id = ${userId};
//         `;
  
  
//       // Execute the query to fetch pages data for the specified role_id
//       const [pagesData] = await pool.query(query, [userId]);
  
//       // Send the pages data as a response
//       res.json(pagesData);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Internal server error' });
//     }
//   });

// router.post('/edituser', verifyToken, async (req, res) => {
//   try {
//     // Extract userId from the request body
//     const { userId } = req.body;

//     console.log(userId);

//     // Construct a SQL query with JOIN to fetch user and payment data together
//     const query = `
//       SELECT 
//         cs_os_users.*, 
//         cs_reg_temp_payment.*
//       FROM cs_os_users
//       LEFT JOIN cs_reg_temp_payment ON cs_os_users.id = cs_reg_temp_payment.user_id
//       WHERE cs_os_users.id = ?
//     `;

//     // Execute the query with the userId as a parameter
//     const [userData] = await pool.query(query, [userId]);

//     // Send the fetched data as a response
//     res.json(userData);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });


router.post('/edituser', verifyToken, async (req, res) => {
  try {
    // Extract userId from the request body
    const { userId } = req.body;

    console.log(userId);

    // Construct a SQL query with JOINs to fetch user, payment, category, and ticket data together
    const query = `
      SELECT 
        cs_os_users.*, 
        cs_reg_temp_payment.*, 
        cs_os_category.cs_reg_category AS category_name,
        cs_reg_tickets.ticket_title AS ticket_name
      FROM cs_os_users
      LEFT JOIN cs_reg_temp_payment ON cs_os_users.id = cs_reg_temp_payment.user_id
      LEFT JOIN cs_os_category ON cs_os_category.cs_reg_cat_id = cs_os_users.cs_reg_cat_id
      LEFT JOIN cs_reg_tickets ON cs_reg_tickets.ticket_id = cs_os_users.cs_ticket
      WHERE cs_os_users.id = ?
      ORDER BY cs_reg_temp_payment.temppayment_id  DESC
      LIMIT 1;
    `;

    

    // Execute the query with the userId as a parameter
    const [userData] = await pool.query(query, [userId]);

    // Send the fetched data as a response
    res.json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


  router.post('/updateBasicUser', verifyToken, async (req, res) => {
    console.log(req.body);
  
    try {
      const userData = req.body;
  
      // Extract the unique identifier (e.g., cs_regno) for updating the user
      const { cs_regno } = userData;
  
      if (!cs_regno) {
        return res.status(400).json({ error: 'Registration number (cs_regno) is required for updating the user.' });
      }
  
      // Remove cs_regno from userData, as we don't want to update this field
      delete userData.cs_regno;
  
      // Get the columns and values from the request body dynamically
      const columns = Object.keys(userData);
      const values = Object.values(userData);
  
      // Construct the SQL query with dynamic column assignments for the UPDATE statement
      const updateQuery = `
        UPDATE cs_os_users
        SET ${columns.map(col => `${col} = ?`).join(', ')}
        WHERE id = ?
      `;
  
      // Execute the query with the dynamically generated values and cs_regno at the end
      await pool.query(updateQuery, [...values, cs_regno]);
  
      res.status(200).json({ success: true, message: "User updated successfully", data: userData });
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

/// Set up multer storage for profile photos
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../profile');

    // Ensure that the profile directory exists; if not, create it
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath); // Upload to 'profile' folder
  },
  filename: (req, file, cb) => {
    // Save the file with a unique name (use timestamp for uniqueness)
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Multer middleware for handling profile photo uploads
const uploadProfilePhoto = multer({
  storage: profileStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Set file size limit to 2MB
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true); // Accept the file
    } else {
      cb(new Error('Invalid file type. Only image files are allowed.'), false); // Reject the file
    }
  }
}).single('profilePhoto'); // Expect a single file with the field name 'profilePhoto'

// Define the API route for profile photo upload
router.post('/uploadProfilePhoto', (req, res) => {
  uploadProfilePhoto(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      // Handle multer-specific errors
      return res.status(400).json({ error: 'Multer error occurred', message: err.message });
    } else if (err) {
      // Handle other errors
      return res.status(400).json({ error: 'File upload failed', message: err.message });
    }

    // If no file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.body.userId; // Assuming you send the userId in the request body
    const filePath = `profile/${req.file.filename}`; // Path to access the file

    try {
      // Insert the file path into the cs_os_users table in the cs_profile column
      const query = 'UPDATE cs_os_users SET cs_profile = ? WHERE id = ?';
      const values = [filePath, userId];

      await pool.query(query, values); // Execute the query using your database connection

      // Send success response with the file path
      res.status(200).json({
        message: 'Profile photo uploaded successfully',
        filePath: filePath // Return the file path in the response
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Failed to update user profile', message: dbError.message });
    }
  });
});


module.exports = router;
