const express = require('express');
const router = express.Router();
const { pool } = require('../../config/database'); // Adjust the path to your db configuration

// Middleware to verify token
const verifyToken = require('../api/middleware/authMiddleware');
  
// Route to fetch colors
router.get('/colors', verifyToken, async (req, res) => {
    try {
        const sql = 'SELECT `color_id`, `color_elements`, `light_color_code`, `dark_color_code`, `status` FROM `cs_app_color` WHERE color_elements != "backgroundColor"';
        const [rows] = await pool.query(sql); // Use await to resolve the promise
        // console.log('Fetched colors:', rows); // Log fetched data for debugging
        res.json(rows); // Send response with fetched rows
    } catch (error) {
        console.error('Error fetching colors:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/colors/:colorId', verifyToken, async (req, res) => {
    const colorId = req.params.colorId;
    const { light_color_code, dark_color_code } = req.body;

    try {
        // Query to fetch the current color elements
        const fetchSql = 'SELECT color_elements FROM cs_app_color WHERE color_id = ?';
        const [rows] = await pool.query(fetchSql, [colorId]);
        const colorElement = rows[0].color_elements;

        // Update query
        let updateSql = 'UPDATE `cs_app_color` SET `light_color_code` = ?, `dark_color_code` = ? WHERE `color_id` = ?';

        // If the color element is 'pageBackgroundColor', update `backgroundColor` as well
        if (colorElement === 'pageBackgroundColor') {
            updateSql = `
                UPDATE \`cs_app_color\`
                SET 
                    \`light_color_code\` = ?,
                    \`dark_color_code\` = ?,
                    \`light_color_code\` = CASE WHEN \`color_elements\` = 'backgroundColor' THEN ? ELSE \`light_color_code\` END,
                    \`dark_color_code\` = CASE WHEN \`color_elements\` = 'backgroundColor' THEN ? ELSE \`dark_color_code\` END
                WHERE \`color_id\` = ? OR \`color_elements\` = 'backgroundColor'
            `;
            await pool.query(updateSql, [light_color_code, dark_color_code, light_color_code, dark_color_code, colorId]);
        } else {
            await pool.query(updateSql, [light_color_code, dark_color_code, colorId]);
        }

        res.json({ message: 'Color updated successfully' });
    } catch (error) {
        console.error('Error updating color:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;
