const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const moment = require('moment-timezone');
const verifyToken = require('../api/middleware/authMiddleware');
const queueMiddleware = require('../api/middleware/queueMiddleware');
const ExcelJS = require('exceljs');
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


// API to get payment list
router.get('/getPaymentData', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = '', sortColumn = 'payment_id', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * pageSize;

    console.log("Search", search);

    const validColumns = [
      'payment_id', 'temppayment_id', 'user_id', 'paymenttype_id', 'addon_fees',
      'conference_fees', 'processing_fee', 'cheque_no', 'bank', 'branch',
      'payment_date', 'current_paid_amount', 'regamount', 'currency',
      'total_paid_amount', 'order_id', 'tracking_id', 'payment_mode',
      'note', 'status', 'created_at', 'updated_at', 'cs_regno'
    ];
    const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'payment_id';

    let query = `SELECT p.*, 
                        u.cs_regno, u.cs_first_name, u.cs_last_name, u.cs_email, u.updated_at,
                        u.cs_ticket, u.cs_addons, u.cs_reg_cat_id, u.cs_state, u.cs_reg_category, u.cs_address,
                        t.ticket_title,
                        a.addon_title,
                        m.paymenttype_name
                 FROM cs_reg_payment p
                 INNER JOIN cs_reg_payment_type m ON p.paymenttype_id = m.paymenttype_id 
                 INNER JOIN cs_os_users u ON p.user_id = u.id
                 LEFT JOIN cs_reg_tickets t ON u.cs_ticket = t.ticket_id
                 LEFT JOIN cs_reg_add_ons a ON u.cs_addons = a.addon_id`;

    if (search) {
      const searchTerms = search.split(' ').filter(term => term.trim() !== '');
      if (searchTerms.length === 1) {
        query += `
        WHERE (u.cs_first_name LIKE '%${searchTerms[0]}%' 
        OR u.cs_last_name LIKE '%${searchTerms[0]}%'
        OR p.payment_id LIKE '%${searchTerms[0]}%'
        OR u.cs_regno LIKE '%${searchTerms[0]}%'
        OR p.order_id LIKE '%${searchTerms[0]}%'
        OR p.payment_mode LIKE '%${searchTerms[0]}%')`;
      } else {
        query += `
        WHERE (
          u.cs_first_name LIKE '%${searchTerms[0]}%' 
          AND u.cs_last_name LIKE '%${searchTerms.slice(1).join(' ')}%'
        )
        OR (
          CONCAT(u.cs_first_name, ' ', u.cs_last_name) LIKE '%${search}%'
        )
        OR p.payment_id LIKE '%${search}%'
        OR u.cs_regno LIKE '%${search}%'
        OR p.order_id LIKE '%${search}%'
        OR p.payment_mode LIKE '%${search}%'
        `;
      }
    }

    query += `
      ORDER BY ${columnToSortBy} ${sortOrder}
      LIMIT ${pageSize} OFFSET ${offset}
    `;
    
    const [paymentData] = await pool.query(query);

    // console.log("Paymentt Data", paymentData)

    const gstinclded = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "GST_Include"`;
    const processinginclded = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "processing_fee_IncludeExclude"`;
    const processingfee = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "processing_fees"`;
    const processingfee_in = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "processing_fees_in"`;
    const gstfee = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "GST"`;
    const IGSTfee = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "IGST"`;
    const State = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Organization State"`;



    // Execute Queries
    const [gstIncludedData] = await pool.query(gstinclded);
    const [processingIncludedData] = await pool.query(processinginclded);
    const [processingFeeData] = await pool.query(processingfee);
    const [processingFeeInData] = await pool.query(processingfee_in);
    const [gstFeeData] = await pool.query(gstfee);
    const [igstFeeData] = await pool.query(IGSTfee);
    const [state] = await pool.query(State);

    const stateNameQuery = `
    SELECT cs_state_name 
    FROM cs_tbl_states 
    WHERE cs_state_id = ?
`;

    // Execute the query with the cs_value from the previous result
    const [stateNameData] = await pool.query(stateNameQuery, [state[0].cs_value]);

    // Log the result
    console.log("State Name:", stateNameData);


    console.log("GST fee", gstFeeData);
    console.log("Processing fee", processingFeeData);
    console.log("Processing fee in", processingFeeInData);
    console.log("Processing fee included", processingIncludedData);
    console.log("State", state);


    // Extract Values
    const gstIncluded = gstIncludedData[0]?.cs_value || null; // e.g., "Yes" or "No"
    const processingIncluded = processingIncludedData[0]?.cs_value || null;
    const processingFee = processingFeeData[0]?.cs_value || null; // Ensure numeric
    const processingFeeIn = processingFeeInData[0]?.cs_value || null; // e.g., "INR" or "USD"
    const gstFee = gstFeeData[0]?.cs_value || null; // e.g., "Yes" or "No"
    const IGST = parseFloat(igstFeeData[0]?.cs_value || 0); // Ensure numeric
    const State_name = stateNameData[0]?.cs_state_name || null;


    console.log("Processing Fee Value:", processingFee);
    console.log("State:", State_name);
    console.log("User State:", paymentData.cs_state);



    // Add GST calculations to each payment record
    const updatedPaymentData = paymentData.map(payment => {
      let gst_amount = null;
      let total_amount = null;
      let cgst_amount = null;
      let sgst_amount = null;
      let isStateMatched = false; // Flag to identify state match


      // Check if GST fee is applicable
      if (gstFee === 'Yes') {
        console.log("GST Fee is applicable");

        if (gstIncluded) {
          console.log("GST is included");

          if (processingFee === 'Yes') {
            console.log("Processing fee exists");

            if (processingIncluded === 'Include') {
              console.log("Processing fee is included");

              // Add processing fee to the calculation of GST and total amount
              let totalPaidAmount = parseFloat(payment.total_paid_amount || 0);
              let processingFeeAmount = parseFloat(payment.processing_fee || 0);
              console.log(`Processing fee is included, total paid amount: ${totalPaidAmount}, processing fee: ${processingFeeAmount}`);

              gst_amount = (parseFloat(payment.conference_fees || 0) * IGST) / 100; // Add processing fee to GST calculation
              total_amount = (totalPaidAmount - processingFeeAmount) + gst_amount;
              console.log(`GST amount: ${gst_amount}, Total amount: ${total_amount}`);
            } else if (processingIncluded === 'Exclude') {
              console.log("Processing fee is excluded");

              // Calculate GST and total without the processing fee
              let totalPaidAmountWithoutFee = parseFloat(payment.total_paid_amount || 0) - parseFloat(payment.processing_fee || 0);
              console.log(`Processing fee is excluded, total paid amount without fee: ${totalPaidAmountWithoutFee}`);

              gst_amount = (parseFloat(payment.conference_fees || 0) * IGST) / 100; // GST only on conference fees
              total_amount = parseFloat(payment.conference_fees || 0) + gst_amount;
              console.log(`GST amount: ${gst_amount}, Total amount: ${total_amount}`);
            }
          } else {
            console.log("No processing fee, calculating based on conference fees");

            // If no processing fee exists, just calculate based on conference fees
            gst_amount = (parseFloat(payment.conference_fees || 0) * IGST) / 100;
            total_amount = parseFloat(payment.conference_fees || 0) + gst_amount;
            console.log(`GST amount: ${gst_amount}, Total amount: ${total_amount}`);
          }

        } else {
          console.log("GST is not included");

          // If GST is not included, calculate it on conference fees alone
          gst_amount = (parseFloat(payment.conference_fees || 0) * IGST) / 100;
          total_amount = parseFloat(payment.conference_fees || 0) + gst_amount;
          console.log(`GST amount: ${gst_amount}, Total amount: ${total_amount}`);
        }

        // Check for CGST and SGST when the state matches
        if (payment.cs_state === State_name) {
          console.log("State matches. Calculating CGST and SGST");
          cgst_amount = (parseFloat(payment.conference_fees || 0) * (IGST / 2)) / 100;
          sgst_amount = (parseFloat(payment.conference_fees || 0) * (IGST / 2)) / 100;
          console.log(`CGST amount: ${cgst_amount}, SGST amount: ${sgst_amount}`);

          // Set the flag to indicate the state matched
          isStateMatched = true;
        }
      } else {
        console.log("GST Fee is not applicable");
        total_amount = parseFloat(payment.conference_fees || 0);

      }

      // Return the updated payment object with calculated values
      return {
        ...payment,
        gst_amount: gst_amount?.toFixed(2) || null,
        cgst_amount: cgst_amount?.toFixed(2) || null,
        sgst_amount: sgst_amount?.toFixed(2) || null,
        total_amount: total_amount?.toFixed(2) || null,
        isStateMatched,
        // total_amount,
        GST_Include: gstIncluded,
        GST_Fee: gstFee,
        IGST: IGST
      };
    });

    // console.log("Updated Payment Data", updatedPaymentData);


    const totalCountQuery = 'SELECT COUNT(*) AS total FROM cs_reg_payment';
    const [totalCountResult] = await pool.query(totalCountQuery);
    const totalItems = totalCountResult[0].total;
    const totalPages = Math.ceil(totalItems / pageSize);

    res.json({ data: updatedPaymentData, currentPage: parseInt(page), totalPages, pageSize, totalItems });
  } catch (error) {
    console.error('Error fetching payment data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



router.get('/getDropdownData', verifyToken, async (req, res) => {
  try {
    // Specify the columns you want to fetch from each table
    console.log("hello");
    const facilitytype = ['cs_type'];
    const prefix = ['cs_prefix', 'cs_prefix_id'];
    const country = ['cs_country', 'cs_countryCode', 'cs_currencyCode'];
    const states = ['cs_state_name', 'cs_state_id', 'cs_country_id'];
    const reg_cat = ['cs_reg_category', 'cs_reg_cat_id'];
    const work_cat = ['cs_workshop_name', 'cs_workshop_id'];
    const day_type = ['cs_reg_daytype_name', 'cs_reg_daytype_id'];
    const facultytype = ['type_title', 'facultytype_id'];
    const registrationtype = ['reg_typeid', 'cs_reg_type_name']

    const custom_data = ['cs_field_option', 'cs_field_option_value, cs_field_option_id, cs_field_id'];


    // Execute each query to fetch data from respective tables
    const [facilitytypeData] = await pool.query(`SELECT ${facilitytype.join(',')} FROM cs_os_facilitytype`);
    const [prefixData] = await pool.query(`SELECT ${prefix.join(',')} FROM cs_os_name_prefixes`);
    const [countryData] = await pool.query(`SELECT ${country.join(',')} FROM cs_tbl_country`);
    const [statesData] = await pool.query(`SELECT ${states.join(',')} FROM cs_tbl_states`);
    const [regCatData] = await pool.query(`SELECT ${reg_cat.join(',')} FROM cs_os_category WHERE cs_status = 1`);
    const [registrationcategory] = await pool.query(`SELECT ${registrationtype.join(',')} FROM cs_reg_type WHERE status = 1`);
    const [workshopData] = await pool.query(`SELECT ${work_cat.join(',')} FROM cs_os_workshop WHERE cs_status = 1`);
    const [dayTypeData] = await pool.query(`SELECT ${day_type.join(',')} FROM cs_os_reg_daytype WHERE cs_status = 1`);
    const [facultytypeData] = await pool.query(`SELECT ${facultytype.join(',')} FROM cs_app_facultytype WHERE status = 1`);

    const [customData] = await pool.query(`SELECT ${custom_data.join(',')} FROM cs_os_field_option WHERE cs_status = 1`);
    const [currencyData] = await pool.query(`
      SELECT DISTINCT ${country.join(',')} 
      FROM cs_tbl_country
      WHERE cs_currencyCode IS NOT NULL
    `);



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
      custom: customData,
      regtype: registrationcategory,
      currency: currencyData,
    };

    // Send the response containing data from all queries
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.put('/UpdateStatus', verifyToken, async (req, res) => {
  try {
    // Extract workshopId, status, and Name from the request body
    console.log(req.body);
    const { paymentId, status } = req.body;


    // Update cs_status in cs_os_workshop
    const updateQuery = `UPDATE cs_reg_payment SET status = ? WHERE payment_id = ?`;
    await pool.query(updateQuery, [status, paymentId]);

    // Update cs_status in cs_os_facilitytyp
    return res.status(200).json({ message: 'Status Updates successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/savePaymentDetails', verifyToken, async (req, res) => {
  const {
    orgDetail,
    identificationNumber,
    GST_Include,
    gst,
    cgst,
    sgst,
    igst,
    state,
    feeInclude,
    processingFee,
    feeType, // 'Amount' or 'Percentage'
    amount, // Only present if feeType is 'Amount'
    percentage, // Only present if feeType is 'Percentage'
    currency, // Only present if feeType is 'Amount'
    paymentMode,
    paymentGateway // Only present if paymentMode is 'Online' or 'Both'
  } = req.body;

  console.log("state", state);
  // List of parameters to update
  const parametersToUpdate = [
    { param: 'Organization Name', value: orgDetail },
    { param: 'GST No.', value: identificationNumber },
    { param: 'GST_Include', value: GST_Include },
    { param: 'GST', value: gst },
    { param: 'CGST', value: cgst },
    { param: 'SGST', value: sgst },
    { param: 'IGST', value: igst },
    { param: 'processing_fee_IncludeExclude', value: feeInclude },
    { param: 'Organization State', value: state },
    { param: 'Payment_mode', value: paymentMode },
    { param: 'currency', value: currency },
    { param: 'processing_fees', value: processingFee },
    { param: 'processing_fees_in', value: feeType },
    { param: 'payment_gateway', value: paymentGateway } // If payment mode is online or both
  ];

  // Add fee details based on fee type
  if (feeType === 'Amount') {
    parametersToUpdate.push(
      { param: 'Processing fee in %', value: amount },
    );
  } else if (feeType === 'Percentage') {
    parametersToUpdate.push(
      { param: 'Processing fee in %', value: percentage }
    );
  }

  // Update each parameter in the database
  try {
    // Run updates in parallel using Promise.all
    const updateQueries = parametersToUpdate
      .filter(paramObj => paramObj.value !== undefined && paramObj.value !== null) // filter out undefined/null values
      .map(paramObj => {
        const query = `UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter = ?`;
        return pool.query(query, [paramObj.value, paramObj.param]); // Return the query promise
      });

    await Promise.all(updateQueries); // Wait for all the queries to execute

    res.status(200).json({ message: 'Payment details saved successfully.' });
  } catch (err) {
    console.error('Error updating site settings:', err);
    res.status(500).json({ message: 'An error occurred while updating payment details.' });
  }
});

router.get('/getPaymentDetails', verifyToken, async (req, res) => {
  try {
    // Fetch payment-related settings from the database
    const query = `SELECT cs_parameter, cs_value FROM cs_tbl_sitesetting 
                   WHERE cs_parameter IN ('Organization Name', 'processing_fee_IncludeExclude', 'GST_Include', 'GST No.', 'GST', 'CGST', 'SGST', 'IGST', 'Organization State', 'Payment_mode', 'payment_gateway', 'processing_fees', 'currency', 'processing_fees_in','Processing fee in %')`;

    const [rows] = await pool.query(query);

    // Transform result to a key-value pair object
    const paymentDetails = {};
    rows.forEach(row => {
      paymentDetails[row.cs_parameter] = row.cs_value;
    });

    res.status(200).json({ data: paymentDetails });
  } catch (err) {
    console.error('Error fetching payment details:', err);
    res.status(500).json({ message: 'An error occurred while fetching payment details.' });
  }
});


router.post('/addPayment', verifyToken, async (req, res) => {
  console.log('Request Body:', req.body); // Log the incoming request body



  try {
    const UserId = req.body.paymentDetails.user_id; // Ensure this is being sent in the request
    const payment = req.body.paymentDetails;
    // const faculty = req.body.facultyDetails ? JSON.parse(req.body.facultyDetails) : {};

    console.log('User ID:', UserId); // Log UserId
    console.log('Payment Details:', payment); // Log payment details

    if (payment && Object.keys(payment).length > 0) {
      try {
        // Insert the payment data into cs_reg_payment
        const paymentColumns = Object.keys(payment);
        const paymentValues = Object.values(payment);

        const additionalColumn = 'status';
        const additionalValue = 1;

        paymentColumns.push(additionalColumn);
        paymentValues.push(additionalValue);

        // Prepare the SQL query
        const paymentInsertQuery = `
      INSERT INTO cs_reg_payment (${paymentColumns.join(', ')})
      VALUES (${paymentColumns.map(() => '?').join(', ')})
    `;

        // Execute the query
        await pool.query(paymentInsertQuery, paymentValues);
        console.log("Payment Insert Result:", paymentValues); // Log payment insert result

      } catch (paymentError) {
        console.error('Error inserting payment data:', paymentError);
        return res.status(500).json({ error: 'Error inserting payment data' });
      }
    }

    res.status(200).json({ success: true, message: "Payment added successfully" });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// Update payment endpoint
router.put('/updatePayment', verifyToken, async (req, res) => {
  console.log('Request Body:', req.body); // Log the incoming request body

  try {
    const { payment_id, ...paymentDetails } = req.body; // Ensure payment_id is part of the request body

    if (!payment_id) {
      return res.status(400).json({ error: 'Payment ID is required for updating.' });
    }

    console.log('Payment ID:', payment_id); // Log the payment ID
    console.log('Payment Details:', paymentDetails); // Log other payment details

    // Prepare columns for updating
    const updateColumns = Object.keys(paymentDetails).map((col) => `${col} = ?`);
    const updateValues = Object.values(paymentDetails);

    // Append the payment_id to the values for the WHERE clause
    updateValues.push(payment_id);

    // Prepare the SQL update query
    const updateQuery = `
          UPDATE cs_reg_payment
          SET ${updateColumns.join(', ')}
          WHERE payment_id = ?
      `;

    // Execute the update query
    await pool.query(updateQuery, updateValues);
    console.log("Payment Update Result:", updateValues); // Log update result

    res.status(200).json({ success: true, message: "Payment updated successfully" });
  } catch (error) {
    console.error('Error updating payment data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/editCatPack', verifyToken, async (req, res) => {
  console.log('Request Body:', req.body); // Log the incoming request body

  try {
    const { data: userData, Id: userId, paymentDetails: payment, sendEmail } = req.body;

    console.log('User ID:', userId); // Log UserId
    console.log('Payment Details:', payment); // Log payment details

    // Validate necessary data
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (userData && Object.keys(userData).length > 0) {
      // Update user data if provided
      try {
        const columns = Object.keys(userData).filter(key => key !== 'accompany_person_data');
        const values = columns.map(key => userData[key]);

        // Fetch cs_reg_cat_id based on cs_reg_category
        const [categoryResult] = await pool.query(
          'SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?',
          [userData.cs_reg_cat_id]
        );

        const csRegCat = categoryResult[0].cs_reg_category;

        const additionalColumn = 'cs_reg_category';
        const additionalValue = csRegCat;

        columns.push(additionalColumn);
        values.push(additionalValue);

        // SQL query with dynamic column assignments for the UPDATE statement
        const updateQuery = `
          UPDATE cs_os_users
          SET ${columns.map(col => `${col} = ?`).join(', ')}
          WHERE id = ?
        `;

        // Execute the query with dynamic values and userId at the end
        await pool.query(updateQuery, [...values, userId]);
        console.log("User update successful for ID:", userId);

      } catch (updateError) {
        console.error('Error updating user data:', updateError);
        return res.status(500).json({ error: 'Error updating user data' });
      }
    }

    if (userData.accompany_person_data) {
      try {
          const parsedData = JSON.parse(userData.accompany_person_data);
          const firstKey = Object.keys(parsedData)[0];
          const personArray = parsedData[firstKey];
  
          if (Array.isArray(personArray)) {
              // Separate new and existing records
              const newPersons = personArray.filter(person => !person.id || person.id === ""); // New entries
              const existingPersons = personArray.filter(person => person.id && person.id !== ""); // Existing entries
  
              // Insert new persons
              if (newPersons.length > 0) {
                  const insertAccperQuery = 'INSERT INTO cs_reg_accper (user_id, accper_name, accper_age) VALUES ?';
                  const insertData = newPersons.map(person => [userId, person.name, person.age || null]);
  
                  await pool.query(insertAccperQuery, [insertData]);
                  console.log('New accompanying persons inserted successfully');
              }
  
              // Update existing persons
              if (existingPersons.length > 0) {
                  for (const person of existingPersons) {
                      const updateAccperQuery = `
                          UPDATE cs_reg_accper
                          SET accper_name = ?, accper_age = ?
                          WHERE accper_id = ? AND user_id = ?
                      `;
                      await pool.query(updateAccperQuery, [person.name, person.age || null, person.id, userId]);
                  }
                  console.log('Existing accompanying persons updated successfully');
              }
          }
      } catch (error) {
          console.error('Error processing accompany_person_data:', error);
          return res.status(400).json({ message: 'Invalid JSON format for accompany_person_data' });
      }
  }
  

    

    // Insert payment details if they exist
    if (payment && Object.keys(payment).length > 0) {
      try {
        const paymentColumns = Object.keys(payment);
        const paymentValues = Object.values(payment);

        // Add status column with value 1
        paymentColumns.push('status');
        paymentValues.push(1);

        // Prepare the SQL insert query
        const paymentInsertQuery = `
          INSERT INTO cs_reg_payment (${paymentColumns.join(', ')})
          VALUES (${paymentColumns.map(() => '?').join(', ')})
        `;

        // Execute the query
        await pool.query(paymentInsertQuery, paymentValues);
        console.log("Payment Insert Result:", paymentValues); // Log payment insert result

      } catch (paymentError) {
        console.error('Error inserting payment data:', paymentError);
        return res.status(500).json({ error: 'Error inserting payment data' });
      }
    }

    // Sending changed package mail
    if (sendEmail) {
      try {
        const [userRow] = await pool.query('SELECT * FROM cs_os_users WHERE id = ?', [userId]);
        if (userRow.length > 0) {
          await sendChangepackageEmail(userRow[0]);

          console.log("Changed package mail send successfully for UserId:", userId); // Log success
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);

        return res.status(500).json({ error: 'Error sending email' });
      }
    }

    res.status(200).json({ success: true, message: "User and payment details updated successfully" });
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// router.post('/editCatPack', verifyToken, async (req, res) => {
//   try {
//       const { data: userData, Id: userId, paymentDetails: payment, sendEmail } = req.body;

//       // Validate necessary data
//       if (!userId) {
//           return res.status(400).json({ error: 'User ID is required' });
//       }

//       // Update user data
//       if (userData && Object.keys(userData).length > 0) {
//           try {
//               const columns = Object.keys(userData).filter(key => key !== 'accompany_person_data');
//               const values = columns.map(key => userData[key]);

//               // Fetch cs_reg_cat_id based on cs_reg_category
//               const [categoryResult] = await pool.query(
//                 'SELECT cs_reg_category FROM cs_os_category WHERE cs_reg_cat_id = ?',
//                 [userData.cs_reg_cat_id]
//               );

//               const csRegCat = categoryResult[0]?.cs_reg_category || null;

//               if (csRegCat) {
//                   columns.push('cs_reg_category');
//                   values.push(csRegCat);
//               }

//               const updateQuery = `
//                 UPDATE cs_os_users
//                 SET ${columns.map(col => `${col} = ?`).join(', ')}
//                 WHERE id = ?
//               `;

//               await pool.query(updateQuery, [...values, userId]);
//               console.log("User update successful for ID:", userId);

//           } catch (updateError) {
//               console.error('Error updating user data:', updateError);
//               return res.status(500).json({ error: 'Error updating user data' });
//           }
//       }

//       // Parse and handle accompany_person_data
//       if (userData.accompany_person_data) {
//           try {
//               const parsedData = JSON.parse(userData.accompany_person_data);
//               const firstKey = Object.keys(parsedData)[0];
//               const personArray = parsedData[firstKey];

//               if (Array.isArray(personArray)) {
//                   const insertAccperQuery = 'INSERT INTO cs_reg_accper (user_id, accper_name, accper_age) VALUES ?';
//                   const insertData = personArray.map(person => [userId, person.name, person.age || null]);

//                   await pool.query(insertAccperQuery, [insertData]);
//                   console.log('Accompanying persons inserted successfully');
//               }
//           } catch (error) {
//               console.error('Error processing accompany_person_data:', error);
//               return res.status(400).json({ message: 'Invalid JSON format for accompany_person_data' });
//           }
//       }

//       // Insert payment details if provided
//       if (payment && Object.keys(payment).length > 0) {
//           try {
//               const paymentColumns = Object.keys(payment);
//               const paymentValues = Object.values(payment);

//               paymentColumns.push('status');
//               paymentValues.push(1);

//               const paymentInsertQuery = `
//                 INSERT INTO cs_reg_payment (${paymentColumns.join(', ')})
//                 VALUES (${paymentColumns.map(() => '?').join(', ')})
//               `;

//               await pool.query(paymentInsertQuery, paymentValues);
//               console.log("Payment Insert Result:", paymentValues);

//           } catch (paymentError) {
//               console.error('Error inserting payment data:', paymentError);
//               return res.status(500).json({ error: 'Error inserting payment data' });
//           }
//       }

//       // Send email if required
//       if (sendEmail) {
//           try {
//               const [userRow] = await pool.query('SELECT * FROM cs_os_users WHERE id = ?', [userId]);
//               if (userRow.length > 0) {
//                   await sendChangepackageEmail(userRow[0]);
//                   console.log("Changed package mail sent successfully for UserId:", userId);
//               }
//           } catch (emailError) {
//               console.error('Error sending email:', emailError);
//               return res.status(500).json({ error: 'Error sending email' });
//           }
//       }

//       res.status(200).json({ success: true, message: "User and payment details updated successfully" });
//   } catch (error) {
//       console.error('Error processing request:', error);
//       return res.status(500).json({ error: 'Internal server error' });
//   }
// });


// Reuse Basic sendEmail function
const sendChangepackageEmail = async (userData, userId) => {
  const templateQuery = `SELECT template_content, template_subject FROM cs_tbl_email_template WHERE template_id = ?`;
  const [templateData] = await pool.query(templateQuery, [21]);

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

router.post('/getPayment', verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    const { userId } = req.body;


    const query = `
        SELECT *
        FROM cs_reg_payment
        WHERE user_id = ? 
        ORDER BY payment_date DESC
      `;

    // Execute the query to fetch pages data for the specified role_id
    const [paymentData] = await pool.query(query, [userId]);



    // Send the pages data as a response
    res.json(paymentData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/getReceipt', verifyToken, async (req, res) => {
  try {
    // Extract temp_id from the request body
    const { temp_id } = req.body;

    const query = `
        SELECT template_content
        FROM cs_tbl_email_template
        WHERE template_id = ? 
      `;

    // Execute the query to fetch data for the specified temp_id
    const [receiptData] = await pool.query(query, [temp_id]);


    const settingquery = `
    SELECT cs_parameter, cs_value
    FROM cs_tbl_sitesetting
    WHERE cs_parameter IN ('payment_receipt_head', 'payment_receipt_foot')
`;

    // Execute the query to fetch setting data
    const [rows] = await pool.query(settingquery);

    // Map results to the desired format
    const settingData = {
      header: rows.find(row => row.cs_parameter === 'payment_receipt_head')?.cs_value || null,
      footer: rows.find(row => row.cs_parameter === 'payment_receipt_foot')?.cs_value || null,
    };

    // Ensure receiptData exists and send only the content
    if (receiptData && receiptData.length > 0) {
      res.json({ htmlContent: receiptData[0].template_content, settingData });
    } else {
      res.status(404).json({ message: 'Template not found' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



router.delete('/deletePayment', verifyToken, async (req, res) => {
  const { exhId, exhName } = req.body;


  try {
    // Delete from cs_os_workshop table
    const deleteQuery = 'DELETE FROM cs_reg_payment WHERE payment_id = ?';
    await pool.query(deleteQuery, [exhId]);

    console.log(`Payment with ID ${exhId} deleted successfully.`);
    res.status(200).json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting workshop:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



router.post('/getUserReceipt', verifyToken, async (req, res) => {
  try {
    const { UserId } = req.body;

    let query = `SELECT p.*, 
                        u.cs_regno, u.cs_first_name, u.cs_last_name, u.cs_email, u.updated_at,
                        u.cs_ticket, u.cs_addons, u.cs_reg_cat_id, u.cs_state, u.cs_address,
                        t.ticket_title,
                        a.addon_title,
                        m.paymenttype_name
                 FROM cs_reg_payment p
                 INNER JOIN cs_reg_payment_type m ON p.paymenttype_id = m.paymenttype_id 
                 INNER JOIN cs_os_users u ON p.user_id = u.id
                 LEFT JOIN cs_reg_tickets t ON u.cs_ticket = t.ticket_id
                 LEFT JOIN cs_reg_add_ons a ON u.cs_addons = a.addon_id
                 WHERE p.user_id = ?`;

    const [paymentData] = await pool.query(query, [UserId]);

    const gstinclded = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "GST_Include"`;
    const processinginclded = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "processing_fee_IncludeExclude"`;
    const processingfee = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "processing_fees"`;
    const processingfee_in = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "processing_fees_in"`;
    const gstfee = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "GST"`;
    const IGSTfee = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "IGST"`;
    const State = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = "Organization State"`;



    // Execute Queries
    const [gstIncludedData] = await pool.query(gstinclded);
    const [processingIncludedData] = await pool.query(processinginclded);
    const [processingFeeData] = await pool.query(processingfee);
    const [processingFeeInData] = await pool.query(processingfee_in);
    const [gstFeeData] = await pool.query(gstfee);
    const [igstFeeData] = await pool.query(IGSTfee);
    const [state] = await pool.query(State);

    const stateNameQuery = `
    SELECT cs_state_name 
    FROM cs_tbl_states 
    WHERE cs_state_id = ?
`;

    // Execute the query with the cs_value from the previous result
    const [stateNameData] = await pool.query(stateNameQuery, [state[0].cs_value]);

    // Log the result
    console.log("State Name:", stateNameData);


    console.log("GST fee", gstFeeData);
    console.log("Processing fee", processingFeeData);
    console.log("Processing fee in", processingFeeInData);
    console.log("Processing fee included", processingIncludedData);
    console.log("State", state);


    // Extract Values
    const gstIncluded = gstIncludedData[0]?.cs_value || null; // e.g., "Yes" or "No"
    const processingIncluded = processingIncludedData[0]?.cs_value || null;
    const processingFee = processingFeeData[0]?.cs_value || null; // Ensure numeric
    const processingFeeIn = processingFeeInData[0]?.cs_value || null; // e.g., "INR" or "USD"
    const gstFee = gstFeeData[0]?.cs_value || null; // e.g., "Yes" or "No"
    const IGST = parseFloat(igstFeeData[0]?.cs_value || 0); // Ensure numeric
    const State_name = stateNameData[0]?.cs_state_name || null;


    console.log("Processing Fee Value:", processingFee);
    console.log("State:", State_name);


    // Add GST calculations to each payment record
    const updatedPaymentData = paymentData.map(payment => {
      let gst_amount = null;
      let total_amount = null;
      let cgst_amount = null;
      let sgst_amount = null;
      let isStateMatched = false; // Flag to identify state match


      // Check if GST fee is applicable
      if (gstFee === 'Yes') {
        console.log("GST Fee is applicable");

        if (gstIncluded) {
          console.log("GST is included");

          if (processingFee === 'Yes') {
            console.log("Processing fee exists");

            if (processingIncluded === 'Include') {
              console.log("Processing fee is included");

              // Add processing fee to the calculation of GST and total amount
              let totalPaidAmount = parseFloat(payment.total_paid_amount || 0);
              let processingFeeAmount = parseFloat(payment.processing_fee || 0);
              console.log(`Processing fee is included, total paid amount: ${totalPaidAmount}, processing fee: ${processingFeeAmount}`);

              gst_amount = (parseFloat(payment.conference_fees || 0) * IGST) / 100; // Add processing fee to GST calculation
              total_amount = (totalPaidAmount - processingFeeAmount) + gst_amount;
              console.log(`GST amount: ${gst_amount}, Total amount: ${total_amount}`);
            } else if (processingIncluded === 'Exclude') {
              console.log("Processing fee is excluded");

              // Calculate GST and total without the processing fee
              let totalPaidAmountWithoutFee = parseFloat(payment.total_paid_amount || 0) - parseFloat(payment.processing_fee || 0);
              console.log(`Processing fee is excluded, total paid amount without fee: ${totalPaidAmountWithoutFee}`);

              gst_amount = (parseFloat(payment.conference_fees || 0) * IGST) / 100; // GST only on conference fees
              total_amount = parseFloat(payment.conference_fees || 0) + gst_amount;
              console.log(`GST amount: ${gst_amount}, Total amount: ${total_amount}`);
            }
          } else {
            console.log("No processing fee, calculating based on conference fees");

            // If no processing fee exists, just calculate based on conference fees
            gst_amount = (parseFloat(payment.conference_fees || 0) * IGST) / 100;
            total_amount = parseFloat(payment.conference_fees || 0) + gst_amount;
            console.log(`GST amount: ${gst_amount}, Total amount: ${total_amount}`);
          }

        } else {
          console.log("GST is not included");

          // If GST is not included, calculate it on conference fees alone
          gst_amount = (parseFloat(payment.conference_fees || 0) * IGST) / 100;
          total_amount = parseFloat(payment.conference_fees || 0) + gst_amount;
          console.log(`GST amount: ${gst_amount}, Total amount: ${total_amount}`);
        }

        // Check for CGST and SGST when the state matches
        if (payment.cs_state === State_name) {
          console.log("State matches. Calculating CGST and SGST");
          cgst_amount = (parseFloat(payment.conference_fees || 0) * (IGST / 2)) / 100;
          sgst_amount = (parseFloat(payment.conference_fees || 0) * (IGST / 2)) / 100;
          console.log(`CGST amount: ${cgst_amount}, SGST amount: ${sgst_amount}`);

          // Set the flag to indicate the state matched
          isStateMatched = true;
        }
      } else {
        console.log("GST Fee is not applicable");
        total_amount = parseFloat(payment.conference_fees || 0);

      }

      // Return the updated payment object with calculated values
      return {
        ...payment,
        gst_amount: gst_amount?.toFixed(2) || null,
        cgst_amount: cgst_amount?.toFixed(2) || null,
        sgst_amount: sgst_amount?.toFixed(2) || null,
        total_amount: total_amount?.toFixed(2) || null,
        isStateMatched,
        // total_amount,
        GST_Include: gstIncluded,
        GST_Fee: gstFee,
        IGST: IGST
      };
    });

    console.log("Updated Payment Data", updatedPaymentData);


    res.json({ data: updatedPaymentData });
  } catch (error) {
    console.error('Error fetching payment data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


router.post('/accompanypersons', verifyToken, async (req, res) => {
  const { Id } = req.body; // Use req.body for POST request

  const query = `
      SELECT accper_id, accper_name, accper_age
      FROM cs_reg_accper
      WHERE user_id = ?
  `;

  try {
      const [receiptData] = await pool.query(query, [Id]);

      console.log("receiptData",receiptData);

      // Send the data back to the frontend
        res.status(200).json({ receiptData }); // Ensure the key is "receiptData" (corrected)
  } catch (error) {
      console.error("Database query error:", error);
      res.status(500).json({ message: 'Server error' });
  }
});


//Get lock status
router.get('/getLockStatus', verifyToken, async (req, res) => {
  try {

    const columnsToFetch = ['*'];


    let query = `
    SELECT ${columnsToFetch}
    FROM cs_tbl_sitesetting
    WHERE cs_parameter = 'Payment Lock'
  `;

    // Execute the query to fetch field data from the table
    const [lockData] = await pool.query(query);


    res.json({ Lock: lockData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to update lock status
router.post('/updateLockStatus', verifyToken, async (req, res) => {
  try {
    const { cs_value } = req.body; // Assuming lockValue is passed in the request body

    const id = 45;

    console.log("Status", cs_value)

    // // Validate lockValue (optional)
    // if (cs_value !== 0 && cs_value !== 1) {
    //   return res.status(400).json({ message: 'Invalid lock value. Must be 0 or 1.' });
    // }

    // Update query
    const query = `
      UPDATE cs_tbl_sitesetting
      SET cs_value = ?
      WHERE cs_parameter = 'Payment Lock'
    `;

    // Execute the update query
    const [pagesData] = await pool.query(query, [cs_value]);

    // Send the pages data as a response
    res.json(pagesData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});









module.exports = router;