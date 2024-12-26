const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const moment = require('moment-timezone');
const multer = require('multer');
const path = require('path');
const verifyToken = require('../api/middleware/authMiddleware');
const { Console } = require('console');

router.use(express.json({ limit: '10mb' }));


// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'map-assets/'); // Specify upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use file.originalname for the filename
  }
});


// Configure multer with limits
const upload = multer({
  storage: storage,
  limits: {
    fieldSize: 25 * 1024 * 1024, // 25MB for fields
    fileSize: 50 * 1024 * 1024 // 50MB for files
  }
});


router.get('/getLocation', verifyToken, async (req, res) => {
  try {
    // Extract page number, page size, and search query from request query parameters
    const { page = 1, pageSize = 10, search = '', sortColumn = 'id', sortOrder = 'DESC'  } = req.query;
    const offset = (page - 1) * pageSize;

    const validColumns = ['id', 'location_name', 'exh_type', 'status'];  // Add all valid column names here
    const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'id';

    const columnsToFetch = ['*'];

    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
        SELECT ${columnsToFetch}
        FROM cs_app_mapdetails
      `;

    // Append search condition if search query is provided
    if (search) {
      query += `
          WHERE location_name LIKE '%${search}%' OR exh_type LIKE '%${search}%'
        `;
    }

    // Append the ORDER BY clause
    query += `
        ORDER BY ${columnToSortBy} ${sortOrder}
      `;

    // Append pagination
    query += `
        LIMIT ${pageSize} OFFSET ${offset}
      `;

    // Execute the query to fetch user data from the table
    const [userData] = await pool.query(query);

    // Send the user data as a response along with pagination metadata
    let totalItems = 0;
    let totalPages = 0;

    if (!search) {
      const totalCountQuery = 'SELECT COUNT(*) AS total FROM cs_app_mapdetails';
      const [totalCountResult] = await pool.query(totalCountQuery);
      totalItems = totalCountResult[0].total;
      totalPages = Math.ceil(totalItems / pageSize);
    }


    res.json({ categories: userData, currentPage: parseInt(page), totalPages, pageSize, totalItems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/getMappedId', verifyToken, async (req, res) => {
  try {
      const getStorageQuery = `SELECT local_position FROM cs_app_storage WHERE id = ?`;
      const [rows] = await pool.query(getStorageQuery, [1]);

      // Check if rows are returned
      if (rows.length === 0) {
          return res.status(404).json({ error: 'No storage data found.' });
      }

      const locationPosition = JSON.parse(rows[0].local_position); // Parse the local_position JSON

      console.log("Location", locationPosition);

      // Function to get IDs with lat and lng as integers
      const getIdsWithCoordinates = (location) => {
          const ids = [];
          Object.entries(location).forEach(([key, value]) => {
              // Check if value is an object (for nested entries)
              if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                  // Traverse inner objects
                  Object.entries(value).forEach(([id, coords]) => {
                      if (coords.lat !== undefined && coords.lng !== undefined) {
                          ids.push(parseInt(id, 10)); // Convert the inner ID to an integer
                      }
                  });
              } else if (value.lat !== undefined && value.lng !== undefined) {
                  ids.push(parseInt(key, 10)); // Convert the outer ID to an integer if it has lat/lng
              }
          });
          return ids;
      };

      // Get the IDs where lat and lng are defined
      const mapedid = getIdsWithCoordinates(locationPosition);

      console.log("Mapped ID", mapedid);

      // Send response
      res.json({ mapedid });
  } catch (error) {
      console.error("Error fetching mapped ID:", error);
      res.status(500).json({ error: 'Internal server error' });
  }
});



// router.put('/UpdateStatus', verifyToken, async (req, res) => {
//   try {
//     // Extract workshopId, status, and Name from the request body
//     console.log(req.body);
//     const { LocationId, status } = req.body;



//     // Update cs_status in cs_os_workshop
//     const updateQuery = `UPDATE cs_app_mapdetails SET status = ? WHERE id = ?`;
//     await pool.query(updateQuery, [status, LocationId]);

//     // Update cs_status in cs_os_facilitytyp
//     return res.status(200).json({ message: 'Status Updates successfully' });
//   } catch (error) {
//     console.error('Error updating status:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// });

router.put('/UpdateStatus', verifyToken, async (req, res) => {
  try {
    // Extract LocationId and status from the request body
    console.log(req.body);
    const { LocationId, status } = req.body;

    // Update status in cs_app_mapdetails
    const updateQuery = `UPDATE cs_app_mapdetails SET status = ? WHERE id = ?`;
    await pool.query(updateQuery, [status, LocationId]);

    // If status is 0, remove the entry from the cs_app_storage table
    if (status === 0) {
      // Fetch the current local_position from cs_app_storage
      const getStorageQuery = `SELECT local_position FROM cs_app_storage WHERE id = ?`;
      const [rows] = await pool.query(getStorageQuery, [1]);

      console.log(rows);
      
      if (rows.length > 0) {
        const localPosition = JSON.parse(rows[0].local_position);

        console.log("Local", localPosition);


        // Delete the location based on LocationId
        for (let key in localPosition) {
          if (localPosition[key][LocationId]) {
            delete localPosition[key][LocationId];
          }
        }

        // Update the local_position back in the database after deletion
        const updatedLocalPosition = JSON.stringify(localPosition);
        console.log("Updated Local", updatedLocalPosition);
        const updateStorageQuery = `UPDATE cs_app_storage SET local_position = ? WHERE id = ?`;
        await pool.query(updateStorageQuery, [updatedLocalPosition, 1]);
      }
    }

    // Respond with success message
    return res.status(200).json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});



router.delete('/deleteLocation', verifyToken, async (req, res) => {
  const { LocationId } = req.body;


  try {
    // Delete from cs_os_workshop table
    const deleteQuery = 'DELETE FROM cs_app_mapdetails WHERE id = ?';
    await pool.query(deleteQuery, [LocationId]);

          // Fetch the current local_position from cs_app_storage
          const getStorageQuery = `SELECT local_position FROM cs_app_storage WHERE id = ?`;
          const [rows] = await pool.query(getStorageQuery, [1]);
    
          console.log(rows);
          
          if (rows.length > 0) {
            const localPosition = JSON.parse(rows[0].local_position);
    
            console.log("Local", localPosition);
    
    
            // Delete the location based on LocationId
            for (let key in localPosition) {
              if (localPosition[key][LocationId]) {
                delete localPosition[key][LocationId];
              }
            }
    
            // Update the local_position back in the database after deletion
            const updatedLocalPosition = JSON.stringify(localPosition);
            console.log("Updated Local", updatedLocalPosition);
            const updateStorageQuery = `UPDATE cs_app_storage SET local_position = ? WHERE id = ?`;
            await pool.query(updateStorageQuery, [updatedLocalPosition, 1]);
          }
        

    res.status(200).json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting workshop:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/getLocationImage', verifyToken, async (req, res) => {
  let query = `
    SELECT *
    FROM  cs_app_mapimage where image_id ="1"
  `;

  const userData = await pool.query(query);
  res.json({ userData });

});


router.get('/getExhibitor', verifyToken, async (req, res) => {
  try {
    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
        SELECT exh_id, exh_name
        FROM cs_app_exhibitor
        WHERE status = 1
      `;
    // Execute the query to fetch field data from the table
    const [exhData] = await pool.query(query);

    let query1 = `
        SELECT loc_icon_id, loc_icon_name
        FROM cs_app_locicon_type
        WHERE status = 1
      `;
    // Execute the query to fetch field data from the table
    const [iconData] = await pool.query(query1);

    // Respond with JSON containing fetched data
    res.json({ exhData, iconData });
  } catch (error) {
    // Handle errors and respond with a 500 status code
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/getExhibitorData', verifyToken, async (req, res) => {
  try {
    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
        SELECT *
        FROM cs_app_exhibitor
        WHERE status = 1
        ORDER BY exh_id DESC
      `;
    // Execute the query to fetch field data from the table
    const [exhData] = await pool.query(query);

    // Respond with JSON containing fetched data
    res.json({ exhData });
  } catch (error) {
    // Handle errors and respond with a 500 status code
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/storeLocation', verifyToken, async (req, res) => {
  const { lName, eType, eTypeid, iType } = req.body;

  console.log(req.body);

  // Basic validation
  if (!lName || !eType || !eTypeid || !iType) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const insertQuery = `
      INSERT INTO cs_app_mapdetails 
      (location_name, exh_type, exh_type_id, shape_type) 
      VALUES (?, ?, ?, ?)
    `;
    const values = [
      lName,
      eType,
      eTypeid,
      iType
    ];

    await pool.query(insertQuery, values);

    return res.status(200).json({ message: 'Location added successfully' });
  } catch (error) {
    console.error('Error adding location:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/updateLocation', async (req, res) => {
  try {
    const { eTypeid, eType, iType, lName, id } = req.body;

    console.log(req.body);

    // Initialize an array to store parameters for the update query
    const queryParams = [];
    let updateQuery = `
          UPDATE cs_app_mapdetails
          SET `;

    // Build the SET clause dynamically based on non-null and non-undefined fields
    if (lName !== undefined && lName !== null) {
      updateQuery += `location_name = ?, `;
      queryParams.push(lName);
    }
    if (eType !== undefined && eType !== null && eType !== '') {
      updateQuery += `exh_type = ?, `;
      queryParams.push(eType);
    }
    if (eTypeid !== undefined && eTypeid !== null) {
      updateQuery += `exh_type_id = ?, `;
      queryParams.push(eTypeid);
    }
    if (iType !== undefined && iType !== null) {
      updateQuery += `shape_type = ?, `;
      queryParams.push(iType);
    }

    // // Always update the timestamp
    // updateQuery += `update_date = ?, `;
    // queryParams.push(moment().format('YYYY-MM-DD HH:mm:ss'));

    // Remove the trailing comma and space from the query string
    updateQuery = updateQuery.slice(0, -2);

    // Add WHERE clause
    updateQuery += ` WHERE id = ?`;

    // Add exh_id to queryParams
    queryParams.push(id);

    // Execute the update query
    const [result] = await pool.query(updateQuery, queryParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.status(200).json({ message: 'Location updated successfully!' });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


//Location for map
router.get('/getExhiloc', verifyToken, async (req, res) => {
  try {
    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
        SELECT id, location_name, location_details, shape_type, exh_type, exh_type_id
        FROM cs_app_mapdetails
        WHERE status = 1
      `;
    // Execute the query to fetch field data from the table
    const [locData] = await pool.query(query);

    let query1 = `
    SELECT locat_id, locat_name, locat_type
    FROM cs_app_location_hall
    WHERE status = 1
  `;
    // Execute the query to fetch field data from the table
    const [hallData] = await pool.query(query1);

    // let query1 = `
    //     SELECT cs_value
    //     FROM cs_tbl_sitesetting
    //     WHERE cs_parameter = "dynamiclogin_id"
    //   `;
    // // Execute the query to fetch field data from the table
    // const [eventMode] = await pool.query(query1);

    // Respond with JSON containing fetched data
    res.json({ locData, hallData });
  } catch (error) {
    // Handle errors and respond with a 500 status code
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// router.post('/saveFloorPlanData', upload.single('image'), verifyToken, async (req, res) => {
//   try {
//     const { imageSrc, shapes, shapePositions, htmlContent } = req.body;
//     let imagePath = ''; // Initialize imagePath as empty string

//     // Check if req.file exists and get the path of the uploaded file
//     if (req.file) {
//       imagePath = req.file.path; // Get the path of the uploaded file
//     }


//     // Example: Update imageSrc, shapes, and shapePositions in your database where id = 1
//     // Adjust this according to your database schema and requirements
//     const updateQuery = `
//       UPDATE cs_app_storage
//       SET local_image = ?, local_image_path = ?, local_shape = ?, local_position = ?, updated_at = ?
//       WHERE id = ?
//     `;

//     const values = [ imageSrc, imagePath, shapes, shapePositions, moment().format('YYYY-MM-DD HH:mm:ss'), 1];

//     // Execute the query to update floor plan data
//     await pool.query(updateQuery, values);

//     // Update cs_app_htmlpagesdata table
//     const updateQuery1 = `
//         UPDATE cs_app_htmlpagesdata
//         SET html_content = ?
//         WHERE page_id = 10
//       `;
//     const values1 = [htmlContent];

//     await pool.query(updateQuery1, values1);

//     res.status(200).json({ message: `Floor plan data with id 1 updated successfully` });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });
router.post('/saveFloorPlanData', upload.single('image'), verifyToken, async (req, res) => {
  try {
    const { imageSrc, shapes, shapePositions, htmlContent, hallPositions } = req.body;
    let imagePath = ''; // Initialize imagePath as empty string

    // Check if req.file exists and get the path of the uploaded file
    if (req.file) {
      imagePath = req.file.path.replace(/\\/g, '/'); // Replace backslashes with forward slashes
      console.log(imagePath);
    }

    // Check if cs_app_storage table is empty
    const [storageResult] = await pool.query('SELECT COUNT(*) AS count FROM cs_app_storage');
    if (storageResult[0].count === 0) {
      // Insert a new default entry if the table is empty
      const defaultInsertQuery = `
        INSERT INTO cs_app_storage (local_image, local_shape, local_position, local_hall_position)
        VALUES (?, ?, ?, ?)
      `;
      const defaultValues = ['', '', '', '']; // Use empty strings or default values as needed
      await pool.query(defaultInsertQuery, defaultValues);
    }

    // Construct the base update query and values
    let updateQuery = `
      UPDATE cs_app_storage
      SET local_image = ?, local_shape = ?, local_position = ?, local_hall_position = ?
      WHERE id = ?
    `;
    let values = [imageSrc, shapes, shapePositions, hallPositions, 1];

    // If imagePath is available, modify the query and values
    if (imagePath) {
      updateQuery = `
        UPDATE cs_app_storage
        SET local_image = ?, local_image_path = ?, local_shape = ?, local_position = ?, local_hall_position = ?
        WHERE id = ?
      `;
      values = [imageSrc, imagePath, shapes, shapePositions, hallPositions, 1];
    }

    // Execute the query to update floor plan data
    await pool.query(updateQuery, values);

    // Retrieve the page_id where page_value is 'map'
    const [pageResult] = await pool.query(`SELECT page_id FROM cs_app_pages WHERE page_value = 'maps'`);
    
    if (pageResult.length === 0) {
      return res.status(404).json({ message: 'Page with value "map" not found' });
    }

    const pageId = pageResult[0].page_id;

    // Update cs_app_htmlpagesdata table with the retrieved page_id
    const updateQuery1 = `
      UPDATE cs_app_htmlpagesdata
      SET html_content = ?
      WHERE page_id = ?
    `;
    const values1 = [htmlContent, pageId];

    await pool.query(updateQuery1, values1);

    res.status(200).json({ message: `Floor plan data with id 1 updated successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


//8/8/2024
// router.post('/saveFloorPlanData', upload.single('image'), verifyToken, async (req, res) => {
//   try {
//     const { imageSrc, shapes, shapePositions, htmlContent, hallPositions } = req.body;
//     let imagePath = ''; // Initialize imagePath as empty string

//     // Check if req.file exists and get the path of the uploaded file
//     if (req.file) {
//       imagePath = req.file.path.replace(/\\/g, '/'); // Replace backslashes with forward slashes
//       console.log(imagePath);
//     }

//     // Construct the base update query and values
//     let updateQuery = `
//       UPDATE cs_app_storage
//       SET local_image = ?, local_shape = ?, local_position = ?, local_hall_position = ?, updated_at = ?
//       WHERE id = ?
//     `;
//     let values = [imageSrc, shapes, shapePositions, hallPositions, moment().format('YYYY-MM-DD HH:mm:ss'), 1];

//     // If imagePath is available, modify the query and values
//     if (imagePath) {
//       updateQuery = `
//         UPDATE cs_app_storage
//         SET local_image = ?, local_image_path = ?, local_shape = ?, local_position = ?, local_hall_position = ?, updated_at = ?
//         WHERE id = ?
//       `;
//       values = [imageSrc, imagePath, shapes, shapePositions, hallPositions, moment().format('YYYY-MM-DD HH:mm:ss'), 1];
//     }

//     // Execute the query to update floor plan data
//     await pool.query(updateQuery, values);

//     // Update cs_app_htmlpagesdata table
//     const updateQuery1 = `
//         UPDATE cs_app_htmlpagesdata
//         SET html_content = ?
//         WHERE page_id = 10
//       `;
//     const values1 = [htmlContent];

//     await pool.query(updateQuery1, values1);

//     res.status(200).json({ message: `Floor plan data with id 1 updated successfully` });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });


router.get('/getFloorPlanData', verifyToken, async (req, res) => {
  try {
    // Example: Fetch imageSrc, shapes, and shapePositions from your database where id = 1
    // Adjust this according to your database schema and requirements
    const query = `
      SELECT local_image as imageSrc, local_image_path as imagePath, local_shape as shapes, local_position as shapePositions, local_hall_position as hallPositions
      FROM cs_app_storage
      WHERE id = 1
    `;

    // Execute the query to fetch floor plan data
    const [result] = await pool.query(query);

    if (result.length > 0) {
      let { imageSrc, imagePath, shapes, shapePositions, hallPositions } = result[0];

      // Attempt to parse JSON fields if they are strings
      try {
        shapes = JSON.parse(shapes);
      } catch (e) {
        console.warn('shapes is not valid JSON, using raw value.');
      }

      try {
        shapePositions = JSON.parse(shapePositions);
      } catch (e) {
        console.warn('shapePositions is not valid JSON, using raw value.');
      }

      try {
        hallPositions = JSON.parse(hallPositions);
      } catch (e) {
        console.warn('hallPositions is not valid JSON, using raw value.');
      }

      res.status(200).json({ imageSrc, imagePath, shapes, shapePositions, hallPositions });
    } else {
      res.status(404).json({ message: 'Floor plan data not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/check-location-name',verifyToken, async (req, res) => {
  const { lName } = req.body;

  try {
    // Execute SQL query to check if email exists in the database
    const [users] = await pool.query('SELECT * FROM cs_app_mapdetails WHERE location_name = ?', [lName]);

    // Check if any user with the provided email exists
    if (users.length > 0) {
      // Email already exists in the database
      res.status(200).json({ available: false });
    } else {
      // Email is available
      res.status(200).json({ available: true });
    }
  } catch (error) {
    console.error('Error checking location availability:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



module.exports = router;