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


// Set up multer for file storage in the 'document1' folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Dynamically set the folder based on the file field name
    let folder;
    switch (file.fieldname) {
      case 'cs_document1':
        folder = 'document1';
        break;
      case 'cs_document2':
        folder = 'document2';
        break;
      case 'cs_document3':
        folder = 'document3';
        break;
      case 'cs_document4':
        folder = 'document4';
        break;
      case 'cs_document5':
        folder = 'document5';
        break;
      default:
        folder = 'otherDocuments'; // Fallback folder if needed
    }

    const uploadPath = path.join(__dirname, `../../${folder}`);

    // Ensure that the directory exists; if not, create it
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Save the file with a unique name
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Create the upload middleware
const upload = multer({ storage }).fields([
  { name: 'cs_document1', maxCount: 1 },
  { name: 'cs_document2', maxCount: 1 },
  { name: 'cs_document3', maxCount: 1 },
  { name: 'cs_document4', maxCount: 1 },
  { name: 'cs_document5', maxCount: 1 }
]);



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
    const currency = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "currency"`;



    // Execute each query to fetch data from respective tables
    const [facilitytypeData] = await pool.query(`SELECT ${facilitytype.join(',')} FROM cs_os_facilitytype`);
    const [prefixData] = await pool.query(`SELECT ${prefix.join(',')} FROM cs_os_name_prefixes`);
    const [countryData] = await pool.query(`SELECT ${country.join(',')} FROM cs_tbl_country`);
    const [statesData] = await pool.query(`SELECT ${states.join(',')} FROM cs_tbl_states`);
    const [regCatData] = await pool.query(`SELECT ${reg_cat.join(',')} FROM cs_os_category WHERE cs_status = 1`);
    const [workshopData] = await pool.query(`SELECT ${work_cat.join(',')} FROM cs_os_workshop WHERE cs_status = 1`);
    const [dayTypeData] = await pool.query(`SELECT ${day_type.join(',')} FROM cs_os_reg_daytype WHERE cs_status = 1 ORDER BY cs_reg_daytype_id ASC`);
    const [customData] = await pool.query(`SELECT cs_field_option, cs_field_option_value, cs_field_option_id, cs_field_id FROM cs_os_field_option WHERE cs_status = 1`);
    const [ticketData] = await pool.query(`SELECT ${ticket.join(',')} FROM cs_reg_tickets WHERE ticket_visibility = 1`);
    const [addonData] = await pool.query(`SELECT ${addon.join(',')} FROM cs_reg_add_ons WHERE addon_visiblility = 1`);
    const [paymentTypeData] = await pool.query(`SELECT ${paymenttype.join(',')} FROM cs_reg_payment_type WHERE status = 1`);
    const [paymentStatusData] = await pool.query(`SELECT ${paymentstatus.join(',')} FROM cs_reg_payment_status WHERE status = 1`);
    // const [ticketAmountData] = await pool.query(`SELECT ${ticketAmount.join(',')} FROM cs_reg_ticket_duration WHERE status = 1`);
    // Assuming `ticketAmount` is an array of columns you want to select
    const currentDate = new Date(); // Get the current date
    const formattedCurrentDate = currentDate.toISOString().split('T')[0]; // Get the date in 'YYYY-MM-DD' format
    
    
    console.log("Formatted Current Date", formattedCurrentDate);
    
    const [ticketAmountData] = await pool.query(`
      SELECT ${ticketAmount.join(', ')} 
      FROM cs_reg_ticket_duration 
      WHERE tick_duration_start_date <= ? 
      AND tick_duration_till_date >= ? 
      AND Status = 1
    `, [formattedCurrentDate, formattedCurrentDate]);
    
    console.log(ticketAmountData);
    
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
    const [CurrencyData] = await pool.query(currency);



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
      currency : CurrencyData,
    };

    // Send the response containing data from all queries
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching dropdown data:', error); // More descriptive logging
    res.status(500).json({ message: 'Internal server error' });
  }
});





// router.post('/addUser', verifyToken, async (req, res) => {
//   try {
//     const { ...userData } = req.body;
//     console.log(req.body);

//     const regId = userData.cs_reg_category;
//     const firstName = userData.cs_first_name;
//     const lastName = userData.cs_last_name;

//     // Fetch facility data based on regId
//     const [rows] = await pool.query(`
//           SELECT fd.cs_facility_name, fc.cs_allow_count, fd.cs_facility_id
//           FROM cs_os_facility_category fc
//           JOIN cs_os_facility_detail fd ON fc.cs_facility_detail_id = fd.cs_facility_detail_id
//           WHERE fc.cs_reg_cat_id = ? AND fd.cs_status = 1
//         `, [regId]);

//     // Map fields and insert user
//     await Promise.all([
//       mapFieldById(userData, 'cs_reg_category', 'cs_os_category', 'cs_reg_cat_id', 'cs_reg_category'),
//       mapRegCategory(userData)
//     ]);

//     const insertUserQuery = `
//         INSERT INTO cs_os_users SET ? `;
//     const insertResult = await pool.query(insertUserQuery, [userData]);
//     const newUserId = insertResult[0].insertId;

//     if (!newUserId) throw new Error("Failed to retrieve new user ID");

//     const username = `${firstName.toLowerCase()}${lastName[0].toLowerCase()}${newUserId}`;
//     const password = `${firstName[0].toUpperCase()}${lastName.toLowerCase()}@${newUserId}`;

//     await pool.query(`UPDATE cs_os_users SET cs_username = ?, cs_password = ? WHERE id = ?`, [username, password, newUserId]);

//     res.status(200).json({ success: true, userId: newUserId, message: "User added successfully", data: userData });
//   } catch (error) {
//     console.error('Error adding user:', error);
//     res.status(500).json({ success: false, message: "Error adding user", error: error.message });
//   }
// });


router.post('/addUser', verifyToken, upload, async (req, res) => {
  try {
    const { userid, ...userData } = req.body; // Extract userid and the rest of the user data
    console.log('Request Body: ', req.body);
    console.log('Files Uploaded: ', req.files); // The uploaded files information

    // Check if userid is provided
    if (!userid) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Handle file upload and store the paths in an object
    let documentPaths = {};
    if (req.files['cs_document1']) documentPaths.cs_document1 = path.basename(req.files['cs_document1'][0].path);
    if (req.files['cs_document2']) documentPaths.cs_document2 = path.basename(req.files['cs_document2'][0].path);
    if (req.files['cs_document3']) documentPaths.cs_document3 = path.basename(req.files['cs_document3'][0].path);
    if (req.files['cs_document4']) documentPaths.cs_document4 = path.basename(req.files['cs_document4'][0].path);
    if (req.files['cs_document5']) documentPaths.cs_document5 = path.basename(req.files['cs_document5'][0].path);

    // Prepare the data to update, combining userData with documentPaths
    const updateData = { ...userData, ...documentPaths };

    // Filter out any empty values to avoid updating fields with empty data
    const filteredUpdateData = Object.fromEntries(Object.entries(updateData).filter(([_, v]) => v !== ''));

    // Update the user data in the database
    const updateUserQuery = `UPDATE cs_os_users SET ? WHERE id = ?`;
    const updateResult = await pool.query(updateUserQuery, [filteredUpdateData, userid]);

    if (updateResult[0].affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'No user found with the provided ID' });
    }

    res.status(200).json({ success: true, message: 'User updated successfully', data: filteredUpdateData });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Error updating user', error: error.message });
  }
});

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
        branch, payment_date, processing_fee, payment_mode,confirm_payment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,? )
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
      confirm_payment
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


      const [userRow] = await pool.query('SELECT * FROM cs_as_users WHERE id = ?', [paymentData.user_id]);
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

router.post('/processPayment', async (req, res) => {
  try {
    const { paymentData } = req.body;

    if (!paymentData) {
      return res.status(400).json({ success: false, message: "Missing payment data" });
    }

    // Step 1: Generate txnid (unique transaction id)
    const txnid = 'TXN' + new Date().getTime(); // Example: Generate a unique transaction ID

    // Step 2: Prepare payment data for PayU
    const payUData = {
      key: PAYU_MERCHANT_KEY,
      txnid: txnid,
      amount: paymentData.amount, // Amount to charge
      productinfo: paymentData.productinfo, // Description of the product or service
      firstname: paymentData.firstname, // User's first name
      email: paymentData.email, // User's email
      phone: paymentData.phone, // User's phone
      udf1: paymentData.userId,
      udf2: paymentData.temppaymentId,
      surl: process.env.SURL,
      furl: process.env.FURL, // Failure URL where PayU will redirect
      // service_provider: 'payu_paisa', // Required for PayU
    };

    // Step 3: Generate PayU Hash
    const hash = generatePayUHash(payUData, PAYU_MERCHANT_KEY, PAYU_MERCHANT_SALT);
    payUData.hash = hash;

    // Step 4: Redirect or send a response to the frontend with PayU form
    return res.status(200).json({
      success: true,
      paymentUrl: process.env.PAYU_BASE_URL,
      payUData,
    });

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
        SELECT user_id FROM cs_reg_temp_payment WHERE temppayment_id = ?
      `, [udf2]);

      if (tempPaymentRows.length === 0) {
        return res.status(400).json({ success: false, message: "Transaction not found in temp payment records." });
      }

      const userId = tempPaymentRows[0].user_id;

      // Step 2: Insert the payment details into the cs_reg_payment table
      const insertPaymentQuery = `
        INSERT INTO cs_reg_payment (
          user_id, temppayment_id, tracking_id, total_paid_amount, current_paid_amount, payment_date
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      const paymentValues = [
        userId, udf2, mihpayid, amount, net_amount_debit, addedon // This should indicate the payment status
      ];

      await pool.query(insertPaymentQuery, paymentValues);

      // Step 3: Update the user status in cs_os_users
      const updateUserQuery = `UPDATE cs_os_users SET cs_isconfirm = 1 WHERE id = ?`;
      await pool.query(updateUserQuery, [userId]);

      // Step 4: Redirect to the success page on the frontend
      res.redirect(`https://projects.consoftservices.com/confirm-payment/Consoft?txnid=${txnid}&amount=${amount}&status=${status}`);

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

    // Send the field data as a response
    res.json({ Fields: fieldData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/getDiscount', async (req, res) => {
  const { discount_code } = req.query;

  try {
      // Query to check if the promo code exists
      const [result] = await pool.execute(
          `SELECT * FROM cs_reg_discounts WHERE discount_code = ? AND status = 1`,
          [discount_code]
      );

      if (result.length > 0) {
          // Promo code is valid, return discount details
          res.status(200).json(result[0]);
      } else {
          // Promo code is invalid
          res.status(404).json({ message: 'Invalid promo code.' });
      }
  } catch (error) {
      console.error('Error fetching discount:', error);
      res.status(500).json({ message: 'An error occurred while retrieving discount data.' });
  }
});


module.exports = router;