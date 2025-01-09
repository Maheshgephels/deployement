const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const moment = require('moment-timezone');
const verifyToken = require('../api/middleware/authMiddleware');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer'); // Import nodemailer
 
// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_PASS,  // Your Gmail app password
  },
});



// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'Editor/'); // Specify the directory where files will be uploaded
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); // Set the filename
  }
});

const upload = multer({ storage: storage });

// Define the upload route
router.post('/uploads', verifyToken, upload.single('file'), (req, res) => {
  console.log('File received:', req.file);

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  } 

  // File information
  const file = req.file;
  const store = 'D:\\wamp64\\www\\EventAdmin\\backend';
  const targetPath = path.join(store, 'Editor', file.filename);

  console.log('Target path:', targetPath);

  res.json({ filelink: `Editor/${file.filename}` });

  // fs.rename(file.path, targetPath, (err) => {
  //   if (err) {
  //     console.error('Failed to save file:', err);
  //     return res.status(500).json({ error: 'Failed to save file' });
  //   }

    
  // });
});

 
router.post('/savetemplate', verifyToken, async (req, res) => {
  const { design, html, tempName, tempSubject } = req.body;
  const status = 1;


  try {

    // Insert new email into the database
    const insertQuery = `INSERT INTO cs_tbl_email_template ( template_name, template_subject, template_default_design, template_draft_design, template_content, cs_status) VALUES (?, ?, ?, ?, ?, ?)`;
    await pool.query(insertQuery, [ tempName, tempSubject, design, design, html, status]);


    return res.status(200).json({ message: 'Template saved successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// router.post('/drafttemplate', verifyToken, async (req, res) => {
//   const { design, temp_id, html} = req.body;
  
//   const status = 2;


//   try {
//      //Update Email draft
//     const updateQuery = `UPDATE cs_tbl_email_template SET template_draft_design = ?, cs_status = ? WHERE template_id = ?`;
//     await pool.query(updateQuery, [design, status, temp_id]);

//     return res.status(200).json({ message: 'Template Drafted successfully' });
//   } catch (error) {
//     console.error('Error updating settings:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

router.post('/drafttemplate', verifyToken, async (req, res) => {
  const { design, temp_id, html, tempName, tempSubject } = req.body;
  const status = 2;
  console.log("Draft", req.body);
  try {
    if (temp_id === "New") {
      // Insert new email into the database
      const insertQuery = `INSERT INTO cs_tbl_email_template 
                           (template_name, template_subject, template_default_design, template_draft_design, template_content, cs_status) 
                           VALUES (?, ?, ?, ?, ?, ?)`;

      await pool.query(insertQuery, [tempName, tempSubject, design, design, html, status]);
    } else {
      // Update Email draft
      const updateQuery = `UPDATE cs_tbl_email_template 
                           SET template_draft_design = ?, cs_status = ? 
                           WHERE template_id = ?`;

      await pool.query(updateQuery, [design, status, temp_id]);
    }

    return res.status(200).json({ message: 'Template Drafted successfully' });
  } catch (error) {
    console.error('Error updating settings:', error); // Log the error for debugging
    res.status(500).json({ message: error.message || 'Internal server error' }); // Send actual error message for better debugging
  }
});

router.post('/publishTemplate', verifyToken, async (req, res) => {
  const { design, temp_id, html, tempName, tempSubject} = req.body;

  const status = 1;


  try {
     //Update Email draft
    const updateQuery = `UPDATE cs_tbl_email_template SET template_name = ?, template_subject = ?, template_draft_design = ?, template_content = ?, cs_status = ? WHERE template_id = ?`;
    await pool.query(updateQuery, [ tempName, tempSubject, design, html, status, temp_id]);

    return res.status(200).json({ message: 'Template Published successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/getTemplates', verifyToken, async (req, res) => {
  try {
    // Extract page number, page size, and search query from request query parameters
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const offset = (page - 1) * pageSize;


    const columnsToFetch = ['*'];

    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
      SELECT ${columnsToFetch}
      FROM cs_tbl_email_template
    `;

    // Append search condition if search query is provided
    if (search) {
      query += `
          WHERE cs_template_name LIKE '%${search}%'
        `;
    }

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
      const totalCountQuery = 'SELECT COUNT(*) AS total FROM cs_tbl_email_template WHERE 1';
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

router.post('/clonetemplate', verifyToken, async (req, res) => {
  try {
    // Extract template_id from the request body
    const { template_id } = req.body;

    // Query to get the template data
    const selectQuery = `SELECT template_name, template_subject, template_default_design, template_draft_design, template_content FROM cs_tbl_email_template WHERE template_id = ?`;
    const [templateData] = await pool.query(selectQuery, [template_id]);

    if (templateData.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Extract the data for the new template
    const {
      template_name,
      template_subject,
      template_default_design,
      template_draft_design,
      template_content
    } = templateData[0];

    // Modify the template_name and template_subject by adding the suffix "(Clone)"
    const newTemplateName = `${template_name} (Clone)`;
    const newTemplateSubject = `${template_subject} (Clone)`;

    // Insert the cloned template data into a new record
    const insertQuery = `
      INSERT INTO cs_tbl_email_template (template_name, template_subject, template_default_design, template_draft_design, template_content, cs_isclone, cs_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;
      
    const result = await pool.query(insertQuery, [
      newTemplateName,
      newTemplateSubject,
      template_default_design,
      template_draft_design,
      template_content,
      1,
      1,
    ]);

    return res.status(201).json({ message: 'Template cloned successfully', newTemplateId: result.insertId });
  } catch (error) {
    console.error('Error cloning template:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/deletetemplate', verifyToken, async (req, res) => {
  try {
    const { template_id } = req.body;

    // Delete the template
    const deleteQuery = `DELETE FROM cs_tbl_email_template WHERE template_id = ?`;
    await pool.query(deleteQuery, [template_id]);

    return res.status(200).json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.put('/UpdateStatus', verifyToken, async (req, res) => {
  try {
    // Extract workshopId, status, and Name from the request body
    console.log(req.body);
    const { templateId, status } = req.body;


    // Update cs_status in cs_os_workshop
    const updateQuery = `UPDATE cs_tbl_email_template SET cs_status = ? WHERE template_id = ?`;
    await pool.query(updateQuery, [status, templateId]);

    // Update cs_status in cs_os_facilitytyp
    return res.status(200).json({ message: 'Status Updates successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/testemail', verifyToken, async (req, res) => {
  const { design, temp_id, html, tempSubject, email } = req.body;

  if (!email) {
    console.error("User email is not defined");
    return res.status(400).json({ error: 'User email is not defined' });
  }

  const emailBody = html;
  const emailSubject = tempSubject;

  const mailOptions = {
    from: `"Test Email" <${process.env.GMAIL_USER}>`, // Custom sender name
    to: email,
    subject: emailSubject,
    html: emailBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${email}`);
    return res.status(200).json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error.message);
    return res.status(500).json({ error: 'Failed to send test email' });
  }
});




module.exports = router;
