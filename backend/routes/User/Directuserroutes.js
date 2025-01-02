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
const qs = require('querystring');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false  // Allow self-signed certificates
  }
});


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'faculty-profile/'); // Specify the directory where files will be uploaded
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); // Set the filename
  }
});

const upload = multer({ storage: storage });

RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

CCAVENUE_MERCHANT_ID = process.env.CCAVENUE_MERCHANT_ID;
CCAVENUE_ACCESS_CODE = process.env.CCAVENUE_ACCESS_CODE;
CCAVENUE_WORKING_KEY = process.env.CCAVENUE_WORKING_KEY;


// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


router.get('/getDropdownData', async (req, res) => {

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
    const ticket = ['ticket_id', 'ticket_title', 'ticket_type', 'ticket_category', 'ticket_ispaid', 'ticket_type', 'ticket_count', 'ticket_max_limit', 'ticket_description', 'ticket_order'];
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
    const multipleuser = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Multipleuser"`;
    const discountcoupon = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Discountcoupon"`;
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
    // const [ticketData] = await pool.query(`SELECT ${ticket.join(',')} FROM cs_reg_tickets WHERE ticket_visibility = 1`);
    const [ticketData] = await pool.query(
      `SELECT ${ticket.join(',')} 
       FROM cs_reg_tickets 
       WHERE ticket_visibility = 1 
       ORDER BY ticket_order ASC`
    );
    const [addonData] = await pool.query(`SELECT ${addon.join(',')} FROM cs_reg_add_ons WHERE addon_visiblility = 1`);
    const [paymentTypeData] = await pool.query(`SELECT ${paymenttype.join(',')} FROM cs_reg_payment_type WHERE status = 1`);
    const [paymentStatusData] = await pool.query(`SELECT ${paymentstatus.join(',')} FROM cs_reg_payment_status WHERE status = 1`);
    const [workshoptypeData] = await pool.query(`SELECT ${workshop_type.join(',')} FROM cs_os_workshop_type WHERE cs_status = 1`);
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
    const [processingincldedData] = await pool.query(processinginclded);
    const [CurrencyData] = await pool.query(currency);
    const [processingfeeornotData] = await pool.query(processingfeeornot);
    const [gstincldedData] = await pool.query(gstinclded);
    const [gstfeeData] = await pool.query(gstfee);
    const [processingfeeinData] = await pool.query(processingfeein);
    const [gstamount] = await pool.query(IGSTfee);
    const [paymentmodeData] = await pool.query(paymentmode);
    const [multipleuserdata] = await pool.query(multipleuser);
    const [Discountcoupondata] = await pool.query(discountcoupon);


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
      workshoptype: workshoptypeData,
      multipleuserdata: multipleuserdata,
      discountcoupon: Discountcoupondata,
    };

    // Send the response containing data from all queries
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching dropdown data:', error); // More descriptive logging
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/getConfirmField', async (req, res) => {
  try {
    const columnsToFetch = 'cs_os_field_data.*, cs_os_field_type.field_type_name';

    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
      SELECT ${columnsToFetch}
      FROM cs_os_field_data
      LEFT JOIN cs_os_field_type ON cs_os_field_data.cs_field_type = cs_os_field_type.cs_field_type
      WHERE cs_os_field_data.cs_status = 1 
        AND cs_visible_reg_confirmform = 1 
        AND cs_visible_reg_userform = 1 
        AND cs_field_name <> 'cs_addons' 
        AND cs_field_name <> 'cs_reg_category' AND cs_field_name <> 'cs_ticket'
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


router.get('/getconfirmusers', async (req, res) => {
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


router.post('/addUser', upload.fields([
  { name: 'photo', maxCount: 1 }, { name: 'resume', maxCount: 1 }
]), async (req, res) => {
  try {
    const { accompany_person_data, facultyDetails, ...userData } = req.body; // Extract the accompanying person data
    console.log('Request Body:', req.body);
    console.log('Files Uploaded:', req.files); // Log uploaded files

    const photo = req.files.photo ? req.files.photo[0].path : null;
    const resume = req.files.resume ? req.files.resume[0].path : null;

    console.log('Profile', photo);
    console.log('CV', resume);



    // Handle file uploads and store paths in documentPaths
    let documentPaths = {};


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
    // const updateUserQuery = `UPDATE cs_os_users SET ? WHERE id = ?`;
    // const [updateResult] = await pool.query(updateUserQuery, [filteredUpdateData, userid]);

    const createUserQuery = `INSERT INTO cs_os_users SET ?`;
    const [updateResult] = await pool.query(createUserQuery, filteredUpdateData);

    const userid = updateResult.insertId;

    console.log("Newly created user ID:", userid);

    // const csTicket = userData.cs_ticket;

    // if (csTicket) {
    //   console.log("Ticket ID:", csTicket);

    //   try {
    //     // Query the `cs_reg_tickets` table to get `reg_typeid` and `residentional_type`
    //     const [ticketResult] = await pool.query(
    //       `SELECT reg_typeid, residentional_type FROM cs_reg_tickets WHERE ticket_id = ?`,
    //       [csTicket]
    //     );

    //     console.log("Ticket Query Result:", ticketResult);

    //     if (ticketResult.length > 0) {
    //       const { reg_typeid, residentional_type } = ticketResult[0];

    //       console.log("Retrieved reg_typeid:", reg_typeid);
    //       console.log("Retrieved residentional_type:", residentional_type);
    //       if (reg_typeid === '1' && residentional_type === 1) {
    //         userData.is_twinsharing = 1;
    //         console.log("is_twinsharing flag added to userData");

    //         const updateUserWithTwinsharingQuery = `
    //         UPDATE cs_os_users
    //         SET is_twinsharing = ?
    //         WHERE id = ?
    //       `;

    //       try {
    //         await pool.query(updateUserWithTwinsharingQuery, [userData.is_twinsharing || 0, userid]);
    //         console.log("Updated is_twinsharing flag in cs_os_users");
    //       } catch (error) {
    //         console.error("Error updating is_twinsharing flag in cs_os_users:", error);
    //       }


    //       } else if (reg_typeid === '1' && residentional_type === 2) {
    //         // Handle case for residentional_type === 2 if needed
    //          // Combine first name and last name for the partner name
    //          const partnerName = `${userData.cs_first_name || ''} ${userData.cs_last_name || ''}`.trim();

    //          // Create partner data
    //          const partnerData = {
    //            p1_userid: userid, // Assuming this is the current user's ID
    //            p1_name: partnerName,
    //            p1_city: userData.cs_city || null,
    //            p1_email: userData.cs_email || null,
    //            p1_phone: userData.cs_phone || null,
    //            Ticketid : csTicket || null,
    //          };

    //          console.log("Partner Data to insert:", partnerData);

    //          // Insert the partner data into the `cs_reg_partner` table
    //          const insertPartnerQuery = `
    //            INSERT INTO cs_reg_partner (p1_userid, p1_name, p1_city, p1_email, p1_phone,Ticketid)
    //            VALUES (?, ?, ?, ?, ?,?)
    //          `;

    //          try {
    //            await pool.query(insertPartnerQuery, [
    //              partnerData.p1_userid,
    //              partnerData.p1_name,
    //              partnerData.p1_city,
    //              partnerData.p1_email,
    //              partnerData.p1_phone,
    //              partnerData.Ticketid
    //            ]);
    //            console.log("Partner details inserted successfully");
    //          } catch (error) {
    //            console.error("Error inserting partner details:", error);
    //          }
    //       }





    //     } else {
    //       console.log("No matching ticket found for the provided cs_ticket");
    //     }
    //   } catch (error) {
    //     console.error("Error querying cs_reg_tickets:", error);
    //     res.status(500).json({ success: false, message: 'Error processing ticket data', error: error.message });
    //     return;
    //   }
    // } else {
    //   console.log("No cs_ticket provided in userData");
    // }

    const firstName = updateData.cs_first_name ? updateData.cs_first_name : 'Dammy';
    const lastName = updateData.cs_last_name ? updateData.cs_last_name : 'Dammy';

    // Function to remove special characters
    const sanitizeString = (str) => str.replace(/[^a-zA-Z0-9]/g, '');

    const sanitizedFirstName = sanitizeString(firstName.toLowerCase());
    const sanitizedLastNameInitial = sanitizeString(lastName[0].toLowerCase());
    const sanitizedLastName = sanitizeString(lastName.toLowerCase());
    const sanitizedFirstNameInitial = sanitizeString(firstName[0].toUpperCase());

    const username = `${sanitizedFirstName}${sanitizedLastNameInitial}${userid}`;
    // const password = `${sanitizedFirstNameInitial}${sanitizedLastName}@${newUserId}`;
    const password = `${sanitizedFirstNameInitial}${sanitizedLastName.substring(0, 5)}@${userid}`;




    const updateUserQuery = `
      UPDATE cs_os_users
      SET cs_username = ?, cs_password = ?
      WHERE id = ?
    `;

    await pool.query(updateUserQuery, [username, password, userid]);

    filteredUpdateData.userid = userid;

    console.log('Filtered Update Data after adding user ID:', filteredUpdateData);


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


    res.status(200).json({ success: true, message: 'User updated successfully', data: filteredUpdateData });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Error updating user', error: error.message });
  }
});


router.post('/storePayment', async (req, res) => {
  try {
    const {
      userId, amount, currency, paymenttype_id, conference_fees, cheque_no, bank, branch,
      payment_date, processing_fee, payment_mode, taxamount, addonamount
    } = req.body;

    console.log("store body", req.body);

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
      taxamount: taxamount || null,
      addonamount: addonamount || null
    };
    let confirm_payment = 0
    let mem_app_date = null;
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Format to 'YYYY-MM-DD HH:MM:SS'

    if (paymentData.payment_mode == "offline" || paymentData.payment_mode == "Offline") {
      confirm_payment = 1;
      mem_app_date = currentDate;

      const [userDetails] = await pool.query(
        `SELECT cs_first_name AS firstName, cs_last_name AS lastName, cs_phone AS mobile, cs_email AS email, cs_city AS city,cs_ticket as csTicket
         FROM cs_os_users 
         WHERE id = ?`,
        [userId]
      );

      const csTicket = parseInt(userDetails[0].csTicket, 10); // Convert to an integer with base 10
      console.log("Ticket ID:", csTicket);
      if (csTicket) {
        console.log("Ticket ID:", csTicket);

        try {
          // Query the `cs_reg_tickets` table to get `reg_typeid` and `residentional_type`
          const [ticketResult] = await pool.query(
            `SELECT reg_typeid, residentional_type FROM cs_reg_tickets WHERE ticket_id = ?`,
            [csTicket]
          );

          console.log("Ticket Query Result:", ticketResult);

          if (ticketResult.length > 0) {
            const { reg_typeid, residentional_type } = ticketResult[0];

            console.log("Retrieved reg_typeid:", reg_typeid);
            console.log("Retrieved residentional_type:", residentional_type);
            if (reg_typeid === '1' && residentional_type === 1) {

              const updateUserWithTwinsharingQuery = `
            UPDATE cs_os_users
            SET is_twinsharing = ?
            WHERE id = ?
          `;

              try {
                await pool.query(updateUserWithTwinsharingQuery, [1, userId]);
                console.log("Updated is_twinsharing flag in cs_os_users");
              } catch (error) {
                console.error("Error updating is_twinsharing flag in cs_os_users:", error);
              }


            } else if (reg_typeid === '1' && residentional_type === 2) {
              // Handle case for residentional_type === 2 if needed
              if (userDetails.length > 0) {
                const user = userDetails[0];
                console.log("User Details:", user);

                // Insert retrieved user details into `cs_reg_partner` or other relevant table
                const insertPartnerQuery = `
                INSERT INTO cs_reg_partner (p1_userid, p1_name, p1_city, p1_email, p1_phone, Ticketid)
                VALUES (?, ?, ?, ?, ?, ?)
              `;
                const partnerName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

                await pool.query(insertPartnerQuery, [
                  userId,
                  partnerName,
                  user.city,
                  user.email,
                  user.mobile,
                  csTicket
                ]);
                console.log("User details inserted successfully into cs_reg_partner");
              } else {
                console.log("No user found for the given userId");
              }
            }





          } else {
            console.log("No matching ticket found for the provided cs_ticket");
          }
        } catch (error) {
          console.error("Error querying cs_reg_tickets:", error);
          res.status(500).json({ success: false, message: 'Error processing ticket data', error: error.message });
          return;
        }
      } else {
        console.log("No cs_ticket provided in userData");
      }



    } else {
      confirm_payment = 0;
      mem_app_date = currentDate;
    }

    // Insert payment data into cs_as_temp_payment table
    const insertPaymentQuery = `
      INSERT INTO cs_reg_temp_payment (
        user_id, current_paid_amount, currency, paymenttype_id, conference_fees, cheque_no, bank,
        branch, payment_date, processing_fee, payment_mode,confirm_payment, paymentstatus_id ,tax_amount,addon_fees
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,?,? ,?,?)
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
      '1',
      paymentData.taxamount,
      paymentData.addonamount,
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
    if (paymentData.payment_mode == "offline" || paymentData.payment_mode == "Offline") {


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

router.post('/processPayment', async (req, res) => {
  try {
    const { paymentData } = req.body;

    console.log("req.body1", req.body);

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
        // amount: paymentData.amount * 100, // Amount in paise
        amount: Math.round(paymentData.amount * 100),
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
          udf1: paymentData.userId,
          udf2: paymentData.temppaymentId,
          ticket: paymentData.ticket,
          category: paymentData.category,
          taxamount: paymentData.taxamount,

        },
      });
    } else if (paymentGateway === 'CCAvenue') {
      // Step 2: Prepare CCAvenue Data
      // const ccAvenueData = {
      //   merchant_id: CCAVENUE_MERCHANT_ID, // Merchant ID
      //   order_id: 'ORDER' + new Date().getTime(), // Unique Order ID
      //   amount: paymentData.amount, // Payment Amount
      //   currency: 'INR', // Currency (default is INR for CCAvenue)
      //   redirect_url: process.env.SURL, // Success Callback URL
      //   cancel_url: process.env.FURL, // Failure Callback URL
      //   language: 'EN', // Language
      //   billing_name: paymentData.firstname,
      //   billing_address: paymentData.address || '',
      //   billing_city: paymentData.city || '',
      //   billing_state: paymentData.state || '',
      //   billing_zip: paymentData.zip || '',
      //   billing_country: paymentData.country || 'India',
      //   billing_tel: paymentData.phone,
      //   billing_email: paymentData.email,
      // };
      const txnid = `TXN${new Date().getTime()}${Math.floor(Math.random() * 1000)}`;

      const ccAvenueData = `tid=${txnid}&merchant_id=${CCAVENUE_MERCHANT_ID}&order_id=${paymentData.temppaymentId}&amount=${paymentData.amount || 0}&currency=INR&redirect_url=${process.env.SURL}&cancel_url=${process.env.FURL}&language=EN&billing_name=${paymentData.firstname || ''}&billing_address=${paymentData.address || ''}&billing_city=${paymentData.city || ''}&billing_state=${paymentData.state || ''}&billing_zip=${paymentData.zip || ''}&billing_country=${paymentData.country || 'India'}&billing_tel=${paymentData.phone || ''}&billing_email=${paymentData.email || ''}&delivery_name=${paymentData.firstname || ''}&delivery_address=${paymentData.address || ''}&delivery_city=${paymentData.city || ''}&delivery_state=${paymentData.state || ''}&delivery_zip=${paymentData.zip || ''}&delivery_country=${paymentData.country || 'India'}&delivery_tel=${paymentData.phone || ''}&merchant_param1=${paymentData.userId} Info.&merchant_param2=additional Info.&merchant_param3=additional Info.&merchant_param4=additional Info.&merchant_param5=additional Info.&promo_code=&customer_identifier=`;


console.log("ccAvenueData",ccAvenueData);


      // Step 3: Encrypt Data
      const encryptedData = encryptCCAvenueData(
        ccAvenueData,
        CCAVENUE_WORKING_KEY
      );

      

      // Step 4: Return Payment Details
      return res.status(200).json({
        success: true,
        paymentGateway: 'CCAvenue',

        // paymentUrl: 'https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction',
        paymentUrl: 'https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction',
        payUData: {


          amount: Math.round(paymentData.amount * 100),

          productinfo: paymentData.productinfo,
          firstname: paymentData.firstname,
          email: paymentData.email,
          phone: paymentData.phone,
          udf1: paymentData.userId,
          udf2: paymentData.temppaymentId,
          ticket: paymentData.ticket,
          category: paymentData.category,
          taxamount: paymentData.taxamount,

        },

        encryptedData,
        accessCode: CCAVENUE_ACCESS_CODE, // Required for the CCAvenue form submission
      });
    }
    else {
      return res.status(400).json({ success: false, message: "Invalid payment gateway selected" });
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ success: false, message: "Error processing payment", error: error.message });
  }
});

// function encryptCCAvenueData(data, encryptionKey) {
//   const qs = require('querystring');
//   const crypto = require('crypto');

//   // Log the input data to check if it's properly formatted
//   console.log('Data before encryption:', data);

//   // Convert data to a query string
//   const plainText = qs.stringify(data);

//   // Log the query string before encryption
//   console.log('Plain Text:', plainText);

//   // Convert encryption key to 16-byte Buffer (if given as hex string)
//   const keyBuffer = Buffer.from(encryptionKey, 'hex');
//   console.log('Key Buffer:', keyBuffer);

//   // Check if the key length is valid (16 bytes)
//   if (keyBuffer.length !== 16) {
//     throw new Error('Invalid encryption key. Key must be 16 bytes long.');
//   }

//   // Encrypt the data using AES-128-CBC
//   const cipher = crypto.createCipheriv('aes-128-cbc', keyBuffer, keyBuffer);
//   let encrypted = cipher.update(plainText, 'utf8', 'base64');
//   encrypted += cipher.final('base64');

//   // Log the encrypted data
//   console.log('Encrypted Data:', encrypted);

//   return encrypted;
// }


function encryptCCAvenueData(data, encryptionKey) {
  try {
    console.log('Input Data:', data);
    console.log('Encryption Key:', encryptionKey);

    // Convert encryptionKey to a 16-byte key
    const key = crypto.createHash('md5').update(encryptionKey).digest();

    // IV must be 16 bytes (you can use any fixed or random value for IV)
    const iv = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f]);

    // Create cipher
    const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);

    // Encrypt the data
    let encoded = cipher.update(data, 'utf8', 'hex');
    encoded += cipher.final('hex');

    console.log('Encoded Data:', encoded);

    return encoded;
  } catch (error) {
    console.error('Error during encryption:', error.message);
    throw error;
  }
}



function decryptCCAvenueData(encryptedData, encryptionKey) {
  try {
    if (!encryptionKey) {
      throw new Error('Encryption key is required');
    }

    // Generate a 16-byte key using the MD5 hash of the encryption key
    const key = crypto.createHash('md5').update(encryptionKey).digest();

    // IV must be 16 bytes
    const iv = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f]);

    // Create decipher
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);

    // Decrypt the data
    let decoded = decipher.update(encryptedData, 'hex', 'utf8');
    decoded += decipher.final('utf8');

    return decoded;
  } catch (error) {
    console.error('Error during decryption:', error.message);
    throw error;
  }
}




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
        SELECT user_id, currency, processing_fee, payment_mode, paymenttype_id,paymentstatus_id,addon_fees FROM cs_reg_temp_payment WHERE temppayment_id = ?
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
      const addon_fees = tempPaymentRows[0].addon_fees;

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
          user_id, temppayment_id, tracking_id, total_paid_amount, current_paid_amount, payment_date, currency, processing_fee, payment_mode, paymenttype_id, paymentstatus_id,addon_fees
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
      `;

        const paymentValues = [
          userId, udf2, mihpayid, amount, net_amount_debit, addedon, currency, processing_fee, payment_mode, paymenttype_id, paymentstatus_id, addon_fees // This should indicate the payment status
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

      const [userRow] = await pool.query('SELECT * FROM cs_os_users WHERE id = ?', [userId]);
      console.log("userRow", userRow);
      if (userRow.length > 0) {
        await sendConfirmEmail(userRow[0]);

        // Update cs_confirmmail to 1 after successfully sending the email

        console.log("cs_confirmmail updated successfully for UserId:", userId); // Log success
      }

      // Step 4: Redirect to the success page on the frontend
      res.redirect(`https://projects.consoftservices.com/user/confirm-payment/Consoft?txnid=${txnid}&amount=${amount}&status=${status}`);

    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ success: false, message: "Error confirming payment", error: error.message });
  }
});


router.post('/confirmRazorpayPayment', async (req, res) => {
  try {
    // Extract the PayU response parameters from the request body
    const {
      paymentId, orderId, signature, userId, temppaymentId, amount
    } = req.body;

    console.log("req.bodysfd", req.body);

    // Check if the payment was successful
    // if (status === 'success') {
    //   // Step 1: Fetch the corresponding temporary payment data
    const [tempPaymentRows] = await pool.query(`
        SELECT user_id, currency, processing_fee, payment_mode, paymenttype_id,paymentstatus_id,conference_fees,tax_amount,addon_fees FROM cs_reg_temp_payment WHERE temppayment_id = ?
      `, [temppaymentId]);

    if (tempPaymentRows.length === 0) {
      return res.status(400).json({ success: false, message: "Transaction not found in temp payment records." });
    }

    // const userId = tempPaymentRows[0].user_id;
    const currency = tempPaymentRows[0].currency;
    const processing_fee = tempPaymentRows[0].processing_fee;
    const payment_mode = tempPaymentRows[0].payment_mode;
    const paymenttype_id = tempPaymentRows[0].paymenttype_id;
    const paymentstatus_id = tempPaymentRows[0].paymentstatus_id;
    const conference_fees = tempPaymentRows[0].conference_fees;
    const tax = tempPaymentRows[0].tax_amount;
    const addon_fees = tempPaymentRows[0].addon_fees;

    const addedon = new Date().toISOString(); // ISO format

    console.log(payment_mode);

    const updateTempQuery = `
      UPDATE cs_reg_temp_payment 
      SET confirm_payment = 1, tracking_id = ? 
      WHERE temppayment_id = ?
    `;
    await pool.query(updateTempQuery, [paymentId, temppaymentId]);

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
          user_id, temppayment_id, tracking_id, total_paid_amount, current_paid_amount, payment_date, currency, processing_fee, payment_mode, paymenttype_id, paymentstatus_id,conference_fees,tax_amount,addon_fees
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?)
      `;

      const paymentValues = [
        userId, temppaymentId, paymentId, amount, amount, addedon, currency, processing_fee, payment_mode, paymenttype_id, paymentstatus_id, conference_fees, tax, addon_fees// This should indicate the payment status
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


    const [userDetails] = await pool.query(
      `SELECT cs_first_name AS firstName, cs_last_name AS lastName, cs_phone AS mobile, cs_email AS email, cs_city AS city,cs_ticket as csTicket
       FROM cs_os_users 
       WHERE id = ?`,
      [userId]
    );

    const csTicket = parseInt(userDetails[0].csTicket, 10); // Convert to an integer with base 10
    console.log("Ticket ID:", csTicket);
    if (csTicket) {
      console.log("Ticket ID:", csTicket);

      try {
        // Query the `cs_reg_tickets` table to get `reg_typeid` and `residentional_type`
        const [ticketResult] = await pool.query(
          `SELECT reg_typeid, residentional_type FROM cs_reg_tickets WHERE ticket_id = ?`,
          [csTicket]
        );

        console.log("Ticket Query Result:", ticketResult);

        if (ticketResult.length > 0) {
          const { reg_typeid, residentional_type } = ticketResult[0];

          console.log("Retrieved reg_typeid:", reg_typeid);
          console.log("Retrieved residentional_type:", residentional_type);
          if (reg_typeid === '1' && residentional_type === 1) {

            const updateUserWithTwinsharingQuery = `
          UPDATE cs_os_users
          SET is_twinsharing = ?
          WHERE id = ?
        `;

            try {
              await pool.query(updateUserWithTwinsharingQuery, [1, userId]);
              console.log("Updated is_twinsharing flag in cs_os_users");
            } catch (error) {
              console.error("Error updating is_twinsharing flag in cs_os_users:", error);
            }


          } else if (reg_typeid === '1' && residentional_type === 2) {
            // Handle case for residentional_type === 2 if needed
            if (userDetails.length > 0) {
              const user = userDetails[0];
              console.log("User Details:", user);

              // Insert retrieved user details into `cs_reg_partner` or other relevant table
              const insertPartnerQuery = `
              INSERT INTO cs_reg_partner (p1_userid, p1_name, p1_city, p1_email, p1_phone, Ticketid)
              VALUES (?, ?, ?, ?, ?, ?)
            `;
              const partnerName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

              await pool.query(insertPartnerQuery, [
                userId,
                partnerName,
                user.city,
                user.email,
                user.mobile,
                csTicket
              ]);
              console.log("User details inserted successfully into cs_reg_partner");
            } else {
              console.log("No user found for the given userId");
            }
          }





        } else {
          console.log("No matching ticket found for the provided cs_ticket");
        }
      } catch (error) {
        console.error("Error querying cs_reg_tickets:", error);
        res.status(500).json({ success: false, message: 'Error processing ticket data', error: error.message });
        return;
      }
    } else {
      console.log("No cs_ticket provided in userData");
    }

    // Step 4: Redirect to the success page on the frontend
    // res.redirect(`https://projects.consoftservices.com/user/conirmdirectformpayment/Consoft?txnid=${txnid}&amount=${amount}`);
    // res.redirect(`http://localhost:3001/conirmdirectformpayment?txnid=${paymentId}&amount=${amount}`);

    const [userRow] = await pool.query('SELECT * FROM cs_os_users WHERE id = ?', [userId]);
    console.log("userRow", userRow);
    if (userRow.length > 0) {
      await sendConfirmEmail1(userRow[0]);

      // Update cs_confirmmail to 1 after successfully sending the email

      console.log("cs_confirmmail updated successfully for UserId:", userId); // Log success
    }

    return res.status(200).json({
      success: true,
      message: "Payment confirmed successfully.",
      data: {
        paymentId,
        amount,
        userId,
      },
    });

    // }
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ success: false, message: "Error confirming payment", error: error.message });
  }
});

const sendConfirmEmail1 = async (userData, userId) => {
  console.log("User Data", userData);

  const toTitleCase = (str) => {
    return str
      .toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  // Convert first and last name to title case
  const formattedFirstName = toTitleCase(userData.cs_first_name);
  const formattedLastName = toTitleCase(userData.cs_last_name);

  userData.cs_first_name = formattedFirstName;
  userData.cs_last_name = formattedLastName;

  // Fetch email template
  const templateQuery = `SELECT template_content, template_subject FROM cs_tbl_email_template WHERE template_id = ?`;
  const [templateData] = await pool.query(templateQuery, [7]);

  // Fetch ticket details if cs_ticket exists
  let ticketData = [];
  if (userData.cs_ticket) {
    const ticketQuery = `
      SELECT ticket_title, ticket_mail_description AS ticket_message 
      FROM cs_reg_tickets 
      WHERE ticket_id = ?`;
    [ticketData] = await pool.query(ticketQuery, [userData.cs_ticket]);
    console.log("Ticket", ticketData);

    // Merge ticket data into userData
    if (ticketData && ticketData.length > 0) {
      userData.ticket_title = ticketData[0].ticket_title;
      userData.ticket_message = ticketData[0].ticket_message;
    } else {
      userData.ticket_title = '';
      userData.ticket_message = '';
    }
  } else {
    console.log("No valid ticket ID found for this user.");
    userData.ticket_title = '';
    userData.ticket_message = '';
  }

  console.log("Final User Data with Ticket", userData);

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


// router.post('/confirmPayment', async (req, res) => {
//   try {
//    const encResp: "625a4e92682bdeb5922a5ea48b2fe321f4dd2927689eaa3d7cd6ac2a8546d4fd400a2fc7e594f82453e92c163bc76a6350c6e5155d70eedc26417f2c3c728795bcd30bbb67b58b5dcda2e8cba6feae3ef45fdd315c16e28b08156cb29fc5702abd94245d57cd373f69f82e9b0c22d8752fcd8628849851aa272f49597bef0488b6e41c2729a62ee3d09838318d1dba20f12d4dcb6943c3dd5e1cb3f9a6bce5a34b4ce0085676b44eb3d0bbd9e6bd6c9ab52c38d3864aec7988ed05450a275f6d3247d8c74c566e482d104b8e94caf8346c0a73f241aabb9f0a734231154d76bf61d33f6f7c3be489f2916ebe3f852ae6bb4e1cbc7c6b1ba4f6c10491ffc7f23a7e97fcd6a25c16879aefe5f7db50f037eb7c9c5aa8ed5d0594518f685a3b8fa17ca9390eb478eb0e76f31f3b921072eae1e196ab4003dc33a7ed7b59a5583076e50f1d26d5230d227c00546ee7c777a457f12d303f1770694030ad74859c7562fad6cba5e157a6e28b5a10e472170e57a91ac86e657cb7c640a94fb9c520abb809014b26082f8d229a1e58b412e04a1af599c2f12d6a907e45ed7bbc026092c27c59c3ca6ed170d39208edf17b3f300e738d998fb53c4f39e6daa5c9ea5bede5f219005ed8c23957756e82006c469876f7a2ff189a69c0951adbe413f825d4e5a7e3b8b4f19cfb49d7134656af9baa34392120849d2a65829f29443d4d0417791e154fe25a5c081dc167ab895e6827234a6b08791abe11b38568d749a82e4a1c88d1c7108237711f70daca40c6f306f69ace38fb40695bebbf877f0b9a8bc6a9440ce7470af56aeffd024b36fbbc44a2b8a03449d51ca65b3e01a2f1c939fb533d2a2993287da0a5b1c674dd223ccd969392fe9975618b93f6268d89d8afe8ab2e50fd57c6b4c6c50064605cec7e6929ab5f894d6c480c0c624bf3c43161e1777d78fe9dca863606005754cd901b2489dd45ebddd2789819c24e08920dc74c2ddc96173cfbab3b4abe96aa19e438bc871e4e801821286a2f53cf2f32d2f3251f136f7875f76c9a906b930bc4bde7b4c0e2baabbfee17be3da1b7116c22eb30b4c0fde29b153503abf36237e004d7f34b9e5bd74dd2fd89101937818ec6eebdd7b1175d4554f435eb257ce39ad57e30838f139144dea6938103b89479d4b5ad30c20dcf3531670740af9f16bf1a904e398f4d78be325c49fc7acfd706a79a8e58ed71794cc0e478411ce11719fd5980873983e3461c3a755921d47003b530b103114f080b126c12a64ebd8b1f31e573e7d4137ab8f4982aea28c9f4741220b92fb9f3c396ee0830e087517e3539278dc7c2213d538b0326d4d97941daecb76f67bfc62863930fb276eeb0d91b2b31293a57b40e87604bffb4a1fb9032d6caeff2036ad726806a2cd004c6fa0254cae5c0"
//    const orderNo:" 92"
//    const accessCode: "ATPX06LL09CC64XPCC"

// const decryptedData =decryptCCAvenueData(
//   encResp,
//   CCAVENUE_WORKING_KEY
// );

// console.log("decryptedData",decryptedData);




  
//   } catch (error) {
//     console.error('Error confirming payment:', error);
//     res.status(500).json({ success: false, message: "Error confirming payment", error: error.message });
//   }
// });

router.post('/confirmPaymentforccavenue', async (req, res) => {
  try {
    // Extract data from the request body
    const { encResp, orderNo, accessCode } = req.body;

    console.log("req.body",req.body);

    // Validate required fields
    if (!encResp || !orderNo || !accessCode) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: encResp, orderNo, or accessCode" 
      });
    }

    // Decrypt the payment response
    const decryptedData = decryptCCAvenueData(encResp, CCAVENUE_WORKING_KEY);

    // Log the decrypted data for debugging
    console.log("Decrypted Data:", decryptedData);

       // Parse decrypted data into an object
       const queryParams = new URLSearchParams(decryptedData);
       const userId = queryParams.get("merchant_param1"); // Extract userId from merchant_param1
       const temppaymentId = queryParams.get("order_id"); // Extract temppaymentId from order_id
       const amount = queryParams.get("mer_amount"); // Extract amount
       const status = queryParams.get("order_status"); // Extract payment status
       const paymentId = queryParams.get("tracking_id"); // Extract payment status


       const [tempPaymentRows] = await pool.query(`
        SELECT user_id, currency, processing_fee, payment_mode, paymenttype_id,paymentstatus_id,conference_fees,tax_amount,addon_fees FROM cs_reg_temp_payment WHERE temppayment_id = ?
      `, [temppaymentId]);

    if (tempPaymentRows.length === 0) {
      return res.status(400).json({ success: false, message: "Transaction not found in temp payment records." });
    }

    // const userId = tempPaymentRows[0].user_id;
    const currency = tempPaymentRows[0].currency;
    const processing_fee = tempPaymentRows[0].processing_fee;
    const payment_mode = tempPaymentRows[0].payment_mode;
    const paymenttype_id = tempPaymentRows[0].paymenttype_id;
    const paymentstatus_id = tempPaymentRows[0].paymentstatus_id;
    const conference_fees = tempPaymentRows[0].conference_fees;
    const tax = tempPaymentRows[0].tax_amount;
    const addon_fees = tempPaymentRows[0].addon_fees;

    const addedon = new Date().toISOString(); // ISO format

    // console.log(payment_mode);

    const updateTempQuery = `
    UPDATE cs_reg_temp_payment 
    SET confirm_payment = 1, tracking_id = ? 
    WHERE temppayment_id = ?
  `;
  await pool.query(updateTempQuery, [paymentId, temppaymentId]);

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
        user_id, temppayment_id, tracking_id, total_paid_amount, current_paid_amount, payment_date, currency, processing_fee, payment_mode, paymenttype_id, paymentstatus_id,conference_fees,tax_amount,addon_fees
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?)
    `;

    const paymentValues = [
      userId, temppaymentId, paymentId, amount, amount, addedon, currency, processing_fee, payment_mode, paymenttype_id, paymentstatus_id, conference_fees, tax, addon_fees// This should indicate the payment status
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


  const [userDetails] = await pool.query(
    `SELECT cs_first_name AS firstName, cs_last_name AS lastName, cs_phone AS mobile, cs_email AS email, cs_city AS city,cs_ticket as csTicket
     FROM cs_os_users 
     WHERE id = ?`,
    [userId]
  );

  const csTicket = parseInt(userDetails[0].csTicket, 10); // Convert to an integer with base 10
  console.log("Ticket ID:", csTicket);
  if (csTicket) {
    console.log("Ticket ID:", csTicket);

    try {
      // Query the `cs_reg_tickets` table to get `reg_typeid` and `residentional_type`
      const [ticketResult] = await pool.query(
        `SELECT reg_typeid, residentional_type FROM cs_reg_tickets WHERE ticket_id = ?`,
        [csTicket]
      );

      console.log("Ticket Query Result:", ticketResult);

      if (ticketResult.length > 0) {
        const { reg_typeid, residentional_type } = ticketResult[0];

        console.log("Retrieved reg_typeid:", reg_typeid);
        console.log("Retrieved residentional_type:", residentional_type);
        if (reg_typeid === '1' && residentional_type === 1) {

          const updateUserWithTwinsharingQuery = `
        UPDATE cs_os_users
        SET is_twinsharing = ?
        WHERE id = ?
      `;

          try {
            await pool.query(updateUserWithTwinsharingQuery, [1, userId]);
            console.log("Updated is_twinsharing flag in cs_os_users");
          } catch (error) {
            console.error("Error updating is_twinsharing flag in cs_os_users:", error);
          }


        } else if (reg_typeid === '1' && residentional_type === 2) {
          // Handle case for residentional_type === 2 if needed
          if (userDetails.length > 0) {
            const user = userDetails[0];
            console.log("User Details:", user);

            // Insert retrieved user details into `cs_reg_partner` or other relevant table
            const insertPartnerQuery = `
            INSERT INTO cs_reg_partner (p1_userid, p1_name, p1_city, p1_email, p1_phone, Ticketid)
            VALUES (?, ?, ?, ?, ?, ?)
          `;
            const partnerName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

            await pool.query(insertPartnerQuery, [
              userId,
              partnerName,
              user.city,
              user.email,
              user.mobile,
              csTicket
            ]);
            console.log("User details inserted successfully into cs_reg_partner");
          } else {
            console.log("No user found for the given userId");
          }
        }





      } else {
        console.log("No matching ticket found for the provided cs_ticket");
      }
    } catch (error) {
      console.error("Error querying cs_reg_tickets:", error);
      res.status(500).json({ success: false, message: 'Error processing ticket data', error: error.message });
      return;
    }
  } else {
    console.log("No cs_ticket provided in userData");
  }

  // Step 4: Redirect to the success page on the frontend
  // res.redirect(`https://projects.consoftservices.com/user/conirmdirectformpayment/Consoft?txnid=${txnid}&amount=${amount}`);
  // res.redirect(`http://localhost:3001/conirmdirectformpayment?txnid=${paymentId}&amount=${amount}`);

  const [userRow] = await pool.query('SELECT * FROM cs_os_users WHERE id = ?', [userId]);
  console.log("userRow", userRow);
  if (userRow.length > 0) {
    await sendConfirmEmail1(userRow[0]);

    // Update cs_confirmmail to 1 after successfully sending the email

    console.log("cs_confirmmail updated successfully for UserId:", userId); // Log success
  }




    res.redirect(`https://pcoacon2025.rnsevents.com/user/Thank-you-for-reg`);
  } catch (error) {
    // Handle errors
    console.error('Error confirming payment:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error confirming payment", 
      error: error.message 
    });
  }
});




module.exports = router