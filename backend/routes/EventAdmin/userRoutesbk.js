const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const moment = require('moment-timezone');
const multer = require('multer');
const path = require('path');
const ExcelJS = require('exceljs');
const verifyToken = require('../api/middleware/authMiddleware');


router.get('/getUser', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = '', catId, sortColumn = 'id', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * pageSize;

    const validColumns = ['cs_first_name', 'cs_last_name', 'cs_reg_category', 'cs_status'];
    const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'id';

    // Start constructing the SQL query
    let query = `
        SELECT cs_first_name, cs_last_name, cs_reg_category, id, cs_status, cs_title
        FROM cs_os_users WHERE 1
    `;

    // Initialize conditions array for dynamic `WHERE` clause
    let conditions = [];

    // Append search condition if search query is provided
    if (search) {
      conditions.push(`
          (cs_first_name LIKE '%${search}%' OR 
           cs_last_name LIKE '%${search}%' OR 
           cs_email LIKE '%${search}%' OR 
           cs_phone LIKE '%${search}%' OR 
           cs_reg_category LIKE '%${search}%')
      `);
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

    // Construct the count query for pagination
    let totalCountQuery = 'SELECT COUNT(id) AS total FROM cs_os_users WHERE cs_status = 1';

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

    console.log(totalPages);
    res.json({ categories: userData, currentPage: parseInt(page), totalPages, pageSize, totalItems, labelData });
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
         
        AND cs_reg_cat_id <> 1
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
    const status = 1;
    const isFaculty = adduser ? 1 : 0; // Set 1 if adduser is true, otherwise 0

    // Construct the SQL query to insert a new user into the cs_os_users table
    const insertQuery = `
            INSERT INTO cs_os_users (cs_title, cs_first_name, cs_last_name, cs_phone, cs_email, cs_username, cs_password, cs_reg_category, cs_reg_cat_id, cs_status, cs_isfaculty)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

    // Execute the query to insert the new user into the cs_os_users table
    const [result] = await pool.query(insertQuery, [prefix.value, fName, lname, mobile, email, uName, pass, regcat.label, regcat.value, status, isFaculty]);

    const userId = result.insertId; // Get the ID of the newly created user

    // If adduser is true, insert into the faculty table
    if (adduser) {

      // Find the current highest exh_order value and increment by 1
      const [result] = await pool.query(`SELECT MAX(faculty_order) as maxOrder FROM cs_app_faculties`);
      const maxOrder = result[0].maxOrder || 0;
      const newOrder = maxOrder + 1;

      const insertFacultyQuery = `
                INSERT INTO cs_app_faculties (user_id, faculty_order, ntitle, fname, lname, contact1, email1, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
      // Execute the query to insert the user into the faculty table
      await pool.query(insertFacultyQuery, [userId, newOrder, prefix.value, fName, lname, mobile, email, 1]);
    }

    return res.status(200).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/editUser', verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    const { UserId } = req.body;



    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
        SELECT *
        FROM cs_os_users
        WHERE id = ${UserId};
        `;


    // Execute the query to fetch pages data for the specified role_id
    const [pagesData] = await pool.query(query, [UserId]);

    console.log(pagesData);

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
                SET cs_reg_cat_id = ?, cs_badge_data = ?, updated_at = ?
                WHERE cs_regno = ?
            `;
        await pool.query(updateBadgeQuery, [regCatId, JSON.stringify(badgeData), new Date(), values.cs_regno]);
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
    const bulkUsers = req.body; // Assuming req.body contains the array of users to be added
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

    // Current date
    const currentDate = new Date();

    // Insert each user and then update the password
    for (const user of bulkUsers) {
      const categoryName = await getCategoryNameById(user['Registration Category ID']);
      const firstName = user['First Name'];
      const lastName = user['Last Name'];

      // Generate username with the pattern FirstName + LastName + newUserId
      const insertUserQuery = `
        INSERT INTO cs_os_users (cs_title, cs_first_name, cs_last_name, cs_phone, cs_email, cs_reg_category, cs_reg_cat_id, cs_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await pool.query(insertUserQuery, [
        user['Title'],
        firstName,
        lastName,
        user['Phone'],
        user['Email'],
        categoryName,
        user['Registration Category ID'],
        1, // Example default value for cs_status
        currentDate,
        currentDate
      ]);

      const newUserId = result.insertId;

      // Generate the username and password based on the inserted user
      const username = `${firstName.toLowerCase()}${lastName[0].toLowerCase()}${newUserId}`;
      const password = `${firstName[0].toUpperCase()}${lastName.toLowerCase()}@${newUserId}`;

      // Update the user's username and password
      const updateUserQuery = `
        UPDATE cs_os_users
        SET cs_username = ?, cs_password = ?
        WHERE id = ?
      `;

      await pool.query(updateUserQuery, [username, password, newUserId]);
    }

    res.status(200).json({ success: true, message: 'Bulk users added successfully' });
  } catch (error) {
    console.error('Error adding bulk users:', error);
    res.status(500).json({ success: false, error: 'Failed to add bulk users' });
  }
});



router.get('/samplefile', async (req, res) => {
  try {
    // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sample');

    // Fetch registration categories from the database excluding cs_reg_cat_id 1 and 2
    const [categories] = await pool.query(`
        SELECT cs_reg_category, cs_reg_cat_id 
        FROM cs_os_category 
        WHERE cs_status = 1  AND cs_reg_cat_id NOT IN (0, 1)
      `);

    // Prepare the dynamic category data
    const categoryHeader = ['Registration Category', 'Value to need mention in import file'];
    const dynamicCategories = categories.map(category => [category.cs_reg_category, category.cs_reg_cat_id]);

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
      [],
      ['TIP:', 'Users in the template can be in any order'],
      ['TIP:', 'Using Registration Category for your users? Make sure the Category already exist before using their id here.'],
      [],
      categoryHeader,
      ...dynamicCategories,
      [],
      ['Column Name', 'Column Descriptions', 'Column Examples'],
      ['Title', 'The title for the user', 'Mr.'],
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
      ['Note- Before import file delete instructions Data with note line'],
      ['Title', 'First Name', 'Last Name', 'Email', 'Phone', 'Registration Category ID']
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
        WHERE cs_status = 1  AND cs_reg_cat_id NOT IN (0, 1)
      `);

    // Prepare the dynamic category data
    const categoryHeader = ['Registration Category', 'Value to need mention in import file'];
    const dynamicCategories = categories.map(category => [category.cs_reg_category, category.cs_reg_cat_id]);

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
      [],
      ['TIP:', 'Users in the template can be in any order'],
      ['TIP:', 'Using Registration Category for your users? Make sure the Category already exists before using their id here.'],
      [],
      ['Column Name', 'Column Descriptions', 'Column Examples'],
      ['Registration number', 'The unique identifier for the user (do not delete or change this value)', '1023'],
      ['Title', 'The title for the user', 'Mr.'],
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
      ['Mandatory fields'],
      ['Registration Number'],
      ['First Name'],
      ['Last Name'],
      ['Registration Category ID'],

      [],
      ['Note- Before import file delete instructions Data with note line'],
      ['Registration Number', 'Title', 'First Name', 'Last Name', 'Email', 'Phone', 'Registration Category ID']
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
        WHERE cs_status = 1  AND cs_reg_cat_id NOT IN (0, 1)
      `);

    // Prepare the dynamic category data
    const categoryHeader = ['Registration Category', 'Value to need mention in import file'];
    const dynamicCategories = categories.map(category => [category.cs_reg_category, category.cs_reg_cat_id]);

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
      [],
      ['TIP:', 'Users in the template can be in any order'],
      ['TIP:', 'Using Registration Category for your users? Make sure the Category already exists before using their id here.'],
      [],
      ['Column Name', 'Column Descriptions', 'Column Examples'],
      ['Title', 'The title for the user', 'Mr.'],
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
      ['Mandatory fields'],
      ['First Name'],
      ['Last Name'],
      ['Registration Category ID'],

      [],
      ['Note- Before import file delete instructions Data with note line'],
      ['Title', 'First Name', 'Last Name', 'Email', 'Phone', 'Registration Category ID']
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

    // Fetch registration categories from the database excluding cs_reg_cat_id 1 and 2
    const [categories] = await pool.query(`
        SELECT cs_reg_category, cs_reg_cat_id 
        FROM cs_os_category 
        WHERE cs_status = 1  AND cs_reg_cat_id NOT IN (0, 1)
      `);

    // Prepare the dynamic category data
    const categoryHeader = ['Registration Category', 'Value to need mention in import file'];
    const dynamicCategories = categories.map(category => [category.cs_reg_category, category.cs_reg_cat_id]);

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
      [],
      ['TIP:', 'Users in the template can be in any order'],
      ['TIP:', 'Using Registration Category for your users? Make sure the Category already exists before using their id here.'],
      [],
      ['Column Name', 'Column Descriptions', 'Column Examples'],
      ['Title', 'The title for the user', 'Mr.'],
      ['First Name*', 'The first name of the user', 'John'],
      ['Last Name*', 'The last name of the user', 'Smith'],
      ['Contact Number', 'Contact Number of the Attendee'],
      ['Registration Category ID', 'The Attendee Registration Category of the users', '1'],
      ['Email', 'The email address the attendee used to register for the event.', 'dummy@gmail.com'],
      ['Username', 'Username will be auto generated'],
      ['Password', 'Password will be auto generated'],
      [],
      ['Questions?', 'If you have any questions or problems uploading your data, email us on info@consoftservices.com'],
      [],
      categoryHeader,
      ...dynamicCategories,
      [],
      ['Mandatory fields'],
      ['First Name'],
      ['Last Name'],

      [],
      ['Note- Before import file delete instructions Data with note line'],
      ['Title', 'First Name', 'Last Name', 'Email', 'Phone', 'Registration Category ID']
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


router.post('/addBulkConfirmUser', verifyToken, async (req, res) => {
  try {
    const bulkUsers = req.body; // Assuming req.body contains the array of users to be added
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

    // Current date
    const currentDate = new Date();

    // Insert each user and then update the password
    for (const user of bulkUsers) {
      const categoryName = await getCategoryNameById(user['Registration Category ID']);
      const username = `${user['First Name'].toLowerCase()}${user['Last Name'].toLowerCase()}`;

      // Insert the user without the password
      const insertUserQuery = `
        INSERT INTO cs_os_users (cs_regno,cs_title, cs_first_name, cs_last_name, cs_phone, cs_email, cs_username, cs_reg_category, cs_reg_cat_id, cs_status,	cs_isconfirm, created_at, updated_at)
        VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,?)
      `;

      const [result] = await pool.query(insertUserQuery, [
        user['Registration Number'],
        user['Title'],
        user['First Name'],
        user['Last Name'],
        user['Phone'],
        user['Email'],
        username,
        categoryName,
        user['Registration Category ID'],
        1, // Example default value for cs_status
        1,
        currentDate,
        currentDate
      ]);

      const newUserId = result.insertId;
      const password = `${user['First Name'][0].toUpperCase()}${user['Last Name'].toLowerCase()}@${newUserId}`;

      // Update the user's password
      const updateUserPasswordQuery = `
        UPDATE cs_os_users
        SET cs_password = ?
        WHERE id = ?
      `;

      await pool.query(updateUserPasswordQuery, [password, newUserId]);
    }

    res.status(200).json({ success: true, message: 'Bulk users added successfully' });
  } catch (error) {
    console.error('Error adding bulk users:', error);
    res.status(500).json({ success: false, error: 'Failed to add bulk users' });
  }
});

// import confirm user without regno
router.post('/addBulkConfirmUserwithputreg', verifyToken, async (req, res) => {
  try {
    const bulkUsers = req.body; // Assuming req.body contains the array of users to be added
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

    // Fetch the last registration number from settings
    const siteSettingResult = await pool.query('SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Admin Reg Start Number"');
    let lastRegNo = siteSettingResult.length > 0 ? parseInt(siteSettingResult[0][0].cs_value, 10) : 0;
    console.log("lastRegNo", lastRegNo);

    // Current date
    const currentDate = new Date();

    // Insert each user and then update the password
    for (const user of bulkUsers) {
      const categoryName = await getCategoryNameById(user['Registration Category ID']);
      const username = `${user['First Name'].toLowerCase()}${user['Last Name'].toLowerCase()}`;

      // Generate unique registration number if not provided
      let regNo = user['Registration Number'];
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

      // Insert the user without the password
      const insertUserQuery = `
              INSERT INTO cs_os_users (cs_regno, cs_title, cs_first_name, cs_last_name, cs_phone, cs_email, cs_username, cs_reg_category, cs_reg_cat_id, cs_status, cs_isconfirm, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

      const [result] = await pool.query(insertUserQuery, [
        regNo,
        user['Title'],
        user['First Name'],
        user['Last Name'],
        user['Phone'],
        user['Email'],
        username,
        categoryName,
        user['Registration Category ID'],
        1, // Example default value for cs_status
        1, // Example default value for cs_isconfirm
        currentDate,
        currentDate
      ]);

      const newUserId = result.insertId;
      const password = `${user['First Name'][0].toUpperCase()}${user['Last Name'].toLowerCase()}@${newUserId}`;

      // Update the user's password
      const updateUserPasswordQuery = `
              UPDATE cs_os_users
              SET cs_password = ?
              WHERE id = ?
          `;

      await pool.query(updateUserPasswordQuery, [password, newUserId]);

      // Update the cs_tbl_sitesetting table with the new regNo
      await pool.query('UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter = "Admin Reg Start Number"', [lastRegNo]);
    }

    res.status(200).json({ success: true, message: 'Bulk users added successfully' });
  } catch (error) {
    console.error('Error adding bulk users:', error);
    res.status(500).json({ success: false, error: 'Failed to add bulk users' });
  }
});

router.post('/importfaculty', verifyToken, async (req, res) => {
  try {
    const bulkUsers = req.body; // Assuming req.body contains the array of users to be added
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

    // Fetch the last registration number from settings
    const siteSettingResult = await pool.query('SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Admin Reg Start Number"');
    let lastRegNo = siteSettingResult.length > 0 ? parseInt(siteSettingResult[0][0].cs_value, 10) : 0;
    console.log("lastRegNo", lastRegNo);

    // Current date
    const currentDate = new Date();

    // Insert each user and then update the password
    for (const user of bulkUsers) {
      const categoryName = await getCategoryNameById(user['Registration Category ID']);
      const username = `${user['First Name'].toLowerCase()}${user['Last Name'].toLowerCase()}`;

      // Generate unique registration number if not provided
      let regNo = user['Registration Number'];
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


      // Insert the user without the password
      const insertUserQuery = `
              INSERT INTO cs_os_users (cs_regno, cs_title, cs_first_name, cs_last_name, cs_phone, cs_email, cs_username, cs_reg_category, cs_reg_cat_id, cs_status, cs_isconfirm,	cs_isfaculty, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? , ?)
          `;

      const [result] = await pool.query(insertUserQuery, [
        regNo,
        user['Title'],
        user['First Name'],
        user['Last Name'],
        user['Phone'],
        user['Email'],
        username,
        categoryName,
        user['Registration Category ID'],
        1, // Example default value for cs_status
        1, // Example default value for cs_isconfirm
        1,
        currentDate,
        currentDate
      ]);

      const newUserId = result.insertId;
      const password = `${user['First Name'][0].toUpperCase()}${user['Last Name'].toLowerCase()}@${newUserId}`;

      // Update the user's password
      const updateUserPasswordQuery = `
              UPDATE cs_os_users
              SET cs_password = ?
              WHERE id = ?
          `;
      // Find the current highest faculty_order value and increment by 1
      const [[{ maxOrder }]] = await pool.query('SELECT MAX(faculty_order) as maxOrder FROM cs_app_faculties');
      const newOrder = (maxOrder || 0) + 1;

      const insertFacultyQuery = `
  INSERT INTO cs_app_faculties (user_id, faculty_order, ntitle, fname, lname, contact1, email1, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;
      await pool.query(insertFacultyQuery, [
        newUserId,
        newOrder, // Use the incremented order here
        user['Title'],
        user['First Name'],
        user['Last Name'],
        user['Phone'],
        user['Email'],
        1 // Example default value for status
      ]);

      // Update the cs_tbl_sitesetting table with the new regNo

      await pool.query('UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter = "Admin Reg Start Number"', [lastRegNo]);
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










module.exports = router;