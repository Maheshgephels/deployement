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
            WHERE cs_status IN (1, 2)
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
                    ELSE a.addon_title 
                END AS cs_addons,
                p.confirm_payment,
                q.is_cancel
            FROM cs_os_users u
            LEFT JOIN cs_reg_temp_payment p ON u.id = p.user_id
            LEFT JOIN cs_reg_payment q ON u.id = q.user_id
            LEFT JOIN cs_reg_tickets r ON u.cs_ticket = r.ticket_id
            LEFT JOIN cs_reg_add_ons a ON u.cs_addons = a.addon_id
            WHERE u.cs_isduplicate = 0
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
                u.cs_ticket, u.cs_addons, u.cs_reg_cat_id, u.cs_reg_category, u.cs_phone,
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

        // Respond with JSON containing fetched data
        res.json({ userData });
    } catch (error) {
        // Handle errors and respond with a 500 status code
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});






module.exports = router;