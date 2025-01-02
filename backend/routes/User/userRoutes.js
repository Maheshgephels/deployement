const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const moment = require('moment-timezone');
const verifyToken = require('../api/middleware/authMiddleware');
const queueMiddleware = require('../api/middleware/queueMiddleware');
const ExcelJS = require('exceljs');
const excel = require('exceljs');
const crypto = require('crypto'); // crypto Hash for the 
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer'); // Import nodemailer
const Razorpay = require('razorpay'); // Razorpay Gateway
const { Console } = require('console');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_PASS, // Your Gmail app password
  },
  tls: {
    rejectUnauthorized: false, // Ignore self-signed certificate error
  },
});




// Constants for PayU - get these from your PayU dashboard
// const PAYU_MERCHANT_KEY = 'dcs8mD'; // IAPA
const PAYU_MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY;  // IADVL
// const PAYU_MERCHANT_SALT = '080JsbjX0ct8Bg06Qndkg1Cr0lAiTYui'; // IAPA 
const PAYU_MERCHANT_SALT = process.env.PAYU_MERCHANT_SALT; // IADVL 
const PAYU_BASE_URL = process.env.PAYU_BASE_URL; // Use this for testing; for production use 'https://secure.payu.in/_payment'

// Generate a hash for PayU request
function generatePayUHash(paymentData, merchantKey, salt) {
  console.log("paymentData_udf1:", paymentData.udf1);
  const { key, txnid, amount, productinfo, firstname, email, udf1, udf2 } = paymentData;
  const hashString = `${merchantKey}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|||||||||${salt}`;
  const hash = crypto.createHash('sha512').update(hashString).digest('hex');
  return hash;
}

RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// Set up multer for file storage in the 'document1' folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'faculty-profile/'); // Specify the directory where files will be uploaded
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); // Set the filename
  }
});

const upload = multer({ storage: storage });


router.get('/getField', verifyToken, async (req, res) => {
  try {
    const columnsToFetch = 'cs_os_field_data.*, cs_os_field_type.field_type_name';

    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
    SELECT ${columnsToFetch}
    FROM cs_os_field_data
    LEFT JOIN cs_os_field_type ON cs_os_field_data.cs_field_type = cs_os_field_type.cs_field_type
    WHERE cs_os_field_data.cs_status = 1 AND cs_visible_reg_basicform = 1 AND cs_visible_reg_userform = 1
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


// router.get('/getDropdownData', verifyToken, async (req, res) => {
//   try {
//     // Specify the columns you want to fetch from each table
//     const facilitytype = ['cs_type'];
//     const prefix = ['cs_prefix', 'cs_prefix_id'];
//     const country = ['cs_country', 'cs_country_id'];
//     const states = ['cs_state_name', 'cs_state_id', 'cs_country_id'];
//     const reg_cat = ['cs_reg_category', 'cs_reg_cat_id'];
//     const work_cat = ['cs_workshop_name', 'cs_workshop_id'];
//     const day_type = ['cs_reg_daytype_name', 'cs_reg_daytype_id'];
//     const ticket = ['ticket_id', 'ticket_title', 'ticket_type']
//     const addon = ['addon_id', 'addon_title']

//     const custom_data = ['cs_field_option', 'cs_field_option_value, cs_field_option_id, cs_field_id'];


//     // Execute each query to fetch data from respective tables
//     const [facilitytypeData] = await pool.query(`SELECT ${facilitytype.join(',')} FROM cs_os_facilitytype`);
//     const [prefixData] = await pool.query(`SELECT ${prefix.join(',')} FROM cs_os_name_prefixes`);
//     const [countryData] = await pool.query(`SELECT ${country.join(',')} FROM cs_tbl_country`);
//     const [statesData] = await pool.query(`SELECT ${states.join(',')} FROM cs_tbl_states`);
//     const [regCatData] = await pool.query(`SELECT ${reg_cat.join(',')} FROM cs_os_category WHERE cs_status = 1  `);
//     const [workshopData] = await pool.query(`SELECT ${work_cat.join(',')} FROM cs_os_workshop WHERE cs_status = 1`);
//     const [dayTypeData] = await pool.query(`SELECT ${day_type.join(',')} FROM cs_os_reg_daytype WHERE cs_status = 1 ORDER BY cs_reg_daytype_id ASC`);
//     const [customData] = await pool.query(`SELECT ${custom_data.join(',')} FROM cs_os_field_option WHERE cs_status = 1`);
//     const [ticketData] = await pool.query(`SELECT ${ticket.join(',')} FROM cs_reg_tickets WHERE ticket_visibility = 1`);
//     const [addonData] = await pool.query(`SELECT ${addon.join(',')} FROM cs_reg_add_ons WHERE addon_status = 1`);

//     // Construct the response object
//     const responseData = {
//       // facilityType: facilitytypeData,
//       prefix: prefixData,
//       country: countryData,
//       states: statesData,
//       regCategory: regCatData,
//       workshop: workshopData,
//       dayType: dayTypeData,
//       ticket: ticketData,
//       addon: addonData,
//       custom: customData
//     };

//     // Send the response containing data from all queries
//     res.json(responseData);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });


router.get('/getDropdownData', verifyToken, async (req, res) => {

  console.log("getDropdownData");
  try {
    // Specify the columns you want to fetch from each table
    const facilitytype = ['cs_type'];
    const prefix = ['cs_prefix', 'cs_prefix_id'];
    const country = ['cs_country', 'cs_country_id'];
    const states = ['cs_state_name', 'cs_state_id', 'cs_country_id'];
    const reg_cat = ['cs_reg_category', 'cs_reg_cat_id'];
    const work_cat = ['cs_workshop_name', 'cs_workshop_id'];
    const day_type = ['cs_reg_daytype_name', 'cs_reg_daytype_id'];
    const ticket = ['ticket_id', 'ticket_title', 'ticket_type', 'ticket_category', 'ticket_ispaid', 'ticket_type', 'ticket_count', 'ticket_description'];
    const addon = ['addon_id', 'addon_title', 'addon_ticket_ids', 'addon_cat_type', 'addon_workshop_id', 'addon_accper_type', '	addon_accper_limit', 'addon_type', 'addon_count', 'addon_ispaid', 'addon_workshoprtype_id'];
    const paymenttype = ['paymenttype_id', 'paymenttype_name'];
    const paymentstatus = ['paymentstatus_id', 'paymentstatus_name'];
    const ticketAmount = ['ticket_id', 'tick_amount', 'tick_duration_start_date', 'tick_duration_till_date'];
    const addonAmount = ['addon_id', 'addon_amount'];
    const processingFeesQuery = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Processing fee in %"`;
    const facultytype = ['type_title', 'facultytype_id'];
    const exhibitor = ['exh_name', 'exh_id'];
    const currency = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "currency"`;
    const processinginclded = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "processing_fee_IncludeExclude"`;
    const processingfeeornot = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "processing_fees"`;
    const processingfeein = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "processing_fees_in"`;
    const gstinclded = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "GST_Include"`;
    const gstfee = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "GST"`;
    const IGSTfee = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "IGST"`;
    const paymentmode = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Payment_mode"`;
    const workshop_type = ['workshoptype_name', 'id'];





    // Execute each query to fetch data from respective tables
    const [facilitytypeData] = await pool.query(`SELECT ${facilitytype.join(',')} FROM cs_os_facilitytype`);
    const [prefixData] = await pool.query(`SELECT ${prefix.join(',')} FROM cs_os_name_prefixes`);
    const [countryData] = await pool.query(`SELECT ${country.join(',')} FROM cs_tbl_country`);
    // const [statesData] = await pool.query(`SELECT ${states.join(',')} FROM cs_tbl_states`);
    const [statesData] = await pool.query(
      `SELECT ${states.join(',')} 
       FROM cs_tbl_states 
       WHERE cs_country_id = 101
       ORDER BY cs_state_name ASC`
    );
    // const [regCatData] = await pool.query(`SELECT ${reg_cat.join(',')} FROM cs_os_category WHERE cs_status = 1`);
    const [regCatData] = await pool.query(`SELECT ${reg_cat.join(',')} FROM cs_os_category WHERE cs_status = 1 AND cs_show_conference_form = 1`);
    const [workshopData] = await pool.query(`SELECT ${work_cat.join(',')} FROM cs_os_workshop WHERE cs_status = 1`);
    const [dayTypeData] = await pool.query(`SELECT ${day_type.join(',')} FROM cs_os_reg_daytype WHERE cs_status = 1 ORDER BY cs_reg_daytype_id ASC`);
    const [customData] = await pool.query(`SELECT cs_field_option, cs_field_option_value, cs_field_option_id, cs_field_id FROM cs_os_field_option WHERE cs_status = 1`);
    const [ticketData] = await pool.query(`SELECT ${ticket.join(',')} FROM cs_reg_tickets WHERE ticket_visibility = 1`);
    const [addonData] = await pool.query(`SELECT ${addon.join(',')} FROM cs_reg_add_ons WHERE addon_visiblility = 1`);
    const [paymentTypeData] = await pool.query(`SELECT ${paymenttype.join(',')} FROM cs_reg_payment_type WHERE status = 1`);
    const [paymentStatusData] = await pool.query(`SELECT ${paymentstatus.join(',')} FROM cs_reg_payment_status WHERE status = 1`);
    const [workshoptypeData] = await pool.query(`SELECT ${workshop_type.join(',')} FROM cs_os_workshop_type WHERE cs_status = 1`);
    const [timezoneData] = await pool.query(`SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Time Zone"`);
    // Assuming `ticketAmount` is an array of columns you want to select
    const currentDate = new Date(); // Get the current date
    const AdminTimezone = timezoneData[0]?.cs_value;
    console.log("Timezone", AdminTimezone);

    // Format current date in AdminTimezone
    const formattedCurrentDate = moment().tz(AdminTimezone).format('YYYY-MM-DD');
    console.log("Date", formattedCurrentDate);

    const [ticketAmountData] = await pool.query(`
      SELECT ${ticketAmount.join(', ')} 
      FROM cs_reg_ticket_duration 
      WHERE tick_duration_start_date <= ? 
      AND tick_duration_till_date >= ? 
      AND Status = 1
    `, [formattedCurrentDate, formattedCurrentDate]);

    // console.log(ticketAmountData);

    // const [addonAmountData] = await pool.query(`SELECT ${addonAmount.join(',')} FROM cs_reg_addon_duration WHERE status = 1`);

    const [addonAmountData] = await pool.query(`
      SELECT ${addonAmount.join(', ')} 
      FROM cs_reg_addon_duration 
      WHERE addon_duration_start_date <= ? 
      AND 	addon_duration_till_date >= ? 
      AND Status = 1
    `, [formattedCurrentDate, formattedCurrentDate]);

    console.log(addonAmountData);
    const [processingFeesData] = await pool.query(processingFeesQuery);
    const [facultytypeData] = await pool.query(`SELECT ${facultytype.join(',')} FROM cs_app_facultytype WHERE status = 1`);
    const [exhibitorData] = await pool.query(`SELECT ${exhibitor.join(',')} FROM cs_app_exhibitor WHERE status = 1`);
    const [processingincldedData] = await pool.query(processinginclded);
    const [CurrencyData] = await pool.query(currency);
    const [processingfeeornotData] = await pool.query(processingfeeornot);
    const [gstincldedData] = await pool.query(gstinclded);
    const [gstfeeData] = await pool.query(gstfee);
    const [processingfeeinData] = await pool.query(processingfeein);
    const [gstamount] = await pool.query(IGSTfee);
    const [paymentmodeData] = await pool.query(paymentmode);


    console.log("regCatData", regCatData);

    // Construct the response object
    const responseData = {
      // facilityType: facilitytypeData, // Uncomment if needed
      prefix: prefixData,
      country: countryData,
      states: statesData,
      regCategory: regCatData,
      workshop: workshopData,
      dayType: dayTypeData,
      ticket: ticketData,
      addon: addonData,
      custom: customData,
      paymentType: paymentTypeData,
      paymentStatus: paymentStatusData,
      ticketAmount: ticketAmountData,
      addonAmount: addonAmountData,
      processingFees: processingFeesData, // Added processing fees to response
      facultytype: facultytypeData,
      exhibitor: exhibitorData,
      currency: CurrencyData,
      gstfee: gstfeeData,
      gstinclded: gstincldedData,
      processingfeein: processingfeeinData,
      processinginclded: processingincldedData,
      processingfeeornot: processingfeeornotData,
      gstamount: gstamount,
      paymentmode: paymentmodeData,
      workshoptype: workshoptypeData

    };

    // Send the response containing data from all queries
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching dropdown data:', error); // More descriptive logging
    res.status(500).json({ message: 'Internal server error' });
  }
});


// router.post('/addUser', verifyToken, upload, async (req, res) => {
//   try {
//     const { userid, ...userData } = req.body; // Extract userid and userData
//     console.log('Request Body:', req.body);
//     console.log('Files Uploaded:', req.files); // Log uploaded files

//     // Check if userid is provided
//     if (!userid) {
//       return res.status(400).json({ success: false, message: 'User ID is required' });
//     }

//     // Handle file uploads and store paths in documentPaths
//     let documentPaths = {};
//     if (req.files['cs_document1']) documentPaths.cs_document1 = path.basename(req.files['cs_document1'][0].path);
//     if (req.files['cs_document2']) documentPaths.cs_document2 = path.basename(req.files['cs_document2'][0].path);
//     if (req.files['cs_document3']) documentPaths.cs_document3 = path.basename(req.files['cs_document3'][0].path);
//     if (req.files['cs_document4']) documentPaths.cs_document4 = path.basename(req.files['cs_document4'][0].path);
//     if (req.files['cs_document5']) documentPaths.cs_document5 = path.basename(req.files['cs_document5'][0].path);

//     // Combine userData and documentPaths
//     const updateData = { ...userData, ...documentPaths };

//     if (Array.isArray(updateData.cs_workshop_category)) {
//       // Filter out empty values from the array and take the first valid value
//       updateData.cs_workshop_category = updateData.cs_workshop_category.filter(Boolean)[0] || '';
//     }

//     // Retrieve cs_reg_cat_id based on cs_reg_category
//     const [categoryResult] = await pool.query(
//       'SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?',
//       [userData.cs_reg_category]
//     );

//     console.log('Category Result:', categoryResult);

//     // Check if categoryResult is empty
//     if (categoryResult.length === 0) {
//       return res.status(404).json({ success: false, message: 'Category not found' });
//     }

//     const csRegCat = categoryResult[0].cs_reg_category;

//     // Add cs_reg_cat_id and cs_reg_category to updateData
//     updateData.cs_reg_cat_id = userData.cs_reg_category;
//     updateData.cs_reg_category = csRegCat;

//     // Filter out empty values from updateData
//     const filteredUpdateData = Object.fromEntries(Object.entries(updateData).filter(([_, v]) => v !== ''));

//     console.log('Filtered Update Data:', filteredUpdateData);

//     // Update user data in the database
//     const updateUserQuery = `UPDATE cs_os_users SET ? WHERE id = ?`;
//     const [updateResult] = await pool.query(updateUserQuery, [filteredUpdateData, userid]);

//     if (updateResult.affectedRows === 0) {
//       return res.status(404).json({ success: false, message: 'No user found with the provided ID' });
//     }

//     res.status(200).json({ success: true, message: 'User updated successfully', data: filteredUpdateData });
//   } catch (error) {
//     console.error('Error updating user:', error);
//     res.status(500).json({ success: false, message: 'Error updating user', error: error.message });
//   }
// });


// router.post('/storePayment', verifyToken, async (req, res) => {
//   try {
//     const { userId, amount, currency, paymenttype_id, addon_fees, conference_fees } = req.body;

//     // Validate input data
//     if (!userId || !amount || !currency || !paymenttype_id) {
//       return res.status(400).json({ success: false, message: "Missing required payment data" });
//     }

//     // Prepare payment data for insertion
//     const paymentData = {
//       user_id: userId,
//       amount,
//       currency,
//       paymenttype_id,
//       addon_fees: addon_fees || 0, // Default to 0 if not provided
//       conference_fees: conference_fees || 0, // Default to 0 if not provided
//       created_at: new Date(),
//       updated_at: new Date(),
//     };

//     // Insert payment data into cs_reg_temp_payment table
//     const insertPaymentQuery = `
//         INSERT INTO cs_reg_temp_payment (
//           user_id, current_paid_amount, currency, paymenttype_id, addon_fees, conference_fees,
//           created_at, updated_at
//         ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
//       `;

//     const insertValues = [
//       paymentData.user_id,
//       paymentData.amount,
//       paymentData.currency,
//       paymentData.paymenttype_id,
//       paymentData.addon_fees,
//       paymentData.conference_fees,
//     ];

//     const [result] = await pool.query(insertPaymentQuery, insertValues);
//     const temppaymentId = result.insertId;

//     res.status(200).json({ success: true, message: "Payment details stored successfully.", temppaymentId });
//   } catch (error) {
//     console.error('Error storing payment:', error);
//     res.status(500).json({ success: false, message: "Error storing payment", error: error.message });
//   }
// });

router.post('/addUser', verifyToken, upload.fields([
  { name: 'photo', maxCount: 1 }, { name: 'resume', maxCount: 1 }
]), async (req, res) => {
  try {
    const { userid, accompany_person_data, facultyDetails, ...userData } = req.body; // Extract the accompanying person data
    console.log('Request Body:', req.body);
    console.log('Files Uploaded:', req.files); // Log uploaded files

    const photo = req.files.photo ? req.files.photo[0].path : null;
    const resume = req.files.resume ? req.files.resume[0].path : null;

    console.log('Profile', photo);
    console.log('CV', resume);


    // Check if userid is provided
    if (!userid) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Handle file uploads and store paths in documentPaths
    let documentPaths = {};
    if (req.files['cs_document1']) documentPaths.cs_document1 = path.basename(req.files['cs_document1'][0].path);
    if (req.files['cs_document2']) documentPaths.cs_document2 = path.basename(req.files['cs_document2'][0].path);
    if (req.files['cs_document3']) documentPaths.cs_document3 = path.basename(req.files['cs_document3'][0].path);
    if (req.files['cs_document4']) documentPaths.cs_document4 = path.basename(req.files['cs_document4'][0].path);
    if (req.files['cs_document5']) documentPaths.cs_document5 = path.basename(req.files['cs_document5'][0].path);

    console.log("userData", userData);

    // Combine userData and documentPaths

    const updateData = { ...userData, ...documentPaths };

    delete updateData.photo;
    delete updateData.resume;

    console.log("updateData", updateData);

    if (Array.isArray(updateData.cs_workshop_category)) {
      // Filter out empty values from the array and take the first valid value
      updateData.cs_workshop_category = updateData.cs_workshop_category.filter(Boolean)[0] || '';
    }

    // Retrieve cs_reg_cat_id based on cs_reg_category
    const [categoryResult] = await pool.query(
      'SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?',
      [userData.cs_reg_category]
    );

    console.log('Category Result:', categoryResult);

    // Check if categoryResult is empty
    if (categoryResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const csRegCat = categoryResult[0].cs_reg_category;

    // Add cs_reg_cat_id and cs_reg_category to updateData
    updateData.cs_reg_cat_id = userData.cs_reg_category;
    updateData.cs_reg_category = csRegCat;

    // Filter out empty values from updateData
    const filteredUpdateData = Object.fromEntries(Object.entries(updateData).filter(([_, v]) => v !== ''));

    console.log('Filtered Update Data:', filteredUpdateData);

    // Update user data in the database
    const updateUserQuery = `UPDATE cs_os_users 
    SET ?, 
        \`cs_module\` = ?, 
        \`cs_source\` = ? 
    WHERE id = ?`;
    const [updateResult] = await pool.query(updateUserQuery, [filteredUpdateData, 1, 1, userid]);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'No user found with the provided ID' });
    }

    console.log('Received accompany_person_data:', accompany_person_data);

    // Step 1: Parse the string into an object
    let parsedData;
    try {
      parsedData = JSON.parse(accompany_person_data);
    } catch (error) {
      console.error('Error parsing accompany_person_data:', error);
      return res.status(400).json({ message: 'Invalid JSON format for accompany_person_data' });
    }

    console.log('Parsed Data:', parsedData);

    // Step 2: Extract the array of people using the first key dynamically
    const firstKey = Object.keys(parsedData)[0];  // Get the first key (e.g., "18")
    const personArray = parsedData[firstKey];  // Get the array associated with that key

    console.log('Extracted personArray:', personArray);

    if (Array.isArray(personArray)) {
      // Step 3: Process each person in the array
      personArray.forEach(person => {
        // Here, you get each person's name and age
        console.log('Person:', person);

        // If you want to process or store the data, you can now map this information
        const accperData = {

          accper_name: person.name,
          accper_age: person.age || null, // Handle if age is missing
        };

        console.log('Mapped accperData:', accperData);

        // Optionally, you can insert this data into the database or process it as needed
        // For example, if you're inserting this data:
        const insertAccperQuery = 'INSERT INTO cs_reg_accper (user_id,accper_name, accper_age) VALUES ?';
        const insertData = [[userid, accperData.accper_name, accperData.accper_age]];

        console.log('Data to insert into the database:', insertData);

        try {
          // Insert into the database (example using a pool)
          pool.query(insertAccperQuery, [insertData]);
          console.log('Accompanying person inserted:', accperData);
        } catch (error) {
          console.error('Error inserting accompanying person:', error);
        }
      });

      // return res.status(200).json({ message: 'Accompanying persons processed successfully' });
    } else {
      console.log('Expected personArray, but found:', personArray);
      // return res.status(400).json({ message: 'No valid array of persons found in the parsed data' });
    }

    const faculty = req.body.facultyDetails ? JSON.parse(req.body.facultyDetails) : {};

    if (faculty && Object.keys(faculty).length > 0) {
      try {
        // Extract faculty data from the request body
        const facultyValues = [];
        const facultyColumns = [];

        // Fetch the maximum faculty order to assign the new order
        const [result] = await pool.query(`SELECT MAX(faculty_order) AS maxOrder FROM cs_app_faculties`);
        const maxOrder = result[0].maxOrder || 0;
        const newOrder = maxOrder + 1;

        // Add user_id and faculty_order to the columns and values
        facultyColumns.push('user_id', 'faculty_order');
        facultyValues.push(userid, newOrder);

        // Check if photo and resume are present, and add them only if they exist
        if (photo) {
          facultyColumns.push('photo');
          facultyValues.push(photo);
        }

        if (resume) {
          facultyColumns.push('resume');
          facultyValues.push(resume);
        }

        // Add the rest of the faculty data
        for (const [key, value] of Object.entries(faculty)) {
          facultyColumns.push(key);
          facultyValues.push(value);
        }

        // Prepare the SQL query
        const facultyInsertQuery = `
          INSERT INTO cs_app_faculties (${facultyColumns.join(', ')})
          VALUES (${facultyColumns.map(() => '?').join(', ')})
        `;

        // Execute the query
        await pool.query(facultyInsertQuery, facultyValues);
        console.log("Faculty Insert Result:", facultyValues); // Log faculty insert result

      } catch (facultyError) {
        console.error('Error inserting faculty data:', facultyError);
        return res.status(500).json({ error: 'Error inserting faculty data' });
      }
    }
    res.status(200).json({ success: true, message: 'User updated successfully', data: filteredUpdateData });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Error updating user', error: error.message });
  }
});


router.post('/storePayment', verifyToken, async (req, res) => {
  try {
    const {
      userId, amount, currency, paymenttype_id, conference_fees, cheque_no, bank, branch,
      payment_date, processing_fee, payment_mode
    } = req.body;

    // Validate required input data
    if (!userId || !amount || !currency || !paymenttype_id) {
      return res.status(400).json({ success: false, message: "Missing required payment data" });
    }

    // Prepare payment data for insertion
    const paymentData = {
      user_id: userId,
      current_paid_amount: amount,
      currency,
      paymenttype_id,
      conference_fees: conference_fees || 0, // Default to 0 if not provided
      cheque_no: cheque_no || null,
      bank: bank || null,
      branch: branch || null,
      payment_date: payment_date || new Date(),
      processing_fee: processing_fee || null,
      payment_mode: payment_mode || null,
    };
    let confirm_payment = 0
    let mem_app_date = null;
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Format to 'YYYY-MM-DD HH:MM:SS'

    if (paymentData.payment_mode == "offline") {
      confirm_payment = 1;
      mem_app_date = currentDate;

    } else {
      confirm_payment = 0;
    }

    // Insert payment data into cs_as_temp_payment table
    const insertPaymentQuery = `
      INSERT INTO cs_reg_temp_payment (
        user_id, current_paid_amount, currency, paymenttype_id, conference_fees, cheque_no, bank,
        branch, payment_date, processing_fee, payment_mode,confirm_payment, paymentstatus_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,?,? )
    `;

    const insertValues = [
      paymentData.user_id,
      paymentData.current_paid_amount,
      paymentData.currency,
      paymentData.paymenttype_id,
      paymentData.conference_fees,
      paymentData.cheque_no,
      paymentData.bank,
      paymentData.branch,
      paymentData.payment_date,
      paymentData.processing_fee,
      paymentData.payment_mode,
      confirm_payment,
      '1'
    ];

    // Execute the SQL query
    const [result] = await pool.query(insertPaymentQuery, insertValues);
    const temppaymentId = result.insertId;


    if (confirm_payment === 1) {
      const updateUserQuery = `
        UPDATE cs_os_users 
        SET cs_apply_date = ? 
        WHERE id = ?
      `;
      await pool.query(updateUserQuery, [mem_app_date, paymentData.user_id]);
    }
    if (paymentData.payment_mode == "offline") {


      const [userRow] = await pool.query('SELECT * FROM cs_os_users WHERE id = ?', [paymentData.user_id]);
      console.log("userRow", userRow);
      if (userRow.length > 0) {
        await sendConfirmEmail(userRow[0]);

        // Update cs_confirmmail to 1 after successfully sending the email

        console.log("cs_confirmmail updated successfully for UserId:", paymentData.user_id); // Log success
      }

    }

    res.status(200).json({ success: true, message: "Payment details stored successfully.", temppaymentId });
  } catch (error) {
    console.error('Error storing payment:', error);
    res.status(500).json({ success: false, message: "Error storing payment", error: error.message });
  }
});




const sendConfirmEmail = async (userData, userId) => {
  console.log("USer Data", userData);
  const templateQuery = `SELECT template_content, template_subject FROM cs_tbl_email_template WHERE template_id = ?`;
  const [templateData] = await pool.query(templateQuery, [1]);

  if (!templateData || templateData.length === 0) {
    console.log("No email template found");
    throw new Error('No email template found');
  }

  const userEmail = userData.cs_email;
  if (!userEmail) {
    console.log("User email is not defined");
    throw new Error('User email is not defined');
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
    cc: process.env.GMAIL_CC,
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


// router.post('/processPayment', async (req, res) => {
//   try {
//     const { paymentData } = req.body;

//     if (!paymentData) {
//       return res.status(400).json({ success: false, message: "Missing payment data" });
//     }



//     // Step 1: Generate txnid (unique transaction id)
//     const txnid = 'TXN' + new Date().getTime(); // Example: Generate a unique transaction ID

//     // Step 2: Prepare payment data for PayU
//     const payUData = {
//       key: PAYU_MERCHANT_KEY,
//       txnid: txnid,
//       amount: paymentData.amount, // Amount to charge
//       productinfo: paymentData.productinfo, // Description of the product or service
//       firstname: paymentData.firstname, // User's first name
//       email: paymentData.email, // User's email
//       phone: paymentData.phone, // User's phone
//       udf1: paymentData.userId,
//       udf2: paymentData.temppaymentId,
//       surl: process.env.SURL,
//       furl: process.env.FURL, // Failure URL where PayU will redirect
//       // service_provider: 'payu_paisa', // Required for PayU
//     };

//     // Step 3: Generate PayU Hash
//     const hash = generatePayUHash(payUData, PAYU_MERCHANT_KEY, PAYU_MERCHANT_SALT);
//     payUData.hash = hash;

//     // Step 4: Redirect or send a response to the frontend with PayU form
//     return res.status(200).json({
//       success: true,
//       paymentUrl: process.env.PAYU_BASE_URL,
//       payUData,
//     });

//   } catch (error) {
//     console.error('Error processing payment:', error);
//     res.status(500).json({ success: false, message: "Error processing payment", error: error.message });
//   }
// });


router.post('/processPayment', async (req, res) => {
  try {
    const { paymentData } = req.body;

    console.log("req.body", req.body);

    if (!paymentData) {
      return res.status(400).json({ success: false, message: "Missing payment data or payment gateway selection" });
    }

    // Step 1: Fetch payment-related settings from the database
    const query = `SELECT cs_parameter, cs_value FROM cs_tbl_sitesetting 
       WHERE cs_parameter = 'payment_gateway'`;

    const [rows] = await pool.query(query);

    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: "Payment gateway configuration not found" });
    }

    // Transform result to a key-value pair object
    const paymentDetails = {};
    rows.forEach(row => {
      paymentDetails[row.cs_parameter] = row.cs_value;
    });

    const paymentGateway = paymentDetails.payment_gateway;

    console.log(paymentGateway);

    if (paymentGateway === 'PayU') {
      // PayU Payment Handling
      const txnid = 'TXN' + new Date().getTime(); // Unique transaction ID for PayU

      const payUData = {
        key: PAYU_MERCHANT_KEY,
        txnid: txnid,
        amount: paymentData.amount, // Amount to charge
        productinfo: paymentData.productinfo, // Product/service description
        firstname: paymentData.firstname, // User's first name
        email: paymentData.email, // User's email
        phone: paymentData.phone, // User's phone
        udf1: paymentData.userId,
        udf2: paymentData.temppaymentId,
        surl: process.env.SURL, // Success URL
        furl: process.env.FURL, // Failure URL
      };

      // Step 3: Generate PayU Hash
      const hash = generatePayUHash(payUData, PAYU_MERCHANT_KEY, PAYU_MERCHANT_SALT);
      payUData.hash = hash;

      return res.status(200).json({
        success: true,
        paymentGateway: 'PayU',
        paymentUrl: PAYU_BASE_URL,
        payUData,
      });
    } else if (paymentGateway === 'Razorpay') {
      // Razorpay Payment Handling
      const options = {
        amount: paymentData.amount * 100, // Amount in paise
        currency: 'INR',
        receipt: 'RCPT' + new Date().getTime(), // Unique receipt ID
        notes: {
          productinfo: paymentData.productinfo,
          userId: paymentData.userId,
          temppaymentId: paymentData.temppaymentId,
        },
      };

      const order = await razorpay.orders.create(options);

      return res.status(200).json({
        success: true,
        paymentGateway: 'Razorpay',
        payUData: {
          key: RAZORPAY_KEY_ID,
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          productinfo: paymentData.productinfo,
          firstname: paymentData.firstname,
          email: paymentData.email,
          phone: paymentData.phone,
        },
      });
    } else {
      return res.status(400).json({ success: false, message: "Invalid payment gateway selected" });
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ success: false, message: "Error processing payment", error: error.message });
  }
});




router.post('/confirmPayment', async (req, res) => {
  try {
    // Extract the PayU response parameters from the request body
    const {
      mihpayid, status, txnid, amount, email, firstname, phone, productinfo,
      net_amount_debit, addedon, payment_source, bank_ref_num, udf1, udf2
    } = req.body;

    // Check if the payment was successful
    if (status === 'success') {
      // Step 1: Fetch the corresponding temporary payment data
      const [tempPaymentRows] = await pool.query(`
        SELECT user_id, currency, processing_fee, payment_mode, paymenttype_id,paymentstatus_id FROM cs_reg_temp_payment WHERE temppayment_id = ?
      `, [udf2]);

      if (tempPaymentRows.length === 0) {
        return res.status(400).json({ success: false, message: "Transaction not found in temp payment records." });
      }

      const userId = tempPaymentRows[0].user_id;
      const currency = tempPaymentRows[0].currency;
      const processing_fee = tempPaymentRows[0].processing_fee;
      const payment_mode = tempPaymentRows[0].payment_mode;
      const paymenttype_id = tempPaymentRows[0].paymenttype_id;
      const paymentstatus_id = tempPaymentRows[0].paymentstatus_id;

      console.log(payment_mode);

      const updateTempQuery = `
      UPDATE cs_reg_temp_payment 
      SET confirm_payment = 1, tracking_id = ? 
      WHERE temppayment_id = ?
    `;
      await pool.query(updateTempQuery, [mihpayid, udf2]);

      const [userRows] = await pool.query(`
      SELECT * FROM cs_os_users WHERE id = ?
    `, [userId]);

      if (userRows.length === 0) {
        return res.status(400).json({ success: false, message: "User not found in cs_os_users." });
      }

      const userData = userRows[0]; // Contains the data of the user
      console.log("User Data:", userData); // Log the user data

      const [ticketRows] = await pool.query(`
      SELECT * FROM cs_reg_tickets WHERE ticket_id = ?
    `, [userData.cs_ticket]);

      if (ticketRows.length === 0) {
        return res.status(400).json({ success: false, message: "Ticket not found in cs_reg_tickets." });
      }

      const ticketData = ticketRows[0];
      console.log("Ticket Data:", ticketData);

      if (ticketData.ticket_isapprove_by_admin !== "1") {


        const insertPaymentQuery = `
        INSERT INTO cs_reg_payment (
          user_id, temppayment_id, tracking_id, total_paid_amount, current_paid_amount, payment_date, currency, processing_fee, payment_mode, paymenttype_id, paymentstatus_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

        const paymentValues = [
          userId, udf2, mihpayid, amount, net_amount_debit, addedon, currency, processing_fee, payment_mode, paymenttype_id, paymentstatus_id // This should indicate the payment status
        ];

        await pool.query(insertPaymentQuery, paymentValues);

        // Fetch the last registration number from the site settings
        const siteSettingResult = await pool.query('SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Admin Reg Start Number"');
        let lastRegNo = siteSettingResult.length > 0 ? parseInt(siteSettingResult[0][0].cs_value, 10) : 0;
        console.log("Last Registration Number:", lastRegNo); // Log last registration number

        // Check if the incremented regNo already exists
        let regNoExists = true;
        while (regNoExists) {
          const existingRegNoResult = await pool.query('SELECT COUNT(*) AS count FROM cs_os_users WHERE cs_regno = ?', [lastRegNo]);
          const existingRegNoCount = existingRegNoResult[0][0].count || 0;
          console.log('Existing Registration Number Count:', existingRegNoCount); // Log count of existing registration numbers
          if (existingRegNoCount > 0) {
            lastRegNo++;
          } else {
            regNoExists = false;
          }
        }

        let regNo = lastRegNo;
        console.log("New Registration Number:", regNo); // Log new registration number

        // Step 3: Update the user status in cs_os_users
        const updateUserQuery = `UPDATE cs_os_users SET cs_regno = ?, cs_isconfirm = ? WHERE id = ?`;
        await pool.query(updateUserQuery, [regNo, 1, userId]);
      }

      // Step 4: Redirect to the success page on the frontend
      res.redirect(`https://projects.consoftservices.com/user/confirm-payment/Consoft?txnid=${txnid}&amount=${amount}&status=${status}`);

    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ success: false, message: "Error confirming payment", error: error.message });
  }
});


async function mapRegCategory(userData) {
  if (userData.cs_reg_category) {
    const { cs_reg_category, cs_reg_cat_id } = await getRegCategoryAndId(userData.cs_reg_category);
    if (cs_reg_category && cs_reg_cat_id) {
      userData.cs_reg_category = cs_reg_category;
      userData.cs_reg_cat_id = cs_reg_cat_id;
    }
  }
}

async function getRegCategoryAndId(regCategoryId) {
  try {
    // Perform a query to fetch both cs_reg_category and cs_reg_cat_id from cs_os_category table
    const [result] = await pool.query('SELECT cs_reg_category, cs_reg_cat_id FROM cs_os_category WHERE cs_reg_cat_id = ?', [regCategoryId]);
    if (result && result.length > 0) {
      return { cs_reg_category: result[0].cs_reg_category, cs_reg_cat_id: result[0].cs_reg_cat_id };
    }
    return { cs_reg_category: null, cs_reg_cat_id: null }; // If values not found for given ID
  } catch (error) {
    console.error('Error fetching cs_reg_category and cs_reg_cat_id:', error);
    throw error;
  }
}

async function mapFieldById(userData, fieldName, tableName, idColumnName, valueColumnName) {
  if (userData[fieldName]) {
    const value = await getValueById(tableName, idColumnName, valueColumnName, userData[fieldName]);
    if (value) {
      userData[fieldName] = value;
    }
  }
}

async function getValueById(tableName, idColumnName, valueColumnName, id) {
  try {
    // Perform a query to fetch value from the specified table based on the provided ID
    const [result] = await pool.query(`SELECT ${valueColumnName} FROM ${tableName} WHERE ${idColumnName} = ?`, [id]);
    if (result && result.length > 0) {
      return result[0][valueColumnName];
    }
    return null; // If value not found for given ID
  } catch (error) {
    console.error(`Error fetching value from ${tableName}:`, error);
    throw error;
  }
}


async function mapRegCategory(userDataWithFields) {
  if (userDataWithFields.cs_reg_category) {
    try {
      const { cs_reg_category, cs_reg_cat_id } = await getRegCategoryAndId(userDataWithFields.cs_reg_category);
      console.log('Returned category and ID:', cs_reg_category, cs_reg_cat_id); // Log the returned values
      if (cs_reg_category && cs_reg_cat_id) {
        userDataWithFields.cs_reg_category = cs_reg_category;
        userDataWithFields.cs_reg_cat_id = cs_reg_cat_id;
      }
    } catch (error) {
      console.error('Error mapping registration category:', error); // Log any errors
    }
  }
}


router.get('/getConfirmField', verifyToken, async (req, res) => {
  try {
    const columnsToFetch = 'cs_os_field_data.*, cs_os_field_type.field_type_name';

    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
    SELECT ${columnsToFetch}
    FROM cs_os_field_data
    LEFT JOIN cs_os_field_type ON cs_os_field_data.cs_field_type = cs_os_field_type.cs_field_type
    WHERE cs_os_field_data.cs_status = 1 AND cs_visible_reg_confirmform = 1 AND cs_visible_reg_userform = 1
    ORDER BY cs_field_order; 
`;


    const [fieldData] = await pool.query(query);

    const settingquery = `
    SELECT cs_parameter, cs_value
    FROM cs_tbl_sitesetting
    WHERE cs_parameter IN ('Event Name', 'Event Start Date')
`;

    // Execute the query to fetch setting data
    const [rows] = await pool.query(settingquery);

    // Map results to the desired format
    const settingData = {
      event_name: rows.find(row => row.cs_parameter === 'Event Name')?.cs_value || null,
      event_start_date: rows.find(row => row.cs_parameter === 'Event Start Date')?.cs_value || null,
    };

    // Send the field data as a response
    res.json({ Fields: fieldData, settingData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/getDiscount', async (req, res) => {
  const { discount_code } = req.query;

  try {
    // Query to check if the promo code exists and is within the valid date range
    const [result] = await pool.execute(
      `SELECT * FROM cs_reg_discounts 
       WHERE discount_code = ? 
       AND status = 1 
       AND discount_start_datetime <= NOW() 
       AND discount_end_datetime >= NOW()`,
      [discount_code]
    );

    if (result.length > 0) {
      // Promo code is valid and within the date range
      res.status(200).json(result[0]);
    } else {
      // Promo code is invalid or outside the date range
      res.status(404).json({ message: 'Invalid promo code or not valid at this time.' });
    }
  } catch (error) {
    console.error('Error fetching discount:', error);
    res.status(500).json({ message: 'An error occurred while retrieving discount data.' });
  }
});

router.get('/useddicountemails', async (req, res) => {
  try {
    // Query to get all data from cs_reg_discount_log table
    const query = `SELECT * FROM cs_reg_discount_log`;

    const [fieldData] = await pool.query(query);

    // Send the field data as a response
    res.json({ Fields: fieldData });
  } catch (error) {
    console.error('Error fetching discount log:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/getconfirmusers', verifyToken, async (req, res) => {
  try {
    const query = 'SELECT cs_addons,cs_ticket FROM cs_os_users WHERE cs_ticket IS NOT NULL AND cs_ticket != ""';

    // Use async/await with promise-based query
    const [results] = await pool.query(query);  // This returns an array with the query results in the first element

    res.status(200).json(results);  // Send back the results to the frontend
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ message: 'Error fetching user tickets' });
  }
});




//Certificate APIs 


router.get('/getCertFeedbackData', async (req, res) => {
  try {
    // Query to fetch cs_value for id 38 from cs_tbl_sitesetting table
    const query = "SELECT cs_parameter,cs_value FROM cs_tbl_sitesetting WHERE cs_parameter IN ('certificate', 'certificate_with_feedback', 'feedback_form', 'user_panel')";

    // Execute the query
    const [results] = await pool.query(query);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Settings not found' });
    }

    //   const csValue = results.cs_value;
    res.json({ setting: results });
  } catch (error) {
    console.error('Error fetching settings value:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



router.post('/searchCertificate', async (req, res) => {
  const { regNo, name, searchType } = req.body;

  // Build the search query dynamically
  let query = 'SELECT * FROM cs_os_users WHERE 1=1';
  let queryParams = [];

  // Handle search by Registration Number
  if (searchType === 'regNo' && regNo) {
    query += ' AND cs_regno LIKE ?';
    queryParams.push(`%${regNo}%`);
  }

  // Handle search by Name
  if (searchType === 'name' && name) {
    const [firstName, lastName] = name.split(' ');
    if (firstName) {
      query += ' AND cs_first_name LIKE ?';
      queryParams.push(`%${firstName}%`);
    }
    if (lastName) {
      query += ' AND cs_last_name LIKE ?';
      queryParams.push(`%${lastName}%`);
    }
  }

  // Optional: Debug the final query and parameters
  console.log('Executing query:', query);
  console.log('With parameters:', queryParams);

  try {
    // Execute the query and retrieve rows
    const [rows] = await pool.execute(query, queryParams);

    // Debugging: Log the retrieved rows
    console.log('Retrieved rows:', rows);

    if (rows.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Data found.',
        data: rows, // Return all matched rows
      });
    } else {
      return res.status(200).json({
        success: true,
        message: 'No matching data found.',
        data: [], // Return an empty array for clarity
      });
    }
  } catch (err) {
    console.error('Error executing search query:', err);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing the request.',
      error: err.message,
    });
  }
});



router.post('/getcertfileds', async (req, res) => {
  try {
    const category = req.body.category;
    console.log('Requested category:', category);

    // const categoryQuery = `SELECT cs_reg_cat_id FROM cs_os_category WHERE cs_reg_category = ?`;
    const categoryQuery = `SELECT cs_reg_cat_id FROM cs_os_category WHERE cs_reg_category = ?`;
    const [categoryRows] = await pool.query(categoryQuery, [category]);

    // const workshopQuery = `SELECT cs_workshop_id FROM cs_os_workshop WHERE cs_reg_category = ?`;
    // const [workshopRows] = await pool.query(categoryQuery, [category]);

    if (categoryRows.length === 0) {
      console.error('Category not found');
      return res.status(404).json({ error: 'Category not found. Please provide a valid category.' });
    }

    const cs_reg_cat_id = categoryRows[0].cs_reg_cat_id;

    const badgeQuery = `SELECT cs_cert_id, cs_cert_width, cs_cert_height, orientation  FROM cs_os_cert_template WHERE cs_reg_cat_id = ?`;
    const [badgeRows] = await pool.query(badgeQuery, [cs_reg_cat_id]);

    if (badgeRows.length === 0) {
      console.error('No Certificate data found for the provided category');
      return res.status(404).json({ error: 'No Certificate data found for the provided category.' });
    }

    const { cs_cert_id, cs_cert_width, cs_cert_height, orientation } = badgeRows[0];
    console.log('Certificate ID:', cs_cert_id);
    console.log('Certificate Width:', cs_cert_width);
    console.log('Certificate Height:', cs_cert_height);
    console.log('Certificate orientation :', orientation);

    const fieldsQuery = `SELECT * FROM cs_os_cert_fields WHERE cs_cert_id = ?`;
    const [fieldsRows] = await pool.query(fieldsQuery, [cs_cert_id]);

    const usersQuery = `SELECT * FROM cs_os_users WHERE cs_reg_cat_id = ? AND cs_isconfirm = 1 `;
    const [usersRows] = await pool.query(usersQuery, [cs_reg_cat_id]);

    const users = usersRows[0];

    console.log(users);

    // if (fieldsRows.length === 0) {
    //     console.error('No badge fields found for the provided badge ID');
    //     return res.status(404).json({ error: 'No badge fields found for the provided badge ID.' });
    // }

    const badgeFields = fieldsRows.map(row => ({
      cs_field_id: row.cs_field_id,
      cs_field_label: row.cs_field_label,
      cs_field_name: row.cs_field_name,
      cs_field_type_id: row.cs_field_type_id,
      cs_field_content: row.cs_field_content,
      cs_field_position_x: row.cs_field_position_x.toString(),
      cs_field_position_y: row.cs_field_position_y.toString(),
      cs_text_size: row.cs_text_size,
      cs_field_color: row.cs_field_color,
      cs_field_alignment: row.cs_field_alignment,
      cs_font: row.cs_font,
      cs_field_weight: row.cs_field_weight,
      cs_field_rotate: row.cs_field_rotate,
      cs_field_width: row.cs_field_width,
      cs_field_height: row.cs_field_height,
      cs_field_order: row.cs_field_order,
      cs_badge_side: row.cs_badge_side,
      cs_status: row.cs_status,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    const responseData = {
      badgedata: {
        width: cs_cert_width,
        height: cs_cert_height,
        orientation: orientation,
        badge_fields: badgeFields
      },
      userData: usersRows, // Assuming you meant to use usersRows instead of users
      message: 'Certificate data retrieved successfully'
    };

    console.log('Response data:', responseData);
    res.json(responseData); // Send the combined responseData object
  } catch (error) {
    console.error('Error fetching badge data:', error);
    res.status(500).json({ error: 'An unexpected error occurred while fetching badge data. Please try again later.' });
  }
});


router.get('/getFeedbackField', async (req, res) => {
  try {
    const columnsToFetch = 'cs_os_cert_field_data.*, cs_os_cert_field_type.field_type_name';

    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
    SELECT ${columnsToFetch}
    FROM cs_os_cert_field_data
    LEFT JOIN cs_os_cert_field_type ON cs_os_cert_field_data.cs_field_type = cs_os_cert_field_type.cs_field_type
    WHERE cs_visible_feedback = 1
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



router.get('/getDropdownDataFeedback', async (req, res) => {
  try {
    // Specify the columns you want to fetch from each table
    const facilitytype = ['cs_type'];
    const prefix = ['cs_prefix', 'cs_prefix_id'];
    const country = ['cs_country', 'cs_country_id'];
    const states = ['cs_state_name', 'cs_state_id', 'cs_country_id'];
    const reg_cat = ['cs_reg_category', 'cs_reg_cat_id'];
    const work_cat = ['cs_workshop_name', 'cs_workshop_id'];
    const day_type = ['cs_reg_daytype_name', 'cs_reg_daytype_id'];
    const ticket = ['ticket_id', 'ticket_title', 'ticket_type', 'ticket_category'];
    const addon = ['addon_id', 'addon_title', 'addon_ticket_ids'];
    const paymenttype = ['paymenttype_id', 'paymenttype_name'];
    const paymentstatus = ['paymentstatus_id', 'paymentstatus_name'];
    const ticketAmount = ['ticket_id', 'tick_amount', 'tick_duration_start_date', 'tick_duration_till_date'];
    const addonAmount = ['addon_id', 'addon_amount'];
    const processingFeesQuery = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Processing fee in %"`;
    const facultytype = ['type_title', 'facultytype_id'];
    const exhibitor = ['exh_name', 'exh_id'];



    // Execute each query to fetch data from respective tables
    const [facilitytypeData] = await pool.query(`SELECT ${facilitytype.join(',')} FROM cs_os_facilitytype`);
    const [prefixData] = await pool.query(`SELECT ${prefix.join(',')} FROM cs_os_name_prefixes`);
    const [countryData] = await pool.query(`SELECT ${country.join(',')} FROM cs_tbl_country`);
    const [statesData] = await pool.query(`SELECT ${states.join(',')} FROM cs_tbl_states`);
    const [regCatData] = await pool.query(`SELECT ${reg_cat.join(',')} FROM cs_os_category WHERE cs_status = 1`);
    const [workshopData] = await pool.query(`SELECT ${work_cat.join(',')} FROM cs_os_workshop WHERE cs_status = 1`);
    const [dayTypeData] = await pool.query(`SELECT ${day_type.join(',')} FROM cs_os_reg_daytype WHERE cs_status = 1 ORDER BY cs_reg_daytype_id ASC`);
    const [customData] = await pool.query(`SELECT cs_field_option, cs_field_option_value, cs_field_option_id, cs_field_id FROM cs_os_cert_field_option WHERE cs_status = 1`);
    const [ticketData] = await pool.query(`SELECT ${ticket.join(',')} FROM cs_reg_tickets WHERE ticket_visibility = 1`);
    const [addonData] = await pool.query(`SELECT ${addon.join(',')} FROM cs_reg_add_ons WHERE addon_visiblility = 1`);
    const [paymentTypeData] = await pool.query(`SELECT ${paymenttype.join(',')} FROM cs_reg_payment_type WHERE status = 1`);
    const [paymentStatusData] = await pool.query(`SELECT ${paymentstatus.join(',')} FROM cs_reg_payment_status WHERE status = 1`);
    const [ticketAmountData] = await pool.query(`SELECT ${ticketAmount.join(',')} FROM cs_reg_ticket_duration WHERE status = 1`);
    // Assuming `ticketAmount` is an array of columns you want to select
    // const currentDate = new Date(); // Get the current date
    // const [ticketAmountData] = await pool.query(`
    //   SELECT ${ticketAmount.join(', ')} 
    //   FROM cs_reg_ticket_duration 
    //   WHERE tick_duration_start_date <= ? 
    //   AND tick_duration_till_date >= ? 
    //   AND Status = 1
    // `, [currentDate, currentDate]);
    const [addonAmountData] = await pool.query(`SELECT ${addonAmount.join(',')} FROM cs_reg_addon_duration WHERE status = 1`);
    const [processingFeesData] = await pool.query(processingFeesQuery);
    const [facultytypeData] = await pool.query(`SELECT ${facultytype.join(',')} FROM cs_app_facultytype WHERE status = 1`);
    const [exhibitorData] = await pool.query(`SELECT ${exhibitor.join(',')} FROM cs_app_exhibitor WHERE status = 1`);



    // Construct the response object
    const responseData = {
      // facilityType: facilitytypeData, // Uncomment if needed
      prefix: prefixData,
      country: countryData,
      states: statesData,
      regCategory: regCatData,
      workshop: workshopData,
      dayType: dayTypeData,
      ticket: ticketData,
      addon: addonData,
      custom: customData,
      paymentType: paymentTypeData,
      paymentStatus: paymentStatusData,
      ticketAmount: ticketAmountData,
      addonAmount: addonAmountData,
      processingFees: processingFeesData, // Added processing fees to response
      facultytype: facultytypeData,
      exhibitor: exhibitorData,
    };

    // Send the response containing data from all queries
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching dropdown data:', error); // More descriptive logging
    res.status(500).json({ message: 'Internal server error' });
  }
});


// router.post('/submitFeedback', async (req, res) => {
//   const formData = req.body;

//   // Ensure formData is not empty
//   if (!formData || Object.keys(formData).length === 0) {
//     return res.status(400).json({ success: false, message: 'Feedback data is missing.' });
//   }

//   // Prepare the columns and values dynamically
//   const columns = Object.keys(formData); // Array of keys (column names)
//   const values = Object.values(formData); // Array of corresponding values

//   // Create placeholders for the SQL query (one '?' for each value)
//   const placeholders = values.map(() => '?').join(',');

//   // Create the SQL query string dynamically
//   const query = `INSERT INTO cs_os_feedback_form_data (${columns.join(',')}) VALUES (${placeholders})`;

//   try {
//     // Use pool.execute for better Promise support
//     const [result] = await pool.execute(query, values);

//     // If successful, return a success response
//     res.status(200).json({ success: true, message: 'Feedback submitted successfully!' });
//   } catch (err) {
//     // Log any errors that occur and send a detailed response
//     console.error('Error inserting feedback data: ', err);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to submit feedback.',
//       error: err.message // Provide specific error message for debugging
//     });
//   }
// });

router.post('/submitFeedback', async (req, res) => {
  const formData = req.body;

  // Ensure formData contains cs_regno
  if (!formData || !formData.cs_regno) {
    return res.status(400).json({ success: false, message: 'Registration number is required.' });
  }

  const cs_regno = formData.cs_regno;

  try {
    // Step 1: Check if cs_regno exists in the cs_os_users table
    const [userResult] = await pool.execute(
      'SELECT * FROM cs_os_users WHERE cs_regno = ?',
      [cs_regno]
    );

    if (userResult.length === 0) {
      // Registration number not found
      return res.status(404).json({ success: false, message: 'Registration number not found.' });
    }

    // User exists, fetch the user data
    const userData = userResult[0];

    // Step 2: Prepare the feedback data for insertion
    const columns = Object.keys(formData); // Array of keys (column names)
    const values = Object.values(formData); // Array of corresponding values
    const placeholders = values.map(() => '?').join(',');

    const query = `INSERT INTO cs_os_feedback_form_data (${columns.join(',')}) VALUES (${placeholders})`;

    // Step 3: Insert the feedback data into the feedback table
    await pool.execute(query, values);

    // Step 4: Return success response with user data
    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully!',
      user: userData, // Include the user data in the response
    });
  } catch (err) {
    // Log and handle any errors
    console.error('Error handling feedback submission:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback.',
      error: err.message,
    });
  }
});



module.exports = router;