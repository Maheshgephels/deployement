const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const verifyToken = require('../api/middleware/authMiddleware');



// Define the route to fetch Facility data from the cs_os_badgeapp_userlogin
router.get('/getBasicFields', verifyToken, async (req, res) => {
    try {


        const columnsToFetch = ['*'];

        // Construct the SQL query to fetch specific columns with pagination and search
        let query = `
    SELECT ${columnsToFetch}
    FROM cs_os_cert_field_data
    WHERE cs_status = 1
  `;


        // Execute the query to fetch field data from the table
        const [userData] = await pool.query(query);





        res.json({ Fields: userData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//Get lock status
router.get('/getLockStatus', verifyToken, async (req, res) => {
    try {

        const columnsToFetch = ['*'];


        let query = `
    SELECT ${columnsToFetch}
    FROM cs_tbl_sitesetting
    WHERE cs_parameter = 'Feedback Lock'
  `;

        // Execute the query to fetch field data from the table
        const [lockData] = await pool.query(query);


        res.json({ Lock: lockData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route to update lock status
router.post('/updateLockStatus', verifyToken, async (req, res) => {
    try {
        const { cs_value } = req.body; // Assuming lockValue is passed in the request body

        const id = 45;

        console.log("Status", cs_value)

        // // Validate lockValue (optional)
        // if (cs_value !== 0 && cs_value !== 1) {
        //   return res.status(400).json({ message: 'Invalid lock value. Must be 0 or 1.' });
        // }

        // Update query
        const query = `
      UPDATE cs_tbl_sitesetting
      SET cs_value = ?
      WHERE cs_parameter = 'Feedback Lock' 
    `;

        // Execute the update query
        const [pagesData] = await pool.query(query, [cs_value]);

        // Send the pages data as a response
        res.json(pagesData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Define the route to fetch Facility data from the cs_os_badgeapp_userlogin
router.get('/getFormfield', verifyToken, async (req, res) => {
    try {


        const columnsToFetch = ['*'];

        // Construct the SQL query to fetch specific columns with pagination and search
        let query = `
    SELECT ${columnsToFetch}
    FROM cs_os_cert_field_data
    WHERE cs_status = 1  AND cs_visible_feedback = 1
    ORDER by cs_field_order
  `;


        // Execute the query to fetch field data from the table
        const [formData] = await pool.query(query);



        res.json({ Fields: formData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//Get custom dropdowm
router.get('/getData', verifyToken, async (req, res) => {
    try {


        const columnsToFetch = ['*'];

        let query = `
    SELECT ${columnsToFetch}
    FROM cs_os_cert_field_option
    WHERE cs_status = 1
  `;
        // Execute the query to fetch custom field data from the table
        const [formData] = await pool.query(query);


        // Construct the SQL query to fetch specific columns with pagination and search
        let query1 = `
    SELECT ${columnsToFetch}
    FROM cs_os_cert_field_type
    WHERE cs_status = 1
  `;


        // Execute the query to fetch field data from the table
        const [typeData] = await pool.query(query1);



        res.json({ Dropdowndata: formData, Types: typeData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Type from cs_os_field_type
// router.get('/getTypes', verifyToken, async (req, res) => {
//   try {


//     const columnsToFetch = ['*'];

//     // Construct the SQL query to fetch specific columns with pagination and search
//     let query = `
//     SELECT ${columnsToFetch}
//     FROM cs_os_field_type
//     WHERE cs_status = 1
//   `;


//     // Execute the query to fetch field data from the table
//     const [typeData] = await pool.query(query);



//     res.json({ Types: typeData });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });


router.post('/getFieldData', verifyToken, async (req, res) => {
    try {
        // Extract role_id from the request body
        const { id } = req.body;

        console.log("Data:", id);



        // Construct the SQL query to fetch specific columns with pagination and search
        let query = `
      SELECT *
      FROM cs_os_cert_field_data
      WHERE cs_field_id = ${id};
      `;


        // Execute the query to fetch pages data for the specified role_id
        const [pagesData] = await pool.query(query, [id]);

        // Send the pages data as a response
        res.json(pagesData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



router.post('/updateFlag', verifyToken, async (req, res) => {
    try {
        // Extract item and flag from the request body
        const { item, val } = req.body;
        const flag = val;

        console.log(req.body);

        // Construct the SQL query to check if the fields need to be updated
        const checkQuery = `
      SELECT cs_visible_feedback
      FROM cs_os_cert_field_data 
      WHERE cs_field_label = ?`;

        // Execute the query to check the current values
        const [result] = await pool.query(checkQuery, [item]);

        // Check if the current values match the flag
        if (result && result.length > 0) {
            const { cs_visible_feedback } = result[0];
            if (cs_visible_feedback === flag) {
                // Values are already set to the flag, no need to update
                return res.status(200).json({ message: 'Fields are already flagged' });
            }
        }

        if (flag === 1) {
            // Get the current max field order
            const lastfieldOrderResult = await pool.query('SELECT cs_field_order FROM cs_os_cert_field_data ORDER BY cs_field_order DESC LIMIT 1');
            const fieldOrder = lastfieldOrderResult[0][0].cs_field_order;
            const newfieldOrder = fieldOrder + 1;

            // Construct the SQL query for updating the fields
            const updateQuery = `
        UPDATE cs_os_cert_field_data 
        SET cs_visible_feedback = ?, cs_field_order = ?
        WHERE cs_field_label = ?`;

            // Execute the query to update the fields
            await pool.query(updateQuery, [flag, newfieldOrder, item]);

        } else if (flag === 0) {
            const newFieldOrder = 0;

            // Construct the SQL query for updating the fields
            const updateQuery = `
        UPDATE cs_os_cert_field_data 
        SET cs_visible_feedback = ?, cs_field_order = ?
        WHERE cs_field_label = ?`;

            // Execute the query to update the fields
            await pool.query(updateQuery, [flag, newFieldOrder, item]);
        }

        // Send success response
        return res.status(200).json({ message: 'Flag updated successfully' });
    } catch (error) {
        // Handle errors
        console.error('Error updating fields:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});




router.post('/editField', async (req, res) => {
    // Log the received data
    console.log("Data:", req.body);

    try {
        // Extract data from the request body
        const { id, label, onspot, required, option_data, deletedOptionIds, new_option, fieldtype, mcq, multi } = req.body;

        // Ensure option_data is an array and filter out null values
        const filteredOptionData = option_data.filter(option => option && option.optionId !== null && option.optionVal !== null);

        const fieldType = fieldtype; // Assuming fieldType is constant for your application

        // Create a new array with modified optionVal
        const modifiedOptionData = filteredOptionData.map(option => ({
            ...option,
            optionVal: option.optionVal.toLowerCase().replace(/\s+/g, '')
        }));

        // Construct the SQL query for updating the fields
        const updateQuery = `
      UPDATE cs_os_cert_field_data 
      SET cs_field_label = ?, cs_is_required = ?, cs_field_question = ?, cs_field_multi = ?
      WHERE cs_field_id = ?`;

        // Execute the query to update the fields
        await pool.query(updateQuery, [label, required, mcq, multi, id]);

        // Update existing options
        for (let i = 0; i < filteredOptionData.length; i++) {
            const filteredOption = filteredOptionData[i];
            const modifiedOption = modifiedOptionData[i];

            // Check if the option has an optionId
            if (filteredOption.optionId) {
                // Update the existing option
                const updateOptionQuery = `
          UPDATE cs_os_cert_field_option 
          SET cs_field_option = ?, cs_field_option_value = ?
          WHERE cs_field_option_id = ?`;

                await pool.query(updateOptionQuery, [filteredOption.optionVal, modifiedOption.optionVal, filteredOption.optionId]);
            }
        }

        // Insert new options
        // Insert new options
        if (new_option && new_option.length > 0) {
            const insertOptionQuery = `
      INSERT INTO cs_os_cert_field_option (cs_field_id, cs_field_option, cs_field_option_value, cs_field_type) 
      VALUES ?`;

            const newOptions = new_option.map(option => [
                option.field_id,
                option.name,
                option.name.toLowerCase().replace(/\s+/g, ''),
                fieldType
            ]);

            await pool.query(insertOptionQuery, [newOptions]);
        }


        // Handle deletions
        if (deletedOptionIds && deletedOptionIds.length > 0) {
            const deleteOptionQuery = `
        DELETE FROM cs_os_cert_field_option 
        WHERE cs_field_option_id IN (?)`;

            await pool.query(deleteOptionQuery, [deletedOptionIds]);
        }

        // Send success response
        return res.status(200).json({ message: 'Field updated successfully' });
    } catch (error) {
        console.error('Error updating Field:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


// router.post('/editField', async (req, res) => {
//   // Log the received data
//   console.log("Data:", req.body);

//   try {
//     // Extract data from the request body
//     const { id, label, onspot, required, option_data, deletedOptionIds } = req.body;

//     // Ensure option_data is an array and filter out null values
//     const filteredOptionData = option_data.filter(option => option && option.optionId !== null && option.optionVal !== null);

//     const fieldType = 5; // Assuming fieldType is constant for your application

//     // Create a new array with modified optionVal
//     const modifiedOptionData = filteredOptionData.map(option => ({
//       ...option,
//       optionVal: option.optionVal.toLowerCase().replace(/\s+/g, '')
//     }));

//     // Construct the SQL query for updating the fields
//     const updateQuery = `
//       UPDATE cs_os_field_data 
//       SET cs_field_label = ?, cs_visible_onspot = ?, cs_is_required = ?
//       WHERE cs_field_id = ?`;

//     // Execute the query to update the fields
//     await pool.query(updateQuery, [label, onspot, required, id]);

//     // Iterate over each filtered option data object
//     for (let i = 0; i < filteredOptionData.length; i++) {
//       const filteredOption = filteredOptionData[i];
//       const modifiedOption = modifiedOptionData[i];

//       // Check if the option has an optionId
//       if (filteredOption.optionId) {
//         // Update the existing option
//         const updateOptionQuery = `
//           UPDATE cs_os_field_option 
//           SET cs_field_option = ?, cs_field_option_value = ?
//           WHERE cs_field_option_id = ?`;

//         await pool.query(updateOptionQuery, [filteredOption.optionVal, modifiedOption.optionVal, filteredOption.optionId]);
//       } else {
//         // Insert a new option
//         const insertOptionQuery = `
//           INSERT INTO cs_os_field_option (cs_field_id, cs_field_option, cs_field_option_value, cs_field_type) 
//           VALUES (?, ?, ?, ?)`;

//         // Log the insert query and values
//         console.log('Insert Query:', insertOptionQuery);
//         console.log('Insert Values:', [id, filteredOption.optionVal, modifiedOption.optionVal, fieldType]);

//         // Execute the insert query
//         await pool.query(insertOptionQuery, [id, filteredOption.optionVal, modifiedOption.optionVal, fieldType]);
//       }
//     }

//     // Handle deletions
//     if (deletedOptionIds && deletedOptionIds.length > 0) {
//       const deleteOptionQuery = `
//         DELETE FROM cs_os_field_option 
//         WHERE cs_field_option_id IN (?)`;

//       await pool.query(deleteOptionQuery, [deletedOptionIds]);
//     }

//     // Send success response
//     return res.status(200).json({ message: 'Field updated successfully' });
//   } catch (error) {
//     console.error('Error updating Field:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// });






router.delete('/deleteworkshop/:workshopId', verifyToken, async (req, res) => {
    const { workshopId } = req.params;

    try {
        // Delete from cs_os_workshop table
        const deleteQuery = 'DELETE FROM cs_os_workshop WHERE cs_workshop_id = ?';
        await pool.query(deleteQuery, [workshopId]);

        console.log(`Workshop with ID ${workshopId} deleted successfully.`);
        res.status(200).json({ message: 'Workshop deleted successfully' });
    } catch (error) {
        console.error('Error deleting workshop:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.post('/CreateCustomField', verifyToken, async (req, res) => {
    try {
        // Extract role_id from the request body
        const { customLabel, mcq_quest, FieldType, options, is_multi } = req.body;
        const spot = 0;
        const label = customLabel.toLowerCase().replace(/\s/g, '');
        const fieldName = `cs_${label}`;

        // const lastfieldOrderResult = await pool.query('SELECT cs_field_order FROM cs_os_field_data ORDER BY cs_field_order DESC LIMIT 1');
        // const fieldOrder = lastfieldOrderResult[0][0].cs_field_order;
        const newfieldOrder = 0;

        // Construct the SQL query to alter the table
        const alterTableQuery = `
        ALTER TABLE cs_os_feedback_form_data
        ADD COLUMN ${fieldName} varchar(255) NULL
        AFTER cs_regno
      `;

        // Execute the ALTER TABLE query
        await pool.query(alterTableQuery);

        // Construct the SQL query to insert a new role into the cs_os_field_data table
        const insertQuery = `
        INSERT INTO cs_os_cert_field_data (cs_field_name, cs_field_label, cs_field_question, cs_is_required,  cs_field_type, cs_field_order, cs_field_multi)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

        // Execute the query to insert the new role into the cs_tbl_roles table
        await pool.query(insertQuery, [fieldName, customLabel, mcq_quest, spot, FieldType, newfieldOrder, is_multi]);

        // Get the newly inserted field's ID
        const result = await pool.query(`SELECT cs_field_id FROM cs_os_cert_field_data WHERE cs_field_label = ?`, [customLabel]);
        const fieldId = result[0][0].cs_field_id;


        // Construct the SQL query to insert options into the cs_os_field_option table
        const insertQuery1 = `
        INSERT INTO cs_os_cert_field_option (cs_field_type, cs_field_id, cs_field_option, cs_field_option_value)
        VALUES (?, ?, ?, ?)
      `;

        // Execute the query to insert options into the cs_os_field_option table
        await Promise.all(options.map(async (option) => {
            // Lowercase each option before inserting
            const lowercaseOption = option.toLowerCase();
            await pool.query(insertQuery1, [FieldType, fieldId, option, lowercaseOption]);
        }));

        return res.status(200).json({ message: 'Custom field created successfully' });

    } catch (error) {
        console.error('Error creating Custom field:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


router.post('/deletefield', verifyToken, async (req, res) => {
    try {
        const { id, custom_label, custom_field } = req.body;

        // const label = custom_label.toLowerCase().replace(/\s/g, '');
        // const fieldName = `cs_${label}`;

        // console.log(fieldName);

        // Construct the SQL query to alter the table
        const alterTableQuery = `
        ALTER TABLE cs_os_feedback_form_data
        DROP COLUMN ${custom_field}
      `;

        // Execute the ALTER TABLE query
        await pool.query(alterTableQuery);

        const deleteQuery = 'DELETE FROM cs_os_cert_field_data WHERE cs_field_id = ?';
        await pool.query(deleteQuery, [id]);

        const deleteQuery1 = 'DELETE FROM cs_os_cert_field_option WHERE cs_field_id = ?';
        await pool.query(deleteQuery1, [id]);

        console.log(`Field with ID ${id} removed successfully.`);
        res.status(200).json({ message: 'Field removed successfully' });
    } catch (error) {
        console.error('Error deleting field:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});





// router.post('/moveup', async (req, res) => {
//   try {
//     // Extract item from the request body
//     const { item } = req.body;

//     // Check if the item is already at the top position
//     const checkTopPositionQuery = `
//       SELECT MIN(cs_field_order) AS min_order 
//       FROM cs_os_field_data`;
//     const [{ min_order }] = await pool.query(checkTopPositionQuery);

//     if (min_order === item) {
//       return res.status(400).json({ error: 'Already at the top position' });
//     }

//     // Construct the SQL query for updating the fields
//     const updateQuery = `
//       UPDATE cs_os_field_data 
//       SET cs_field_order = cs_field_order - 1
//       WHERE cs_field_order = ?`;

//     // Execute the query to update the fields
//     await pool.query(updateQuery, [item]);

//     // Send success response
//     return res.status(200).json({ message: 'Moved up successfully' });
//   } catch (error) {
//     // Handle errors
//     console.error('Error while moving up:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// });

// router.post('/movedown', async (req, res) => {
//   try {
//     // Extract item from the request body
//     const { item } = req.body;

//     // Check if the item is already at the bottom position
//     const checkBottomPositionQuery = `
//       SELECT MAX(cs_field_order) AS max_order 
//       FROM cs_os_field_data`;
//     const [{ max_order }] = await pool.query(checkBottomPositionQuery);

//     if (max_order === item) {
//       return res.status(400).json({ error: 'Already at the bottom position' });
//     }

//     // Construct the SQL query for updating the fields
//     const updateQuery = `
//       UPDATE cs_os_field_data 
//       SET cs_field_order = cs_field_order + 1
//       WHERE cs_field_order = ?`;

//     // Execute the query to update the fields
//     await pool.query(updateQuery, [item]);

//     // Send success response
//     return res.status(200).json({ message: 'Moved down successfully' });
//   } catch (error) {
//     // Handle errors
//     console.error('Error while moving down:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// });

router.post('/moveup', verifyToken, async (req, res) => {
    try {
        // Extract item from the request body
        const { item } = req.body;

        // Get the current field order of the item
        const getOrderQuery = 'SELECT cs_field_order FROM cs_os_cert_field_data WHERE cs_field_id = ?';
        const [orderResult] = await pool.query(getOrderQuery, [item]);

        if (orderResult.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const currentOrder = orderResult[0].cs_field_order;

        // Prevent cs_field_order from going below 1
        if (currentOrder <= 1) {
            return res.status(202).json({ error: 'Cannot move up. cs_field_order is already at the minimum value.' });
        }

        // Get the item that currently has the cs_field_order one less than or nearest to the current order,
        // but ensure cs_field_order doesn't go below 1
        const swapOrderQuery = `
    SELECT cs_field_id 
    FROM cs_os_cert_field_data 
    WHERE cs_field_order < ? AND cs_field_order > 0 
    ORDER BY cs_field_order DESC 
    LIMIT 1`;
        const [swapOrderResult] = await pool.query(swapOrderQuery, [currentOrder]);




        if (swapOrderResult.length === 0) {
            return res.status(500).json({ error: 'Failed to find the item to swap orders with' });
        }

        const swapItemId = swapOrderResult[0].cs_field_id;

        // Update the cs_field_order values for the two items
        const updateOrderQuery = `
      UPDATE cs_os_cert_field_data 
      SET cs_field_order = CASE 
        WHEN cs_field_id = ? THEN ?
        WHEN cs_field_id = ? THEN ?
      END
      WHERE cs_field_id IN (?, ?)`;

        await pool.query(updateOrderQuery, [item, currentOrder - 1, swapItemId, currentOrder, item, swapItemId]);

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
        const { item } = req.body;

        // Get the current field order of the item
        const getOrderQuery = 'SELECT cs_field_order FROM cs_os_cert_field_data WHERE cs_field_id = ?';
        const [orderResult] = await pool.query(getOrderQuery, [item]);

        if (orderResult.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const currentOrder = orderResult[0].cs_field_order;

        // Get the maximum field order
        const getMaxOrderQuery = 'SELECT MAX(cs_field_order) AS max_order FROM cs_os_cert_field_data';
        const [maxOrderResult] = await pool.query(getMaxOrderQuery);

        const maxOrder = maxOrderResult[0].max_order;

        // Prevent cs_field_order from going beyond the maximum value
        if (currentOrder >= maxOrder) {
            return res.status(202).json({ error: 'Cannot move down. cs_field_order is already at the maximum value.' });
        }

        // Get the item that currently has the cs_field_order one more than the current order
        const swapOrderQuery = 'SELECT cs_field_id FROM cs_os_cert_field_data WHERE cs_field_order = ?';
        const [swapOrderResult] = await pool.query(swapOrderQuery, [currentOrder + 1]);

        if (swapOrderResult.length === 0) {
            return res.status(500).json({ error: 'Failed to find the item to swap orders with' });
        }

        const swapItemId = swapOrderResult[0].cs_field_id;

        // Update the cs_field_order values for the two items
        const updateOrderQuery = `
      UPDATE cs_os_cert_field_data 
      SET cs_field_order = CASE 
        WHEN cs_field_id = ? THEN ?
        WHEN cs_field_id = ? THEN ?
      END
      WHERE cs_field_id IN (?, ?)`;

        await pool.query(updateOrderQuery, [item, currentOrder + 1, swapItemId, currentOrder, item, swapItemId]);

        // Send success response
        return res.status(200).json({ message: 'Moved down successfully' });
    } catch (error) {
        // Handle errors
        console.error('Error while moving down:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});




// router.get('/getRegno', (req, res, next) => {
//     db.getConnection((err, connection) => {
//         if (err) {
//             console.error('Error connecting to MySQL database:', err);
//             return next(err); // Pass the error to the error handling middleware
//         }
//         connection.query('SELECT cs_regno FROM cs_os_users', (err, results) => {
//             connection.release(); // Release the connection
//             if (err) {
//                 console.error('Error fetching users:', err);
//                 return next(err); // Pass the error to the error handling middleware
//             }
//             res.json(results);
//         });
//     });
//   });

// router.get('/getCatId', (req, res, next) => {
//   db.getConnection((err, connection) => {
//       if (err) {
//           console.error('Error connecting to MySQL database:', err);
//           return next(err); // Pass the error to the error handling middleware
//       }
//       connection.query('SELECT cs_reg_cat_id FROM cs_os_category WHERE cs_status = 1', (err, results) => {
//           connection.release(); // Release the connection
//           if (err) {
//               console.error('Error fetching users:', err);
//               return next(err); // Pass the error to the error handling middleware
//           }
//           res.json(results);
//       });
//   });
// });

router.get('/getRegno', verifyToken, async (req, res) => {
    try {


        // Construct the SQL query to fetch specific columns with pagination and search
        let query = `
      SELECT cs_regno
      FROM cs_os_users
    `;


        // Execute the query to fetch field data from the table
        const [regData] = await pool.query(query);







        res.json(regData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/getCatId', verifyToken, async (req, res) => {
    try {


        // Construct the SQL query to fetch specific columns with pagination and search
        let query = `
      SELECT cs_reg_cat_id
      FROM cs_os_category
      WHERE cs_status = 1
      AND cs_reg_cat_id != 3
    `;


        // Execute the query to fetch field data from the table
        const [catData] = await pool.query(query);

        let query1 = `
    SELECT cs_workshop_id
    FROM cs_os_workshop
    WHERE cs_status = 1
  `;

        const [workshopData] = await pool.query(query1);

        let query2 = `
      SELECT cs_field_label
      FROM cs_os_field_data
      WHERE cs_is_required = 1
    `;

        // Execute the query to fetch field data from the table
        const [mandatoryData] = await pool.query(query2);

        let query3 = `
    SELECT cs_prefix_id, cs_prefix
    FROM cs_os_name_prefixes
    WHERE cs_status = 1
  `;
        const [prefixData] = await pool.query(query3);

        let query4 = `
    SELECT facultytype_id, type_title
    FROM cs_app_facultytype
    WHERE status = 1
  `;
        const [facultyData] = await pool.query(query4);



        res.json({ catData, workshopData, mandatoryData, prefixData, facultyData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.post('/check-field-name', verifyToken, async (req, res) => {
    const { customLabel } = req.body;

    try {
        // Execute SQL query to check if email exists in the database
        const [users] = await pool.query('SELECT * FROM cs_os_field_data WHERE cs_field_label = ?', [customLabel]);

        // Check if any user with the provided email exists
        if (users.length > 0) {
            // Email already exists in the database
            res.status(200).json({ available: false });
        } else {
            // Email is available
            res.status(200).json({ available: true });
        }
    } catch (error) {
        console.error('Error checking facility availability:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});












module.exports = router;