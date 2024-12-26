const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const moment = require('moment-timezone');
const verifyToken = require('../api/middleware/authMiddleware');
const multer = require('multer');
const path = require('path');



// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'exhibitor-assets/'); // Specify the directory where files will be uploaded
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); // Set the filename
  }
});

const upload = multer({ storage: storage });

// Define the route to fetch Facility data from the cs_os_badgeapp_userlogin
router.get('/getExhibitors', verifyToken, async (req, res) => {
  try {
    // Extract page number, page size, and search query from request query parameters
    const { page = 1, pageSize = 10, search = '', sortColumn = 'exh_id', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * pageSize;

    console.log("Exhibitor", req.query);

    const validColumns = ['exh_id', 'exh_name', 'exh_type', 'exh_email', 'created_at', 'status'];  // Add all valid column names here
    const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'exh_order';


    const columnsToFetch = ['*'];

    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
      SELECT ${columnsToFetch}
      FROM cs_app_exhibitor
    `;

    // Append search condition if search query is provided
    if (search) {
      query += `
          WHERE exh_name LIKE '%${search}%' OR exh_email LIKE '%${search}%' OR exh_type LIKE '%${search}%'
        `;
    }
    

    // Append pagination
    query += `
        ORDER BY ${columnToSortBy} ${sortOrder}
        LIMIT ${pageSize} OFFSET ${offset}
      `;

    // Execute the query to fetch user data from the table
    const [userData] = await pool.query(query);

    // Send the user data as a response along with pagination metadata
    let totalItems = 0;
    let totalPages = 0;

    if (!search) {
      const totalCountQuery = 'SELECT COUNT(*) AS total FROM cs_app_exhibitor WHERE 1';
      const [totalCountResult] = await pool.query(totalCountQuery);
      totalItems = totalCountResult[0].total;
      totalPages = Math.ceil(totalItems / pageSize);
    }

    res.json({ pages: userData, currentPage: parseInt(page), totalPages, pageSize, totalItems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/getSponsor', verifyToken, async (req, res) => {
  try {
    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
        SELECT spon_id, spon_name
        FROM cs_app_exhsponsor
        WHERE cs_status = 1
      `;
    // Execute the query to fetch field data from the table
    const [sponData] = await pool.query(query);

    // Respond with JSON containing fetched data
    res.json({ sponData });
  } catch (error) {
    // Handle errors and respond with a 500 status code
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/getCategory', verifyToken, async (req, res) => {
  try {
    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
        SELECT *
        FROM cs_app_roles
        WHERE status = 1
      `;
    // Execute the query to fetch field data from the table
    const [catData] = await pool.query(query);

    let query1 = `
        SELECT cs_value
        FROM cs_tbl_sitesetting
        WHERE cs_parameter = "dynamiclogin_id"
      `;
    // Execute the query to fetch field data from the table
    const [eventMode] = await pool.query(query1);

    // Respond with JSON containing fetched data
    res.json({ catData, eventMode });
  } catch (error) {
    // Handle errors and respond with a 500 status code
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/fetchCategoryDetail', verifyToken, async (req, res) => {
  try {
    // Extract role_id from the request body
    const { item } = req.body;

    console.log(item);


    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
        SELECT *
        FROM cs_app_access
        WHERE page_id = ${item.page_id};
        `;


    // Execute the query to fetch pages data for the specified role_id
    const [pagesData] = await pool.query(query, [item.page_id]);
    console.log("pagesData", pagesData);

    // Send the pages data as a response
    res.json({ pagesData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



router.put('/UpdateStatus', verifyToken, async (req, res) => {
  try {
    // Extract workshopId, status, and Name from the request body
    console.log(req.body);
    const { pageId, status } = req.body;


    // Update cs_status in cs_os_workshop
    const updateQuery = `UPDATE cs_app_exhibitor SET status = ? WHERE exh_id = ?`;
    await pool.query(updateQuery, [status, pageId]);

    // Update cs_status in cs_os_facilitytyp
    return res.status(200).json({ message: 'Status Updates successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/deleteExhibitor', verifyToken, async (req, res) => {
  const { exhId, exhName } = req.body;


  try {
    // Delete from cs_os_workshop table
    const deleteQuery = 'DELETE FROM cs_app_exhibitor WHERE exh_id = ?';
    await pool.query(deleteQuery, [exhId]);

    console.log(`Workshop with ID ${exhId} deleted successfully.`);
    res.status(200).json({ message: 'Exhibitor deleted successfully' });
  } catch (error) {
    console.error('Error deleting workshop:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/storeExhibitor', verifyToken, upload.fields([
  { name: 'exhIcon', maxCount: 1 },
  { name: 'exhImage', maxCount: 1 }
]), async (req, res) => {
  console.log(req.body);
  const { eName, eType, eDesc, ePerson, email, eContact, eAddress, eWebsite, show_type, show_listing, show_detail } = req.body;
  const exhIcon = req.files.exhIcon ? req.files.exhIcon[0].path : null;
  const exhImage = req.files.exhImage ? req.files.exhImage[0].path : null;

  // Log the absolute path for debugging
  if (req.files.exhIcon) {
    console.log('Icon', exhIcon);
  }
  if (req.files.exhImage) {
    console.log('Image', exhImage);
  }

  try {

    // Find the current highest exh_order value and increment by 1
    const [result] = await pool.query(`SELECT MAX(exh_order) as maxOrder FROM cs_app_exhibitor WHERE exh_order <> 1000`);
    const maxOrder = result[0].maxOrder || 0;
    const newOrder = maxOrder + 1;

    // Insert new exhibitor into the database
    const insertQuery = `INSERT INTO cs_app_exhibitor (exh_name, exh_order, exh_type, exh_description, exh_contact_person, exh_email, exh_contact, exh_address, exh_website, exh_logo, exh_image, show_type, show_listing, show_detail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await pool.query(insertQuery, [
      eName, newOrder, eType, eDesc, ePerson, email, eContact, eAddress, eWebsite, exhIcon, exhImage, show_type, show_listing, show_detail 
    ]);

    return res.status(200).json({ message: 'Exhibitor added successfully' });
  } catch (error) {
    console.error('Error adding exhibitor:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/moveup', verifyToken, async (req, res) => {
  try {
    // Extract item from the request body
    const { item, order } = req.body;

    console.log(req.body);

    // // Get the current field order of the item
    // const getOrderQuery = 'SELECT cs_field_order FROM cs_os_field_data WHERE cs_field_id = ?';
    // const [orderResult] = await pool.query(getOrderQuery, [item]);

    // if (orderResult.length === 0) {
    //   return res.status(404).json({ error: 'Item not found' });
    // }

    // const currentOrder = orderResult[0].cs_field_order;

    // Prevent cs_field_order from going below 2
    if (order <= 0) {
      return res.status(202).json({ error: 'Cannot move up. page order is already at the minimum value.' });
    }

    // Get the item that currently has the cs_field_order one less than or nearest to the current order,
    // but ensure cs_field_order doesn't go below 1
    const swapOrderQuery = `
      SELECT exh_id 
      FROM cs_app_exhibitor 
      WHERE exh_order < ? AND exh_order >= 1 
      ORDER BY exh_order DESC 
      LIMIT 1`;
    const [swapOrderResult] = await pool.query(swapOrderQuery, [order]);






    if (swapOrderResult.length === 0) {
      return res.status(500).json({ error: 'Failed to find the item to swap orders with' });
    }

    const swapItemId = swapOrderResult[0].exh_id;

    // Update the cs_field_order values for the two items
    const updateOrderQuery = `
        UPDATE cs_app_exhibitor 
        SET exh_order = CASE 
          WHEN exh_id = ? THEN ?
          WHEN exh_id = ? THEN ?
        END
        WHERE exh_id IN (?, ?)`;

    await pool.query(updateOrderQuery, [item, order - 1, swapItemId, order, item, swapItemId]);

    // Send success response
    return res.status(200).json({ message: 'Moved up successfully' });
  } catch (error) {
    // Handle errors
    console.error('Error while moving up:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/movedown', verifyToken, async (req, res) => {
  try {
    // Extract item from the request body
    const { item, order } = req.body;

    console.log(req.body);

    // Get the current field order of the item
    // const getOrderQuery = 'SELECT cs_field_order FROM cs_os_field_data WHERE cs_field_id = ?';
    // const [orderResult] = await pool.query(getOrderQuery, [item]);

    // if (orderResult.length === 0) {
    //   return res.status(404).json({ error: 'Item not found' });
    // }

    // const currentOrder = orderResult[0].cs_field_order;

    // Get the maximum field order
    const getMaxOrderQuery = 'SELECT MAX(exh_order) AS max_order FROM cs_app_exhibitor';
    const [maxOrderResult] = await pool.query(getMaxOrderQuery);

    const maxOrder = maxOrderResult[0].max_order;

    // Prevent cs_field_order from going beyond the maximum value
    if (order >= maxOrder) {
      return res.status(202).json({ error: 'Cannot move down. page order is already at the maximum value.' });
    }

    // Get the item that currently has the cs_field_order one more than the current order
    const swapOrderQuery = 'SELECT exh_id FROM cs_app_exhibitor WHERE exh_order = ?';
    const [swapOrderResult] = await pool.query(swapOrderQuery, [order + 1]);

    if (swapOrderResult.length === 0) {
      return res.status(500).json({ error: 'Failed to find the item to swap orders with' });
    }

    const swapItemId = swapOrderResult[0].exh_id;

    // Update the cs_field_order values for the two items
    const updateOrderQuery = `
        UPDATE cs_app_exhibitor 
        SET exh_order = CASE 
          WHEN exh_id = ? THEN ?
          WHEN exh_id = ? THEN ?
        END
        WHERE exh_id IN (?, ?)`;

    await pool.query(updateOrderQuery, [item, order + 1, swapItemId, order, item, swapItemId]);

    // Send success response
    return res.status(200).json({ message: 'Moved down successfully' });
  } catch (error) {
    // Handle errors
    console.error('Error while moving down:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// // Update Exhibitor Endpoint
// router.post('/updateExhibitor', upload.fields([{ name: 'exhIcon', maxCount: 1 }, { name: 'exhImage', maxCount: 1 }]), async (req, res) => {
//     try {
//         const updatedFields = {};

//         // Handle non-file fields
//         for (const key in req.body) {
//             if (req.body[key]) {
//                 updatedFields[key] = req.body[key];
//             }
//         }

//         // Handle file uploads
//         if (req.files['exhIcon']) {
//             updatedFields.exhIcon = req.files['exhIcon'][0].path; // Store file path or process accordingly
//         }
//         if (req.files['exhImage']) {
//             updatedFields.exhImage = req.files['exhImage'][0].path; // Store file path or process accordingly
//         }

//         // Update the Exhibitor in the database
//         const { exh_id } = req.body; // Assuming you are sending the exhibitor ID
//         const updatedExhibitor = await Exhibitor.findByIdAndUpdate(exhibitorId, updatedFields, { new: true });

//         if (updatedExhibitor) {
//             res.status(200).json({ message: 'Exhibitor updated successfully!', data: updatedExhibitor });
//         } else {
//             res.status(404).json({ message: 'Exhibitor not found!' });
//         }
//     } catch (error) {
//         console.error('Error updating exhibitor:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });





router.post('/updateExhibitor', upload.fields([
  { name: 'exhIcon', maxCount: 1 },
  { name: 'exhImage', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log(req.body);
    const { exh_id, eName, e_Type, eDesc, ePerson, email, eContact, eAddress, eWebsite, show_type, show_listing, show_detail } = req.body;
    const exhIcon = req.files.exhIcon ? req.files.exhIcon[0].path : null;
    const exhImage = req.files.exhImage ? req.files.exhImage[0].path : null;

    // Initialize an array to store parameters for the update query
    const queryParams = [];
    let updateQuery = `
            UPDATE cs_app_exhibitor
            SET `;

    // Build the SET clause dynamically based on non-null and non-undefined fields
    if (eName !== undefined && eName !== null) {
      updateQuery += `exh_name = ?, `;
      queryParams.push(eName);
    }
    if (e_Type !== null && e_Type !== undefined && e_Type !== '') {
      updateQuery += `exh_type = ?, `;
      queryParams.push(e_Type);
    }
    if (eDesc !== undefined && eDesc !== null) {
      updateQuery += `exh_description = ?, `;
      queryParams.push(eDesc);
    }
    if (ePerson !== undefined && ePerson !== null) {
      updateQuery += `exh_contact_person = ?, `;
      queryParams.push(ePerson);
    }
    if (email !== undefined && email !== null) {
      updateQuery += `exh_email = ?, `;
      queryParams.push(email);
    }
    if (eContact !== undefined && eContact !== null) {
      updateQuery += `exh_contact = ?, `;
      queryParams.push(eContact);
    }
    if (eAddress !== undefined && eAddress !== null) {
      updateQuery += `exh_address = ?, `;
      queryParams.push(eAddress);
    }
    if (eWebsite !== undefined && eWebsite !== null) {
      updateQuery += `exh_website = ?, `;
      queryParams.push(eWebsite);
    }
    if (exhIcon !== null) {
      updateQuery += `exh_logo = ?, `;
      queryParams.push(exhIcon);
    }
    if (exhImage !== null) {
      updateQuery += `exh_image = ?, `;
      queryParams.push(exhImage);
    }
    if (show_type !== null) {
      updateQuery += `show_type = ?, `;
      queryParams.push(show_type);
    }
    if (show_listing !== null) {
      updateQuery += `show_listing = ?, `;
      queryParams.push(show_listing);
    }
    if (show_detail !== null) {
      updateQuery += `show_detail = ?, `;
      queryParams.push(show_detail);
    }


    // Remove the trailing comma and space from the query string
    updateQuery = updateQuery.slice(0, -2);

    // Add WHERE clause
    updateQuery += ` WHERE exh_id = ?`;

    // Add exh_id to queryParams
    queryParams.push(exh_id);

    // Execute the update query
    const [result] = await pool.query(updateQuery, queryParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Exhibitor not found' });
    }

    res.status(200).json({ message: 'Exhibitor updated successfully!' });
  } catch (error) {
    console.error('Error updating exhibitor:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/check-exhibitor-name',verifyToken, async (req, res) => {
  const { eName } = req.body;

  try {
    // Execute SQL query to check if email exists in the database
    const [users] = await pool.query('SELECT * FROM cs_app_exhibitor WHERE exh_name = ?', [eName]);

    // Check if any user with the provided email exists
    if (users.length > 0) {
      // Email already exists in the database
      res.status(200).json({ available: false });
    } else {
      // Email is available
      res.status(200).json({ available: true });
    }
  } catch (error) {
    console.error('Error checking page availability:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});





module.exports = router;