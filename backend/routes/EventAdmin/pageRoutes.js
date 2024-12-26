const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const moment = require('moment-timezone');
const verifyToken = require('../api/middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Import the fs module






// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'page-icon/'); // Specify the directory where files will be uploaded
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); // Set the filename
  }
});

const upload = multer({ storage: storage });

// Set up multer for general image uploads
const imageUploadStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'page-assets/'); // Directory for general uploads
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Timestamp-based filename for uniqueness
  }
});
const uploadImages = multer({ storage: imageUploadStorage });


// Route for uploading general images
router.post('/pageassets', uploadImages.array('files'), (req, res) => {

  console.log('Files received:', req.files); // Correctly logging all files

  if (req.files && req.files.length > 0) {
    const fileUrls = req.files.map(file => `http://localhost:4000/page-assets/${file.filename}`);
    return res.json({ images: fileUrls });
  } else {
    return res.status(400).json({ error: 'No files uploaded' });
  }
});


// Define the route to fetch Facility data from the cs_os_badgeapp_userlogin
router.get('/getPages', verifyToken, async (req, res) => {
  try {
    // Extract page number, page size, and search query from request query parameters
    const { page = 1, pageSize = 10, search = '', sortColumn = 'page_order', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * pageSize;

    const validColumns = ['page_id', 'page_display_name', 'status'];  // Add all valid column names here
    const columnToSortBy = validColumns.includes(sortColumn) ? sortColumn : 'page_order';


    const columnsToFetch = ['*'];

    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
      SELECT ${columnsToFetch}
      FROM cs_app_pages
    `;

    // Append search condition if search query is provided
    if (search) {
      query += `
          WHERE page_display_name LIKE '%${search}%'
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
      const totalCountQuery = 'SELECT COUNT(*) AS total FROM cs_app_pages WHERE 1';
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


router.get('/getCategory', verifyToken, async (req, res) => {
  try {
    // Query to fetch category data
    let query = `
        SELECT *
        FROM cs_os_category
        WHERE cs_status = 1
      `;
    const [catData] = await pool.query(query);

    // Query to fetch event mode data
    let query1 = `
        SELECT cs_value
        FROM cs_tbl_sitesetting
        WHERE cs_parameter = "dynamiclogin_id"
      `;
    const [eventMode] = await pool.query(query1);

    // Query to fetch pages with navbar set to '1'
    let query2 = `
        SELECT *
        FROM cs_app_pages
        WHERE navbar LIKE '1'
      `;
    const [navbarPages] = await pool.query(query2);

    // Check if the number of rows in navbarPages is more than 4
    const navbarLimit = navbarPages.length > 3 ? 'yes' : 'no';

    // Respond with JSON containing all fetched data and the additional check result
    res.json({ catData, eventMode, navbarLimit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/getPageAssets', verifyToken, async (req, res) => {
  try {

      // Define the path to the page-assets folder (located directly under backend)
      const assetsPath = path.join(__dirname, '..', '..', 'page-assets'); // Navigate up two levels to reach backend

      // Fetch all file names in the page-assets folder
      fs.readdir(assetsPath, (err, files) => {
          if (err) {
              console.error("Error reading directory:", err);
              return res.status(500).json({ error: 'Error reading directory' });
          }

          // Filter files if necessary, e.g., only include certain file types
          const assetFiles = files.filter(file => {
              // Optional: filter logic, e.g., only .jpg or .png files
              return file.endsWith('.jpg') || file.endsWith('.png');
          });

          // Send response with mapped IDs and asset files
          res.json({ assetFiles });
      });
  } catch (error) {
      console.error("Error fetching mapped ID:", error);
      res.status(500).json({ error: 'Internal server error' });
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
        WHERE page_id = ?;
    `;

    // Execute the query to fetch pages data for the specified role_id
    const [pagesData] = await pool.query(query, [item.page_id]);

    // Construct the SQL query to fetch specific columns with pagination and search
    let query1 = `
        SELECT html_content
        FROM cs_app_htmlpagesdata
        WHERE page_id = ?;
    `;

    // Execute the query to fetch HTML content for the specified page_id
    const [htmlData] = await pool.query(query1, [item.page_id]);


    // Send the pages data and HTML content as a response
    res.json({ pagesData, htmlData });
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
    const updateQuery = `UPDATE cs_app_pages SET status = ? WHERE page_id = ?`;
    await pool.query(updateQuery, [status, pageId]);

    // Update cs_status in cs_os_facilitytyp
    return res.status(200).json({ message: 'Status Updates successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/storePage', verifyToken, upload.single('pageIcon'), async (req, res) => {
  console.log(req.body);
  const { pName, pType, sidebar, navbar, pageContent, login, Category, pLink, NonCategory } = req.body;
  const pageIconPath = req.file ? req.file.path : null; // Get the path of the uploaded icon image
  const iconName = req.file ? req.file.originalname : null; // Use the original file name
  const value = pName.toLowerCase().replace(/\s/g, '');
  const homepage = 1;


  // Log the absolute path for debugging
  if (req.file) {
    console.log('Absolute icon path:', pageIconPath);
  }

  try {
    // Find the current highest page_order value and increment by 1
    const [result] = await pool.query(`SELECT MAX(page_order) as maxOrder FROM cs_app_pages WHERE page_order <> 1000`);
    const maxOrder = result[0].maxOrder || 0;
    const newPageOrder = maxOrder + 1;

    // Find the current highest page_id value and increment by 1
    const [pageH] = await pool.query(`SELECT MAX(page_id) as maxId FROM cs_app_pages`);
    const maxId = pageH[0].maxId || 0;
    const newPageId = maxId + 1;

    // Insert new page settings into the database
    const insertQuery = `INSERT INTO cs_app_pages (page_id, page_display_name, page_value, page_type, icon_image_name, icon_image_url, directlink_url, homepage, sidebar, navbar, page_order, login_access) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await pool.query(insertQuery, [newPageId, pName, value, pType, iconName, pageIconPath, pLink, homepage, sidebar, navbar, newPageOrder, login]);

    // Insert html page data in table
    const insertHTMLquery = `INSERT INTO cs_app_htmlpagesdata (page_id, html_content) VALUES (?, ?)`;
    await pool.query(insertHTMLquery, [newPageId, pageContent]);

    // Insert access for each category
    if (Category) {
      const categories = Category.split(',').map(catId => parseInt(catId.trim(), 10)); // Split and convert to array of integers
      const insertAccessquery = `INSERT INTO cs_app_access (cs_reg_cat_id, page_id) VALUES (?, ?)`;
      for (const catId of categories) {
        await pool.query(insertAccessquery, [catId, newPageId]);
      }
    }

    // Insert access for each non-category with status 0
    if (NonCategory) {
      const nonCategories = NonCategory.split(',').map(catId => parseInt(catId.trim(), 10)); // Split and convert to array of integers
      const insertNonCategoryQuery = `INSERT INTO cs_app_access (cs_reg_cat_id, page_id, status) VALUES (?, ?, ?)`;
      for (const catId of nonCategories) {
        await pool.query(insertNonCategoryQuery, [catId, newPageId, 0]); // Insert with status 0
      }
    }

    return res.status(200).json({ message: 'Page added successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



router.post('/moveup', verifyToken, async (req, res) => {
  try {
    // Extract item from the request body
    const { item, order } = req.body;

    // // Get the current field order of the item
    // const getOrderQuery = 'SELECT cs_field_order FROM cs_os_field_data WHERE cs_field_id = ?';
    // const [orderResult] = await pool.query(getOrderQuery, [item]);

    // if (orderResult.length === 0) {
    //   return res.status(404).json({ error: 'Item not found' });
    // }

    // const currentOrder = orderResult[0].cs_field_order;

    // Prevent cs_field_order from going below 2
    if (order <= 1) {
      return res.status(202).json({ error: 'Cannot move up. page order is already at the minimum value.' });
    }

    // Get the item that currently has the cs_field_order one less than or nearest to the current order,
    // but ensure cs_field_order doesn't go below 1
    const swapOrderQuery = `
    SELECT page_id 
    FROM cs_app_pages 
    WHERE page_order < ? AND page_order >= 1  
    ORDER BY page_order DESC 
    LIMIT 1`;
    const [swapOrderResult] = await pool.query(swapOrderQuery, [order]);




    if (swapOrderResult.length === 0) {
      return res.status(500).json({ error: 'Failed to find the item to swap orders with' });
    }

    const swapItemId = swapOrderResult[0].page_id;

    // Update the cs_field_order values for the two items
    const updateOrderQuery = `
      UPDATE cs_app_pages 
      SET page_order = CASE 
        WHEN page_id = ? THEN ?
        WHEN page_id = ? THEN ?
      END
      WHERE page_id IN (?, ?)`;

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

    // Get the current field order of the item
    // const getOrderQuery = 'SELECT cs_field_order FROM cs_os_field_data WHERE cs_field_id = ?';
    // const [orderResult] = await pool.query(getOrderQuery, [item]);

    // if (orderResult.length === 0) {
    //   return res.status(404).json({ error: 'Item not found' });
    // }

    // const currentOrder = orderResult[0].cs_field_order;

    // Get the maximum field order
    const getMaxOrderQuery = 'SELECT MAX(page_order) AS max_order FROM cs_app_pages';
    const [maxOrderResult] = await pool.query(getMaxOrderQuery);

    const maxOrder = maxOrderResult[0].max_order;

    // Prevent cs_field_order from going beyond the maximum value
    if (order >= maxOrder) {
      return res.status(202).json({ error: 'Cannot move down. page order is already at the maximum value.' });
    }

    // Get the item that currently has the cs_field_order one more than the current order
    const swapOrderQuery = 'SELECT page_id FROM cs_app_pages WHERE page_order = ?';
    const [swapOrderResult] = await pool.query(swapOrderQuery, [order + 1]);

    if (swapOrderResult.length === 0) {
      return res.status(500).json({ error: 'Failed to find the item to swap orders with' });
    }

    const swapItemId = swapOrderResult[0].page_id;

    // Update the cs_field_order values for the two items
    const updateOrderQuery = `
      UPDATE cs_app_pages 
      SET page_order = CASE 
        WHEN page_id = ? THEN ?
        WHEN page_id = ? THEN ?
      END
      WHERE page_id IN (?, ?)`;

    await pool.query(updateOrderQuery, [item, order + 1, swapItemId, order, item, swapItemId]);

    // Send success response
    return res.status(200).json({ message: 'Moved down successfully' });
  } catch (error) {
    // Handle errors
    console.error('Error while moving down:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// router.post('/updatePage', verifyToken, upload.single('pageIcon'), async (req, res) => {
//   const { page_id, pName, pType, sidebar, navbar, login, Category, pLink, pageContent } = req.body;
//   const pageIconPath = req.file ? req.file.path : null; // Get the path of the uploaded icon image
//   const absoluteIconPath = req.file ? path.resolve(req.file.path) : null; // Get the absolute path of the uploaded icon image
//   const iconName = req.file ? req.file.originalname : null; // Use the original file name

//   try {
//     // Update page settings in the database
//     const updateQuery = `
//           UPDATE cs_app_pages 
//           SET page_display_name = ?, page_type = ?, icon_image_name = ?, icon_image_url = ?, directlink_url = ?, sidebar = ?, navbar = ?, login_access = ?, updated_at = ? 
//           WHERE page_id = ?`;

//     await pool.query(updateQuery, [
//       pName, pType, iconName, absoluteIconPath, pLink, sidebar, navbar, login,
//       moment().format('YYYY-MM-DD HH:mm:ss'),
//       page_id
//     ]);

//     if (pageContent) {
//       const updateHTMLQuery = `
//           UPDATE cs_app_htmlpagesdata 
//           SET html_content = ? 
//           WHERE page_id = ?`;

//       await pool.query(updateHTMLQuery, [pageContent, page_id]);
//   }


//     // Insert access for each category
//     // if (Category) {
//     //   const categories = Category.split(',').map(catId => parseInt(catId.trim(), 10)); // Split and convert to array of integers
//     //   const insertAccessquery = `INSERT INTO cs_app_access (cs_reg_cat_id, page_id) VALUES (?, ?)`;
//     //   for (const catId of categories) {
//     //     await pool.query(insertAccessquery, [catId, newPageId]);
//     //   }
//     // } else {
//     //   // If Category is empty or undefined, insert default value 0
//     //   const insertAccessquery = `INSERT INTO cs_app_access (cs_reg_cat_id, page_id) VALUES (?, ?)`;
//     //   await pool.query(insertAccessquery, [0, newPageId]);
//     // }

//     return res.status(200).json({ message: 'Page added successfully' });
//   } catch (error) {
//     console.error('Error updating settings:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

router.post('/updatePage', verifyToken, upload.single('pageIcon'), async (req, res) => {
  console.log(req.body);
  const { page_id, pName, pType, sidebar, navbar, login, Category, pLink, pageContent, NonCategory, type } = req.body;
  const pageIconPath = req.file ? req.file.path : null; // Get the path of the uploaded icon image
  let iconName = null;
  let absoluteIconPath = null;


  // Check if req.file is defined to assign icon values
  if (req.file) {
    iconName = req.file.originalname; // Use the original file name
    absoluteIconPath = path.resolve(req.file.path); // Get the absolute path of the uploaded icon image
  }

  try {
    // Initialize an array to store parameters for the update query
    const queryParams = [];
    let updateQuery = `
      UPDATE cs_app_pages 
      SET `;

    // Build the SET clause dynamically based on non-null and non-undefined fields
    if (pName !== undefined && pName !== null) {
      updateQuery += `page_display_name = ?, `;
      queryParams.push(pName);
    }
    if (pType !== undefined && pType !== null) {
      updateQuery += `page_type = ?, `;
      queryParams.push(pType);
    }
    if (iconName !== null) {
      updateQuery += `icon_image_name = ?, `;
      queryParams.push(iconName);
    }
    if (pageIconPath !== null) {
      updateQuery += `icon_image_url = ?, `;
      queryParams.push(pageIconPath);
    }
    if (pLink !== undefined && pLink !== null) {
      updateQuery += `directlink_url = ?, `;
      queryParams.push(pLink);
    }
    if (sidebar !== undefined && sidebar !== null) {
      updateQuery += `sidebar = ?, `;
      queryParams.push(sidebar);
    }
    if (navbar !== undefined && navbar !== null) {
      updateQuery += `navbar = ?, `;
      queryParams.push(navbar);
    }
    if (login !== undefined && login !== null) {
      updateQuery += `login_access = ?, `;
      queryParams.push(login);
    }


    // Remove the trailing comma and space from the query string
    updateQuery = updateQuery.slice(0, -2);

    // Add WHERE clause
    updateQuery += ` 
      WHERE page_id = ?`;

    // Add page_id to queryParams
    queryParams.push(page_id);

    // Execute the update query
    await pool.query(updateQuery, queryParams);

    // Update HTML content if available
    if (type !== 'Static' && type !== 'Web') {
      if (pageContent !== undefined) {
        const updateHTMLQuery = `
        UPDATE cs_app_htmlpagesdata 
        SET html_content = ? 
        WHERE page_id = ?`;

        await pool.query(updateHTMLQuery, [pageContent, page_id]);
      }
    }

    // Handle Category updates
    if (Category !== undefined && Category !== null) {
      const categories = Category.split(',').map(catId => parseInt(catId.trim(), 10)).filter(catId => !isNaN(catId)); // Split, convert to array of integers, and filter NaNs

      // Check for existing categories in cs_app_access
      const [existingCategories] = await pool.query(`
        SELECT cs_reg_cat_id 
        FROM cs_app_access 
        WHERE page_id = ?
      `, [page_id]);

      const existingCategoryIds = existingCategories.map(row => row.cs_reg_cat_id);
      console.log("Existed:", existingCategoryIds); // Debug statement

      const newCategories = categories.filter(catId => !existingCategoryIds.includes(catId));
      console.log("NewCategory:", newCategories); // Debug statement

      // Insert new categories into cs_app_access
      const insertAccessQuery = `
        INSERT INTO cs_app_access (cs_reg_cat_id, page_id, status) 
        VALUES (?, ?, 1)`;

      for (const catId of newCategories) {
        await pool.query(insertAccessQuery, [catId, page_id]);
      }

      // Update status for existing categories
      const updateAccessQuery = `
        UPDATE cs_app_access 
        SET status = 1 
        WHERE cs_reg_cat_id = ? AND page_id = ?`;

      for (const catId of categories) {
        await pool.query(updateAccessQuery, [catId, page_id]);
      }
    }

    // Handle NonCategory updates
    if (NonCategory !== undefined && NonCategory !== null) {
      const nonCategories = NonCategory.split(',').map(catId => parseInt(catId.trim(), 10)).filter(catId => !isNaN(catId)); // Split, convert to array of integers, and filter NaNs
      const updateAccessQuery = `
        UPDATE cs_app_access 
        SET status = 0 
        WHERE cs_reg_cat_id = ? AND page_id = ?`;

      // Use a loop to update each category
      for (const catId of nonCategories) {
        await pool.query(updateAccessQuery, [catId, page_id]);
      }
    }

    // Handle success response
    return res.status(200).json({ message: 'Page updated successfully' });
  } catch (error) {
    // Handle error response
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// router.post('/updatePage', verifyToken, upload.single('pageIcon'), async (req, res) => {
//   console.log(req.body);
//   const { page_id, pName, pType, sidebar, navbar, login, Category, pLink, pageContent, NonCategory } = req.body;
//   const pageIconPath = req.file ? req.file.path : null; // Get the path of the uploaded icon image
//   let iconName = null;
//   let absoluteIconPath = null;

//   // Check if req.file is defined to assign icon values
//   if (req.file) {
//     iconName = req.file.originalname; // Use the original file name
//     absoluteIconPath = path.resolve(req.file.path); // Get the absolute path of the uploaded icon image
//   }

//   try {
//     // Initialize an array to store parameters for the update query
//     const queryParams = [];
//     let updateQuery = `
//       UPDATE cs_app_pages 
//       SET `;

//     // Build the SET clause dynamically based on non-null and non-undefined fields
//     if (pName !== undefined && pName !== null) {
//       updateQuery += `page_display_name = ?, `;
//       queryParams.push(pName);
//     }
//     if (pType !== undefined && pType !== null) {
//       updateQuery += `page_type = ?, `;
//       queryParams.push(pType);
//     }
//     if (iconName !== null) {
//       updateQuery += `icon_image_name = ?, `;
//       queryParams.push(iconName);
//     }
//     if (pageIconPath !== null) {
//       updateQuery += `icon_image_url = ?, `;
//       queryParams.push(pageIconPath);
//     }
//     if (pLink !== undefined && pLink !== null) {
//       updateQuery += `directlink_url = ?, `;
//       queryParams.push(pLink);
//     }
//     if (sidebar !== undefined && sidebar !== null) {
//       updateQuery += `sidebar = ?, `;
//       queryParams.push(sidebar);
//     }
//     if (navbar !== undefined && navbar !== null) {
//       updateQuery += `navbar = ?, `;
//       queryParams.push(navbar);
//     }
//     if (login !== undefined && login !== null) {
//       updateQuery += `login_access = ?, `;
//       queryParams.push(login);
//     }

//     // Add updated_at to SET clause
//     updateQuery += `updated_at = ?, `;
//     queryParams.push(moment().format('YYYY-MM-DD HH:mm:ss'));

//     // Remove the trailing comma and space from the query string
//     updateQuery = updateQuery.slice(0, -2);

//     // Add WHERE clause
//     updateQuery += ` 
//       WHERE page_id = ?`;

//     // Add page_id to queryParams
//     queryParams.push(page_id);

//     // Execute the update query
//     await pool.query(updateQuery, queryParams);

//     // Update HTML content if available
//     if (pageContent !== undefined) {
//       const updateHTMLQuery = `
//         UPDATE cs_app_htmlpagesdata 
//         SET html_content = ? 
//         WHERE page_id = ?`;

//       await pool.query(updateHTMLQuery, [pageContent, page_id]);
//     }

//     // Handle Category updates
//     if (Category !== undefined && Category !== null) {
//       const categories = Category.split(',').map(catId => parseInt(catId.trim(), 10)).filter(catId => !isNaN(catId)); // Split, convert to array of integers, and filter NaNs
//       const updateAccessQuery = `
//         UPDATE cs_app_access 
//         SET status = 1 
//         WHERE cs_reg_cat_id = ? AND page_id = ?`;

//       // Use a loop to update each category
//       for (const catId of categories) {
//         await pool.query(updateAccessQuery, [catId, page_id]);
//       }
//     }

//     // Handle NonCategory updates
//     if (NonCategory !== undefined && NonCategory !== null) {
//       const nonCategories = NonCategory.split(',').map(catId => parseInt(catId.trim(), 10)).filter(catId => !isNaN(catId)); // Split, convert to array of integers, and filter NaNs
//       const updateAccessQuery = `
//         UPDATE cs_app_access 
//         SET status = 0 
//         WHERE cs_reg_cat_id = ? AND page_id = ?`;

//       // Use a loop to update each category
//       for (const catId of nonCategories) {
//         await pool.query(updateAccessQuery, [catId, page_id]);
//       }
//     }

//     // Handle success response
//     return res.status(200).json({ message: 'Page updated successfully' });
//   } catch (error) {
//     // Handle error response
//     console.error('Error updating settings:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

// router.post('/updatePage', verifyToken, upload.single('pageIcon'), async (req, res) => {
//   console.log(req.body);
//   const { page_id, pName, pType, sidebar, navbar, login, Category, pLink, pageContent, NonCategory } = req.body;
//   const pageIconPath = req.file ? req.file.path : null; // Get the path of the uploaded icon image
//   let iconName = null;
//   let absoluteIconPath = null;

//   // Check if req.file is defined to assign icon values
//   if (req.file) {
//     iconName = req.file.originalname; // Use the original file name
//     absoluteIconPath = path.resolve(req.file.path); // Get the absolute path of the uploaded icon image
//   }

//   try {
//     // Initialize an array to store parameters for the update query
//     const queryParams = [];
//     let updateQuery = `
//       UPDATE cs_app_pages 
//       SET `;

//     // Build the SET clause dynamically based on non-null and non-undefined fields
//     if (pName !== undefined && pName !== null) {
//       updateQuery += `page_display_name = ?, `;
//       queryParams.push(pName);
//     }
//     if (pType !== undefined && pType !== null) {
//       updateQuery += `page_type = ?, `;
//       queryParams.push(pType);
//     }
//     if (iconName !== null) {
//       updateQuery += `icon_image_name = ?, `;
//       queryParams.push(iconName);
//     }
//     if (pageIconPath !== null) {
//       updateQuery += `icon_image_url = ?, `;
//       queryParams.push(pageIconPath);
//     }
//     if (pLink !== undefined && pLink !== null) {
//       updateQuery += `directlink_url = ?, `;
//       queryParams.push(pLink);
//     }
//     if (sidebar !== undefined && sidebar !== null) {
//       updateQuery += `sidebar = ?, `;
//       queryParams.push(sidebar);
//     }
//     if (navbar !== undefined && navbar !== null) {
//       updateQuery += `navbar = ?, `;
//       queryParams.push(navbar);
//     }
//     if (login !== undefined && login !== null) {
//       updateQuery += `login_access = ?, `;
//       queryParams.push(login);
//     }

//     // Add updated_at to SET clause
//     updateQuery += `updated_at = ?, `;
//     queryParams.push(moment().format('YYYY-MM-DD HH:mm:ss'));

//     // Remove the trailing comma and space from the query string
//     updateQuery = updateQuery.slice(0, -2);

//     // Add WHERE clause
//     updateQuery += ` 
//       WHERE page_id = ?`;

//     // Add page_id to queryParams
//     queryParams.push(page_id);

//     // Execute the update query
//     await pool.query(updateQuery, queryParams);

//     // Update HTML content if available
//     if (pageContent !== undefined) {
//       const updateHTMLQuery = `
//         UPDATE cs_app_htmlpagesdata 
//         SET html_content = ? 
//         WHERE page_id = ?`;

//       await pool.query(updateHTMLQuery, [pageContent, page_id]);
//     }

//     // Handle Category updates
//     if (Category !== undefined || Category !== null) {
//       const categories = Category.split(',').map(catId => parseInt(catId.trim(), 10)); // Split and convert to array of integers
//       const updateAccessQuery = `
//         UPDATE cs_app_access 
//         SET status = 1 
//         WHERE cs_reg_cat_id = ? AND page_id = ?`;

//       // Use a loop to update each category
//       for (const catId of categories) {
//         await pool.query(updateAccessQuery, [catId, page_id]);
//       }
//     }

//     // Handle NonCategory updates (if needed)
//     // Handle Category updates
//     if (NonCategory !== null) {
//       const categories = NonCategory.split(',').map(catId => parseInt(catId.trim(), 10)); // Split and convert to array of integers
//       const updateAccessQuery = `
//         UPDATE cs_app_access 
//         SET status = 0 
//         WHERE cs_reg_cat_id = ? AND page_id = ?`;

//       // Use a loop to update each category
//       for (const catId of categories) {
//         await pool.query(updateAccessQuery, [catId, page_id]);
//       }
//     }

//     // Handle success response
//     return res.status(200).json({ message: 'Page updated successfully' });
//   } catch (error) {
//     // Handle error response
//     console.error('Error updating settings:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });


router.delete('/deletePage', verifyToken, async (req, res) => {
  const { pageId, pageName } = req.body;

  console.log(req.body);


  try {
    // Delete from cs_os_workshop table
    const deleteQuery = 'DELETE FROM cs_app_pages WHERE page_id = ?';
    await pool.query(deleteQuery, [pageId]);

    const deleteAccessQuery = 'DELETE FROM cs_app_access WHERE page_id = ?';
    await pool.query(deleteAccessQuery, [pageId]);

    const deletePageQuery = 'DELETE FROM cs_app_htmlpagesdata WHERE page_id = ?';
    await pool.query(deletePageQuery, [pageId]);

    console.log(`Page with ID ${pageId} deleted successfully.`);
    res.status(200).json({ message: 'Exhibitor deleted successfully' });
  } catch (error) {
    console.error('Error deleting workshop:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/check-page-name', verifyToken, async (req, res) => {
  const { pName } = req.body;

  try {
    // Execute SQL query to check if email exists in the database
    const [users] = await pool.query('SELECT * FROM cs_app_pages WHERE page_display_name = ?', [pName]);

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