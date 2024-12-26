const express = require('express');
const router = express.Router();
const { pool } = require('../../config/database'); // Assuming db is your database configuration
const { pool } = db.pool; // Access the pool from your database configuration
const verifyToken =require ('../api/middleware/authMiddleware');

router.get('/widgetdatachart',verifyToken, async (req, res) => {
    try {
        // Query to fetch counts for all facilities from cs_os_facility_detail table
        const query = `
            SELECT 
                fd.cs_facility_name AS title, 
                SUM(CASE WHEN br.cs_type IS NOT NULL THEN 1 ELSE 0 END) AS total, 
                fd.cs_facility_name AS facilityType
            FROM 
                cs_os_facility_detail fd 
            LEFT JOIN 
                cs_os_badgerecords br ON fd.cs_facility_name = br.cs_type 
            WHERE 
                fd.cs_status = 1 
            GROUP BY 
                fd.cs_facility_name;
        `;

        // Execute the query using promises
        const [result] = await pool.query(query);

        // Rest of your code...
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

module.exports = router;
