// timezone.js
const moment = require('moment-timezone');
const { pool } = require('../../config/database');

async function getFormattedTimestamp() {
  try {
    // Retrieve the timezone from the database
    const [rows] = await pool.query(`SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = 'Time Zone'`);
    const timezone = rows.length > 0 ? rows[0].cs_value : 'Asia/Kolkata'; // Default to UTC if not found

    // Format the current time in the specified timezone
    return moment().tz(timezone).format('YYYY-MM-DD HH:mm:ss');
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return moment().tz('UTC').format('YYYY-MM-DD HH:mm:ss'); // Default to UTC if an error occurs
  }
}

module.exports = getFormattedTimestamp;
