const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const moment = require('moment-timezone');
// const verifyToken = require('./middleware/authMiddleware');
const verifyToken = require('../api/middleware/authMiddleware');


router.get('/getConfirmUserData', verifyToken, async (req, res) => {
  try {

    // Construct the SQL query to fetch specific columns with pagination and search
    let headerQuery = `
            SELECT cs_field_name, cs_field_label
            FROM cs_os_field_data
            WHERE cs_status IN (1, 3)
            AND (cs_visible_reg_adminform = 1 OR cs_field_id IN (1, 97, 98))
            ORDER BY cs_field_order;
        `;

    const [fieldData] = await pool.query(headerQuery);

    // Log the count of fieldData
    console.log("Number of Field Data:", fieldData.length);

    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
    SELECT 
        u.*,  
        CASE 
            WHEN u.cs_ticket IS NULL THEN '' 
            ELSE r.ticket_title 
        END AS cs_ticket,
        CASE 
            WHEN u.cs_addons IS NULL THEN '' 
            WHEN u.cs_addons LIKE '%,%' THEN 
                -- Dynamically fetch add-on names for multiple add-ons
                GROUP_CONCAT(a.addon_title SEPARATOR ', ') 
            ELSE a.addon_title 
        END AS cs_addons,
        p.confirm_payment,
        q.is_cancel
    FROM cs_os_users u
    LEFT JOIN cs_reg_temp_payment p ON u.id = p.user_id
    LEFT JOIN cs_reg_payment q ON u.id = q.user_id
    LEFT JOIN cs_reg_tickets r ON u.cs_ticket = r.ticket_id
    LEFT JOIN cs_reg_add_ons a ON FIND_IN_SET(a.addon_id, u.cs_addons) > 0 -- This handles the matching of multiple add-on IDs
    WHERE u.cs_isduplicate = 0
    GROUP BY u.id
    ORDER BY u.id DESC
`;



    // Execute the query to fetch user data
    const [userData] = await pool.query(query);

    // Log the count of userData
    console.log("Number of User Data:", userData.length);

    // Respond with JSON containing fetched data
    res.json({ userData, fieldData });
  } catch (error) {
    // Handle errors and respond with a 500 status code
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/getPaymentData', verifyToken, async (req, res) => {
  try {

    let query = `
            SELECT p.*, 
                u.cs_regno, u.cs_first_name, u.cs_last_name, u.cs_email, u.updated_at,
                u.cs_ticket, u.cs_addons, u.cs_reg_cat_id, u.cs_reg_category, u.cs_phone, u.cs_state,
                t.ticket_title,
                a.addon_title,
                m.paymenttype_name,
                s.paymentstatus_name
            FROM cs_reg_payment p
            INNER JOIN cs_reg_payment_type m ON p.paymenttype_id = m.paymenttype_id 
            INNER JOIN cs_reg_payment_status s ON p.paymentstatus_id = s.paymentstatus_id 
            INNER JOIN cs_os_users u ON p.user_id = u.id
            LEFT JOIN cs_reg_tickets t ON u.cs_ticket = t.ticket_id
            LEFT JOIN cs_reg_add_ons a ON u.cs_addons = a.addon_id
            WHERE p.status IN (0, 1)
        `;



    // Execute the query to fetch field data from the table
    const [userData] = await pool.query(query);

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
    const updatedPaymentData = userData.map(payment => {
      let gst_amount = null;
      let total_amount = null;
      let cgst_amount = null;
      let sgst_amount = null;
      let igst_amount = null;
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
              igst_amount = (parseFloat(payment.conference_fees || 0) * IGST) / 100;
              total_amount = (totalPaidAmount - processingFeeAmount) + gst_amount;
              console.log(`GST amount: ${gst_amount}, Total amount: ${total_amount}`);
            } else if (processingIncluded === 'Exclude') {
              console.log("Processing fee is excluded");

              // Calculate GST and total without the processing fee
              let totalPaidAmountWithoutFee = parseFloat(payment.total_paid_amount || 0) - parseFloat(payment.processing_fee || 0);
              console.log(`Processing fee is excluded, total paid amount without fee: ${totalPaidAmountWithoutFee}`);

              gst_amount = (parseFloat(payment.conference_fees || 0) * IGST) / 100; // GST only on conference fees
              igst_amount = (parseFloat(payment.conference_fees || 0) * IGST) / 100;
              total_amount = parseFloat(payment.conference_fees || 0) + gst_amount;
              console.log(`GST amount: ${gst_amount}, Total amount: ${total_amount}`);
            }
          } else {
            console.log("No processing fee, calculating based on conference fees");

            // If no processing fee exists, just calculate based on conference fees
            gst_amount = (parseFloat(payment.conference_fees || 0) * IGST) / 100;
            igst_amount = (parseFloat(payment.conference_fees || 0) * IGST) / 100;
            total_amount = parseFloat(payment.conference_fees || 0) + gst_amount;
            console.log(`GST amount: ${gst_amount}, Total amount: ${total_amount}`);
          }

        } else {
          console.log("GST is not included");

          // If GST is not included, calculate it on conference fees alone
          gst_amount = (parseFloat(payment.conference_fees || 0) * IGST) / 100;
          igst_amount = (parseFloat(payment.conference_fees || 0) * IGST) / 100;
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
        igst_amount: igst_amount?.toFixed(2) || null,
        total_amount: total_amount?.toFixed(2) || null,
        isStateMatched,
        // total_amount,
        GST_Include: gstIncluded,
        GST_Fee: gstFee,
        IGST: IGST
      };
    });

    console.log("Updated Payment Data", updatedPaymentData);

    // Respond with JSON containing fetched data
    res.json({ userData, updatedPaymentData });
  } catch (error) {
    // Handle errors and respond with a 500 status code
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});






module.exports = router;