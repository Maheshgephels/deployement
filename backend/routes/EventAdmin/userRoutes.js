const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const moment = require('moment-timezone');
const multer = require('multer');
const path = require('path');
const ExcelJS = require('exceljs');
const verifyToken = require('../api/middleware/authMiddleware');
const excel = require('exceljs');
const nodemailer = require('nodemailer'); // Import nodemailer


// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_PASS,  // Your Gmail app password
  },
});






router.get('/getUser', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = '', catId, sortColumn = 'id', sortOrder = 'DESC', selectedColumns } = req.query;
    const offset = (page - 1) * pageSize;

    // Convert selectedColumns back into an array
    const columnsArray = selectedColumns ? selectedColumns.split(',') : [];


    const validColumns = ['cs_first_name', 'cs_last_name', 'cs_reg_category', 'cs_status', 'cs_isconfirm', 'cs_email', 'cs_phone'];
    const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'id';

    // Start constructing the SQL query
    let query = `
        SELECT cs_first_name, cs_last_name, cs_reg_category, id, cs_status, cs_title, cs_isconfirm, cs_email, cs_phone
        FROM cs_os_users WHERE 1
    `;

    // Initialize conditions array for dynamic `WHERE` clause
    let conditions = [];

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

    // Append category condition if catId is provided and not 'Yes'
    if (catId !== 'Yes' && catId) {
      conditions.push(`cs_reg_cat_id = ${catId}`);
    }

    // Add conditions to the query if there are any
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    // Append ORDER BY and pagination
    query += `
          ORDER BY ${columnToSortBy} ${sortOrder}
          LIMIT ${pageSize} OFFSET ${offset}
    `;

    // Execute the query to fetch user data
    const [userData] = await pool.query(query);

    let totalCountQuery = `
    SELECT COUNT(*) AS total
    FROM cs_os_users
    WHERE 1
  `;

    // Replicate the search logic
    if (search) {
      const searchTrimmed = search.trim();
      const searchTerms = searchTrimmed.split(' ');

      let searchConditions = '';

      if (searchTerms.length === 3) {
        const firstName = searchTerms[0];
        const middleInitial = searchTerms[1];
        const lastName = searchTerms[2];

        searchConditions = `
        (
          cs_first_name LIKE '%${firstName} ${middleInitial}%' AND cs_last_name LIKE '%${lastName}%'
        )
      `;
      } else if (searchTerms.length === 2) {
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
      totalCountQuery += `
      AND (${searchConditions})
    `;
    }

    // Add the same conditions to the count query
    if (conditions.length > 0) {
      totalCountQuery += ' AND ' + conditions.join(' AND ');
    }


    const [totalCountResult] = await pool.query(totalCountQuery);
    const totalItems = totalCountResult[0].total;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Execute the query to fetch label data
    let labelQuery = `
        SELECT cs_field_name, cs_field_label
        FROM cs_os_field_data
    `;
    const [labelData] = await pool.query(labelQuery);

    res.json({ categories: userData, currentPage: parseInt(page), totalPages, pageSize, totalItems, labels: labelData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



router.put('/UpdateStatus', verifyToken, async (req, res) => {
  try {
    // Extract workshopId, status, and Name from the request body
    console.log(req.body);
    const { UserId, status } = req.body;



    // Update cs_status in cs_os_workshop
    const updateQuery = `UPDATE cs_os_users SET cs_status = ? WHERE id = ?`;
    await pool.query(updateQuery, [status, UserId]);

    // Update cs_status in cs_os_facilitytyp
    return res.status(200).json({ message: 'Status Updates successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/BulkUpdateStatus', verifyToken, async (req, res) => {
  try {
    const { Id, status } = req.body;

    // Ensure Id is an array
    if (!Array.isArray(Id) || Id.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty Id list' });
    }

    // Construct the query with placeholders for the IDs
    const placeholders = Id.map(() => '?').join(',');
    const updateQuery = `UPDATE cs_os_users SET cs_status = ? WHERE id IN (${placeholders})`;

    // Execute the query
    await pool.query(updateQuery, [status, ...Id]);

    return res.status(200).json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.delete('/deleteUser', verifyToken, async (req, res) => {
  const { UserId } = req.body;


  try {
    // Delete from cs_os_workshop table
    const deleteQuery = 'DELETE FROM cs_os_users WHERE id = ?';
    await pool.query(deleteQuery, [UserId]);

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting workshop:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

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
    const facultytype = ['type_title', 'facultytype_id'];

    const custom_data = ['cs_field_option', 'cs_field_option_value, cs_field_option_id, cs_field_id'];


    // Execute each query to fetch data from respective tables
    const [facilitytypeData] = await pool.query(`SELECT ${facilitytype.join(',')} FROM cs_os_facilitytype`);
    const [prefixData] = await pool.query(`SELECT ${prefix.join(',')} FROM cs_os_name_prefixes`);
    const [countryData] = await pool.query(`SELECT ${country.join(',')} FROM cs_tbl_country`);
    const [statesData] = await pool.query(`SELECT ${states.join(',')} FROM cs_tbl_states`);
    const [regCatData] = await pool.query(`
      SELECT ${reg_cat.join(',')} 
      FROM cs_os_category 
      WHERE cs_status = 1 
        AND cs_reg_cat_id NOT IN (0, 1)
    `);
    const [workshopData] = await pool.query(`SELECT ${work_cat.join(',')} FROM cs_os_workshop WHERE cs_status = 1`);
    const [dayTypeData] = await pool.query(`SELECT ${day_type.join(',')} FROM cs_os_reg_daytype WHERE cs_status = 1`);
    const [facultytypeData] = await pool.query(`SELECT ${facultytype.join(',')} FROM cs_app_facultytype WHERE status = 1`);

    const [customData] = await pool.query(`SELECT ${custom_data.join(',')} FROM cs_os_field_option WHERE cs_status = 1`);



    // Construct the response object
    const responseData = {
      // facilityType: facilitytypeData,
      prefix: prefixData,
      country: countryData,
      states: statesData,
      regCategory: regCatData,
      workshop: workshopData,
      dayType: dayTypeData,
      facultytype: facultytypeData,
      custom: customData
    };

    // Send the response containing data from all queries
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/check-user-name', verifyToken, async (req, res) => {
  const { uName } = req.body;

  console.log(req.body);
  try {
    // Execute SQL query to check if email exists in the database
    const [users] = await pool.query('SELECT * FROM cs_os_users WHERE cs_username = ?', [uName]);

    // Check if any user with the provided email exists
    if (users.length > 0) {
      // Email already exists in the database
      res.status(200).json({ available: false });
    } else {
      // Email is available
      res.status(200).json({ available: true });
    }
  } catch (error) {
    console.error('Error checking username availability:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/addUser', verifyToken, async (req, res) => {
  try {
    // Extract data from the request body
    console.log(req.body);
    const { adduser, prefix, fName, lname, mobile, email, uName, pass, regcat } = req.body;
    const isFaculty = adduser ? 1 : 0; // Set 1 if adduser is true, otherwise 0


    // Construct the SQL query to insert a new user into the cs_os_users table
    const insertQuery = `
            INSERT INTO cs_os_users (cs_title, cs_first_name, cs_last_name, cs_phone, cs_email, cs_username, cs_password, cs_reg_category, cs_reg_cat_id, cs_isfaculty, cs_module, cs_source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
    //cs_source define from where user inserted into a database

    // Execute the query to insert the new user into the cs_os_users table
    const [result] = await pool.query(insertQuery, [prefix.value, fName, lname, mobile, email, uName, pass, regcat.label, regcat.value, isFaculty, 2, 2
    ]);

    const userId = result.insertId; // Get the ID of the newly created user

    // If adduser is true, insert into the faculty table
    if (adduser) {

      // Find the current highest exh_order value and increment by 1
      const [result] = await pool.query(`SELECT MAX(faculty_order) as maxOrder FROM cs_app_faculties`);
      const maxOrder = result[0].maxOrder || 0;
      const newOrder = maxOrder + 1;

      const insertFacultyQuery = `
                INSERT INTO cs_app_faculties (user_id, faculty_order, ntitle, fname, lname, contact1, email1)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
      // Execute the query to insert the user into the faculty table
      await pool.query(insertFacultyQuery, [userId, newOrder, prefix.value, fName, lname, mobile, email]);
    }

    return res.status(200).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/editUser', verifyToken, async (req, res) => {
  try {
    // Extract the 'id' field from the UserId object in the request body
    const { UserId } = req.body;

    console.log("User ID:", req.body);

    // Construct the SQL query to fetch specific columns based on the user ID
    let query = `
        SELECT *
        FROM cs_os_users
        WHERE id = ?
    `;

    // Execute the query with the extracted id
    const [pagesData] = await pool.query(query, [UserId]);

    // Send the pages data as a response
    res.json(pagesData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// router.post('/updateUser',verifyToken, async (req, res) => {
//   try {
//     // Extract role_id from the request body
//     console.log(req.body);
//     const { values, UserId } = req.body;


//     const updateQuery = `UPDATE cs_os_users SET cs_title = ?, cs_first_name = ? , cs_last_name = ?, cs_email = ?, cs_phone = ?, cs_username = ?, cs_password = ? WHERE id = ?`;
//     await pool.query(updateQuery, [values.prefix,values.fName,values.lname,values.email,values.mobile,values.uName,values.pass, UserId]);




//     return res.status(200).json({ message: 'Workshop Updates succesffuly' });
//   } catch (error) {
//     console.error('Error updating workshop:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// });


router.post('/updateUser', verifyToken, async (req, res) => {
  try {
    console.log(req.body);
    const { values, UserId } = req.body;

    // Step 1: Check the current value of cs_isfaculty
    const selectQuery = `SELECT cs_isfaculty,cs_isbadge_created FROM cs_os_users WHERE id = ?`;
    const [userResult] = await pool.query(selectQuery, [UserId]);
    const currentIsFaculty = userResult[0]?.cs_isfaculty;
    const currentbadgestatus = userResult[0]?.cs_isbadge_created;
    const oldRegCategory = userResult[0]?.cs_reg_category;
    const oldRegType = userResult[0]?.cs_reg_type;
    const oldWorkshopCategory = userResult[0]?.cs_workshop_category;


    const getCategoryIdQuery = `SELECT cs_reg_cat_id FROM cs_os_category WHERE cs_reg_category = ?`;
    const [categoryResult] = await pool.query(getCategoryIdQuery, [values.regcat]);
    const regCatId = categoryResult[0]?.cs_reg_cat_id;

    // Step 2: Update user data in cs_os_users
    const updateQuery = `UPDATE cs_os_users SET cs_title = ?, cs_first_name = ?, cs_last_name = ?, cs_email = ?, cs_phone = ?, cs_username = ?, cs_password = ?, cs_isfaculty = ?, cs_reg_category = ?, cs_reg_cat_id = ? WHERE id = ?`;
    await pool.query(updateQuery, [values.prefix, values.fName, values.lname, values.email, values.mobile, values.uName, values.pass, values.isChecked ? 1 : 0, values.regcat, regCatId, UserId]);

    // Step 3: Handle cs_isfaculty changes
    const newIsFaculty = values.isChecked ? 1 : 0;

    if (currentIsFaculty !== newIsFaculty) {
      if (newIsFaculty === 1) {
        // Insert into cs_app_faculties if the new value is 1
        const insertFacultyQuery = `
            INSERT INTO cs_app_faculties (user_id, ntitle, fname, lname, contact1, email1, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE ntitle = VALUES(ntitle), fname = VALUES(fname), lname = VALUES(lname), contact1 = VALUES(contact1), email1 = VALUES(email1), status = VALUES(status)
          `;
        await pool.query(insertFacultyQuery, [UserId, values.prefix, values.fName, values.lname, values.mobile, values.email, 1]);
      } else {
        // Delete from cs_app_faculties if the new value is 0
        const deleteFacultyQuery = `DELETE FROM cs_app_faculties WHERE user_id = ?`;
        await pool.query(deleteFacultyQuery, [UserId]);
      }
    } else if (currentIsFaculty === newIsFaculty && currentIsFaculty === 1) {
      // Update the existing entry if cs_isfaculty is the same and it's 1
      const updateFacultyQuery = `
          UPDATE cs_app_faculties
          SET ntitle = ?, fname = ?, lname = ?, contact1 = ?, email1 = ?
          WHERE user_id = ?
        `;
      await pool.query(updateFacultyQuery, [values.prefix, values.fName, values.lname, values.mobile, values.email, UserId]);
    }

    if (currentbadgestatus === 1) {
      if (oldRegCategory !== values.regcat || oldRegType !== values.regtype || oldWorkshopCategory !== values.workshopCategory) {
        // Fetch facility details based on regCatId
        const facilityQuery = `
                SELECT fd.cs_facility_name, fc.cs_allow_count, fd.cs_facility_id
                FROM cs_os_facility_category fc
                JOIN cs_os_facility_detail fd ON fc.cs_facility_detail_id = fd.cs_facility_detail_id
                WHERE fc.cs_reg_cat_id = ? AND fd.cs_status = 1
            `;
        const [rows] = await pool.query(facilityQuery, [regCatId]);

        const badgeData = {};
        const reg_daytype = values.regtype;
        const workshop = values.workshopCategory;

        if (rows) {
          for (const row of rows) {
            const { cs_facility_name, cs_allow_count, cs_facility_id } = row;
            const [typeRows] = await pool.query(`
                        SELECT cs_type 
                        FROM cs_os_facilitytype 
                        WHERE cs_facility_id = ?
                    `, [cs_facility_id]);
            const facilityType = typeRows[0]?.cs_type;

            if (facilityType === 'workshop') {
              const [workshopRows] = await pool.query(`
                            SELECT cs_workshop_id 
                            FROM cs_os_workshop 
                            WHERE cs_facility_id = ? 
                        `, [cs_facility_id]);
              const workshopId = workshopRows[0]?.cs_workshop_id;

              if (workshopId === workshop) {
                badgeData[cs_facility_name] = cs_allow_count;
                badgeData[cs_facility_name + '_status'] = "0";
              } else {
                badgeData[cs_facility_name] = "0";
                badgeData[cs_facility_name + '_status'] = "0";
              }
            } else {
              if (cs_facility_name.includes(reg_daytype) || !/\d$/.test(cs_facility_name)) {
                badgeData[cs_facility_name] = cs_allow_count;
                badgeData[cs_facility_name + '_status'] = "0";
              } else {
                badgeData[cs_facility_name] = "0";
                badgeData[cs_facility_name + '_status'] = "0";
              }
            }
          }
        } else {
          console.error("Error executing facility query");
        }

        console.log("badgeData", badgeData);

        // Update badge data
        const updateBadgeQuery = `
                UPDATE cs_os_badges
                SET cs_reg_cat_id = ?, cs_badge_data = ?
                WHERE cs_regno = ?
            `;
        await pool.query(updateBadgeQuery, [regCatId, JSON.stringify(badgeData), values.cs_regno]);
      }
    }

    return res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});





// router.post('/addBulkUser', verifyToken, async (req, res) => {
//   try {
//     const bulkUsers = req.body; // Assuming req.body contains the array of users to be added
//     console.log(bulkUsers);

//     // Function to get category name by ID
//     const getCategoryNameById = async (id) => {
//       const [rows] = await pool.query('SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?', [id]);
//       if (rows.length > 0) {
//         return rows[0].cs_reg_category;
//       } else {
//         throw new Error(`Category with ID ${id} not found`);
//       }
//     };

//     // Current date
//     const currentDate = new Date();

//     // Insert each user and then update the password
//     for (const user of bulkUsers) {
//       const categoryName = await getCategoryNameById(user['Registration Category ID']);
//       const username = `${user['First Name'].toLowerCase()}${user['Last Name'].toLowerCase()}`;

//       // Insert the user without the password
//       const insertUserQuery = `
//           INSERT INTO cs_os_users (cs_title, cs_first_name, cs_last_name, cs_phone, cs_email, cs_username, cs_reg_category, cs_reg_cat_id, cs_status, created_at, updated_at)
//           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `;

//       const [result] = await pool.query(insertUserQuery, [
//         user['Title'],
//         user['First Name'],
//         user['Last Name'],
//         user['Phone'],
//         user['Email'],
//         username,
//         categoryName,
//         user['Registration Category ID'],
//         1, // Example default value for cs_status
//         currentDate,
//         currentDate
//       ]);

//       const newUserId = result.insertId;
//       const password = `${user['First Name'][0].toUpperCase()}${user['Last Name'].toLowerCase()}@${newUserId}`;

//       // Update the user's password
//       const updateUserPasswordQuery = `
//           UPDATE cs_os_users
//           SET cs_password = ?
//           WHERE id = ?
//         `;

//       await pool.query(updateUserPasswordQuery, [password, newUserId]);
//     }

//     res.status(200).json({ success: true, message: 'Bulk users added successfully' });
//   } catch (error) {
//     console.error('Error adding bulk users:', error);
//     res.status(500).json({ success: false, error: 'Failed to add bulk users' });
//   }
// });

router.post('/addBulkUser', verifyToken, async (req, res) => {
  try {
    const bulkUsers = req.body.data; // Assuming req.body contains the array of users to be added
    const email = req.body.sendEmail; // Check if email flag is true

    // Function to get category name by ID
    const getCategoryNameById = async (id) => {
      const [rows] = await pool.query('SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?', [id]);
      if (rows.length > 0) {
        return rows[0].cs_reg_category;
      } else {
        throw new Error(`Category with ID ${id} not found`);
      }
    };

    // Function to get title name by ID
    const getTitleNameById = async (id) => {
      const [rows] = await pool.query('SELECT cs_prefix FROM cs_os_name_prefixes WHERE cs_prefix_id = ?', [id]);
      if (rows.length > 0) {
        return rows[0].cs_prefix;
      } else {
        throw new Error(`Title with ID ${id} not found`);
      }
    };

    // Function to trim and process user fields
    const processUserFields = async (user) => {
      const trimmedUser = {};
      for (const [key, value] of Object.entries(user)) {
        if (typeof value === 'string') {
          trimmedUser[key] = value.trim();
        } else {
          trimmedUser[key] = value;
        }
      }

      if (trimmedUser['Title'] && !isNaN(trimmedUser['Title'])) {
        trimmedUser['Title'] = await getTitleNameById(trimmedUser['Title']);
      } else {
        trimmedUser['Title'] = null;
      }

      trimmedUser['Registration Category'] = await getCategoryNameById(trimmedUser['Registration Category ID']);

      return trimmedUser;
    };

    // Array to store the newly inserted user IDs
    const ids = [];

    for (const user of bulkUsers) {
      const processedUser = await processUserFields(user);

      const firstName = processedUser['First Name'];
      const lastName = processedUser['Last Name'];

      // Insert the user
      const insertUserQuery = `
        INSERT INTO cs_os_users (cs_title, cs_first_name, cs_last_name, cs_phone, cs_email, cs_reg_category, cs_reg_cat_id, cs_module, cs_source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await pool.query(insertUserQuery, [
        processedUser['Title'],
        firstName,
        lastName,
        processedUser['Phone'],
        processedUser['Email'],
        processedUser['Registration Category'],
        processedUser['Registration Category ID'],
        2,
        4
      ]);

      const newUserId = result.insertId;
      ids.push(newUserId);

      // Function to remove special characters
      const sanitizeString = (str) => str.replace(/[^a-zA-Z0-9]/g, '');

      const sanitizedFirstName = sanitizeString(firstName.toLowerCase());
      const sanitizedLastNameInitial = sanitizeString(lastName[0].toLowerCase());
      const sanitizedLastName = sanitizeString(lastName.toLowerCase());
      const sanitizedFirstNameInitial = sanitizeString(firstName[0].toUpperCase());

      const username = `${sanitizedFirstName}${sanitizedLastNameInitial}${newUserId}`;
      const password = `${sanitizedFirstNameInitial}${sanitizedLastName.substring(0, 5)}@${newUserId}`;

      const updateUserQuery = `
        UPDATE cs_os_users
        SET cs_username = ?, cs_password = ?
        WHERE id = ?
      `;
      await pool.query(updateUserQuery, [username, password, newUserId]);

      // Send email if email flag is true
      if (email) {
        const [userRow] = await pool.query('SELECT * FROM cs_os_users WHERE id = ?', [
          newUserId,
        ]);
        if (userRow.length > 0) {
          await sendEmail(userRow[0]);
        }
      }
    }


    console.log("Registered Users' IDs:", ids);
    res.status(200).json({ success: true, message: 'Bulk users added successfully', ids });

  } catch (error) {
    console.error('Error adding bulk users:', error);
    res.status(500).json({ success: false, error: 'Failed to add bulk users' });
  }
});

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Basic sendEmail function
const sendEmail = async (userData) => {
  const templateQuery = `SELECT template_content, template_subject FROM cs_tbl_email_template WHERE template_id = ?`;
  const [templateData] = await pool.query(templateQuery, [1]);



  console.log("User Data", userData);

  if (!templateData || templateData.length === 0) {
    console.log("No email template found");
    throw new Error('No email template found');
  }

  const userEmail = userData.cs_email;
  if (!userEmail || !isValidEmail(userEmail)) {
    console.log(`Skipping email for user ID ${userData.id}: Invalid email address.`);
    return; // Skip sending email
  }

  let emailBody = templateData[0].template_content;
  const emailSubject = templateData[0].template_subject;

  const replacePlaceholders = (template, data) => {
    return template.replace(/{{(\w+)}}/g, (_, key) => data[key] || '');
  };

  emailBody = replacePlaceholders(emailBody, userData);

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: userEmail,
    subject: emailSubject,
    html: emailBody,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Email sent successfully to ${userEmail}`);
};

// Confirm mail send option

const sendConfirmEmail = async (userData, userId) => {
  const templateQuery = `SELECT template_content, template_subject FROM cs_tbl_email_template WHERE template_id = ?`;
  const [templateData] = await pool.query(templateQuery, [7]);

  if (!templateData || templateData.length === 0) {
    console.log("No email template found");
    throw new Error('No email template found');
  }

  const userEmail = userData.cs_email;
  if (!userEmail || !isValidEmail(userEmail)) {
    console.log(`Skipping email for user ID ${userData.id}: Invalid email address.`);
    return; // Skip sending email
  }

  let emailBody = templateData[0].template_content;
  const emailSubject = templateData[0].template_subject;

  const replacePlaceholders = (template, data) => {
    return template.replace(/{{(\w+)}}/g, (_, key) => data[key] || '');
  };

  emailBody = replacePlaceholders(emailBody, userData);

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: userEmail,
    subject: emailSubject,
    html: emailBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${userEmail}`);
  } catch (error) {
    console.error(`Error sending email to ${userEmail}:`, error.message);
  }
};






router.get('/samplefile', async (req, res) => {
  try {
    // Create a new workbook and add a worksheet
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Sample');

    // Fetch registration categories from the database excluding cs_reg_cat_id 1 and 2
    const [categories] = await pool.query(`
        SELECT cs_reg_category, cs_reg_cat_id 
        FROM cs_os_category 
        WHERE cs_status = 1 AND cs_reg_cat_id NOT IN (0, 1, 3)
      `);

    const [prefixes] = await pool.query(`
        SELECT cs_prefix, cs_prefix_id 
        FROM cs_os_name_prefixes 
        WHERE cs_status = 1
      `);

    // Prepare the dynamic category data
    const categoryHeader = ['Registration Category', 'Value to need mention in import file'];
    const dynamicCategories = categories.map(category => [category.cs_reg_category, category.cs_reg_cat_id]);

    const prefixHeader = ['Title Prefix', 'Prefix ID'];
    const dynamicPrefixes = prefixes.map(prefix => [prefix.cs_prefix, prefix.cs_prefix_id]);

    // Add the instructions and sample data to the worksheet
    const data = [
      ['Title', 'First Name', 'Last Name', 'Email', 'Phone', 'Registration Category ID'], // Header row
      ['Mr.', 'John', 'Doe', 'john.doe@example.com', '1234567890', '2'], // Dummy entry
      ['Mrs.', 'Jane', 'Smith', 'jane.smith@example.com', '0987654321', '3'], // Dummy entry
      ['Dr.', 'Emily', 'Johnson', 'emily.johnson@example.com', '1122334455', '4']  // Dummy entry
    ];

    // Add data to worksheet
    data.forEach((row) => {
      worksheet.addRow(row);
    });

    // Convert workbook to CSV and send to client
    const csvData = await workbook.csv.writeBuffer();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sample.csv');
    res.status(200).send(csvData);
  } catch (error) {
    console.error('Error generating sample CSV file:', error);
    res.status(500).send('Internal Server Error');
  }
});



router.get('/instructionfile', async (req, res) => {
  try {
    // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sample');

    // Fetch registration categories from the database excluding cs_reg_cat_id 1 and 2
    const [categories] = await pool.query(`
        SELECT cs_reg_category, cs_reg_cat_id 
        FROM cs_os_category 
        WHERE cs_status = 1  AND cs_reg_cat_id NOT IN (0, 1, 3)
      `);

    const [prefixes] = await pool.query(`
        
        SELECT cs_prefix, cs_prefix_id 
        FROM cs_os_name_prefixes 
        WHERE cs_status = 1
      `);

    // Prepare the dynamic category data
    const categoryHeader = ['Registration Category', 'Value to need mention in import file'];
    const dynamicCategories = categories.map(category => [category.cs_reg_category, category.cs_reg_cat_id]);


    const prefixHeader = ['Title Prefix', 'Prefix ID'];
    const dynamicPrefixes = prefixes.map(prefix => [prefix.cs_prefix, prefix.cs_prefix_id]);

    // Add the instructions and sample data to the worksheet
    const data = [
      ['Import User Template'],
      [],
      ['How to import your data'],
      ['Step 1:', 'Collect all your attendee information and when you are ready, add your data to the Import sample sheet.'],
      ['Step 2:', 'Add your content; the columns mentioned in the mandatory section are required.'],
      ['Step 3:', 'When you are done adding your content, upload this file through the "Import" menu on Consoft Event App admin.'],
      ['Step 4:', 'Your content will be automatically imported. If there are any errors you will be notified.'],
      [],
      ['NOTE:', "Don't delete any columns from the sample sheet. If you aren't using a column, just leave it empty."],
      ['NOTE:', 'If you are trying to add a Date, it should be in the "YYYY-MM-DD" format, e.g., 2024-11-22.'],
      [],
      ['TIP:', 'Users in the template can be in any order'],
      ['TIP:', 'Using Registration Category for your users? Make sure the Category already exist before using their id here.'],
      [],
      categoryHeader,
      ...dynamicCategories,
      [],
      prefixHeader,
      ...dynamicPrefixes,
      [],
      ['Column Name', 'Column Descriptions', 'Column Examples'],
      ['Title', 'The title for the user', '1'],
      ['First Name*', 'The first name (first name) of the user', 'John'],
      ['Last Name*', 'The last name (last name) of the user', 'Smith'],
      ['Email', 'The email address the attendee used to register for the event.', 'dummy@gmail.com'],
      ['Registration Category ID', 'The Attendee Registration Category of the users', '1'],
      ['Username', 'Username will be auto generated'],
      ['Password', 'Password will be auto generated'],
      [],
      ['Questions?', 'If you have any questions or problems uploading your data, email us on info@consoftservices.com'],
      [],
      ['Mandatory fields'],
      ['First Name'],
      ['Last Name'],
      ['Registration Category ID'],


      [],
      // ['Note- Before import file delete instructions Data with note line'],
      // ['Title', 'First Name', 'Last Name', 'Email', 'Phone', 'Registration Category ID']
    ];

    // Add data to worksheet
    data.forEach((row) => {
      worksheet.addRow(row);
    });

    // Convert workbook to CSV and send to client
    const csvData = await workbook.csv.writeBuffer();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sample.csv');
    res.status(200).send(csvData);
  } catch (error) {
    console.error('Error generating sample CSV file:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/Confirmsamplefilewithregno', async (req, res) => {
  try {
    // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sample');

    // Fetch registration categories from the database excluding cs_reg_cat_id 1 and 2
    const [categories] = await pool.query(`
        SELECT cs_reg_category, cs_reg_cat_id 
        FROM cs_os_category 
        WHERE cs_status = 1  AND cs_reg_cat_id NOT IN (0, 1, 3)
      `);

    const [prefixes] = await pool.query(`
        SELECT cs_prefix, cs_prefix_id 
        FROM cs_os_name_prefixes 
        WHERE cs_status = 1
      `);

    // Prepare the dynamic category data
    const categoryHeader = ['Registration Category', 'Value to need mention in import file'];
    const dynamicCategories = categories.map(category => [category.cs_reg_category, category.cs_reg_cat_id]);

    // Prepare the dynamic prefix data
    const prefixHeader = ['Title Prefix', 'Prefix ID'];
    const dynamicPrefixes = prefixes.map(prefix => [prefix.cs_prefix, prefix.cs_prefix_id]);
    // Add the instructions and sample data to the worksheet
    const data = [
      ['Registration Number', 'Title', 'First Name', 'Last Name', 'Email', 'Phone', 'Registration Category ID'],
      ['23', 'Mr.', 'John', 'Doe', 'john.doe@example.com', '1234567890', '2'], // Dummy entry
      ['343', 'Mrs.', 'Jane', 'Smith', 'jane.smith@example.com', '0987654321', '3'], // Dummy entry
      ['43', 'Dr.', 'Emily', 'Johnson', 'emily.johnson@example.com', '1122334455', '4']  // Dummy entry
    ];

    // Add data to worksheet
    data.forEach((row) => {
      worksheet.addRow(row);
    });

    // Convert workbook to CSV and send to client
    const csvData = await workbook.csv.writeBuffer();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sample.csv');
    res.status(200).send(csvData);
  } catch (error) {
    console.error('Error generating sample CSV file:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/ConfirmInstructionfilewithregno', async (req, res) => {
  try {
    // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sample');

    // Fetch registration categories from the database excluding cs_reg_cat_id 1 and 2
    const [categories] = await pool.query(`
        SELECT cs_reg_category, cs_reg_cat_id 
        FROM cs_os_category 
        WHERE cs_status = 1  AND cs_reg_cat_id NOT IN (0, 1, 3)
      `);

    const [prefixes] = await pool.query(`
        SELECT cs_prefix, cs_prefix_id 
        FROM cs_os_name_prefixes 
        WHERE cs_status = 1
      `);

    // Prepare the dynamic category data
    const categoryHeader = ['Registration Category', 'Value to need mention in import file'];
    const dynamicCategories = categories.map(category => [category.cs_reg_category, category.cs_reg_cat_id]);

    // Prepare the dynamic prefix data
    const prefixHeader = ['Title Prefix', 'Prefix ID'];
    const dynamicPrefixes = prefixes.map(prefix => [prefix.cs_prefix, prefix.cs_prefix_id]);
    // Add the instructions and sample data to the worksheet
    const data = [
      ['Import User with Registration number Template'],
      [],
      ['How to import your data'],
      ['Step 1:', 'Collect all your attendee information and when you are ready, add your data to the Import sample sheet.'],
      ['Step 2:', 'Add your content; the columns mentioned in the mandatory section are required.'],
      ['Step 3:', 'When you are done adding your content, upload this file through the "Import" menu on Consoft Event App admin.'],
      ['Step 4:', 'Your content will be automatically imported. If there are any errors you will be notified.'],
      [],
      ['NOTE:', "Don't delete any columns from the sample sheet. If you aren't using a column, just leave it empty."],
      ['NOTE:', 'If you are trying to add a Date, it should be in the "YYYY-MM-DD" format, e.g., 2024-11-22.'],
      [],
      ['TIP:', 'Users in the template can be in any order'],
      ['TIP:', 'Using Registration Category for your users? Make sure the Category already exists before using their id here.'],
      [],
      ['Column Name', 'Column Descriptions', 'Column Examples'],
      ['Registration number', 'The unique identifier for the user (do not delete or change this value)', '1023'],
      ['Title', 'The title for the user', '1'],
      ['First Name*', 'The first name of the user', 'John'],
      ['Last Name*', 'The last name of the user', 'Smith'],
      ['Contact Number', 'Contact Number of the Attendee'],
      ['Registration Category ID*', 'The Attendee Registration Category of the users', '1'],
      ['Email', 'The email address the attendee used to register for the event.', 'dummy@gmail.com'],
      ['Username', 'Username will be auto generated'],
      ['Password', 'Password will be auto generated'],
      [],
      ['Questions?', 'If you have any questions or problems uploading your data, email us on info@consoftservices.com'],
      [],
      categoryHeader,
      ...dynamicCategories,
      [],
      prefixHeader,
      ...dynamicPrefixes,
      [],
      ['Mandatory fields'],
      ['Registration Number'],
      ['First Name'],
      ['Last Name'],
      ['Registration Category ID'],

      [],
      // ['Note- Before import file delete instructions Data with note line'],
      // ['Registration Number', 'Title', 'First Name', 'Last Name', 'Email', 'Phone', 'Registration Category ID']
    ];

    // Add data to worksheet
    data.forEach((row) => {
      worksheet.addRow(row);
    });

    // Convert workbook to CSV and send to client
    const csvData = await workbook.csv.writeBuffer();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sample.csv');
    res.status(200).send(csvData);
  } catch (error) {
    console.error('Error generating sample CSV file:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/Confirmsamplefilewithoutregno', async (req, res) => {
  try {
    // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sample');

    // Fetch registration categories from the database excluding cs_reg_cat_id 1 and 2
    const [categories] = await pool.query(`
        SELECT cs_reg_category, cs_reg_cat_id 
        FROM cs_os_category 
        WHERE cs_status = 1  AND cs_reg_cat_id NOT IN (0, 1, 3)
      `);

    const [prefixes] = await pool.query(`
        SELECT cs_prefix, cs_prefix_id 
        FROM cs_os_name_prefixes 
        WHERE cs_status = 1
      `);

    // Prepare the dynamic category data
    const categoryHeader = ['Registration Category', 'Value to need mention in import file'];
    const dynamicCategories = categories.map(category => [category.cs_reg_category, category.cs_reg_cat_id]);

    // Prepare the dynamic prefix data
    const prefixHeader = ['Title Prefix', 'Prefix ID'];
    const dynamicPrefixes = prefixes.map(prefix => [prefix.cs_prefix, prefix.cs_prefix_id]);
    // Add the instructions and sample data to the worksheet
    const data = [
      ['Title', 'First Name', 'Last Name', 'Email', 'Phone', 'Registration Category ID'],
      ['Mr.', 'John', 'Doe', 'john.doe@example.com', '1234567890', '2'], // Dummy entry
      ['Mrs.', 'Jane', 'Smith', 'jane.smith@example.com', '0987654321', '3'], // Dummy entry
      ['Dr.', 'Emily', 'Johnson', 'emily.johnson@example.com', '1122334455', '4']  // Dummy entry
    ];

    // Add data to worksheet
    data.forEach((row) => {
      worksheet.addRow(row);
    });

    // Convert workbook to CSV and send to client
    const csvData = await workbook.csv.writeBuffer();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sample.csv');
    res.status(200).send(csvData);
  } catch (error) {
    console.error('Error generating sample CSV file:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/ConfirmInstructionfilewithoutregno', async (req, res) => {
  try {
    // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sample');

    // Fetch registration categories from the database excluding cs_reg_cat_id 1 and 2
    const [categories] = await pool.query(`
        SELECT cs_reg_category, cs_reg_cat_id 
        FROM cs_os_category 
        WHERE cs_status = 1  AND cs_reg_cat_id NOT IN (0, 1, 3)
      `);

    const [prefixes] = await pool.query(`
        SELECT cs_prefix, cs_prefix_id 
        FROM cs_os_name_prefixes 
        WHERE cs_status = 1
      `);

    // Prepare the dynamic category data
    const categoryHeader = ['Registration Category', 'Value to need mention in import file'];
    const dynamicCategories = categories.map(category => [category.cs_reg_category, category.cs_reg_cat_id]);

    // Prepare the dynamic prefix data
    const prefixHeader = ['Title Prefix', 'Prefix ID'];
    const dynamicPrefixes = prefixes.map(prefix => [prefix.cs_prefix, prefix.cs_prefix_id]);
    // Add the instructions and sample data to the worksheet
    const data = [
      ['Import User without Registration number Template'],
      [],
      ['How to import your data'],
      ['Step 1:', 'Collect all your attendee information and when you are ready, add your data to the Import sample sheet.'],
      ['Step 2:', 'Add your content; the columns mentioned in the mandatory section are required.'],
      ['Step 3:', 'When you are done adding your content, upload this file through the "Import" menu on Consoft Event App admin .'],
      ['Step 4:', 'Your content will be automatically imported. If there are any errors you will be notified.'],
      [],
      ['NOTE:', "Don't delete any columns from the sample sheet. If you aren't using a column, just leave it empty."],
      ['NOTE:', 'If you are trying to add a Date, it should be in the "YYYY-MM-DD" format, e.g., 2024-11-22.'],
      [],
      ['TIP:', 'Users in the template can be in any order'],
      ['TIP:', 'Using Registration Category for your users? Make sure the Category already exists before using their id here.'],
      [],
      ['Column Name', 'Column Descriptions', 'Column Examples'],
      ['Title', 'The title for the user', '1'],
      ['First Name*', 'The first name of the user', 'John'],
      ['Last Name*', 'The last name of the user', 'Smith'],
      ['Contact Number', 'Contact Number of the Attendee'],
      ['Registration Category ID*', 'The Attendee Registration Category of the users', '1'],
      ['Email', 'The email address the attendee used to register for the event.', 'dummy@gmail.com'],
      ['Username', 'Username will be auto generated'],
      ['Password', 'Password will be auto generated'],
      [],
      ['Questions?', 'If you have any questions or problems uploading your data, email us on info@consoftservices.com'],
      [],
      categoryHeader,
      ...dynamicCategories,
      [],
      prefixHeader,
      ...dynamicPrefixes,
      [],
      ['Mandatory fields'],
      ['First Name'],
      ['Last Name'],
      ['Registration Category ID'],

      [],
    ];

    // Add data to worksheet
    data.forEach((row) => {
      worksheet.addRow(row);
    });

    // Convert workbook to CSV and send to client
    const csvData = await workbook.csv.writeBuffer();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sample.csv');
    res.status(200).send(csvData);
  } catch (error) {
    console.error('Error generating sample CSV file:', error);
    res.status(500).send('Internal Server Error');
  }
});



router.get('/facultyimportsamplefile', async (req, res) => {
  try {
    // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sample');

    // Add the instructions and sample data to the worksheet
    const data = [
      ['Title', 'First Name', 'Last Name', 'Email', 'Phone', 'Faculty Type']
    ];

    // Add data to worksheet
    data.forEach((row) => {
      worksheet.addRow(row);
    });

    // Convert workbook to CSV and send to client
    const csvData = await workbook.csv.writeBuffer();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sample.csv');
    res.status(200).send(csvData);
  } catch (error) {
    console.error('Error generating sample CSV file:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/facultyimportinstructionfile', async (req, res) => {
  try {
    // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sample');

    // // Fetch registration categories from the database excluding cs_reg_cat_id 1 and 2
    // const [categories] = await pool.query(`
    //     SELECT cs_reg_category, cs_reg_cat_id 
    //     FROM cs_os_category 
    //     WHERE cs_status = 1  AND cs_reg_cat_id = 3
    //   `);

    const [faculty] = await pool.query(`
      SELECT facultytype_id, type_title
      FROM cs_app_facultytype 
      WHERE status = 1
    `);


    const [prefixes] = await pool.query(`
        SELECT cs_prefix, cs_prefix_id 
        FROM cs_os_name_prefixes 
        WHERE cs_status = 1
      `);

    // Prepare the dynamic category data
    // const categoryHeader = ['Registration Category', 'Value to need mention in import file'];
    // const dynamicCategories = categories.map(category => [category.cs_reg_category, category.cs_reg_cat_id]);

    // Prepare the dynamic prefix data
    const prefixHeader = ['Title Prefix', 'Prefix ID'];
    const dynamicPrefixes = prefixes.map(prefix => [prefix.cs_prefix, prefix.cs_prefix_id]);

    // Prepare the dynamic prefix data
    const facultyHeader = ['Faculty Type', 'Faculty type ID'];
    const facultyPrefixes = faculty.map(faculty => [faculty.type_title, faculty.facultytype_id]);

    // Add the instructions and sample data to the worksheet
    const data = [
      ['Import Faculty Template'],
      [],
      ['How to import your data'],
      ['Step 1:', 'Collect all your attendee information and when you are ready, add your data to the Import sample sheet.'],
      ['Step 2:', 'Add your content; the columns mentioned in the mandatory section are required.'],
      ['Step 3:', 'When you are done adding your content, upload this file through the "Import" menu on Consoft Event App admin.'],
      ['Step 4:', 'Your content will be automatically imported. If there are any errors you will be notified.'],
      [],
      ['NOTE:', "Don't delete any columns from the sample sheet. If you aren't using a column, just leave it empty."],
      ['NOTE:', 'If you are trying to add a Date, it should be in the "YYYY-MM-DD" format, e.g., 2024-11-22.'],
      [],
      ['TIP:', 'Users in the template can be in any order'],
      // ['TIP:', 'Using Registration Category for your users? Make sure the Category already exists before using their id here.'],
      [],
      ['Column Name', 'Column Descriptions', 'Column Examples'],
      ['Title', 'The title for the user', '1'],
      ['First Name*', 'The first name of the user', 'John'],
      ['Last Name*', 'The last name of the user', 'Smith'],
      ['Phone Number', 'Phone Number of the Attendee'],
      // ['Registration Category ID', 'The Attendee Registration Category of the users', '1'],
      ['Email', 'The email address the attendee used to register for the event.', 'dummy@gmail.com'],
      ['Username', 'Username will be auto generated'],
      ['Password', 'Password will be auto generated'],
      [],
      ['Questions?', 'If you have any questions or problems uploading your data, email us on info@consoftservices.com'],
      [],
      facultyHeader,
      ...facultyPrefixes,
      [],
      prefixHeader,
      ...dynamicPrefixes,
      [],
      ['Mandatory fields'],
      ['First Name'],
      ['Last Name'],
      ['Faculty Type'],

      [],
      // ['Note- Before import file delete instructions Data with note line'],
      // ['Title', 'First Name', 'Last Name', 'Email', 'Phone', 'Registration Category ID']
    ];

    // Add data to worksheet
    data.forEach((row) => {
      worksheet.addRow(row);
    });

    // Convert workbook to CSV and send to client
    const csvData = await workbook.csv.writeBuffer();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sample.csv');
    res.status(200).send(csvData);
  } catch (error) {
    console.error('Error generating sample CSV file:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/getEmails', verifyToken, async (req, res) => {
  try {
    // Specify the columns you want to fetch from the table
    console.log("user dataa");
    const columnsToFetch = ['cs_email'];

    // Construct the SQL query to fetch specific columns
    const query = `SELECT ${columnsToFetch.join(',')} FROM cs_os_users`;



    // Execute the query to fetch user data from the table
    const [userData] = await pool.query(query);

    // console.log("user dataa",userData);

    // Send the user data as a response
    res.json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// router.post('/addBulkConfirmUser', verifyToken, async (req, res) => {
//   try {
//     const bulkUsers = req.body; // Assuming req.body contains the array of users to be added
//     console.log(bulkUsers);

//     // Function to get category name by ID
//     const getCategoryNameById = async (id) => {
//       const [rows] = await pool.query('SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?', [id]);
//       if (rows.length > 0) {
//         return rows[0].cs_reg_category;
//       } else {
//         throw new Error(`Category with ID ${id} not found`);
//       }
//     };

//     // Current date
//     const currentDate = new Date();

//     // Insert each user and then update the password
//     for (const user of bulkUsers) {
//       const categoryName = await getCategoryNameById(user['Registration Category ID']);
//       const username = `${user['First Name'].toLowerCase()}${user['Last Name'].toLowerCase()}`;

//       // Insert the user without the password
//       const insertUserQuery = `
//         INSERT INTO cs_os_users (cs_regno,cs_title, cs_first_name, cs_last_name, cs_phone, cs_email, cs_username, cs_reg_category, cs_reg_cat_id, cs_status,	cs_isconfirm, created_at, updated_at)
//         VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,?)
//       `;

//       const [result] = await pool.query(insertUserQuery, [
//         user['Registration Number'],
//         user['Title'],
//         user['First Name'],
//         user['Last Name'],
//         user['Phone'],
//         user['Email'],
//         username,
//         categoryName,
//         user['Registration Category ID'],
//         1, // Example default value for cs_status
//         1,
//         currentDate,
//         currentDate
//       ]);

//       const newUserId = result.insertId;
//       const password = `${user['First Name'][0].toUpperCase()}${user['Last Name'].toLowerCase()}@${newUserId}`;

//       // Update the user's password
//       const updateUserPasswordQuery = `
//         UPDATE cs_os_users
//         SET cs_password = ?
//         WHERE id = ?
//       `;

//       await pool.query(updateUserPasswordQuery, [password, newUserId]);
//     }

//     res.status(200).json({ success: true, message: 'Bulk users added successfully' });
//   } catch (error) {
//     console.error('Error adding bulk users:', error);
//     res.status(500).json({ success: false, error: 'Failed to add bulk users' });
//   }
// });


router.post('/addBulkConfirmUser', verifyToken, async (req, res) => {
  try {
    const bulkUsers = req.body.data; // Assuming req.body contains the array of users to be added
    const email = req.body.sendEmail; // Check if email flag is true


    // Function to get category name by ID
    const getCategoryNameById = async (id) => {
      const [rows] = await pool.query('SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?', [id]);
      if (rows.length > 0) {
        return rows[0].cs_reg_category;
      } else {
        throw new Error(`Category with ID ${id} not found`);
      }
    };

    // Function to get title name by ID
    const getTitleNameById = async (id) => {
      const [rows] = await pool.query('SELECT cs_prefix FROM cs_os_name_prefixes WHERE cs_prefix_id = ?', [id]);
      if (rows.length > 0) {
        return rows[0].cs_prefix;
      } else {
        throw new Error(`Title with ID ${id} not found`);
      }
    };

    // Function to trim and process user fields
    const processUserFields = async (user) => {
      const trimmedUser = {};
      for (const [key, value] of Object.entries(user)) {
        // Check if the value is a string before trimming
        if (typeof value === 'string') {
          trimmedUser[key] = value.trim();
        } else {
          trimmedUser[key] = value;
        }
      }

      // If Title is provided and it's a valid number, fetch the title name
      if (trimmedUser['Title'] && !isNaN(trimmedUser['Title'])) {
        trimmedUser['Title'] = await getTitleNameById(trimmedUser['Title']);
      } else {
        // If Title is missing or invalid, set it to null
        trimmedUser['Title'] = null;
      }

      // Get category name by ID
      trimmedUser['Registration Category'] = await getCategoryNameById(trimmedUser['Registration Category ID']);

      return trimmedUser;
    };

    // Insert each user and then update the password
    for (const user of bulkUsers) {
      // Create a processed version of the user
      const processedUser = await processUserFields(user);

      // Function to remove special characters
      const sanitize = (str) => str.replace(/[^a-zA-Z0-9]/g, '');

      const firstName = processedUser['First Name'];
      const lastName = processedUser['Last Name'];

      // Insert the user without the password and username
      const insertUserQuery = `
        INSERT INTO cs_os_users (cs_regno, cs_title, cs_first_name, cs_last_name, cs_phone, cs_email, cs_reg_category, cs_reg_cat_id, cs_isconfirm, cs_module, cs_source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

        //cs_source define from where user inserted into a database


      const [result] = await pool.query(insertUserQuery, [
        processedUser['Registration Number'],
        processedUser['Title'],
        firstName,
        lastName,
        processedUser['Phone'],
        processedUser['Email'],
        processedUser['Registration Category'],
        processedUser['Registration Category ID'],
        1, // Example default value for cs_status
        2,
        4
      ]);

      const newUserId = result.insertId;

      // Function to remove special characters
      const sanitizeString = (str) => str.replace(/[^a-zA-Z0-9]/g, '');


      // Sanitize and format the first and last names
      const sanitizedFirstName = sanitizeString(firstName.toLowerCase());
      const sanitizedLastNameInitial = sanitizeString(lastName[0].toLowerCase());
      const sanitizedLastName = sanitizeString(lastName.toLowerCase());
      const sanitizedFirstNameInitial = sanitizeString(firstName[0].toUpperCase());

      // Generate username and password
      const username = `${sanitizedFirstName}${sanitizedLastNameInitial}${newUserId}`;
      const password = `${sanitizedFirstNameInitial}${sanitizedLastName.substring(0, 5)}@${newUserId}`;

      // console.log("Username:", username);
      // console.log("Password:", password);




      // Update the user's username and password
      const updateUserQuery = `
        UPDATE cs_os_users
        SET cs_username = ?, cs_password = ?
        WHERE id = ?
      `;

      await pool.query(updateUserQuery, [username, password, newUserId]);

      // Send email if email flag is true
      if (email) {
        const [userRow] = await pool.query('SELECT * FROM cs_os_users WHERE id = ?', [newUserId]);
        if (userRow.length > 0) {
          await sendConfirmEmail(userRow[0]);
        }
      }
    }


    res.status(200).json({ success: true, message: 'Bulk users added successfully' });
  } catch (error) {
    console.error('Error adding bulk users:', error);
    res.status(500).json({ success: false, error: 'Failed to add bulk users' });
  }
});




// import confirm user without regno
// router.post('/addBulkConfirmUserwithputreg', verifyToken, async (req, res) => {
//   try {
//     const bulkUsers = req.body; // Assuming req.body contains the array of users to be added
//     console.log(bulkUsers);

//     // Function to get category name by ID
//     const getCategoryNameById = async (id) => {
//       const [rows] = await pool.query('SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?', [id]);
//       if (rows.length > 0) {
//         return rows[0].cs_reg_category;
//       } else {
//         throw new Error(`Category with ID ${id} not found`);
//       }
//     };

//     // Fetch the last registration number from settings
//     const siteSettingResult = await pool.query('SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Admin Reg Start Number"');
//     let lastRegNo = siteSettingResult.length > 0 ? parseInt(siteSettingResult[0][0].cs_value, 10) : 0;
//     console.log("lastRegNo", lastRegNo);

//     // Current date
//     const currentDate = new Date();

//     // Insert each user and then update the password
//     for (const user of bulkUsers) {
//       const categoryName = await getCategoryNameById(user['Registration Category ID']);
//       const username = `${user['First Name'].toLowerCase()}${user['Last Name'].toLowerCase()}`;

//       // Generate unique registration number if not provided
//       let regNo = user['Registration Number'];
//       if (!regNo) {
//         let regNoExists = true;
//         while (regNoExists) {
//           const existingRegNoResult = await pool.query('SELECT COUNT(*) AS count FROM cs_os_users WHERE cs_regno = ?', [lastRegNo]);
//           const existingRegNoCount = existingRegNoResult[0][0].count || 0;
//           if (existingRegNoCount > 0) {
//             lastRegNo++;
//           } else {
//             regNoExists = false;
//           }
//         }
//         regNo = lastRegNo;
//         lastRegNo++;
//       }

//       // Insert the user without the password
//       const insertUserQuery = `
//               INSERT INTO cs_os_users (cs_regno, cs_title, cs_first_name, cs_last_name, cs_phone, cs_email, cs_username, cs_reg_category, cs_reg_cat_id, cs_status, cs_isconfirm, created_at, updated_at)
//               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//           `;

//       const [result] = await pool.query(insertUserQuery, [
//         regNo,
//         user['Title'],
//         user['First Name'],
//         user['Last Name'],
//         user['Phone'],
//         user['Email'],
//         username,
//         categoryName,
//         user['Registration Category ID'],
//         1, // Example default value for cs_status
//         1, // Example default value for cs_isconfirm
//         currentDate,
//         currentDate
//       ]);

//       const newUserId = result.insertId;
//       const password = `${user['First Name'][0].toUpperCase()}${user['Last Name'].toLowerCase()}@${newUserId}`;

//       // Update the user's password
//       const updateUserPasswordQuery = `
//               UPDATE cs_os_users
//               SET cs_password = ?
//               WHERE id = ?
//           `;

//       await pool.query(updateUserPasswordQuery, [password, newUserId]);

//       // Update the cs_tbl_sitesetting table with the new regNo
//       await pool.query('UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter = "Admin Reg Start Number"', [lastRegNo]);
//     }

//     res.status(200).json({ success: true, message: 'Bulk users added successfully' });
//   } catch (error) {
//     console.error('Error adding bulk users:', error);
//     res.status(500).json({ success: false, error: 'Failed to add bulk users' });
//   }
// });

router.post('/addBulkConfirmUserwithputreg', verifyToken, async (req, res) => {
  try {
    const bulkUsers = req.body.data; // Assuming req.body contains the array of users to be added
    const email = req.body.sendEmail; // Check if email flag is true

    console.log(bulkUsers);


    // Function to get category name by ID
    const getCategoryNameById = async (id) => {
      const [rows] = await pool.query('SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?', [id]);
      if (rows.length > 0) {
        return rows[0].cs_reg_category;
      } else {
        throw new Error(`Category with ID ${id} not found`);
      }
    };

    // Function to get title name by ID
    const getTitleNameById = async (id) => {
      const [rows] = await pool.query('SELECT cs_prefix FROM cs_os_name_prefixes WHERE cs_prefix_id = ?', [id]);
      if (rows.length > 0) {
        return rows[0].cs_prefix;
      } else {
        throw new Error(`Title with ID ${id} not found`);
      }
    };

    // Function to trim all string fields in a user object
    const trimUserFields = (user) => {
      const trimmedUser = {};
      Object.keys(user).forEach(key => {
        // Check if the value is a string before trimming
        trimmedUser[key] = typeof user[key] === 'string' ? user[key].trim() : user[key];
      });
      return trimmedUser;
    };

    // Fetch the last registration number from settings
    const siteSettingResult = await pool.query('SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Admin Reg Start Number"');
    let lastRegNo = siteSettingResult.length > 0 ? parseInt(siteSettingResult[0][0].cs_value, 10) : 0;
    console.log("lastRegNo", lastRegNo);

    // Insert each user and then update the password
    for (const user of bulkUsers) {
      // Create a trimmed version of the user
      const trimmedUser = trimUserFields(user);

      const categoryName = await getCategoryNameById(trimmedUser['Registration Category ID']);

      // Check if the Title is present and valid, otherwise set it to null
      let title = trimmedUser['Title'];
      if (title && !isNaN(title)) {
        title = await getTitleNameById(title).catch(() => null); // Set title to null if not found
      } else {
        title = null;
      }

      // Generate unique registration number if not provided
      let regNo = trimmedUser['Registration Number'];
      if (!regNo) {
        let regNoExists = true;
        while (regNoExists) {
          const existingRegNoResult = await pool.query('SELECT COUNT(*) AS count FROM cs_os_users WHERE cs_regno = ?', [lastRegNo]);
          const existingRegNoCount = existingRegNoResult[0][0].count || 0;
          if (existingRegNoCount > 0) {
            lastRegNo++;
          } else {
            regNoExists = false;
          }
        }
        regNo = lastRegNo;
        lastRegNo++;
      }

      // Insert the user without the password and username
      const insertUserQuery = `
        INSERT INTO cs_os_users (cs_regno, cs_title, cs_first_name, cs_last_name, cs_phone, cs_email, cs_reg_category, cs_reg_cat_id, cs_isconfirm, cs_module, cs_source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await pool.query(insertUserQuery, [
        regNo,
        title, // Use the title name here
        trimmedUser['First Name'],
        trimmedUser['Last Name'],
        trimmedUser['Phone'],
        trimmedUser['Email'],
        categoryName,
        trimmedUser['Registration Category ID'],
        1, // Example default value for cs_status
        2,
        4
      ]);

      const newUserId = result.insertId;

      // Function to remove special characters
      const sanitizeString = (str) => str.replace(/[^a-zA-Z0-9]/g, '');

      // Sanitize and format the first and last names
      const sanitizedFirstName = sanitizeString(trimmedUser['First Name'].toLowerCase());
      const sanitizedLastNameInitial = sanitizeString(trimmedUser['Last Name'][0].toLowerCase());
      const sanitizedLastName = sanitizeString(trimmedUser['Last Name'].toLowerCase());
      const sanitizedFirstNameInitial = sanitizeString(trimmedUser['First Name'][0].toUpperCase());

      // Generate username and password
      const username = `${sanitizedFirstName}${sanitizedLastNameInitial}${newUserId}`;
      const password = `${sanitizedFirstNameInitial}${sanitizedLastName.substring(0, 5)}@${newUserId}`;

      console.log("Username:", username);
      console.log("Password:", password);

      // Generate username with the pattern FirstName + First letter of LastName + newUserId
      // const username = `${trimmedUser['First Name'].toLowerCase()}${trimmedUser['Last Name'][0].toLowerCase()}${newUserId}`;
      // const password = `${trimmedUser['First Name'][0].toUpperCase()}${trimmedUser['Last Name'].toLowerCase()}@${newUserId}`;

      // Update the user's username and password
      const updateUserQuery = `
        UPDATE cs_os_users
        SET cs_username = ?, cs_password = ?
        WHERE id = ?
      `;

      await pool.query(updateUserQuery, [username, password, newUserId]);

      // Update the cs_tbl_sitesetting table with the new regNo
      await pool.query('UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter = "Admin Reg Start Number"', [lastRegNo]);

      // Send email if email flag is true
      if (email) {
        const [userRow] = await pool.query('SELECT * FROM cs_os_users WHERE id = ?', [newUserId]);
        if (userRow.length > 0) {
          await sendConfirmEmail(userRow[0]);
        }
      }
    }


    res.status(200).json({ success: true, message: 'Bulk users added successfully' });
  } catch (error) {
    console.error('Error adding bulk users:', error);
    res.status(500).json({ success: false, error: 'Failed to add bulk users' });
  }
});




// router.post('/importfaculty', verifyToken, async (req, res) => {
//   try {
//     const bulkUsers = req.body; // Assuming req.body contains the array of users to be added
//     console.log(bulkUsers);

//     // Function to get category name by ID
//     const getCategoryNameById = async (id) => {
//       const [rows] = await pool.query('SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?', [id]);
//       if (rows.length > 0) {
//         return rows[0].cs_reg_category;
//       } else {
//         throw new Error(`Category with ID ${id} not found`);
//       }
//     };

//     // Fetch the last registration number from settings
//     const siteSettingResult = await pool.query('SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Admin Reg Start Number"');
//     let lastRegNo = siteSettingResult.length > 0 ? parseInt(siteSettingResult[0][0].cs_value, 10) : 0;
//     console.log("lastRegNo", lastRegNo);

//     // Current date
//     const currentDate = new Date();

//     // Insert each user and then update the password
//     for (const user of bulkUsers) {
//       const categoryName = await getCategoryNameById(user['Registration Category ID']);
//       const username = `${user['First Name'].toLowerCase()}${user['Last Name'].toLowerCase()}`;

//       // Generate unique registration number if not provided
//       let regNo = user['Registration Number'];
//       if (!regNo) {
//         let regNoExists = true;
//         while (regNoExists) {
//           const existingRegNoResult = await pool.query('SELECT COUNT(*) AS count FROM cs_os_users WHERE cs_regno = ?', [lastRegNo]);
//           const existingRegNoCount = existingRegNoResult[0][0].count || 0;
//           if (existingRegNoCount > 0) {
//             lastRegNo++;
//           } else {
//             regNoExists = false;
//           }
//         }
//         regNo = lastRegNo;
//         lastRegNo++;

//       }


//       // Insert the user without the password
//       const insertUserQuery = `
//               INSERT INTO cs_os_users (cs_regno, cs_title, cs_first_name, cs_last_name, cs_phone, cs_email, cs_username, cs_reg_category, cs_reg_cat_id, cs_status, cs_isconfirm,	cs_isfaculty, created_at, updated_at)
//               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? , ?)
//           `;

//       const [result] = await pool.query(insertUserQuery, [
//         regNo,
//         user['Title'],
//         user['First Name'],
//         user['Last Name'],
//         user['Phone'],
//         user['Email'],
//         username,
//         categoryName,
//         user['Registration Category ID'],
//         1, // Example default value for cs_status
//         1, // Example default value for cs_isconfirm
//         1,
//         currentDate,
//         currentDate
//       ]);

//       const newUserId = result.insertId;
//       const password = `${user['First Name'][0].toUpperCase()}${user['Last Name'].toLowerCase()}@${newUserId}`;

//       // Update the user's password
//       const updateUserPasswordQuery = `
//               UPDATE cs_os_users
//               SET cs_password = ?
//               WHERE id = ?
//           `;
//       // Find the current highest faculty_order value and increment by 1
//       const [[{ maxOrder }]] = await pool.query('SELECT MAX(faculty_order) as maxOrder FROM cs_app_faculties');
//       const newOrder = (maxOrder || 0) + 1;

//       const insertFacultyQuery = `
//   INSERT INTO cs_app_faculties (user_id, faculty_order, ntitle, fname, lname, contact1, email1, status)
//   VALUES (?, ?, ?, ?, ?, ?, ?, ?)
// `;
//       await pool.query(insertFacultyQuery, [
//         newUserId,
//         newOrder, // Use the incremented order here
//         user['Title'],
//         user['First Name'],
//         user['Last Name'],
//         user['Phone'],
//         user['Email'],
//         1 // Example default value for status
//       ]);

//       // Update the cs_tbl_sitesetting table with the new regNo

//       await pool.query('UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter = "Admin Reg Start Number"', [lastRegNo]);
//     }

//     res.status(200).json({ success: true, message: 'Bulk users added successfully' });
//   } catch (error) {
//     console.error('Error adding bulk users:', error);
//     res.status(500).json({ success: false, error: 'Failed to add bulk users' });
//   }
// });

router.post('/importfaculty', verifyToken, async (req, res) => {
  try {
    const bulkUsers = req.body.data; // Assuming req.body contains the array of users to be added
    const email = req.body.sendEmail; // Check if email flag is true
    console.log(bulkUsers);


    // Function to get category name by ID
    const getCategoryNameById = async (id) => {
      const [rows] = await pool.query('SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?', [id]);
      if (rows.length > 0) {
        return rows[0].cs_reg_category;
      } else {
        throw new Error(`Category with ID ${id} not found`);
      }
    };

    // Function to get title name by ID
    const getTitleNameById = async (id) => {
      const [rows] = await pool.query('SELECT cs_prefix FROM cs_os_name_prefixes WHERE cs_prefix_id = ?', [id]);
      if (rows.length > 0) {
        return rows[0].cs_prefix;
      } else {
        throw new Error(`Title with ID ${id} not found`);
      }
    };

    // Function to trim all string fields in a user object
    const trimUserFields = (user) => {
      const trimmedUser = {};
      Object.keys(user).forEach(key => {
        // Check if the value is a string before trimming
        trimmedUser[key] = typeof user[key] === 'string' ? user[key].trim() : user[key];
      });
      return trimmedUser;
    };

    // Fetch the last registration number from settings
    const siteSettingResult = await pool.query('SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Admin Reg Start Number"');
    let lastRegNo = siteSettingResult.length > 0 ? parseInt(siteSettingResult[0][0].cs_value, 10) : 0;
    console.log("lastRegNo", lastRegNo);

    // Insert each user and then update the password
    for (const user of bulkUsers) {
      // Create a trimmed version of the user
      const trimmedUser = trimUserFields(user);

      const categoryName = 'Faculty';
      const categoryId = 3;

      // Get the title name by ID if the title is an ID
      let title = trimmedUser['Title'];
      if (title && !isNaN(title)) { // Ensure title is not empty and is a number
        title = await getTitleNameById(title);
      } else {
        title = null; // Set to null if invalid
      }

      // Get the faculty type
      let facultyType = trimmedUser['Faculty Type'];

      // Generate unique registration number if not provided
      let regNo = trimmedUser['Registration Number'];
      if (!regNo) {
        let regNoExists = true;
        while (regNoExists) {
          const existingRegNoResult = await pool.query('SELECT COUNT(*) AS count FROM cs_os_users WHERE cs_regno = ?', [lastRegNo]);
          const existingRegNoCount = existingRegNoResult[0][0].count || 0;
          if (existingRegNoCount > 0) {
            lastRegNo++;
          } else {
            regNoExists = false;
          }
        }
        regNo = lastRegNo;
        lastRegNo++;
      }

      // Insert the user without the password and username
      const insertUserQuery = `
      INSERT INTO cs_os_users (cs_regno, cs_title, cs_first_name, cs_last_name, cs_phone, cs_email, cs_reg_category, cs_reg_cat_id, cs_isconfirm, cs_isfaculty, cs_module, cs_source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;


      const [result] = await pool.query(insertUserQuery, [
        regNo,
        title, // Use the title name here
        trimmedUser['First Name'],
        trimmedUser['Last Name'],
        trimmedUser['Phone'],
        trimmedUser['Email'],
        categoryName,
        categoryId,
        1, // Example default value for cs_status
        1, // Example default value for cs_isconfir
        2,
        4
      ]);

      const newUserId = result.insertId;

      // Function to remove special characters
      const sanitizeString = (str) => str.replace(/[^a-zA-Z0-9]/g, '');

      // Sanitize and format the first and last names
      const sanitizedFirstName = sanitizeString(trimmedUser['First Name'].toLowerCase());
      const sanitizedLastNameInitial = sanitizeString(trimmedUser['Last Name'][0].toLowerCase());
      const sanitizedLastName = sanitizeString(trimmedUser['Last Name'].toLowerCase());
      const sanitizedFirstNameInitial = sanitizeString(trimmedUser['First Name'][0].toUpperCase());

      // Generate username and password
      const username = `${sanitizedFirstName}${sanitizedLastNameInitial}${newUserId}`;
      const password = `${sanitizedFirstNameInitial}${sanitizedLastName.substring(0, 5)}@${newUserId}`;

      console.log("Username:", username);
      console.log("Password:", password);

      // Generate username with the pattern FirstName + First letter of LastName + newUserId
      // const username = `${trimmedUser['First Name'].toLowerCase()}${trimmedUser['Last Name'][0].toLowerCase()}${newUserId}`;
      // const password = `${trimmedUser['First Name'][0].toUpperCase()}${trimmedUser['Last Name'].toLowerCase()}@${newUserId}`;

      // Update the user's username and password
      const updateUserQuery = `
        UPDATE cs_os_users
        SET cs_username = ?, cs_password = ?
        WHERE id = ?
      `;

      await pool.query(updateUserQuery, [username, password, newUserId]);

      // Insert the faculty information
      const [[{ maxOrder }]] = await pool.query('SELECT MAX(faculty_order) as maxOrder FROM cs_app_faculties');
      const newOrder = (maxOrder || 0) + 1;

      const insertFacultyQuery = `
        INSERT INTO cs_app_faculties (user_id, facultytype_id, faculty_order, ntitle, fname, lname, contact1, email1, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await pool.query(insertFacultyQuery, [
        newUserId,
        facultyType,
        newOrder, // Use the incremented order here
        title, // Use the title name here for faculty
        trimmedUser['First Name'],
        trimmedUser['Last Name'],
        trimmedUser['Phone'],
        trimmedUser['Email'],
        1 // Example default value for status
      ]);

      // Update the cs_tbl_sitesetting table with the new regNo
      await pool.query('UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter = "Admin Reg Start Number"', [lastRegNo]);

      // Send email if email flag is true
      if (email) {
        const [userRow] = await pool.query('SELECT * FROM cs_os_users WHERE id = ?', [newUserId]);
        if (userRow.length > 0) {
          await sendConfirmEmail(userRow[0]);
        }
      }
    }


    res.status(200).json({ success: true, message: 'Bulk users added successfully' });
  } catch (error) {
    console.error('Error adding bulk users:', error);
    res.status(500).json({ success: false, error: 'Failed to add bulk users' });
  }
});





router.post('/updateName', verifyToken, async (req, res) => {
  try {
    const { UserId, firstName, lastName } = req.body;

    // Update first name and last name in cs_os_users
    const updateQuery = `UPDATE cs_os_users SET cs_first_name = ?, cs_last_name = ? WHERE id = ?`;
    await pool.query(updateQuery, [firstName, lastName, UserId]);

    return res.status(200).json({ message: 'Name updated successfully' });
  } catch (error) {
    console.error('Error updating name:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/getBasicUserData', verifyToken, async (req, res) => {
  try {
    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
      SELECT *
      FROM cs_os_users
      WHERE cs_status = 1 AND cs_regno IS NULL
      ORDER BY id DESC
      `;
    // Execute the query to fetch field data from the table
    const [userData] = await pool.query(query);

    // Respond with JSON containing fetched data
    res.json({ userData });
  } catch (error) {
    // Handle errors and respond with a 500 status code
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/getConfirmUserData', verifyToken, async (req, res) => {
  try {
    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
      SELECT *
      FROM cs_os_users
      WHERE cs_status IN (0, 1)
      ORDER BY id DESC
      `;
    // Execute the query to fetch field data from the table
    const [userData] = await pool.query(query);

    // Respond with JSON containing fetched data
    res.json({ userData });
  } catch (error) {
    // Handle errors and respond with a 500 status code
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});










module.exports = router;