const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const nodemailer = require('nodemailer'); // Import nodemailer


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_PASS, // Your Gmail app password
  },
  tls: {
    rejectUnauthorized: false, // Ignore self-signed certificate error
  },
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
    
  try {
    if (!username) {
      return res.status(401).json({ message: 'Invalid username' });
    } else if (!password) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    // if (!username || !password) {
    //   return res.status(400).json({ message: 'Username and password are required' });
    // }


    // The BINARY function converts a value to a binary string & match, Then its check the case also for comparison.
    const [users] = await pool.query('SELECT * FROM cs_ad_admins WHERE BINARY csa_uname = ?', [username]);
    const user = users[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid username' });
    }

    if (user.csa_password !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Retrieve user's role information
    const [roles] = await pool.query('SELECT csa_role_name FROM cs_ad_roles WHERE csa_role_id = ?', [user.csa_role_id]);
    const roleName = roles[0].csa_role_name;

    // Fetch permissions based on role id
    const [permissions] = await pool.query(
      `SELECT 
                c.cs_component_name,
                MAX(a.view) AS \`view\`,
                MAX(a.validate) AS \`validate\`,
                MAX(a.\`add\`) AS \`add\`,
                MAX(a.edit) AS \`edit\`,
                MAX(a.delete) AS \`delete\`,
                MAX(a.print) AS \`print\`
            FROM  
                cs_ad_components_access AS a 
            JOIN 
                cs_ad_components AS c ON a.cs_component_id = c.cs_component_id 
            WHERE 
                a.csa_role_id = ?
            GROUP BY 
                c.cs_component_name`,
      [user.csa_role_id]
    );

    const rolePermissions = permissions.reduce((acc, curr) => {
      acc[curr.cs_component_name] = {
        view: curr.view,
        validate: curr.validate,
        add: curr.add,
        edit: curr.edit,
        delete: curr.delete,
        print: curr.print
      };
      return acc;
    }, {});

    // Generate JWT token
    const token = jwt.sign({ username: user.csa_uname, id: user.id, role: roleName }, process.env.SECRET_KEY, { expiresIn: '4h' });

    // Retrieve the timezone from the database
    const [rows] = await pool.query(`SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = 'Time Zone'`);
    const timezone = rows.length > 0 ? rows[0].cs_value : 'Asia/Kolkata';

    res.status(200).json({ message: 'Login successful', username: user.csa_uname, token: token, permissions: rolePermissions, timezone: timezone });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/userlogin', async (req, res) => {
  const { username, password } = req.body;

  // console.log(req.body);

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // The BINARY function converts a value to a binary string & match, Then its check the case also for comparison.
    const [users] = await pool.query('SELECT * FROM cs_os_users WHERE BINARY cs_username = ?', [username]);
    const user = users[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid username' });
    }

    if (user.cs_password !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Retrieve user's role information
    const [roles] = await pool.query('SELECT csa_role_name FROM cs_ad_roles WHERE csa_role_id = ?', [1]);
    const roleName = 1;

    // Fetch permissions based on role id
    const [permissions] = await pool.query(
      `SELECT 
                c.cs_component_name,
                MAX(a.view) AS \`view\`,
                MAX(a.validate) AS \`validate\`,
                MAX(a.\`add\`) AS \`add\`,
                MAX(a.edit) AS \`edit\`,
                MAX(a.delete) AS \`delete\`,
                MAX(a.print) AS \`print\`
            FROM  
                cs_ad_components_access AS a 
            JOIN 
                cs_ad_components AS c ON a.cs_component_id = c.cs_component_id 
            WHERE 
                a.csa_role_id = ?
            GROUP BY 
                c.cs_component_name`,
      [user.csa_role_id]
    );

    const rolePermissions = permissions.reduce((acc, curr) => {
      acc[curr.cs_component_name] = {
        view: curr.view,
        validate: curr.validate,
        add: curr.add,
        edit: curr.edit,
        delete: curr.delete,
        print: curr.print
      };
      return acc;
    }, {});

    // Generate JWT token
    const token = jwt.sign({ username: user.cs_username, id: user.id, role: roleName }, process.env.SECRET_KEY, { expiresIn: '4h' });

    // Retrieve the timezone from the database
    const [rows] = await pool.query(`SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = 'Time Zone'`);
    const timezone = rows.length > 0 ? rows[0].cs_value : 'Asia/Kolkata';

    res.status(200).json({ message: 'Login successful', username: user.cs_username, token: token, permissions: rolePermissions, id: user.id, timezone: timezone });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});




// Product route to fetch product records
router.get('/products', async (req, res) => {
  try {
    const [products] = await pool.query('SELECT `product_id`, `product_name`, `product_image_url`, `product_url`, `product_value`, `cs_status` FROM `cs_ad_products` WHERE `cs_status` = 1');
    res.status(200).json(products);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});




router.get('/getBasicField', async (req, res) => {
  try {
    const columnsToFetch = 'cs_os_field_data.*, cs_os_field_type.field_type_name';

    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
      SELECT ${columnsToFetch}
      FROM cs_os_field_data
      LEFT JOIN cs_os_field_type ON cs_os_field_data.cs_field_type = cs_os_field_type.cs_field_type
      WHERE cs_visible_reg_basicform = 1  
      ORDER BY cs_field_order; 
  `;


    const [fieldData] = await pool.query(query);

    // Send the field data as a response
    res.json({ Fields: fieldData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/getDropdownData', async (req, res) => {
  try {
    // Specify the columns you want to fetch from each table
    const facilitytype = ['cs_type'];
    const prefix = ['cs_prefix', 'cs_prefix_id'];
    const country = ['cs_country', 'cs_country_id'];
    const states = ['cs_state_name', 'cs_state_id', 'cs_country_id'];


    const custom_data = ['cs_field_option', 'cs_field_option_value, cs_field_option_id, cs_field_id'];


    // Execute each query to fetch data from respective tables
    const [prefixData] = await pool.query(`SELECT ${prefix.join(',')} FROM cs_os_name_prefixes`);
    const [countryData] = await pool.query(`SELECT ${country.join(',')} FROM cs_tbl_country`);
    const [statesData] = await pool.query(`SELECT ${states.join(',')} FROM cs_tbl_states`);

    const [customData] = await pool.query(`SELECT ${custom_data.join(',')} FROM cs_os_field_option WHERE cs_status = 1`);






    // Construct the response object
    const responseData = {
      // facilityType: facilitytypeData,
      prefix: prefixData,
      country: countryData,
      states: statesData,
      custom: customData
    };

    // Send the response containing data from all queries
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/check-username/:username', async (req, res) => {
  const { username } = req.params;
  console.log("Username", username);
  try {
    const query = 'SELECT COUNT(*) AS count FROM cs_os_users WHERE cs_username = ?';
    const [rows] = await pool.execute(query, [username]);

    if (rows[0].count > 0) {
      return res.status(200).json({ exists: true });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Database error' });
  }
});

router.get('/check-email/:email', async (req, res) => {
  const { email } = req.params;
  console.log("Username", email);
  try {
    const query = 'SELECT COUNT(*) AS count FROM cs_os_users WHERE cs_email = ?';
    const [rows] = await pool.execute(query, [email]);

    if (rows[0].count > 0) {
      return res.status(200).json({ exists: true });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Database error' });
  }
});

router.post('/addBasicUser', async (req, res) => {
  console.log(req.body);

  try {
    const userData = req.body;

    // Get the columns (keys) and values from the request body dynamically
    const columns = Object.keys(userData);
    const values = Object.values(userData);

    // Add 'cs_module' column and its value if it's constant or from req.body
    //cs_source define from where user inserted into a database
    columns.push('cs_module', 'cs_source');
    values.push(1, 1); // Set your desired value for cs_module


    // Create placeholders for the values in the SQL query
    const placeholders = values.map(() => '?').join(', ');

    // Construct the dynamic SQL query to insert the user data
    const insertQuery = `
            INSERT INTO cs_os_users (${columns.join(', ')})
            VALUES (${placeholders})
        `;

    // Execute the query to insert the user
    const [result] = await pool.query(insertQuery, values);
    const insertedUserId = result.insertId; // Get the inserted user ID

    // if (!insertedUserId) {
    //   return res.status(500).json({ error: 'Failed to generate new user ID' });
    // }
    // console.log('New User ID:', insertedUserId);

    // // Set default names if first or last names are not provided
    // const firstName = userData.cs_first_name || 'Dammy';
    // const lastName = userData.cs_last_name || 'Dammy';

    // // Function to remove special characters
    // const sanitizeString = (str) => str.replace(/[^a-zA-Z0-9]/g, '');

    // const sanitizedFirstName = sanitizeString(firstName.toLowerCase());
    // const sanitizedLastNameInitial = sanitizeString(lastName[0]?.toLowerCase() || '');
    // const sanitizedFirstNameInitial = sanitizeString(firstName[0]?.toUpperCase() || '');
    // const sanitizedLastName = sanitizeString(lastName.toLowerCase());

    // const username = `${sanitizedFirstName}${sanitizedLastNameInitial}${insertedUserId}`;
    // const password = `${sanitizedFirstNameInitial}${sanitizedLastName}@${insertedUserId}`;

    // console.log('Generated Username:', username);
    // console.log('Generated Password:', password);

    // // Update the user record with the generated username and password
    // const updateUserQuery = `
    //       UPDATE cs_os_users
    //       SET cs_username = ?, cs_password = ?
    //       WHERE id = ?
    //     `;
    // await pool.query(updateUserQuery, [username, password, insertedUserId]);

    // After the user is inserted, retrieve the newly created user to return detailed information
    const [users] = await pool.query('SELECT * FROM cs_os_users WHERE id = ?', [insertedUserId]);
    const user = users[0];

    console.log("user", user);

    if (!user) {
      return res.status(404).json({ message: 'User not found after insertion' });
    }

    // Assuming a default role for the new user, e.g., a basic role
    const [roles] = await pool.query('SELECT csa_role_name FROM cs_ad_roles WHERE csa_role_id = ?', [user.csa_role_id]);
    const roleName = roles.length > 0 ? roles[0].csa_role_name : 'User';

    // Fetch permissions based on role id
    const [permissions] = await pool.query(
      `SELECT 
                c.cs_component_name,
                MAX(a.view) AS \`view\`,
                MAX(a.validate) AS \`validate\`,
                MAX(a.\`add\`) AS \`add\`,
                MAX(a.edit) AS \`edit\`,
                MAX(a.delete) AS \`delete\`,
                MAX(a.print) AS \`print\`
            FROM  
                cs_ad_components_access AS a 
            JOIN 
                cs_ad_components AS c ON a.cs_component_id = c.cs_component_id 
            WHERE 
                a.csa_role_id = ?
            GROUP BY 
                c.cs_component_name`,
      [user.csa_role_id]
    );

    // Prepare permissions in a structured format
    const rolePermissions = permissions.reduce((acc, curr) => {
      acc[curr.cs_component_name] = {
        view: curr.view,
        validate: curr.validate,
        add: curr.add,
        edit: curr.edit,
        delete: curr.delete,
        print: curr.print
      };
      return acc;
    }, {});

    // Generate JWT token with user data and role
    const token = jwt.sign({ username: user.cs_username, id: user.id, role: roleName }, process.env.SECRET_KEY, { expiresIn: '4h' });

    // Retrieve the timezone from the database
    const [rows] = await pool.query(`SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = 'Time Zone'`);
    const timezone = rows.length > 0 ? rows[0].cs_value : 'Asia/Kolkata';

    // Return success response with the new user's token, permissions, and timezone

    const [userRow] = await pool.query('SELECT * FROM cs_os_users WHERE id = ?', [insertedUserId]);
    if (userRow.length > 0) {
      await sendConfirmEmail(userRow[0]);
    }



    res.status(200).json({
      success: true,
      message: 'User added successfully',
      username: user.cs_username,
      token: token,
      permissions: rolePermissions,
      timezone: timezone,
      id: user.id
    });
  } catch (error) {
    console.error('Error adding user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


const sendConfirmEmail = async (userData, userId) => {
  console.log("USer Data", userData);
  const templateQuery = `SELECT template_content, template_subject FROM cs_tbl_email_template WHERE template_id = ?`;
  const [templateData] = await pool.query(templateQuery, [1]);

  if (!templateData || templateData.length === 0) {
    console.log("No email template found");
    throw new Error('No email template found');
  }

  const userEmail = userData.cs_email;
  if (!userEmail) {
    console.log("User email is not defined");
    throw new Error('User email is not defined');
  }

  let emailBody = templateData[0].template_content;
  const emailSubject = templateData[0].template_subject;

  const replacePlaceholders = (template, data) => {
    return template.replace(/{{(\w+)}}/g, (_, key) => data[key] || '');
  };

  emailBody = replacePlaceholders(emailBody, userData);

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: userEmail,
    cc: process.env.GMAIL_CC,
    subject: emailSubject,
    html: emailBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${userEmail}`);
  } catch (error) {
    console.error(`Error sending email to ${userEmail}:`, error.message);
  }
};

router.post('/sendloginmail', async (req, res) => {
  const { forgotPasswordEmail } = req.body;

  console.log(forgotPasswordEmail);

  try {
    const query = 'SELECT * FROM cs_os_users WHERE cs_email = ?';
    const [rows] = await pool.execute(query, [forgotPasswordEmail]);

    const userid = rows[0].cs_user_id

    if (rows.length > 0) {
      // Email exists, return the corresponding user ID
      await sendEmail(rows[0]);

      return res.status(200).json({ exists: true, userId: rows[0].id });
    } else {
      // Email does not exist
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Database error' });
  }
});

const sendEmail = async (userData) => {
  console.log("USer Data", userData);
  const templateQuery = `SELECT template_content, template_subject FROM cs_tbl_email_template WHERE template_id = ?`;
  const [templateData] = await pool.query(templateQuery, [12]);

  if (!templateData || templateData.length === 0) {
    console.log("No email template found");
    throw new Error('No email template found');
  }

  const userEmail = userData.cs_email;
  if (!userEmail) {
    console.log("User email is not defined");
    throw new Error('User email is not defined');
  }

  let emailBody = templateData[0].template_content;
  const emailSubject = templateData[0].template_subject;

  const replacePlaceholders = (template, data) => {
    return template.replace(/{{(\w+)}}/g, (_, key) => data[key] || '');
  };

  emailBody = replacePlaceholders(emailBody, userData);

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: userEmail,
    cc: process.env.GMAIL_CC,
    subject: emailSubject,
    html: emailBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${userEmail}`);
  } catch (error) {
    console.error(`Error sending email to ${userEmail}:`, error.message);
  }
};


router.get('/getsettings', async (req, res) => {

  try {
    // Query the database
    const query = 'SELECT cs_value FROM cs_tbl_sitesetting WHERE cs_parameter = ?';
    const [rows] = await pool.query(query, ['user_panel']);

    // Check if data exists
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No settings found for user_panel' });
    }

    console.log("rows", rows);

    // Send the result to the frontend
    res.status(200).json({ settings: rows[0].cs_value });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});


module.exports = router;

