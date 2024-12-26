const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');
const { pool, pool2 } = require('../../config/database');
const multer = require('multer');
const verifyToken = require('../api/middleware/authMiddleware');
const queueMiddleware = require('../api/middleware/queueMiddleware');
const path = require('path');


// Set up multer for file uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'app-icon/') // Specify the directory where files will be uploaded
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname) // Use the original file name for the uploaded file
//   }
// });

// const upload = multer({ storage: storage });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    if (file.fieldname === 'logoimage') {
      uploadPath = 'Header_Footer/'; // Save 'Facultycv' files to 'faculty-cv' directory
    } else {
      uploadPath = 'Header_Footer/'; // Save other files to 'faculty-profile' directory
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const dName = "app"; // Extract the name from the request body
    const dateTime = new Date().toLocaleString('en-US', { hour12: false }).replace(/[^\w\s]/gi, '').replace(/ /g, '_'); // Get current date and time in a formatted string without AM/PM
    let filename;
    if (file.fieldname === 'logoimage') {
      filename = `${dName}-header${path.extname(file.originalname)}`;
    } else if (file.fieldname === 'Facultycv') {
      filename = `${dName}-facultycv${path.extname(file.originalname)}`;
    } else {
      filename = `${dName}-footer${path.extname(file.originalname)}`;
    }
    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // optional, to set file size limit (e.g., 5MB)
});





router.get('/getSetting', verifyToken, async (req, res) => {
  try {
    // Query to fetch cs_value for id 38 from cs_tbl_sitesetting table
    const query = "SELECT cs_parameter,cs_value FROM cs_tbl_sitesetting WHERE cs_parameter IN ('Time Zone', 'Event Days', 'Event Name', 'Banner Image', 'Token Expiry Time')";

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


router.post('/updateSettings', verifyToken, upload.single('bannerimage'), async (req, res) => {
  const { tokenExpiryTime } = req.body;
  const bannerImagePath = req.file ? req.file.path : null; // Get the path of the uploaded banner image

  try {
    // Update settings in the database
    const updateQuery = `UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter = ?`;
    const queryParams = [];

    // Optionally, construct and execute queries based on available data
    if (bannerImagePath !== null) {
      await pool.query(updateQuery, [bannerImagePath, 'Banner Image']);
    }

    if (tokenExpiryTime) {
      // Convert token expiry time to seconds
      const totalSeconds = parseInt(tokenExpiryTime) * 60;
      await pool.query(updateQuery, [totalSeconds.toString(), 'Token Expiry Time']);
    }

    // Optionally, you can fetch and return the updated settings to the client
    const updatedSettingsQuery = `SELECT * FROM cs_tbl_sitesetting`;
    const [updatedResults] = await pool.query(updatedSettingsQuery);

    res.json({ settings: updatedResults });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



router.get('/getAdminSetting', verifyToken, async (req, res) => {
  try {
    // Query to fetch cs_value for id 38 from cs_tbl_sitesetting table
    const query = "SELECT cs_parameter,cs_value FROM cs_tbl_sitesetting WHERE cs_parameter IN ('Time Zone', 'Event Days', 'Event Name', 'AdminEmail', 'mobile', 'From', 'CC', 'BCC','TO','Reply-To', 'SMS Sending', 'Spot Registration Start', 'Admin Reg Start Number','Event Start Date','event_venue','dynamiclogin_id','event_end_date','event_image_url','homepage_bg_img','event_time', 'payment_receipt_head', 'payment_receipt_foot')";

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

const requestQueue = [];
let isProcessing = false;

router.post('/updateAdminSettings', verifyToken, upload.fields([
  { name: 'logoimage', maxCount: 1 },
  { name: 'backgroundimg', maxCount: 1 }
]), async (req, res) => {

  try {
    requestQueue.push({ req, res });

    console.log("setting hitted");

    if (!isProcessing) {
      await processRequest();
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


async function processRequest() {
  if (requestQueue.length === 0) {
    isProcessing = false;
    return;
  }

  isProcessing = true;
  const { req, res } = requestQueue.shift();
  console.log(req.body);
  const { eventName, tokenExpiryTime, timezone, email, from, cc, bcc, replyto, regstart, eventstartdate, eventvenue, eventMode, eventenddate, eventtime } = req.body;


  const header = req.files['logoimage'] ? req.files['logoimage'][0] : null;
  const footer = req.files['backgroundimg'] ? req.files['backgroundimg'][0] : null;


  console.log("header", header);

  const adminPathQuery = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = ?`;
  const [adminPathResult] = await pool.query(adminPathQuery, 'AdminPath');
  const adminPath = adminPathResult[0].cs_value;


  const beforeUpdateQuery = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = ?`;
  const [beforeUpdateDateResult] = await pool.query(beforeUpdateQuery, ['Event Start Date']);

  const beforeEventdate = beforeUpdateDateResult[0].cs_value;

  const [beforeUpdateResult] = await pool.query(beforeUpdateQuery, ['Event Days', 'Event Start Date']);
  const eventDays = beforeUpdateResult[0].cs_value;
  console.log("beforeEventDays", beforeEventdate);




  try {


    // Update settings in the database
    const updateQuery = `UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter = ?`;
    await pool.query(updateQuery, [timezone, 'Time Zone']);
    await pool.query(updateQuery, [eventName, 'Event Name']);
    await pool.query(updateQuery, [email, 'AdminEmail']);
    await pool.query(updateQuery, [from, 'From']);
    // await pool.query(updateQuery, [to, 'TO']);
    await pool.query(updateQuery, [cc, 'CC']);
    await pool.query(updateQuery, [bcc, 'BCC']);
    await pool.query(updateQuery, [replyto, 'Reply-To']);
    await pool.query(updateQuery, [eventstartdate, 'Event Start Date']);
    await pool.query(updateQuery, [eventvenue, 'event_venue']);
    await pool.query(updateQuery, [eventMode, 'dynamiclogin_id']);
    await pool.query(updateQuery, [eventenddate, 'event_end_date']);
    await pool.query(updateQuery, [eventtime, 'event_time']);
    if (header) {
      await pool.query(updateQuery, [header.path, 'payment_receipt_head']);
    }
    if (footer) {
      await pool.query(updateQuery, [footer.path, 'payment_receipt_foot']);
    }


   

    const beforeEventDateObj = new Date(beforeEventdate);
    const eventStartDateObj = new Date(eventstartdate);

    // Compare dates
    if (beforeEventDateObj.getTime() !== eventStartDateObj.getTime()) {
      // Dates are different, proceed with your logic
      console.log("Dates are different");

      // Function to format date to YYYY-MM-DD
      const formatDate = (date) => {
        const d = new Date(date);
        const month = `${d.getMonth() + 1}`.padStart(2, '0');
        const day = `${d.getDate()}`.padStart(2, '0');
        const year = d.getFullYear();
        return `${year}-${month}-${day}`;
      };

      // Parse old date and new date
      const oldDate = formatDate(beforeEventDateObj);
      let currentDate = new Date(eventStartDateObj);

      // Loop through the number of event days and update each day accordingly
      for (let i = 1; i <= parseInt(eventDays); i++) {
        const newDate = formatDate(currentDate);

        // Create the new day name, e.g., "First Day (2024-06-16)"
        const dayNames = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth",
          "Eleventh", "Twelfth", "Thirteenth", "Fourteenth", "Fifteenth", "Sixteenth", "Seventeenth", "Eighteenth", "Nineteenth"];
        const dayName = dayNames[i - 1]; // Adjust this according to the maximum number of days you handle
        const newDayName = `${dayName} Day (${newDate})`;

        // Assuming you have a way to determine the correct cs_reg_daytype_id
        const cs_reg_daytype_id = i; // Update this with your logic to get the correct ID

        // Update query to change the date in the table
        const updateQuery = `
      UPDATE cs_os_reg_daytype
      SET cs_reg_daytype_name = ?
      WHERE cs_reg_daytype_id = ?
    `;

        try {
          await pool.query(updateQuery, [newDayName, cs_reg_daytype_id]);
          console.log(`Updated cs_reg_daytype_id ${cs_reg_daytype_id} to ${newDayName} in cs_os_reg_daytype table.`);
        } catch (error) {
          console.error(`Error updating cs_reg_daytype_id ${cs_reg_daytype_id}:`, error);
        }

        // Increment the current date by 1 day for the next iteration
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      // Dates are the same, no action needed
      console.log("Dates are the same");
    }


    const updatedSettingsQuery = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = ?`;
    const [updatedResults] = await pool.query(updatedSettingsQuery, 'event_host');


    console.log(updatedResults);



    const updateEventDetailsQuery = `
    UPDATE cs_app_eventdetails
    SET event_name = ?, 
        event_date = ?, 
        event_venue = ?, 
        event_time = ?, 
        dynamiclogin_id = ?
    WHERE event_host = ?`;

    const updatedResultssecnd = await pool2.query(updateEventDetailsQuery, [
      eventName,
      eventstartdate,
      eventvenue,
      eventtime,
      eventMode,
      updatedResults[0].cs_value // Replace with actual event host identifier
    ]);

    // if (header) {
    //   const updateEventDetailsQueryImage = `
    //   UPDATE cs_app_eventdetails
    //   SET event_image_url = ?
    //   WHERE event_host = ?`;

    //   await pool2.query(updateEventDetailsQueryImage, [
    //     header.path,
    //     updatedResults[0].cs_value // Replace with actual event host identifier
    //   ]);
    // }

    // if (footer) {
    //   const updateEventDetailsQueryBackground = `
    //   UPDATE cs_app_eventdetails
    //   SET homepage_bg_img = ?
    //   WHERE event_host = ?`;

    //   await pool2.query(updateEventDetailsQueryBackground, [
    //     footer.path,
    //     updatedResults[0].cs_value // Replace with actual event host identifier
    //   ]);
    // }

    if (header) {
      const updateEventDetailsQueryImage = `
        UPDATE cs_app_eventdetails
        SET event_image_url = ?
        WHERE event_host = ?`;
    
      await pool2.query(updateEventDetailsQueryImage, [
        adminPath + header.path, // Concatenate AdminPath with the image path
        updatedResults[0].cs_value // Use the actual event host identifier
      ]);
    }
    
    if (footer) {
      const updateEventDetailsQueryBackground = `
        UPDATE cs_app_eventdetails
        SET homepage_bg_img = ?
        WHERE event_host = ?`;
    
      await pool2.query(updateEventDetailsQueryBackground, [
        adminPath + footer.path, // Concatenate AdminPath with the background image path
        updatedResults[0].cs_value // Use the actual event host identifier
      ]);
    }










    res.status(200).json({ message: 'Changes Updated successfully' });

  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await processNextRequest();
  }
}




async function processNextRequest() {
  if (requestQueue.length > 0) {
    await processRequest();
  } else {
    isProcessing = false;
  }
}




function getOrdinalWord(num) {
  const words = ["", "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth",
    "Eleventh", "Twelfth", "Thirteenth", "Fourteenth", "Fifteenth", "Sixteenth", "Seventeenth", "Eighteenth", "Nineteenth"];
  const tens = ["", "", "Twentieth", "Thirtieth", "Fortieth", "Fiftieth", "Sixtieth", "Seventieth", "Eightieth", "Ninetieth"];

  if (num <= 19) {
    return words[num];
  } else if (num % 10 === 0) {
    return tens[Math.floor(num / 10)];
  } else if (num < 100) {
    return tens[Math.floor(num / 10)] + "-" + words[num % 10];
  } else {
    return "number not supported";
  }
}


router.post('/check-admin-regno', verifyToken, async (req, res) => {
  const { regstart } = req.body;

  try {
    // Execute SQL queries to check if regstart exists in either table
    const [users] = await pool.query('SELECT * FROM cs_os_users WHERE cs_regno = ?', [regstart]);
    const [badgeUsers] = await pool.query('SELECT * FROM cs_os_badgeapp_userlogin WHERE cs_regno_start = ?', [regstart]);

    // Check if any user with the provided regstart exists in either table
    if (users.length > 0 || badgeUsers.length > 0) {
      // regstart already exists in the database
      res.status(200).json({ available: false });
    } else {
      // regstart is available
      res.status(200).json({ available: true });
    }
  } catch (error) {
    console.error('Error checking registration number availability:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



module.exports = router;