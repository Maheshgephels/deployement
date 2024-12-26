const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const moment = require('moment-timezone');
const multer = require('multer');
const path = require('path');
const verifyToken = require('../api/middleware/authMiddleware');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'session-tumbnail'); // Folder to store uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Initialize upload
const upload = multer({ storage });


// router.get('/get-session-date', verifyToken, async (req, res) => {
//   try {
//       // Query to fetch cs_value for id 38 from cs_tbl_sitesetting table
//       const settingsQuery = "SELECT cs_parameter, cs_value FROM cs_tbl_sitesetting WHERE cs_parameter IN ('Event Start Date', 'session_length')";

//       // Execute the settings query
//       const [settingsResults] = await pool.query(settingsQuery);
//       console.log(settingsResults);

//       if (settingsResults.length === 0) {
//           return res.status(404).json({ message: 'Settings not found' });
//       }

//       // Query to fetch all to_date values from the cs_app_program table
//       const programsQuery = "SELECT to_date FROM cs_app_program";

//       // Execute the programs query
//       const [programsResults] = await pool.query(programsQuery);

//       // Extract to_date values into an array
//       const toDateArray = programsResults.map(row => row.to_date);

//       // Combine settings and to_date values
//       res.json({
//           settings: settingsResults,
//           to_dates: toDateArray
//       });
//   } catch (error) {
//       console.error('Error fetching settings or program dates:', error);
//       res.status(500).json({ message: 'Internal server error' });
//   }
// });

router.get('/get-session-date', verifyToken, async (req, res) => {
  try {
    // Query to fetch cs_value for id 38 from cs_tbl_sitesetting table
    const settingsQuery = "SELECT cs_parameter, cs_value FROM cs_tbl_sitesetting WHERE cs_parameter IN ('Event Start Date', 'session_length')";

    // Execute the settings query
    const [settingsResults] = await pool.query(settingsQuery);
    console.log(settingsResults);

    if (settingsResults.length === 0) {
      return res.status(404).json({ message: 'Settings not found' });
    }

    // Query to fetch all to_date values and their IDs from the cs_app_program table
    const programsQuery = "SELECT to_date, prog_id, start_time, end_time,prog_name FROM cs_app_program Where status= ?";

    // Execute the programs query
    const [programsResults] = await pool.query(programsQuery, 1);

    if (programsResults.length === 0) {
      return res.status(404).json({ message: 'Program dates not found' });
    }

    // Extract to_date values and their IDs into an array
    const toDateArray = programsResults.map(row => ({
      date: row.to_date,
      id: row.prog_id,  // Assuming `prog_id` is the ID associated with the date
      starttime: row.start_time,
      endtime: row.end_time,
      prog_name:row.prog_name,
    }));

    // Combine settings and to_date values
    res.json({
      settings: settingsResults,
      to_dates: toDateArray
    });
  } catch (error) {
    console.error('Error fetching settings or program dates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



//Demo//

router.post('/set-session-length', verifyToken, async (req, res) => {
  console.log(req.body);

  const { length } = req.body;

  const updateQuery = `UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter = ?`;
  await pool.query(updateQuery, [length, 'session_length']);

  res.status(200).json({ message: 'Changes Updated successfully' });


});


router.get('/get-hall', verifyToken, async (req, res) => {
  try {
    // Query to fetch cs_value for id 38 from cs_tbl_sitesetting table
    console.log("hello");
    const query = "SELECT locat_id, locat_name FROM cs_app_location_hall WHERE status = '1' AND locat_type IN (1, 4)";


    // Execute the query
    const [results] = await pool.query(query, 1);

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


router.post('/save-date', async (req, res) => {
  const { date } = req.body;

  console.log(req.body);

  if (!date) {
    return res.status(400).json({ success: false, message: 'Date is required' });
  }

  try {
    // Use parameterized query to prevent SQL injection
    const query = `
      SELECT *
      FROM cs_app_program
      WHERE to_date = ?;
    `;

    // Execute the query with the date parameter
    const [rows] = await pool.query(query, [date]);

    console.log("pagesData", rows);

    if (rows.length > 0) {
      // Respond with the ID of the saved date
      res.status(200).json({
        success: true,
        id: rows[0].prog_id, // Return the ID of the saved date
        starttime: rows[0].start_time,
        endtime: rows[0].end_time,
        prog_name:rows[0].prog_name,
        message: 'Date saved successfully!'
      });
    } else {
      // Handle case where no records are found
      res.status(404).json({
        success: false,
        message: 'No records found for the provided date'
      });
    }
  } catch (error) {
    console.error('Error saving date:', error);
    res.status(500).json({ success: false, message: 'Failed to save date' });
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
    const facultytype = ['ntitle', 'fname', 'lname', 'faculty_id'];
    const halltype = ['locat_name', '	locat_id'];
    const role = ['role_name', 'role_id'];

    const custom_data = ['cs_field_option', 'cs_field_option_value, cs_field_option_id, cs_field_id'];


    // Execute each query to fetch data from respective tables
    const [facilitytypeData] = await pool.query(`SELECT ${facilitytype.join(',')} FROM cs_os_facilitytype`);
    const [prefixData] = await pool.query(`SELECT ${prefix.join(',')} FROM cs_os_name_prefixes`);
    const [countryData] = await pool.query(`SELECT ${country.join(',')} FROM cs_tbl_country`);
    const [statesData] = await pool.query(`SELECT ${states.join(',')} FROM cs_tbl_states`);
    const [regCatData] = await pool.query(`SELECT ${reg_cat.join(',')} FROM cs_os_category WHERE cs_status = 1`);
    const [workshopData] = await pool.query(`SELECT ${work_cat.join(',')} FROM cs_os_workshop WHERE cs_status = 1`);
    const [dayTypeData] = await pool.query(`SELECT ${day_type.join(',')} FROM cs_os_reg_daytype WHERE cs_status = 1`);
    const [facultytypeData] = await pool.query(`SELECT ${facultytype.join(',')} FROM cs_app_faculties WHERE status = 1`);
    const [halltypeData] = await pool.query(`SELECT ${halltype.join(',')} FROM cs_app_location_hall WHERE status = 1 AND locat_type IN (1, 4)`);
    const [roleData] = await pool.query(`SELECT ${role.join(',')} FROM cs_app_roles WHERE status = 1`);

    const [customData] = await pool.query(`SELECT ${custom_data.join(',')} FROM cs_os_field_option WHERE cs_status = 1  `);




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
      halltype: halltypeData,
      custom: customData,
      role: roleData
    };

    // Send the response containing data from all queries
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// router.post('/add-session', verifyToken, async (req, res) => {
//   try {
//     const formData = req.body;
//     console.log('Received data:', formData);

//     // Extract fields from formData and provide default values
//     const {
//       title,
//       description,
//       hallLocation,
//       startTime,
//       endTime,
//       facultyRolePairs = [], // Provide default empty array
//       activeTabContent,
//       savedDateId,
//       startDate,
//     } = formData;

//     const status = 1;

//     // Ensure facultyRolePairs is an array and process it
//     const processedFacultyRolePairs = Array.isArray(facultyRolePairs) ? facultyRolePairs.map(pair => ({
//       facultyId: pair.faculty?.value, // Safe access with optional chaining
//       roleId: pair.role?.value,       // Safe access with optional chaining
//     })) : [];

//     // Log processed data for debugging
//     console.log('Processed FacultyRolePairs:', processedFacultyRolePairs);

//     const insertQuery = `
//     INSERT INTO cs_app_session (
//       session_title,
//       session_description,
//       start_time,
//       end_time,
//       prog_id,
//       locat_id,
//       sessiontype_id,
//       created_at,
//       status,
//       session_date
//     ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?,?)
//   `;

//   // Prepare data for insertion
//   const sessionData = [
//     title,                     // session_title
//     description,               // session_description
//     startTime,                 // start_time
//     endTime,                   // end_time
//     savedDateId, 
//     hallLocation,
//     activeTabContent,              
//       // created_at
//     status,
//     startDate                  // status
//   ];

//   // Execute the query to insert the new session into the table
//   const [result] = await pool.query(insertQuery, sessionData);

//   const sessionId = result.insertId; // Get the inserted session ID

//     // Insert into cs_app_session_role_details
//     const insertRoleDetailsQuery = `
//       INSERT INTO cs_app_session_role_details (
//         session_id,
//         prog_id,
//         locat_id,
//         faculty_id,
//         role_id,
//         created_at,
//         status
//       ) VALUES (?, ?, ?, ?, ?, NOW(), ?)
//     `;

//     // Prepare data for insertion
//     const roleDetailsData = processedFacultyRolePairs.map(pair => [
//       sessionId,                 // session_id
//       savedDateId,               // prog_id                        // course_id (placeholder if needed)
//       hallLocation,              // locat_id
//       pair.facultyId,            // faculty_id                        // user_id (placeholder if needed)
//       pair.roleId,               // role_id
//       status                     // status
//     ]);

//     // Execute the query to insert role details
//     await Promise.all(roleDetailsData.map(data => pool.query(insertRoleDetailsQuery, data)));

//     // Send success response
//     res.status(201).json({ message: 'Event created successfully'});
//   } catch (error) {
//     // Log error and send failure response
//     console.error('Error saving event:', error);
//     res.status(500).json({ message: 'Error saving event', error });
//   }
// });


router.post('/add-session', verifyToken, upload.single('thumbnail'), async (req, res) => {
  try {
    const formData = req.body;
    const thumbnail = req.file; // Access the uploaded file

    console.log('Received data:', formData);
    console.log('Received file:', thumbnail);

    // Extract fields from formData and provide default values
    const {
      title,
      description,
      hallLocation,
      startTime,
      endTime,
      facultyRolePairs = [], // Provide default empty array
      activeTabContent,
      savedDateId,
      startDate,
    } = formData;


    // Ensure facultyRolePairs is an array and process it
    // const processedFacultyRolePairs = Array.isArray(facultyRolePairs) ? JSON.parse(facultyRolePairs).map(pair => ({
    //   facultyId: pair.faculty?.value, // Safe access with optional chaining
    //   roleId: pair.role?.value,       // Safe access with optional chaining
    // })) : [];

    // // Log processed data for debugging
    // console.log('Processed FacultyRolePairs:', processedFacultyRolePairs);

    const processedFacultyRolePairs = JSON.parse(facultyRolePairs).map(pair => ({
      facultyId: pair.faculty?.value, // Safe access with optional chaining
      roleId: pair.role?.value,       // Safe access with optional chaining
    }));

    // Log processed data for debugging
    console.log('Processed FacultyRolePairs:', processedFacultyRolePairs);

    const insertQuery = `
      INSERT INTO cs_app_session (
        session_title,
        session_description,
        start_time,
        end_time,
        prog_id,
        locat_id,
        sessiontype_id,
        session_date,
        session_thumbnail
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Prepare data for insertion
    const sessionData = [
      title,                     // session_title
      description,               // session_description
      startTime,                 // start_time
      endTime,                   // end_time
      savedDateId,               // prog_id
      hallLocation,              // locat_id
      activeTabContent,          // sessiontype_id
      startDate,                 // session_date
      thumbnail ? thumbnail.path : null // thumbnail_path
    ];

    // Execute the query to insert the new session into the table
    const [result] = await pool.query(insertQuery, sessionData);
    const sessionId = result.insertId; // Get the inserted session ID

    // Insert into cs_app_session_role_details
    const insertRoleDetailsQuery = `
    INSERT INTO cs_app_session_role_details (
      session_id,
      prog_id,
      locat_id,
      faculty_id,
      role_id
    ) VALUES (?, ?, ?, ?, ?)
  `;

    // Prepare data for insertion
    const roleDetailsData = processedFacultyRolePairs.map(pair => [
      sessionId,                 // session_id
      savedDateId,               // prog_id
      hallLocation,              // locat_id
      pair.facultyId,            // faculty_id
      pair.roleId             // role_id
    ]);

    // Execute the query to insert role details
    await Promise.all(roleDetailsData.map(data => pool.query(insertRoleDetailsQuery, data)));

    // Send success response
    res.status(201).json({ message: 'Event created successfully' });
  } catch (error) {
    // Log error and send failure response
    console.error('Error saving event:', error);
    res.status(500).json({ message: 'Error saving event', error });
  }
});


router.get('/get-session', verifyToken, async (req, res) => {
  try {
    // Query to fetch cs_value for id 38 from cs_tbl_sitesetting table
    // console.log("hello");
    const query = "SELECT * FROM cs_app_session WHERE status = '1'";


    // Execute the query
    const [results] = await pool.query(query, 1);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Settings not found' });
    }

    //   const csValue = results.cs_value;
    // console.log(results);
    res.json({ session: results });
  } catch (error) {
    console.error('Error fetching settings value:', error);
    res.status(500).json({ message: 'Internal server error' });
  }

});


router.delete('/deletesession', verifyToken, async (req, res) => {
  const { eventId } = req.body;


  try {
    // Delete from cs_os_workshop table
    const deleteSessionRoleDetailsQuery = 'DELETE FROM cs_app_session_role_details WHERE session_id = ?';
    await pool.query(deleteSessionRoleDetailsQuery, [eventId]);

    // Delete from cs_app_subsessions
    const deleteSubsessionsQuery = 'DELETE FROM cs_app_subsessions WHERE session_id = ?';
    await pool.query(deleteSubsessionsQuery, [eventId]);

    // Delete from cs_app_subsessios_role_details
    const deleteSubsessionsRoleDetailsQuery = 'DELETE FROM cs_app_subsessios_role_details WHERE session_id = ?';
    await pool.query(deleteSubsessionsRoleDetailsQuery, [eventId]);

    // Delete from cs_app_session
    const deleteSessionQuery = 'DELETE FROM cs_app_session WHERE session_id = ?';
    await pool.query(deleteSessionQuery, [eventId]);



    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting workshop:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/editSession', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.body;

    // Construct the SQL query with JOIN
    const query = `
      SELECT 
        s.session_id,
        s.session_title,
        s.session_description,
        s.start_time,
        s.end_time,
        s.locat_id,
        s.prog_id,
        s.sessiontype_id,
        s.session_date,
        sr.faculty_id,
        sr.role_id,
        sr.sroled_id,
        s.session_thumbnail
      FROM 
        cs_app_session s
      LEFT JOIN 
        cs_app_session_role_details sr
      ON 
        s.session_id = sr.session_id
      WHERE 
        s.session_id = ?;
    `;

    // Execute the query
    const [rows] = await pool.query(query, [sessionId]);

    // Extract session data and role details
    const sessionData = {
      session_id: rows[0]?.session_id,
      session_title: rows[0]?.session_title,
      session_description: rows[0]?.session_description,
      start_time: rows[0]?.start_time,
      end_time: rows[0]?.end_time,
      locat_id: rows[0]?.locat_id,
      prog_id: rows[0]?.prog_id,
      sessiontype_id: rows[0]?.sessiontype_id,
      session_date: rows[0]?.session_date,
      roles: rows.map(row => ({
        sroled_id: row.sroled_id,
        faculty_id: row.faculty_id,
        role_id: row.role_id
      })),
      session_thumbnail: rows[0]?.session_thumbnail
    };

    console.log("sessionData",sessionData);

    // Send the session data and role details as a response
    res.json(sessionData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});





router.post('/add-subsession', verifyToken, async (req, res) => {
  try {
    const formData = req.body;
    console.log('Received data:', formData);

    // Extract fields from formData and provide default values
    const {
      sessionId,
      title,
      description,
      startTime,
      endTime,
      facultyRolePairs = [], // Provide default empty array
      activeTabContent,
      savedDateId,
      startDate,
    } = formData;


    // Ensure facultyRolePairs is an array and process it
    const processedFacultyRolePairs = Array.isArray(facultyRolePairs) ? facultyRolePairs.map(pair => ({
      facultyId: pair.faculty?.value, // Safe access with optional chaining
      roleId: pair.role?.value,       // Safe access with optional chaining
    })) : [];

    // Log processed data for debugging
    console.log('Processed FacultyRolePairs:', processedFacultyRolePairs);

    const query = 'SELECT locat_id FROM cs_app_session WHERE session_id = ?';
    const [rows] = await pool.query(query, [sessionId]);

    // Assuming only one row is returned, access the first row's locat_id
    const locat_id = rows.length ? rows[0].locat_id : null;

    console.log('locat_id', locat_id);


    const insertQuery = `
    INSERT INTO cs_app_subsessions(
      subsession_title,
      subsession_description,
      start_time,
      end_time,
      prog_id,
      locat_id,
      sessiontype_id,
      subsession_date,
      session_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?,?,?)
  `;

    // Prepare data for insertion
    const sessionData = [
      title,                     // session_title
      description,               // session_description
      startTime,                 // start_time
      endTime,                   // end_time
      savedDateId,
      locat_id,
      activeTabContent,
      startDate,
      sessionId              // status
    ];

    // Execute the query to insert the new session into the table
    const [result] = await pool.query(insertQuery, sessionData);

    const subsessionId = result.insertId; // Get the inserted session ID

    // Insert into cs_app_session_role_details
  //   const insertRoleDetailsQuery = `
  //   INSERT INTO cs_app_subsessios_role_details(
  //     subsession_id,
  //     session_id,
  //     prog_id,
  //     locat_id,
  //     faculty_id,
  //     role_id,
  //   ) VALUES (?, ?, ?, ?, ?, ?)
  // `;

  //   // Prepare data for insertion
  //   const roleDetailsData = processedFacultyRolePairs.map(pair => [
  //     subsessionId,          // subsroled_id or an auto-incremented field (use NULL if auto-increment)
  //     sessionId,             // session_id
  //     savedDateId,           // prog_id
  //     locat_id,              // locat_id
  //     pair.facultyId,        // faculty_id
  //     pair.roleId         // role_id
  //   ]);

  //   // Execute the query to insert role details
  //   await Promise.all(roleDetailsData.map(data => pool.query(insertRoleDetailsQuery, data)));


  const insertRoleDetailsQuery = `
  INSERT INTO cs_app_subsessios_role_details(
    subsession_id,
    session_id,
    prog_id,
    locat_id,
    faculty_id,
    role_id
  ) VALUES (?, ?, ?, ?, ?, ?)
`;

// Prepare data for insertion
const roleDetailsData = processedFacultyRolePairs.map(pair => [
  subsessionId,          // subsroled_id or an auto-incremented field (use NULL if auto-increment)
  sessionId,             // session_id
  savedDateId,           // prog_id
  locat_id,              // locat_id
  pair.facultyId,        // faculty_id
  pair.roleId            // role_id
]);

// Execute the query to insert role details
await Promise.all(roleDetailsData.map(data => pool.query(insertRoleDetailsQuery, data)));



    // Send success response
    res.status(201).json({ message: 'Event created successfully' });
  } catch (error) {
    // Log error and send failure response
    console.error('Error saving event:', error);
    res.status(500).json({ message: 'Error saving event', error });
  }
});

router.post('/updateSession', verifyToken, upload.single('thumbnail'), async (req, res) => {
  console.log("Data", req.body);

  const {
    sessionId,
    title,
    description,
    hallType,
    startTime,
    endTime,
    sessionDate,
    facultyRoles, // This is a JSON string
    activeTabContent
  } = req.body;

  const thumbnail = req.file;

  try {
    // Parse facultyRoles JSON string to array
    const parsedFacultyRoles = JSON.parse(facultyRoles);

    // Query to get prog_id from cs_app_program based on sessionDate
    const getProgIdQuery = `
      SELECT prog_id
      FROM cs_app_program
      WHERE to_date = ?;
    `;
    const [progIdResult] = await pool.query(getProgIdQuery, [sessionDate]);

    if (progIdResult.length === 0) {
      return res.status(404).json({ message: 'Program not found for the given date' });
    }

    const progId = progIdResult[0].prog_id;

    // Update session details with the retrieved prog_id
    let updateSessionQuery = `
      UPDATE cs_app_session
      SET
        session_title = ?,
        session_description = ?,
        start_time = ?,
        end_time = ?,
        session_date = ?,
        locat_id = ?,
        prog_id = ?,
        sessiontype_id = ?
    `;

    const queryParams = [
      title,
      description,
      startTime,
      endTime,
      sessionDate,
      hallType, // assuming hallType maps to locat_id
      progId, // use the retrieved prog_id
      activeTabContent // assuming a default or specific sessiontype_id
    ];

    if (thumbnail) {
      updateSessionQuery += `, session_thumbnail = ? `;
      queryParams.push(thumbnail.path); // Add the thumbnail URL to the query params
    }

    updateSessionQuery += ` WHERE session_id = ?;`;
    queryParams.push(sessionId);

    // Execute the update query
    await pool.query(updateSessionQuery, queryParams);

    const updateSubSessionsQuery = `
      UPDATE cs_app_subsessions
      SET
        prog_id = ?,
        locat_id = ?
      WHERE session_id = ?;
    `;
    await pool.query(updateSubSessionsQuery, [progId, hallType, sessionId]);

    // Update subsession role details for all related subsessions
    const updateSubSessionRolesQuery = `
      UPDATE cs_app_subsessios_role_details
      SET
        prog_id = ?,
        locat_id = ?
      WHERE session_id = ?;
    `;
    await pool.query(updateSubSessionRolesQuery, [progId, hallType, sessionId]);

    // Get existing roles from the database
    const getExistingRolesQuery = `
      SELECT sroled_id
      FROM cs_app_session_role_details
      WHERE session_id = ?;
    `;
    const [existingRoles] = await pool.query(getExistingRolesQuery, [sessionId]);

    // Extract existing sroled_ids
    const existingRoleIds = existingRoles.map(role => role.sroled_id);

    // Filter out invalid roles
    const validFacultyRoles = parsedFacultyRoles.filter(role => role.faculty_id);

    // Extract incoming sroled_ids
    const incomingRoleIds = validFacultyRoles.map(role => role.sroled_id).filter(id => id);

    // Determine roles to delete
    const rolesToDelete = existingRoleIds.filter(id => !incomingRoleIds.includes(id));

    // Delete roles that are not present in the incoming data
    if (rolesToDelete.length > 0) {
      const deleteRolesQuery = `
        DELETE FROM cs_app_session_role_details
        WHERE sroled_id IN (?)
      `;
      await pool.query(deleteRolesQuery, [rolesToDelete]);
    }

    // Insert or update session role details
    for (const role of validFacultyRoles) {
      const roleId = role.role_id || null; // Allow null role_id if missing
      if (role.sroled_id) {
        // Update existing role
        const updateRoleQuery = `
          UPDATE cs_app_session_role_details
          SET
            faculty_id = ?,
            role_id = ?,
            prog_id = ?,
            locat_id = ?,
            status = ?
          WHERE sroled_id = ? AND session_id = ?;
        `;

        await pool.query(updateRoleQuery, [
          role.faculty_id,
          roleId,
          progId, // use the retrieved prog_id
          hallType, // assuming hallType maps to locat_id
          1, // assuming a default status
          role.sroled_id,
          sessionId
        ]);
      } else {
        // Insert new role
        const insertRoleDetailsQuery = `
          INSERT INTO cs_app_session_role_details (
            session_id,
            prog_id,
            locat_id,
            faculty_id,
            role_id,
            status
          ) VALUES (?, ?, ?, ?, ?, ?);
        `;

        await pool.query(insertRoleDetailsQuery, [
          sessionId,
          progId, // use the retrieved prog_id
          hallType, // assuming hallType maps to locat_id
          role.faculty_id,
          roleId,
          1 // assuming a default status
        ]);
      }
    }

    res.status(200).json({ message: 'Session updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});




router.post('/get-subsessions', verifyToken, async (req, res) => {
  const { sessionId } = req.body;

  // console.log("hello in subsession");

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    const [subsessions] = await pool.query(
      'SELECT * FROM cs_app_subsessions WHERE session_id = ? AND status = \'1\'',
      [sessionId]
    );
    res.json(subsessions);
  } catch (error) {
    console.error('Error fetching subsessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }

});

router.post('/get-facultyandrole', verifyToken, async (req, res) => {
  const { sessionId } = req.body;

  // console.log("hello in subsession");

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    const [facultyAndRoles] = await pool.query(
      'SELECT * FROM cs_app_session_role_details WHERE session_id = ?',
      [sessionId]
    );

    // Combine results into a single object
    const result = {
      facultyAndRoles,
    };

    console.log("result", result);
    res.json(result);
  } catch (error) {
    console.error('Error fetching subsessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }

});


router.delete('/deletesubsession', verifyToken, async (req, res) => {
  const { subsessionId } = req.body;


  try {

    // Delete from cs_app_subsessios_role_details
    const deleteSubsessionsRoleDetailsQuery = 'DELETE FROM cs_app_subsessios_role_details WHERE subsession_id = ?';
    await pool.query(deleteSubsessionsRoleDetailsQuery, [subsessionId]);

    // Delete from cs_app_session
    const deleteSessionQuery = 'DELETE FROM  cs_app_subsessions WHERE subsession_id  = ?';
    await pool.query(deleteSessionQuery, [subsessionId]);



    res.status(200).json({ message: 'Subsession deleted successfully' });
  } catch (error) {
    console.error('Error deleting workshop:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/Edit-subsessions', verifyToken, async (req, res) => {
  // console.log("gfdgdg",req.body);
  const { subsesionid } = req.body;

  // console.log("hello in subsession");

  if (!subsesionid) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    // const [subsessions] = await pool.query(
    //   'SELECT * FROM cs_app_subsessions WHERE subsession_id = ?',
    //   [subsesionid]
    // );

    //  console.log("gfdgdg",subsessions);

    // res.json(subsessions);


    // Construct the SQL query with JOIN
    // Construct the SQL query with JOIN
    const query = `
SELECT 
  s.session_id,
  s.subsession_id,
  s.subsession_title,
  s.subsession_description,
  s.start_time,
  s.end_time,
  s.locat_id,
  s.prog_id,
  s.sessiontype_id,
  s.subsession_date,
  sr.faculty_id,
  sr.role_id,
  sr.subsroled_id
FROM 
  cs_app_subsessions s
LEFT JOIN 
  cs_app_subsessios_role_details sr
ON 
  s.subsession_id = sr.subsession_id
WHERE 
  s.subsession_id = ?;
`;

    // Execute the query
    const [rows] = await pool.query(query, [subsesionid]);

    // Extract session data and role details
    const sessionData = {
      session_id: rows[0]?.session_id,
      subsession_id: rows[0]?.subsession_id,
      session_title: rows[0]?.subsession_title,
      session_description: rows[0]?.subsession_description,
      start_time: rows[0]?.start_time,
      end_time: rows[0]?.end_time,
      locat_id: rows[0]?.locat_id,
      prog_id: rows[0]?.prog_id,
      sessiontype_id: rows[0]?.sessiontype_id,
      session_date: rows[0]?.subsession_date,
      roles: rows.map(row => ({
        sroled_id: row.subsroled_id,
        faculty_id: row.faculty_id,
        role_id: row.role_id
      }))
    };

    // Send the session data and role details as a response
    res.json(sessionData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/updateSubSession', verifyToken, async (req, res) => {
  console.log("Data", req.body);

  const {
    subsessionid,
    title,
    description,
    startTime,
    endTime,
    facultyRoles,
    activeTabContent,
  } = req.body;

  try {
    // Update subsession details

    const getSubSessionDataQuery = `
    SELECT 
     *
    FROM cs_app_subsessions
    WHERE subsession_id = ?;
  `;
    const [subsessionData] = await pool.query(getSubSessionDataQuery, [subsessionid]);

    const hallType = subsessionData[0].locat_id;

    const updateSubSessionQuery = `
      UPDATE cs_app_subsessions
      SET
        subsession_title = ?,
        subsession_description = ?,
        start_time = ?,
        end_time = ?,
        sessiontype_id = ?
      WHERE subsession_id = ?;
    `;

    await pool.query(updateSubSessionQuery, [
      title,
      description,
      startTime,
      endTime,
      activeTabContent,
      subsessionid
    ]);

    // Get existing role details for the subsession
    const getExistingRolesQuery = `
      SELECT subsroled_id 
      FROM cs_app_subsessios_role_details
      WHERE subsession_id = ?;
    `;
    const [existingRoles] = await pool.query(getExistingRolesQuery, [subsessionid]);

    // Extract existing subsroled_ids
    const existingRoleIds = existingRoles.map(role => role.subsroled_id);

    // Extract incoming subsroled_ids
    const incomingRoleIds = facultyRoles.map(role => role.sroled_id).filter(id => id);

    // Determine roles to delete
    const rolesToDelete = existingRoleIds.filter(id => !incomingRoleIds.includes(id));

    // Delete roles that are not present in the incoming data
    if (rolesToDelete.length > 0) {
      const deleteRolesQuery = `
        DELETE FROM cs_app_subsessios_role_details
        WHERE subsroled_id IN (?);
      `;
      await pool.query(deleteRolesQuery, [rolesToDelete]);
    }

    // Insert or update subsession role details
    for (const role of facultyRoles) {
      if (role.sroled_id) {
        // Update existing role
        const updateRoleQuery = `
          UPDATE cs_app_subsessios_role_details
          SET
            faculty_id = ?,
            role_id = ?,
            locat_id = ?,
            status = ?
          WHERE subsroled_id = ? AND subsession_id = ?;
        `;

        await pool.query(updateRoleQuery, [
          role.faculty_id,
          role.role_id,
          hallType, // Assuming hallType maps to locat_id
          1, // Assuming a default status
          role.sroled_id,
          subsessionid
        ]);
      } else {
        // Insert new role
        const insertRoleDetailsQuery = `
          INSERT INTO cs_app_subsessios_role_details (
            subsession_id,
            locat_id,
            faculty_id,
            role_id,
            status
          ) VALUES (?, ?, ?, ?, ?);
        `;

        await pool.query(insertRoleDetailsQuery, [
          subsessionid,
          hallType, // Assuming hallType maps to locat_id
          role.faculty_id,
          role.role_id,
          1 // Assuming a default status
        ]);
      }
    }

    res.status(200).json({ message: 'Subsession updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

















module.exports = router;