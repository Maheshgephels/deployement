const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const multer = require('multer');
// const verifyToken = require('./middleware/authMiddleware'); 
const verifyToken =require('../api/middleware/authMiddleware');
// const path = require('path');
const fs = require('fs');
const path = require('path');



//----------------
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'badgeimg/'); // Ensure this directory exists
    },
    filename: function (req, file, cb) {
        const currentDate = new Date();
        const day = String(currentDate.getDate()).padStart(2, '0');
        const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero based
        const year = currentDate.getFullYear();
        const dateSuffix = day + month + year; // Concatenate day, month, and year
        const fileNameWithoutExtension = file.originalname.split('.').slice(0, -1).join('.'); // Remove extension from original filename
        const extension = file.originalname.split('.').pop(); // Get the file extension
        let newFileName = fileNameWithoutExtension + '-' + dateSuffix + '.' + extension; // Append date and extension

        // Check if the filename already exists in the destination folder
        let fileIndex = 1;
        while (fs.existsSync(`badgeimg/${newFileName}`)) {
            newFileName = fileNameWithoutExtension + '-' + dateSuffix + '-' + fileIndex + '.' + extension;
            fileIndex++;
        }

        cb(null, newFileName); // Use the new filename
    }
});

const upload = multer({ storage: storage });


//---------------------------
// Route to delete a badge and its associated fields
router.delete('/removecertificate/:badgeId',verifyToken ,async (req, res) => {
    const badgeId = req.params.badgeId;
    try {
        // Delete the badge from the cs_os_cert_template table
        await pool.query('DELETE FROM cs_os_cert_template WHERE cs_cert_id = ?', [badgeId]);

        // Delete associated fields from the cs_os_cert_fields table
        await pool.query('DELETE FROM cs_os_cert_fields WHERE cs_cert_id = ?', [badgeId]);

        // Respond with success message
        res.json({ success: true, message: 'Certificate and associated fields deleted successfully' });
    } catch (error) {
        console.error('Error removing badge:', error);
        // Respond with error message
        res.status(500).json({ success: false, error: 'Failed to delete Certificate and associated fields' });
    }
});


//---------------------------
// Route to fetch previously created badges
router.get('/getcreatedcertificate',verifyToken, async (req, res) => {
    try {
        // Query to fetch badges with necessary fields
        const query = `
            SELECT bt.cs_cert_id AS badge_id, 
                   bt.cs_cert_name AS badge_name,
                   bt.cs_reg_cat_id AS category_id, 
                   cat.cs_reg_category AS category_name, 
                   bt.cs_cert_width AS width, 
                   bt.cs_cert_height AS height,
                   bt.created_at AS created_at,
                   bt.updated_at AS updated_at
            FROM cs_os_cert_template bt
            LEFT JOIN cs_os_category cat ON bt.cs_reg_cat_id = cat.cs_reg_cat_id
        `;
        const [rows] = await pool.query(query);

        // Send the fetched badges as a response
        const createdBadges = rows.map(badge => ({
            badge_id: badge.badge_id,
            badge_name: badge.badge_name,
            badge_type: badge.badge_type,
            category_id: badge.category_id,
            category_name: badge.category_name,
            designation_id: badge.designation_id,
            designation_name: badge.designation_name,
            width: badge.width,
            height: badge.height,
            created_at: badge.created_at,
            updated_at: badge.updated_at
        }));

        res.json({ success: true, createdBadges });
    } catch (error) {
        console.error('Error fetching created badges:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch created badges' });
    }
});
//---------------------------

// Assuming Multer is set up correctly
router.post('/uplaodebadgeimg',verifyToken, upload.single('image'), (req, res) => {
    if (req.file) {
        const imageUrl = 'badgeimg/' + req.file.filename;
        console.log('File path:', imageUrl);
        res.json({ success: true, imageUrl: imageUrl });
    } else {
        res.status(400).json({ success: false, error: 'No file uploaded' });
    }
});



//-----------------



router.get('/getdesignations/:categoryId', verifyToken,async (req, res) => {
    try {
        const { categoryId } = req.params;

        // Fetch designations based on the provided category ID from the database where cs_status is 1
        const designationsQuery = 'SELECT cs_designation_id, cs_designation_name FROM cs_tbl_category_designation WHERE cs_reg_cat_id = ? AND cs_status = 1';

        // Execute the query to fetch designations
        const designationsResult = await pool.query(designationsQuery, [categoryId]);
        console.log('Fetched designationsResult:', designationsResult);

        // Extract the data from the first array within designationsResult
        const designationsData = designationsResult[0];

        // If no data rows are returned, return an empty array
        if (!designationsData || designationsData.length === 0) {
            console.log('No designations found for the category:', categoryId);
            res.status(200).json({ designations: [] });
            return;
        }

        // Extract the data from the query result
        const designations = designationsData.map(designation => ({
            id: designation.cs_designation_id,
            name: designation.cs_designation_name
        }));

        console.log('Fetched designations:', designations);

        // Send the designations data in the response
        res.status(200).json({ designations });
    } catch (error) {
        console.error('Error fetching designations:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


//---
// Route to update the badge name
router.put('/updatecertname/:badgeId', verifyToken, async (req, res) => {
    const badgeId = req.params.badgeId;
    const { badgeName } = req.body;

    if (!badgeName) {
        return res.status(400).json({ success: false, message: 'Certificate name is required' });
    }

    try {
        // Update the badge name in the database
        const [result] = await pool.query('UPDATE cs_os_cert_template SET cs_cert_name = ? WHERE cs_cert_id = ?', [badgeName, badgeId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }

        res.json({ success: true, message: 'Certificate name updated successfully' });
    } catch (error) {
        console.error('Error updating badge name:', error);
        res.status(500).json({ success: false, error: 'Failed to update Certificate name' });
    }
});





// router.post('/getcategories',verifyToken, async (req, res) => {
//     try {
//         // Fetch categories from the database where cs_status is 1
//         const categoriesQuery = 'SELECT cs_reg_cat_id, cs_reg_category FROM cs_os_category WHERE cs_status = 1';

//         // Execute the query to fetch categories
//         const categoriesResult = await pool.query(categoriesQuery);

//         // Flatten the array to access the array of objects containing category data
//         const flattenedCategories = categoriesResult.flat();

//         // Extract the data from the query result
//         const categories = flattenedCategories.map(category => ({
//             id: category.cs_reg_cat_id,
//             name: category.cs_reg_category,
//         }));

//         console.log('Fetched categories:', categories); // Log the extracted categories

//         // Send the categories data in the response
//         res.status(200).json({ categories });
//     } catch (error) {
//         console.error('Error fetching categories:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

router.post('/getcategories', verifyToken, async (req, res) => {
    try {
        const categoriesQuery = 'SELECT cs_reg_cat_id, cs_reg_category FROM cs_os_category WHERE cs_status = 1';
        const categoriesResult = await pool.query(categoriesQuery);

        // Extract the array of categories from categoriesResult
        const categoriesData = categoriesResult[0]; // Access the first array in categoriesResult

        // Map over the categoriesData to create the categories array
        const categories = categoriesData.map(category => ({
            id: category.cs_reg_cat_id,
            name: category.cs_reg_category,
        }));

        console.log('Fetched categories:', categories);
        res.status(200).json({ categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});






// Define the route to create a badge template
router.post('/createcert',verifyToken, async (req, res) => {
    const { badgeName, categoryId } = req.body;

    try {
  
        const existingBadgeQuery = `
        SELECT cs_reg_cat_id FROM cs_os_cert_template WHERE cs_reg_cat_id = ?;
    `;
    
    const existingBadgeResult = await pool.query(existingBadgeQuery, [categoryId]);
    console.log('Existing badges:', existingBadgeResult,categoryId);

       // If a badge already exists for the category, return an error message
       if (existingBadgeResult.length > 0 && existingBadgeResult[0].length > 0) {
        console.log('A Certificate already exists for this category');
        return res.status(400).json({ message: 'A Certificate already exists for this category' });
    }


        const insertQuery = `
        INSERT INTO cs_os_cert_template (cs_cert_name, cs_reg_cat_id)
        VALUES (?, ?) 
    `;


        await pool.query(insertQuery, [badgeName, categoryId]);

        console.log('Certificate created successfully');

        res.status(201).json({ message: 'Certificate created successfully' });
    } catch (error) {
        console.error('Error creating badge:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.post('/Certconfiguration', verifyToken, async (req, res) => {
    const { badgeData } = req.body;
    const { width, height, orientation, storedData } = badgeData;
    const categoryId = storedData.id;  // Extract id from storedData

    console.log(req.body);

    try {
        // Check if a row with the given cs_reg_cat_id already exists
        const existingRowTemplate = await pool.query('SELECT * FROM cs_os_cert_template WHERE cs_reg_cat_id = ?', [categoryId]);

        if (existingRowTemplate.length > 0 && existingRowTemplate[0].length > 0) {
            const badgeId = existingRowTemplate[0][0].cs_cert_id;
            console.log("badgeId: here", badgeId);

            // If a row exists, update the existing row
            await pool.query(
                'UPDATE cs_os_cert_template SET cs_cert_width = ?, cs_cert_height = ?, orientation = ?  WHERE cs_reg_cat_id = ?',
                [width, height, orientation, categoryId]  // Use categoryId instead of id
            );

            return res.status(200).json({ message: 'Certificate design saved successfully!' });
        } else {
            // If no row exists, return an error response
            console.error('No row exists with the matching cs_reg_cat_id');
            return res.status(404).json({ error: 'No row exists with the matching cs_reg_cat_id' });
        }
    } catch (error) {
        console.error('Error updating badge:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.get('/formfields',verifyToken, async (req, res) => {
    try {
        // Execute a query to fetch the active form fields from the table
        // const [formFields] = await pool.query('SELECT cs_field_id, cs_field_label FROM cs_os_field_data WHERE cs_status = 1');
        const [formFields] = await pool.query('SELECT cs_field_id, cs_field_label FROM cs_os_field_data WHERE cs_status = 1 AND cs_visible_onspot = 1 OR cs_field_id = 1');

        if (formFields.length === 0) {
            // If no active form fields are found, send a 404 Not Found response with an error message
            res.status(404).json({ status: 'error', message: 'No active form fields found' });
            // res.json(formFields);
        } else {
            // Send a 200 OK response with the form fields data
            res.status(200).json({ status: 'success', data: formFields });
        }
    } catch (error) {
        console.error(error);
        // Send a 500 Internal Server Error response with an error message
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});

//--

router.post('/saveCertDesign', verifyToken, async (req, res) => {
    try {
        // Extract badge design information from request body

        if (!req.body || Object.keys(req.body).length === 0) {
            console.error('Request body is empty');
            return res.status(400).json({ error: 'Request body is empty' });
        }
        
        const badgeDesign = req.body;
        console.log('Received badge design:', badgeDesign);
        const { storedData, badgeSize, components, orientation } = badgeDesign;
        const { id } = storedData;
        const { width, height } = badgeSize;

        // Check if a row already exists with the matching cs_reg_cat_id
        const existingRowTemplate = await pool.query('SELECT * FROM cs_os_cert_template WHERE cs_reg_cat_id = ?', [id]);

        const badgeId = existingRowTemplate[0][0].cs_cert_id;
        console.log("badgeId: here", badgeId);

        if (existingRowTemplate.length > 0) {
            // If a row already exists, update the existing row
            // await pool.query('UPDATE cs_os_cert_template SET cs_cert_width = ?, cs_cert_height = ? WHERE cs_reg_cat_id = ?', [width, height, id]);

            await pool.query('UPDATE cs_os_cert_template SET cs_cert_width = ?, cs_cert_height = ?, orientation = ? WHERE cs_reg_cat_id = ?', [width, height, orientation, id]);



            // Remove all existing fields for the badge
            await pool.query('DELETE FROM cs_os_cert_fields WHERE cs_cert_id = ?', [badgeId]);


            // Loop through components and insert/update them into the cs_os_cert_fields table
            for (const component of components) {
                await processBadgeComponent(badgeId, component);
            }

            // Send success response
            return res.status(200).json({ message: 'Certificate design saved successfully!' });
        } else {


            // If no row exists, send an error response
            console.error('No row exists with the matching cs_reg_cat_id');
            return res.status(404).json({ error: 'No row exists with the matching cs_reg_cat_id' });
        }
    } catch (error) {
        console.error('Error saving badge design:', error);
        return res.status(500).json({ error: 'Failed to save badge design. Please try again.' });
    }
});



async function processQRComponent(badgeId, component) {
    const { content, size, position, textFontSize, type, fontColor, alignment, font, fontWeight, rotation } = component;
    const csfieldName = 'cs_regno'; // For QR type, set csfieldName to 'cs_regno'

    const { width: fieldWidth, height: fieldHeight } = size;
    const { left: fieldPosX, top: fieldPosY } = position;

    // Check if the field exists and update it, otherwise insert a new record
    const existingField = await pool.query('SELECT * FROM cs_os_cert_fields WHERE cs_field_content = ? AND cs_cert_id = ?', [content, badgeId]);
    if (existingField[0].length > 0) {
        // If the field exists, update its values
        await pool.query(
            'UPDATE cs_os_cert_fields SET cs_field_name = ?, cs_field_type_id = ?, cs_field_position_x = ?, cs_field_position_y = ?, cs_text_size = ?, cs_field_width = ?, cs_field_height = ?,cs_field_content=? WHERE  cs_field_type_id = ?',
            [csfieldName, 'qr', fieldPosX, fieldPosY, textFontSize, fieldWidth, fieldHeight, content, 'qr']
        );
    } else {
        // If the field doesn't exist, insert a new record
        await pool.query(
            'INSERT INTO cs_os_cert_fields (cs_cert_id, cs_field_label, cs_field_name, cs_field_type_id, cs_field_content, cs_field_position_x, cs_field_position_y, cs_text_size, cs_field_color, cs_field_alignment, cs_font, cs_field_weight, cs_field_rotate, cs_field_width, cs_field_height, cs_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [badgeId, 'qr', csfieldName, 'qr', content, fieldPosX, fieldPosY, textFontSize, fontColor, alignment, font, fontWeight, rotation, fieldWidth, fieldHeight, '1']
        );
    }
}

async function processFullnameComponent(badgeId, component) {
    const { content, textFontSize, size, position, fontColor, alignment, font, fontWeight, rotation } = component;
    const { width: fieldWidth, height: fieldHeight } = size;
    const { left: fieldPosX, top: fieldPosY } = position;
    const csfieldName = 'fullname'; // Set csfieldName for fullname type

    // Check if the field exists and update it, otherwise insert a new record
    const existingField = await pool.query('SELECT * FROM cs_os_cert_fields WHERE cs_field_label = ? AND cs_cert_id = ?', [content, badgeId]);
    if (existingField.length > 0 && existingField[0].length > 0) {
        // If the field exists, update its values
        await pool.query(
            'UPDATE cs_os_cert_fields SET cs_field_name = ?, cs_field_type_id = ?, cs_field_position_x = ?, cs_field_position_y = ?, cs_text_size = ?, cs_field_width = ?, cs_field_height = ? WHERE cs_field_label = ?',
            [csfieldName, 'fullname', fieldPosX, fieldPosY, textFontSize, fieldWidth, fieldHeight, content]
        );
    } else {
        // If the field doesn't exist, insert a new record
        await pool.query(
            'INSERT INTO cs_os_cert_fields (cs_cert_id, cs_field_label, cs_field_name, cs_field_type_id, cs_field_content, cs_field_position_x, cs_field_position_y, cs_text_size, cs_field_color, cs_field_alignment, cs_font, cs_field_weight, cs_field_rotate, cs_field_width, cs_field_height, cs_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [badgeId, content, csfieldName, 'fullname', '', fieldPosX, fieldPosY, textFontSize, fontColor, alignment, font, fontWeight, rotation, fieldWidth, fieldHeight, '1']
        );
    }
}




async function processBadgeComponent(badgeId, component) {
    const { type, content, textFontSize, size, position, } = component;

    if (type === 'qr') {
        await processQRComponent(badgeId, component);
    } else if (type === 'customtext') {
        const { type, content, textFontSize, size, position,  fontColor, alignment, font, fontWeight, rotation } = component;
        const { width: fieldWidth, height: fieldHeight } = size;
        const { left: fieldPosX, top: fieldPosY } = position;

        let csfieldName = ''; // Determine csfieldName for custom text

        // Check if the field exists and update it, otherwise insert a new record
        const existingField = await pool.query('SELECT * FROM cs_os_cert_fields WHERE cs_field_label = ? AND cs_cert_id = ?', [content, badgeId]);
        if (existingField.length > 0 && existingField[0].length > 0) {
            // If the field exists, update its values
            await pool.query(
                'UPDATE cs_os_cert_fields SET cs_field_name = ?, cs_field_type_id = ?, cs_field_position_x = ?, cs_field_position_y = ?, cs_text_size = ?, cs_field_width = ?, cs_field_height = ? WHERE cs_field_label = ?',
                [csfieldName, type, fieldPosX, fieldPosY, textFontSize, fieldWidth, fieldHeight, content]
            );
        } else {
            // If the field doesn't exist, insert a new record
            await pool.query( 
                'INSERT INTO cs_os_cert_fields (cs_cert_id, cs_field_label, cs_field_name, cs_field_type_id, cs_field_content, cs_field_position_x, cs_field_position_y, cs_text_size, cs_field_color, cs_field_alignment, cs_font, cs_field_weight, cs_field_rotate, cs_field_width, cs_field_height, cs_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [badgeId, content, csfieldName, type, '', fieldPosX, fieldPosY, textFontSize, fontColor, alignment, font, fontWeight, rotation, fieldWidth, fieldHeight, '1']
            );
        }
    } else if (type === 'fullname') {
        await processFullnameComponent(badgeId, component)
    }
    else {
        // For non-QR types, continue with the existing logic
        let csfieldName = '';

        if (type === 'image' || type === 'backgroundimage') {
            const { size, position } = component;
            const { width: fieldWidth, height: fieldHeight } = size;
            const { left: fieldPosX, top: fieldPosY } = position;

            // csfieldName = type === 'qr' ? 'cs_regno' : csfieldName;


            // Process image or backgroundimage components
            const existingField = await pool.query('SELECT * FROM cs_os_cert_fields WHERE cs_field_content = ? AND cs_cert_id = ?', [content, badgeId]);
            // Check if the field exists and update it, otherwise insert a new record
            if (existingField.length > 0 && existingField[0].length > 0) {
                // If the field exists, update its values
                await pool.query(
                    'UPDATE cs_os_cert_fields SET cs_field_name = ?, cs_field_type_id = ?, cs_field_position_x = ?, cs_field_position_y = ?, cs_text_size = ?, cs_field_width = ?, cs_field_height = ? WHERE cs_field_content = ?',
                    [csfieldName, type, fieldPosX, fieldPosY, textFontSize, fieldWidth, fieldHeight, content]
                );
            } else {
                // If the field doesn't exist, insert a new record
                await pool.query(
                    'INSERT INTO cs_os_cert_fields (cs_cert_id, cs_field_label, cs_field_name, cs_field_type_id, cs_field_content, cs_field_position_x, cs_field_position_y, cs_text_size, cs_field_color, cs_field_alignment, cs_font, cs_field_width, cs_field_height, cs_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [badgeId,type, csfieldName, type, content, fieldPosX, fieldPosY, textFontSize, '', '', '', fieldWidth, fieldHeight, '1']
                );
            }
        } else {

            // For other types, continue with existing logic
            const fieldData = await pool.query('SELECT cs_field_name FROM cs_os_field_data WHERE cs_field_label = ?', [content]);
            csfieldName = fieldData.length > 0 ? fieldData[0][0].cs_field_name : '';

            const { size, position, fontColor, alignment, font, fontWeight, rotation } = component;
            const { width: fieldWidth, height: fieldHeight } = size;
            const { left: fieldPosX, top: fieldPosY } = position;

            // Check if the field exists and update it, otherwise insert a new record
            const existingField = await pool.query('SELECT * FROM cs_os_cert_fields WHERE cs_field_label = ? AND cs_cert_id = ?', [content, badgeId]);
            if (existingField.length > 0 && existingField[0].length > 0) {
                // If the field exists, update its values
                await pool.query(
                    'UPDATE cs_os_cert_fields SET cs_field_name = ?, cs_field_type_id = ?, cs_field_position_x = ?, cs_field_position_y = ?, cs_text_size = ?, cs_field_width = ?, cs_field_height = ? WHERE cs_field_label = ?',
                    [csfieldName, type, fieldPosX, fieldPosY, textFontSize, fieldWidth, fieldHeight, content]
                );
            } else {
                // If the field doesn't exist, insert a new record
                await pool.query(
                    'INSERT INTO cs_os_cert_fields (cs_cert_id, cs_field_label, cs_field_name, cs_field_type_id, cs_field_content, cs_field_position_x, cs_field_position_y, cs_text_size, cs_field_color, cs_field_alignment, cs_font, cs_field_weight, cs_field_rotate, cs_field_width, cs_field_height, cs_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [badgeId, content, csfieldName, type, '', fieldPosX, fieldPosY, textFontSize, fontColor, alignment, font, fontWeight, rotation, fieldWidth, fieldHeight, '1']
                );
            }
        }
    }
}


// ++++++++++++++++++++++++++++++++ 

router.post('/cloneCertificate', verifyToken, async (req, res) => {
    try {
        const { badgeId, selectedCat } = req.body;

        console.log("badgeId:", badgeId);
console.log("selectedCat:", selectedCat);


        // Check if the badge exists
        const originalBadge = 'SELECT * FROM cs_os_cert_template WHERE cs_cert_id = ?';
        // if (originalBadge.length === 0) {
        //     return res.status(404).json({ error: 'Original badge template not found' });
        // }

        const [templateData] = await pool.query(originalBadge, [badgeId]);

        if (templateData.length === 0) {
          return res.status(404).json({ error: 'Template not found' });
        }

        // Extract badge information
        const { cs_cert_width, cs_cert_name, cs_cert_height, orientation } = templateData[0];

                // Modify the badge name by appending 'Clone'
                const newBadgeName = cs_cert_name + ' Clone';

        // Insert new badge template with the new category ID
        const result = await pool.query(
            'INSERT INTO cs_os_cert_template (cs_reg_cat_id, cs_cert_name, cs_cert_width, cs_cert_height, orientation) VALUES (?, ?, ?, ?, ?)',
            [selectedCat, newBadgeName, cs_cert_width, cs_cert_height, orientation]
        );

        // Access the insertId from the first element of the result array
        const newBadgeId = result[0].insertId;
        console.log("New Certificate ID:", newBadgeId); // Log newBadgeId for debugging

        // Clone fields associated with the original badge
        const QoriginalFields = 'SELECT * FROM cs_os_cert_fields WHERE cs_cert_id = ?';

        const [originalFields] = await pool.query(QoriginalFields, [badgeId]);

        console.log("Original Fields:", originalFields); // Log fields data

        if (originalFields.length > 0) {
            for (const field of originalFields) {
                try {
                    await pool.query(
                        'INSERT INTO cs_os_cert_fields (cs_cert_id, cs_field_label, cs_field_name, cs_field_type_id, cs_field_content, cs_field_position_x, cs_field_position_y, cs_text_size, cs_field_color, cs_field_alignment, cs_font, cs_field_weight, cs_field_rotate, cs_field_width, cs_field_height, cs_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [newBadgeId, field.cs_field_label, field.cs_field_name, field.cs_field_type_id, field.cs_field_content, field.cs_field_position_x, field.cs_field_position_y, field.cs_text_size, field.cs_field_color, field.cs_field_alignment, field.cs_font, field.cs_field_weight, field.cs_field_rotate, field.cs_field_width, field.cs_field_height, field.cs_status]
                    );
                } catch (error) {
                    console.error(`Error inserting field for Certificate ID ${newBadgeId}:`, error);
                }
            }
        } else {
            console.log("No fields to clone for this badge.");
        }

        res.status(200).json({ message: 'Certificate cloned successfully!', newBadgeId });
    } catch (error) {
        console.error('Error cloning badge:', error);
        res.status(500).json({ error: 'Failed to clone Certificate. Please try again.' });
    }
});




router.get('/getNoCertCat', verifyToken, async (req, res) => {
    try {
      const columnsToFetch = ['*'];
  
      // Construct the SQL query to fetch categories not present in the badge_template table
      let query = `
        SELECT ${columnsToFetch}
        FROM cs_os_category
        WHERE cs_status = 1
          AND cs_reg_cat_id NOT IN (0, 1)
          AND cs_reg_cat_id NOT IN (
            SELECT DISTINCT cs_reg_cat_id
            FROM cs_os_cert_template
          )
      `;
  
      // Execute the query to fetch category data from the table
      const [catData] = await pool.query(query);
  
      res.json({ Types: catData });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
// 




router.post('/getcertfileds',verifyToken, async (req, res) => {
    try {
        const category = req.body.category;
        console.log('Requested category:', category);

        // const categoryQuery = `SELECT cs_reg_cat_id FROM cs_os_category WHERE cs_reg_category = ?`;
        const categoryQuery = `SELECT cs_reg_cat_id FROM cs_os_category WHERE cs_reg_category = ?`;
        const [categoryRows] = await pool.query(categoryQuery, [category]);

        // const workshopQuery = `SELECT cs_workshop_id FROM cs_os_workshop WHERE cs_reg_category = ?`;
        // const [workshopRows] = await pool.query(categoryQuery, [category]);

        if (categoryRows.length === 0) {
            console.error('Category not found');
            return res.status(404).json({ error: 'Category not found. Please provide a valid category.' });
        }

        const cs_reg_cat_id = categoryRows[0].cs_reg_cat_id;

        const badgeQuery = `SELECT cs_cert_id, cs_cert_width, cs_cert_height, orientation  FROM cs_os_cert_template WHERE cs_reg_cat_id = ?`;
        const [badgeRows] = await pool.query(badgeQuery, [cs_reg_cat_id]);

        if (badgeRows.length === 0) {
            console.error('No Certificate data found for the provided category');
            return res.status(404).json({ error: 'No Certificate data found for the provided category.' });
        }

        const { cs_cert_id, cs_cert_width, cs_cert_height, orientation } = badgeRows[0];
        console.log('Certificate ID:', cs_cert_id);
        console.log('Certificate Width:', cs_cert_width);
        console.log('Certificate Height:', cs_cert_height);
        console.log('Certificate orientation :', orientation);

        const fieldsQuery = `SELECT * FROM cs_os_cert_fields WHERE cs_cert_id = ?`;
        const [fieldsRows] = await pool.query(fieldsQuery, [cs_cert_id]);

        const usersQuery = `SELECT * FROM cs_os_users WHERE cs_reg_cat_id = ? AND cs_isconfirm = 1 `;
        const [usersRows] = await pool.query(usersQuery, [cs_reg_cat_id]);

        const users = usersRows[0];

        console.log(users);

        // if (fieldsRows.length === 0) {
        //     console.error('No badge fields found for the provided badge ID');
        //     return res.status(404).json({ error: 'No badge fields found for the provided badge ID.' });
        // }

        const badgeFields = fieldsRows.map(row => ({
            cs_field_id: row.cs_field_id,
            cs_field_label: row.cs_field_label,
            cs_field_name: row.cs_field_name,
            cs_field_type_id: row.cs_field_type_id,
            cs_field_content: row.cs_field_content,
            cs_field_position_x: row.cs_field_position_x.toString(),
            cs_field_position_y: row.cs_field_position_y.toString(),
            cs_text_size: row.cs_text_size,
            cs_field_color: row.cs_field_color,
            cs_field_alignment: row.cs_field_alignment,
            cs_font: row.cs_font,
            cs_field_weight: row.cs_field_weight,
            cs_field_rotate: row.cs_field_rotate,
            cs_field_width: row.cs_field_width,
            cs_field_height: row.cs_field_height,
            cs_field_order: row.cs_field_order,
            cs_badge_side: row.cs_badge_side,
            cs_status: row.cs_status,
            created_at: row.created_at,
            updated_at: row.updated_at
        }));

    const responseData = {
        badgedata: {
            width: cs_cert_width,
            height: cs_cert_height,
            orientation: orientation,
            badge_fields: badgeFields
        },
        userData: usersRows, // Assuming you meant to use usersRows instead of users
        message: 'Certificate data retrieved successfully'
    };

    console.log('Response data:', responseData);
    res.json(responseData); // Send the combined responseData object
    } catch (error) {
        console.error('Error fetching badge data:', error);
        res.status(500).json({ error: 'An unexpected error occurred while fetching badge data. Please try again later.' });
    }
});





// exportbadgegetdata for singleuser on catagory and day basis 
router.post('/exportbadgegetdata',verifyToken, async (req, res) => {
    try {
        // Extract category from the request body
        const { category } = req.body;

        // Log the received category
        console.log('Category:', category);

        // Query to fetch data from cs_os_cert_template table based on category
        const templateQuery = `SELECT * FROM cs_os_cert_template WHERE cs_reg_cat_id = ?`;

        // Execute the SQL query using pool.query
        pool.query(templateQuery, [category], (templateError, templateResults) => {
            if (templateError) {
                console.error('Error fetching badge template data:', templateError);
                res.status(500).json({ error: 'An unexpected error occurred' });
            } else {
                // Log the retrieved template data
                console.log('Retrieved Template Data:', templateResults);

                // Query to fetch data from cs_os_cert_fields table based on badge IDs obtained from template results
                const fieldsQuery = `SELECT * FROM cs_os_cert_fields WHERE cs_cert_id IN (SELECT cs_cert_id FROM cs_os_cert_template WHERE cs_reg_cat_id = ?)`;

                // Execute the SQL query for cs_os_cert_fields using pool.query
                pool.query(fieldsQuery, [category], (fieldsError, fieldsResults) => {
                    if (fieldsError) {
                        console.error('Error fetching badge fields data:', fieldsError);
                        res.status(500).json({ error: 'An unexpected error occurred' });
                    } else {
                        // Log the retrieved fields data
                        console.log('Retrieved Fields Data:', fieldsResults);

                        // Send the retrieved data as response
                        res.json({ success: true, templateData: templateResults, fieldsData: fieldsResults });
                    }
                });
            }
        });
    } catch (error) {
        console.error('Error fetching badge data:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }

});




// userdataforBadgePrinting 
router.get('/getsearchUserdata', verifyToken, async (req, res) => {
    try {
        const { query } = req.query; // Extract the search query from the request query parameters
        console.log("getsearchUserdata query", query);
        const searchQuery = `%${query}%`; // Construct a SQL query with wildcard for partial matches

        // const columnsToFetch = ['*'];
        const columnsToFetch = ['u.*', 'r.cs_reg_daytype_name AS cs_reg_type', 'w.cs_workshop_name As cs_workshop_category'];
        // Query the database to search for users matching the search query
        // const sql = `
        //     SELECT ${columnsToFetch.join(', ')}
        //     FROM cs_os_users u
        //     JOIN cs_os_reg_daytype r ON u.cs_reg_type = r.cs_reg_daytype_id
        //     WHERE u.cs_regno LIKE ? OR
        //           u.cs_first_name LIKE ? OR
        //           u.cs_last_name LIKE ?
        // `;

        const sql = `
        SELECT ${columnsToFetch.join(', ')}
        FROM cs_os_users u
        LEFT JOIN cs_os_reg_daytype r ON u.cs_reg_type = r.cs_reg_daytype_id
        LEFT JOIN cs_os_workshop w ON u.cs_workshop_category = w.cs_workshop_id
            WHERE (u.cs_regno LIKE ? OR
                   u.cs_first_name LIKE ? OR
                   u.cs_last_name LIKE ?)
              AND u.cs_isconfirm = 1
              
    `;
        const results = await pool.query(sql, [searchQuery, searchQuery, searchQuery]);

        console.log('Search results:', results); // Log the search results

        if (results.length > 0) {
            // If users are found, return the list of matching users
            res.json(results);
        } else {
            // If no users are found, return an empty array
            res.json([]);
        }
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: 'Internal server error', message: 'An error occurred while searching for users' });
    }
});





module.exports = router;
