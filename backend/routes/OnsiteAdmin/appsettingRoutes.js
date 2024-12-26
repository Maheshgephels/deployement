const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const multer = require('multer');
const verifyToken = require('../api/middleware/authMiddleware');
const queueMiddleware = require('../api/middleware/queueMiddleware');


// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'app-icon/') // Specify the directory where files will be uploaded
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname) // Use the original file name for the uploaded file
  }
});

const upload = multer({ storage: storage });




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

router.get('/getCertFeedbackData', verifyToken, async (req, res) => {
  try {
    // Query to fetch cs_value for id 38 from cs_tbl_sitesetting table
    const query = "SELECT cs_parameter,cs_value FROM cs_tbl_sitesetting WHERE cs_parameter IN ('certificate', 'certificate_with_feedback', 'feedback_form')";

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


router.post('/updateSettings', verifyToken,upload.single('bannerimage'), async (req, res) => {
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

router.post('/updateCertSettings', verifyToken, async (req, res) => {
  const { certificate, certificateWithFeedback, feedbackForm } = req.body;

  try {
    // Settings to update
    const settingsToUpdate = [
      { parameter: 'certificate', value: certificate },
      { parameter: 'certificate_with_feedback', value: certificateWithFeedback },
      { parameter: 'feedback_form', value: feedbackForm },
    ];

    // Update each setting in the database
    const updateQuery = `UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter = ?`;
    for (const setting of settingsToUpdate) {
      await pool.query(updateQuery, [setting.value, setting.parameter]);
    }

    // Fetch and return the updated settings
    const updatedSettingsQuery = `SELECT * FROM cs_tbl_sitesetting`;
    const [updatedResults] = await pool.query(updatedSettingsQuery);

    res.json({ message: 'Settings updated successfully', settings: updatedResults });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});




router.get('/getAdminSetting', verifyToken, async (req, res) => {
  try {
    // Query to fetch cs_value for id 38 from cs_tbl_sitesetting table
    const query = "SELECT cs_parameter,cs_value FROM cs_tbl_sitesetting WHERE cs_parameter IN ('Time Zone', 'Event Days', 'Event Name', 'AdminEmail', 'mobile', 'From', 'CC', 'BCC','TO','Reply-To', 'SMS Sending', 'Spot Registration Start', 'Admin Reg Start Number','Event Start Date')";

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

router.post('/updateAdminSettings', verifyToken,queueMiddleware, upload.single('bannerimage'), async (req, res) => {

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
  const { eventName, eventDays, tokenExpiryTime, timezone, email, from, cc, bcc, replyto, regstart, eventstartdate } = req.body;
  const bannerImagePath = req.file ? req.file.path : null; // Get the path of the uploaded banner image

  // Get the value of "Event Days" before updating
  const beforeUpdateQuery = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = ?`;
  const [beforeUpdateResult] = await pool.query(beforeUpdateQuery, ['Event Days', 'Event Start Date']);
  const beforeEventDays = beforeUpdateResult[0].cs_value;

  const [beforeUpdateDateResult] = await pool.query(beforeUpdateQuery, ['Event Start Date']);

  const beforeEventdate = beforeUpdateDateResult[0].cs_value;
  console.log("beforeEventdate", beforeEventdate);



  try {


    // Update settings in the database
    const updateQuery = `UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter = ?`;
    await pool.query(updateQuery, [timezone, 'Time Zone']);
    await pool.query(updateQuery, [eventDays, 'Event Days']);
    await pool.query(updateQuery, [eventName, 'Event Name']);
    await pool.query(updateQuery, [bannerImagePath, 'Banner Image']);
    await pool.query(updateQuery, [email, 'AdminEmail']);
    await pool.query(updateQuery, [from, 'From']);
    // await pool.query(updateQuery, [to, 'TO']);
    await pool.query(updateQuery, [cc, 'CC']);
    await pool.query(updateQuery, [bcc, 'BCC']);
    await pool.query(updateQuery, [replyto, 'Reply-To']);
    await pool.query(updateQuery, [regstart, 'Admin Reg Start Number']);
    await pool.query(updateQuery, [eventstartdate, 'Event Start Date']);

    const updatedSettingsQuery = `SELECT * FROM cs_tbl_sitesetting`;
    const [updatedResults] = await pool.query(updatedSettingsQuery);

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

    if (beforeEventDays !== null && parseInt(eventDays) > beforeEventDays) {
      console.log('New eventDays is greater than beforeEventDays');
      try {
        // Fetch facility types from the database
        const facilityTypesQuery = `SELECT * FROM cs_os_facilitytype`;
        const [facilityTypesResult] = await pool.query(facilityTypesQuery);

        // Iterate through each facility type
        for (const facility of facilityTypesResult) {
          if (facility.cs_daywise === 'Yes') {
            console.log(`Facility ${facility.cs_name} is day-wise`);

            // Loop through each day from beforeEventDays to eventDays
            const startDay = parseInt(beforeEventDays) + 1;
            const endDay = parseInt(eventDays);

            for (let i = startDay; i <= endDay; i++) {
              console.log('i:', i);
              const facilityName = `cs_${facility.cs_name}${i}`;
              console.log('eventstartdate', eventstartdate);

              // Check if the facility name already exists in the table
              const checkQuery = `SELECT COUNT(*) AS count FROM cs_os_facility_detail WHERE cs_facility_name = ?`;
              const [checkResult] = await pool.query(checkQuery, [facilityName]);
              const facilityCount = checkResult[0].count;

              if (facilityCount === 0) {
                // Insert new facility details
                const insertQuery = `INSERT INTO cs_os_facility_detail (cs_facility_id, cs_facility_name, cs_status) VALUES (?, ?, ?)`;
                const [insertResult] = await pool.query(insertQuery, [facility.cs_facility_id, facilityName, '1']);
                const insertedId = insertResult.insertId;

                // Select all categories from cs_os_category table
                const categoriesQuery = `SELECT * FROM cs_os_category`;
                const [categoriesResult] = await pool.query(categoriesQuery);

                // Insert records into cs_os_facility_category for each category
                for (const category of categoriesResult) {
                  const insertCategoryQuery = `INSERT INTO cs_os_facility_category (cs_facility_detail_id, cs_reg_cat_id, cs_allow_count, cs_status) VALUES (?, ?, ?, ?)`;
                  await pool.query(insertCategoryQuery, [insertedId, category.cs_reg_cat_id, '0', '1']);
                }

                // Update cs_os_badges table with updated data
                // const badgesData = await pool.query('SELECT * FROM cs_os_badges');
                // for (const badge of badgesData) {
                //   for (const badgeObj of badge) {
                //     const { cs_reg_cat_id, cs_badge_data, cs_badge_id } = badgeObj;

                //     try {
                //       if (typeof cs_badge_data !== 'undefined') {
                //         const parsedBadgeData = JSON.parse(cs_badge_data);
                //         parsedBadgeData[facilityName] = '0'; // Initialize with '0' value
                //         parsedBadgeData[`${facilityName}_status`] = '0'; // Initialize status

                //         const updatedBadgeDataString = JSON.stringify(parsedBadgeData);
                //         const updateQuery = `UPDATE cs_os_badges SET cs_badge_data = ? WHERE cs_badge_id = ?`;
                //         const updateValues = [updatedBadgeDataString, cs_badge_id];
                //         await pool.query(updateQuery, updateValues);
                //       } else {
                //         console.log('cs_badge_data is undefined, skipping update');
                //       }
                //     } catch (error) {
                //       console.error("Error updating cs_badge_data:", error);
                //     }
                //   }
                // }

                console.log(`Facility ${facilityName} added with categories`);
              } else {
                console.log(`Facility ${facilityName} already exists, skipping insertion`);
              }
            }
          }
        }
        // for (let i = 1; i <= parseInt(eventDays); i++) {
        //   const ordinalWord = getOrdinalWord(i);
        //   const dayTypeName = `${ordinalWord} Day `;

        //   // Check if the day type already exists in the table
        //   const checkDayTypeQuery = `SELECT COUNT(*) AS count FROM cs_os_reg_daytype WHERE cs_reg_daytype_id = ?`;
        //   const [checkDayTypeResult] = await pool.query(checkDayTypeQuery, [i]);
        //   const dayTypeCount = checkDayTypeResult[0].count;

        //   if (dayTypeCount === 0) {
        //     // Insert the day type into the table
        //     const insertDayTypeQuery = `INSERT INTO cs_os_reg_daytype (cs_reg_daytype_id, cs_reg_daytype_name) VALUES (?, ?)`;
        //     await pool.query(insertDayTypeQuery, [i, dayTypeName]);
        //     console.log(`Day type '${dayTypeName} ' added to cs_os_reg_daytype table`);
        //   } else {
        //     console.log(`Day type '${dayTypeName}' already exists, skipping insertion`);
        //   }
        // }

        const eventStartDateQuery = `SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = ?`;
        const [eventStartDateResult] = await pool.query(eventStartDateQuery, ['Event Start Date']);
        const eventStartDate = eventStartDateResult[0].cs_value;

        console.log("eventStartDate", eventStartDate);

        const startDate = new Date(eventStartDate); // Assuming eventStartDate is in a valid date format

        for (let i = 1; i <= parseInt(eventDays); i++) {
          const ordinalWord = getOrdinalWord(i);
          const currentDate = new Date(startDate);
          currentDate.setDate(currentDate.getDate() + i - 1); // Add i - 1 days to the start date
          const formattedDate = currentDate.toISOString().split('T')[0];

          const dayTypeName = `${ordinalWord} Day ( ${formattedDate} )`;

          console.log("dayTypeName", dayTypeName);

          // Check if the day type already exists in the table
          const checkDayTypeQuery = `SELECT COUNT(*) AS count FROM cs_os_reg_daytype WHERE cs_reg_daytype_id = ?`;
          const [checkDayTypeResult] = await pool.query(checkDayTypeQuery, [i]);
          const dayTypeCount = checkDayTypeResult[0].count;

          if (dayTypeCount === 0) {
            // Insert the day type into the table
            const insertDayTypeQuery = `INSERT INTO cs_os_reg_daytype (cs_reg_daytype_id, cs_reg_daytype_name) VALUES (?, ?)`;
            await pool.query(insertDayTypeQuery, [i, dayTypeName]);
            console.log(`Day type '${dayTypeName}' added to cs_os_reg_daytype table`);
          } else {
            console.log(`Day type '${dayTypeName}' already exists, skipping insertion`);
          }
        }






      } catch (error) {
        console.error('Error fetching facility types:', error);
      }
    // } else if (beforeEventDays !== null && parseInt(eventDays) < beforeEventDays) {
    //   console.log('New eventDays is lesser than beforeEventDays');
    //   try {
    //     const facilityTypesQuery = `SELECT * FROM cs_os_facilitytype`;
    //     const [facilityTypesResult] = await pool.query(facilityTypesQuery);

    //     for (const facility of facilityTypesResult) {
    //       if (facility.cs_daywise === 'Yes') {
    //         console.log(`Facility ${facility.cs_name} is day-wise`);

    //         const currentEventDays = parseInt(eventDays);
    //         const startDay = currentEventDays + 1;
    //         const endDay = parseInt(beforeEventDays);

    //         for (let i = startDay; i <= endDay; i++) {
    //           console.log('i:', i);
    //           const facilityName = `cs_${facility.cs_name}${i}`;

    //           const checkQuery = `SELECT cs_facility_detail_id, COUNT(*) AS count FROM cs_os_facility_detail WHERE cs_facility_name = ?`;
    //           const [checkResult] = await pool.query(checkQuery, [facilityName]);
    //           const facilityCount = checkResult[0].count;
    //           const facilityId = checkResult[0].cs_facility_detail_id;
              

    //           if (facilityCount > 0) {
    //             // const deleteFacilityDetailQuery = `DELETE FROM cs_os_facility_detail WHERE cs_facility_detail_id = ?`;
    //             // await pool.query(deleteFacilityDetailQuery, [facilityId]);

    //             // Delete related records from cs_os_facility_category
    //             const deleteFacilityCategoryQuery = `DELETE FROM cs_os_facility_category WHERE cs_facility_detail_id = ?`;
    //             await pool.query(deleteFacilityCategoryQuery, [facilityId]);

    //             // Update cs_os_badges table with updated data
    //             const selectDetailQuery = `SELECT cs_facility_detail_id, cs_facility_name FROM cs_os_facility_detail WHERE cs_facility_detail_id = ?`;
    //             const facilityDetails = await pool.query(selectDetailQuery, [facilityId]);

              

    //             // Delete each record from cs_os_facility_detail table
    //             const deleteDetailQuery = `DELETE FROM cs_os_facility_detail WHERE cs_facility_detail_id = ?`;

    //             for (const detail of facilityDetails) {
    //               for (const detailObj of detail) {

    //                 const { cs_facility_detail_id, cs_facility_name } = detailObj;
                   


    //                 // Delete data from cs_os_facility_category table where cs_facility_detail_id = detail.cs_facility_detail_id
    //                 const deleteCategoryQuery = `DELETE FROM cs_os_facility_category WHERE cs_facility_detail_id = ?`;
    //                 await pool.query(deleteCategoryQuery, [cs_facility_detail_id]);

    //                 // Delete data from cs_os_facility_detail table where cs_facility_detail_id = detail.cs_facility_detail_id


    //                 // Use cs_facility_name to delete badge data
    //                 const badgesData = await pool.query('SELECT * FROM cs_os_badges');
    //                 for (const badge of badgesData) {
    //                   for (const badgeObj of badge) {
    //                     const { cs_reg_cat_id, cs_badge_data, cs_badge_id } = badgeObj;

    //                     try {
    //                       if (typeof cs_badge_data !== 'undefined') {
    //                         const parsedBadgeData = JSON.parse(cs_badge_data);

    //                         // Remove the facilityName and ${facilityName}_status entries
                            
    //                         delete parsedBadgeData[cs_facility_name];
    //                         delete parsedBadgeData[`${cs_facility_name}_status`];

    //                         const updatedBadgeDataString = JSON.stringify(parsedBadgeData);
    //                         // console.log('updatedBadgeDataString',updatedBadgeDataString);
    //                         const updateQuery = `UPDATE cs_os_badges SET cs_badge_data = ? WHERE cs_badge_id = ?`;
    //                         const updateValues = [updatedBadgeDataString, cs_badge_id];
    //                         await pool.query(updateQuery, updateValues);
    //                         await pool.query(deleteDetailQuery, [cs_facility_detail_id]);
    //                       } else {
    //                         console.log('cs_badge_data is undefined, skipping update');
    //                       }

    //                     } catch (error) {
    //                       console.error("Error updating cs_badge_data:", error);
    //                     }
    //                   }
    //                 }

    //               }
    //             }


    //             console.log(`Facility ${facilityName} deleted along with related records`);
    //           } else {
    //             console.log(`Facility ${facilityName} does not exist, skipping deletion`);
    //           }
    //         }
    //       }
    //     }

    //     const deleteStartIndex = parseInt(eventDays) + 1;
    //     const deleteEndIndex = parseInt(beforeEventDays);

    //     for (let i = deleteStartIndex; i <= deleteEndIndex; i++) {
    //       // Delete each day type individually
    //       const deleteDayTypeQuery = `DELETE FROM cs_os_reg_daytype WHERE cs_reg_daytype_id = ?`;
    //       await pool.query(deleteDayTypeQuery, [i]);
    //       console.log(`Deleted day type with cs_reg_daytype_id ${i}`);
    //     }

    //   } catch (error) {
    //     console.error("Error updating cs_badge_data:", error);
    //   }
    // }

    }else if (beforeEventDays !== null && parseInt(eventDays) < beforeEventDays) {
      console.log('New eventDays is lesser than beforeEventDays');
      try {
        const facilityTypesQuery = `SELECT * FROM cs_os_facilitytype`;
        const [facilityTypesResult] = await pool.query(facilityTypesQuery);
    
        let facilitiesToDelete = [];
        let facilityNamesAndStatusesToDelete = [];
    
        for (const facility of facilityTypesResult) {
          if (facility.cs_daywise === 'Yes') {
            console.log(`Facility ${facility.cs_name} is day-wise`);
    
            const currentEventDays = parseInt(eventDays);
            const startDay = currentEventDays + 1;
            const endDay = parseInt(beforeEventDays);
    
            for (let i = startDay; i <= endDay; i++) {
              console.log('i:', i);
              const facilityName = `cs_${facility.cs_name}${i}`;
    
              const checkQuery = `SELECT cs_facility_detail_id, COUNT(*) AS count FROM cs_os_facility_detail WHERE cs_facility_name = ?`;
              const [checkResult] = await pool.query(checkQuery, [facilityName]);
              const facilityCount = checkResult[0].count;
              const facilityId = checkResult[0].cs_facility_detail_id;
    
              if (facilityCount > 0) {
                facilitiesToDelete.push(facilityId);
                facilityNamesAndStatusesToDelete.push(facilityName, `${facilityName}_status`);
              } else {
                console.log(`Facility ${facilityName} does not exist, skipping deletion`);
              }
            }
          }
        }
    
        // Delete related records from cs_os_facility_category and cs_os_facility_detail
        for (const facilityId of facilitiesToDelete) {
          const deleteFacilityCategoryQuery = `DELETE FROM cs_os_facility_category WHERE cs_facility_detail_id = ?`;
          await pool.query(deleteFacilityCategoryQuery, [facilityId]);
    
          const deleteDetailQuery = `DELETE FROM cs_os_facility_detail WHERE cs_facility_detail_id = ?`;
          await pool.query(deleteDetailQuery, [facilityId]);
        }
    
        // Update badge data
        const badgesData = await pool.query('SELECT * FROM cs_os_badges');
        for (const badge of badgesData) {
          for (const badgeObj of badge) {
            const { cs_badge_data, cs_badge_id } = badgeObj;
    
            try {
              if (typeof cs_badge_data !== 'undefined') {
                const parsedBadgeData = JSON.parse(cs_badge_data);
    
                // Remove all facilityName and facilityName_status entries
                for (const key of facilityNamesAndStatusesToDelete) {
                  delete parsedBadgeData[key];
                }
    
                const updatedBadgeDataString = JSON.stringify(parsedBadgeData);
                const updateQuery = `UPDATE cs_os_badges SET cs_badge_data = ? WHERE cs_badge_id = ?`;
                const updateValues = [updatedBadgeDataString, cs_badge_id];
                await pool.query(updateQuery, updateValues);
              } else {
                console.log('cs_badge_data is undefined, skipping update');
              }
            } catch (error) {
              console.error("Error updating cs_badge_data:", error);
            }
          }
        }
    
        console.log('All facilities deleted along with related records and badge data updated');
    
        const deleteStartIndex = parseInt(eventDays) + 1;
        const deleteEndIndex = parseInt(beforeEventDays);
    
        for (let i = deleteStartIndex; i <= deleteEndIndex; i++) {
          // Delete each day type individually
          const deleteDayTypeQuery = `DELETE FROM cs_os_reg_daytype WHERE cs_reg_daytype_id = ?`;
          await pool.query(deleteDayTypeQuery, [i]);
          console.log(`Deleted day type with cs_reg_daytype_id ${i}`);
        }
    
      } catch (error) {
        console.error("Error updating cs_badge_data:", error);
      }
    
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

// Optionally, fetch and return the updated settings to the client


// router.post('/updateAdminSettings', upload.single('bannerimage'), async (req, res) => {
//   const { eventName, eventDays, timezone, email, from, to, cc, bcc, replyto } = req.body;
//   const bannerImagePath = req.file ? req.file.path : null; // Get the path of the uploaded banner image

//   try {


//       // Update settings in the database
//       const updateQuery = `UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter = ?`;
//       await pool.query(updateQuery, [timezone, 'Time Zone']);
//       await pool.query(updateQuery, [eventDays, 'Event Days']);
//       await pool.query(updateQuery, [eventName, 'Event Name']);
//       await pool.query(updateQuery, [bannerImagePath, 'Banner Image']);
//       await pool.query(updateQuery, [email, 'AdminEmail']);
//       await pool.query(updateQuery, [from, 'From']);
//       await pool.query(updateQuery, [to, 'TO']);
//       await pool.query(updateQuery, [cc, 'CC']);
//       await pool.query(updateQuery, [bcc, 'BCC']);
//       await pool.query(updateQuery, [replyto, 'Reply-To']);





//       // Optionally, you can fetch and return the updated settings to the client
//       const updatedSettingsQuery = `SELECT * FROM cs_tbl_sitesetting`;
//       const [updatedResults] = await pool.query(updatedSettingsQuery);

//       res.json({ settings: updatedResults });
//   } catch (error) {
//       console.error('Error updating settings:', error);
//       res.status(500).json({ message: 'Internal server error' });
//   }
// });


// router.post('/ChangeEvemtDay', async (req, res) => {
//   const { eventDays } = req.body;

//   console.log(eventDays);

//   try {
//       // Update settings in the database
//       const updateQuery = `UPDATE cs_tbl_sitesetting SET cs_value = ? WHERE cs_parameter = ?`;
//       const queryParams = [];

//       // Optionally, construct and execute queries based on available data
//       if (bannerImagePath !== null) {
//           await pool.query(updateQuery, [bannerImagePath, 'Banner Image']);
//       }

//       if (tokenExpiryTime) {
//           // Convert token expiry time to seconds
//           const totalSeconds = parseInt(tokenExpiryTime) * 60;
//           await pool.query(updateQuery, [totalSeconds.toString(), 'Token Expiry Time']);
//       }

//       // Optionally, you can fetch and return the updated settings to the client
//       const updatedSettingsQuery = `SELECT * FROM cs_tbl_sitesetting`;
//       const [updatedResults] = await pool.query(updatedSettingsQuery);

//       res.json({ settings: updatedResults });
//   } catch (error) {
//       console.error('Error updating settings:', error);
//       res.status(500).json({ message: 'Internal server error' });
//   }
// });




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