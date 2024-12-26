const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const moment = require('moment-timezone');
const verifyToken = require('../api/middleware/authMiddleware');
const nodemailer = require('nodemailer'); // Import nodemailer
const sgMail = require('@sendgrid/mail');
const bodyParser = require('body-parser');
const multer = require('multer');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');






sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_PASS,  // Your Gmail app password
  },
});

// Setup multer for file uploads
const upload = multer({
  storage: multer.memoryStorage() // Store files in memory for easy access
});

// Function to generate a transparent QR code and save it to a specified directory
const generateQRCode = async (data) => {
  console.log("Data for QR code generation:", data);
  console.log("Data type:", typeof data); // Log the type of data

  try {
    // Trim data and check if it is a non-empty string
    const trimmedData = data ? String(data).trim() : '';

    if (!trimmedData) {
      throw new Error('Invalid QR code data: Must be a non-empty string');
    }

    // Define the destination directory
    const destinationDir = 'qrCodes'; // Relative directory where files will be uploaded
    const qrCodePath = path.join(destinationDir, `${trimmedData}.png`); // Use path.resolve to get the full path

    // Create the directory if it doesn't exist
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }

    // Generate the QR code with transparent background
    const qrCodeOptions = {
      color: {
        dark: '#000000', // QR code color (black)
        light: '#0000',  // Background color (transparent)
      },
      errorCorrectionLevel: 'H', // High error correction level
    };

    await QRCode.toFile(qrCodePath, trimmedData, qrCodeOptions);

    // Create the public URL based on your server's URL
    const qrCodeUrl = `http://localhost:4000/${qrCodePath}`; // Change "localhost" to your domain
    console.log("QR code public URL:", qrCodeUrl);

    return qrCodeUrl; // Return the public URL instead of the local path


  } catch (error) {
    console.error('Error generating QR code:', error.message);
    throw error; // Re-throw the error for further handling
  }
};


// Define the bulk email route
// router.post('/bulk-email', verifyToken, upload.array('attachments'), async (req, res) => {
//   const { To, name, Body, Subject, category, QR, startDate, endDate } = req.body;
//   const attachments = req.files;

//   console.log("Body", req.body);

//   if (!Body || !Subject) {
//     return res.status(400).send('Missing required fields');
//   }

//   // Fetch user data from the database
//   let userData;
//   if (category && category.trim() !== '') {
//     const categoryArray = Array.isArray(category) ? category : category.split(',');
//     const categoryString = categoryArray.map(cat => pool.escape(cat)).join(',');
//     let query = `
//       SELECT cs_reg_category, cs_first_name, cs_last_name, cs_regno, cs_email
//       FROM cs_os_users
//       WHERE cs_reg_cat_id IN (${categoryString})
//     `;

//     if (startDate && endDate) {
//       query += ` AND created_at BETWEEN ${pool.escape(startDate + ' 00:00:00')} AND ${pool.escape(endDate + ' 23:59:59')}`;
//     } else if (startDate) {
//       query += ` AND created_at >= ${pool.escape(startDate + ' 00:00:00')}`;
//     } else if (endDate) {
//       query += ` AND created_at <= ${pool.escape(endDate + ' 23:59:59')}`;
//     }
//     console.log("Generated SQL Query:", query);
//     [userData] = await pool.query(query);
//     console.log("Fetched User Data:", userData);
//   } else {
//     userData = [{ cs_email: To, cs_first_name: 'John', cs_last_name: 'Doe' }]; // Dummy data if no category
//   }

//   // Function to replace placeholders
//   const replacePlaceholders = (template, data) => {
//     return template.replace(/{{(\w+)}}/g, (_, key) => data[key] || '');
//   };

//   try {
//     const messages = await Promise.all(userData.map(async user => {
//       const userEmail = user.cs_email || To;

//       // Generate QR code if QR is set to 1
//       const messageAttachments = [];
//       if (QR === '1' && user.cs_regno) {
//         const qrCodeData = await QRCode.toDataURL(user.cs_regno.toString());
//         const base64Data = qrCodeData.split(',')[1];
//         messageAttachments.push({
//           filename: 'qrcode.png',
//           content: Buffer.from(base64Data, 'base64'),
//           cid: 'qrcode' // Add a content ID for inline images
//         });
//         Body += `<p><img src="cid:qrcode" alt="QR Code" /></p>`;
//       }

//       // Add additional attachments if present
//       if (attachments && attachments.length > 0) {
//         attachments.forEach(file => {
//           messageAttachments.push({
//             filename: file.originalname,
//             content: file.buffer,
//           });
//         });
//       }

//       // Replace placeholders in the email body
//       const personalizedBody = replacePlaceholders(Body, user);

//       const message = {
//         to: userEmail,
//         from: process.env.GMAIL_USER, // Your Gmail address
//         subject: Subject,
//         html: personalizedBody,
//         attachments: messageAttachments
//       };

//       return transporter.sendMail(message); // Send the email using nodemailer
//     }));

//     await Promise.all(messages); // Wait for all emails to be sent
//     res.status(200).send('Email sent');
//   } catch (error) {
//     console.error('Error sending email:', error);
//     res.status(500).send('Error sending email');
//   }
// });

//Onsite user resend mail
router.post('/resend', verifyToken, async (req, res) => {
  console.log('Request body:', req.body);

  try {
    const { cs_id, Id, Template_id, flag } = req.body;

    if (!Template_id) {
      return res.status(400).json({ message: 'Template ID must be provided' });
    }

    if (cs_id) {
      const userData = await getUserData(cs_id);
      if (!userData) return res.status(404).json({ message: 'User not found' });

      await sendEmail(userData, Template_id);

      if (flag === 0) {
        // Update cs_basicmail to 1 after successfully sending the email
        await pool.query(
          'UPDATE cs_os_users SET cs_basicmail = ? WHERE id = ?',
          [1, userData.id]
        );
      } else if (flag === 1) {
        // Update cs_confirmmail to 1 after successfully sending the email
        await pool.query(
          'UPDATE cs_os_users SET cs_confirmmail = ? WHERE id = ?',
          [1, userData.id]
        );
      }

      return res.status(200).json({ message: 'Email sent successfully' });

    } else if (Id && Id.length > 0) {
      const results = [];
      for (let id of Id) {
        const userData = await getUserData(id);
        if (!userData) {
          console.log(`User not found for Id: ${id}`);
          continue; // Skip to next Id
        }
        await sendEmail(userData, Template_id);

        if (flag === 0) {
          // Update cs_basicmail to 1 after successfully sending the email
          await pool.query(
            'UPDATE cs_os_users SET cs_basicmail = ? WHERE id = ?',
            [1, userData.id]
          );
        } else if (flag === 1) {
          // Update cs_confirmmail to 1 after successfully sending the email
          await pool.query(
            'UPDATE cs_os_users SET cs_confirmmail = ? WHERE id = ?',
            [1, userData.id]
          );
        }

        results.push(userData.cs_email); // Keep track of sent emails
      }
      return res.status(200).json({ message: 'Emails processed successfully', sentTo: results });
    }

    return res.status(400).json({ message: 'Registration number must be provided' });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// Function to get user data
const getUserData = async (id) => {
  const userQuery = `SELECT * FROM cs_os_users WHERE id = ?`;
  const [userData] = await pool.query(userQuery, [id]);
  return userData && userData.length > 0 ? userData[0] : null;
};

// Function to send email
const sendEmail = async (userData, Template_id) => {
  const templateQuery = `SELECT template_content, template_subject FROM cs_tbl_email_template WHERE template_id = ?`;
  const [templateData] = await pool.query(templateQuery, [Template_id]);

  if (!templateData || templateData.length === 0) {
    throw new Error('No email template found');
  }

  const userEmail = userData.cs_email;
  if (!userEmail) {
    throw new Error('User email is not defined');
  }

  const qrCodeData = userData.id;
  const qrCodeUrl = await generateQRCode(qrCodeData); // Get the public URL

  let emailBody = templateData[0].template_content;
  const emailSubject = templateData[0].template_subject;

  // Include qr_code as part of userData to replace in email body
  emailBody = replacePlaceholders(emailBody, { ...userData, qr_code: qrCodeUrl });

  console.log("Body", emailBody);
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: userEmail,
    cc: process.env.GMAIL_CC,
    subject: emailSubject,
    html: emailBody,
  };

  await transporter.sendMail(mailOptions);

  // const msg = {
  //   to: userEmail,
  //   from: 'info@iadvlpune.org',
  //   replyTo: 'iadvlpune@gmail.com',
  //   subject: emailSubject,
  //   html: emailBody, // Updated body with QR code as image
  // };

  // await sgMail.send(msg);
  console.log(`Email sent successfully to ${userEmail}`);
};


// Function to replace placeholders in email body
const replacePlaceholders = (template, data) => {
  const currentDate = moment().format('YYYY-MM-DD');

  return template.replace(/{{(\w+)}}/g, (_, key) => {
    if (key === 'current_date') {
      return currentDate;
    } else if (key === 'qr_code') {
      return `<img src="${data.qr_code}" alt="QR Code" style="width: 150px; height: 150px;" />`; // Embedding image tag
    }
    return data[key] || '';
  });
};



// const sendEmail = async (userData, Template_id) => {
//   console.log("User", userData);
//   const templateQuery = `SELECT template_content, template_subject FROM cs_tbl_email_template WHERE template_id = ?`;
//   const [templateData] = await pool.query(templateQuery, [Template_id]);

//   // Check if template data exists
//   if (!templateData || templateData.length === 0) {
//     throw new Error('No email template found');
//   }

//   const userEmail = userData.cs_email;
//   if (!userEmail) {
//     throw new Error('User email is not defined');
//   }

//   let emailBody = templateData[0].template_content;
//   const emailSubject = templateData[0].template_subject;

//   // Check if the email body contains the {{qr_code}} placeholder
//   if (emailBody.includes('{{qr_code}}')) {
//     try {
//       // Use cs_regno if available; otherwise, fallback to userData.id
//       const qrData = userData.cs_regno || userData.id; 

//       // Ensure qrData is valid for QR code generation
//       if (!qrData) {
//         throw new Error('No valid registration number or ID for QR code generation');
//       }

//       // Generate the QR code using the valid QR data
//       const qrCodeDataUrl = await QRCode.toDataURL(qrData.toString());

//       console.log("QRData", qrCodeDataUrl);

//       // Replace the {{qr_code}} placeholder with the QR code image in the email body
//       emailBody = emailBody.replace(/{{qr_code}}/g, `<img src="${qrCodeDataUrl}" alt="QR Code" style="width: 150px; height: auto;" />`);
//     } catch (qrError) {
//       console.error('Error generating QR code:', qrError);
//       throw new Error('Failed to generate QR code');
//     }
//   }

//   // Replace any other placeholders in the email body
//   emailBody = replacePlaceholders(emailBody, userData);

//   console.log("Email Body", emailBody);

//   const mailOptions = {
//     from: process.env.GMAIL_USER,
//     to: userEmail,
//     subject: emailSubject,
//     html: emailBody,
//   };

//   // Send the email
//   await transporter.sendMail(mailOptions);
//   console.log(`Email sent successfully to ${userEmail}`);
// };





//Working 15/11/2024

router.post('/bulk-email', verifyToken, upload.array('attachments'), async (req, res) => {
  const BATCH_SIZE = 100; // Define the batch size here
  const { To, name, Body, Subject, category, QR, startDate, endDate, replyTo, temp_id, mailType } = req.body;
  const attachments = req.files;

  console.log("Body", req.body);

  let emailBody;
  let emailSubject;

  // If To is provided, no need to fetch template or user data
  if (!temp_id) {
    emailBody = Body;  // Directly use the provided Body
    emailSubject = Subject;  // Directly use the provided Subject
  } else {
    // If mailType is 'custom', fetch the template content and subject
    if (mailType === 'custom') {
      const templateQuery = `SELECT template_content, template_subject FROM cs_tbl_email_template WHERE template_id = ?`;
      const [templateData] = await pool.query(templateQuery, temp_id);

      if (templateData && templateData.length > 0) {
        emailBody = templateData[0].template_content;
        emailSubject = templateData[0].template_subject;
      } else {
        return res.status(400).send('Template not found');
      }
    } else {
      // Use provided Subject and Body directly when mailType is not 'custom'
      emailBody = Body;
      emailSubject = emailSubject;
    }
  }

  let userData;
  if (category && category.trim() !== '') {
    const categoryArray = Array.isArray(category) ? category : category.split(',');
    const categoryString = categoryArray.map(cat => pool.escape(cat)).join(',');
    let query = `
      SELECT *
      FROM cs_os_users
      WHERE cs_reg_cat_id IN (${categoryString})
    `;

    if (startDate && endDate) {
      query += ` AND created_at BETWEEN ${pool.escape(startDate + ' 00:00:00')} AND ${pool.escape(endDate + ' 23:59:59')}`;
    } else if (startDate) {
      query += ` AND created_at >= ${pool.escape(startDate + ' 00:00:00')}`;
    } else if (endDate) {
      query += ` AND created_at <= ${pool.escape(endDate + ' 23:59:59')}`;
    }
    console.log("Generated SQL Query:", query);
    [userData] = await pool.query(query);
    console.log("Fetched User Data:", userData);
  } else {
    userData = [{ cs_email: To, cs_first_name: 'John', cs_last_name: 'Doe' }];
  }

  try {
    const totalEmails = userData.length;
    for (let i = 0; i < totalEmails; i += BATCH_SIZE) {
      const batch = userData.slice(i, i + BATCH_SIZE);
      const messages = await Promise.all(batch.map(async user => {
        const userEmail = user.cs_email || To;
        const messageAttachments = [];
      
        // Generate QR code if QR is set to 1
        if (QR === '1' && user.cs_regno) {
          const qrCodeData = await QRCode.toDataURL(user.cs_regno.toString());
          const base64Data = qrCodeData.split(',')[1];
          messageAttachments.push({
            content: base64Data,
            filename: 'qrcode.png',
            type: 'image/png',
            disposition: 'inline',
            content_id: 'qrcode'
          });
          emailBody += `<p><img src="cid:qrcode" alt="QR Code" /></p>`;
        }
      
        if (attachments && attachments.length > 0) {
          attachments.forEach(file => {
            messageAttachments.push({
              content: file.buffer.toString('base64'),
              filename: file.originalname,
              type: file.mimetype,
              disposition: 'attachment'
            });
          });
        }
      
        // Function to replace placeholders with user data
        const replacePlaceholders = (template, data) => {
          return template.replace(/{{(\w+)}}/g, (_, key) => data[key] || '');
        };
      
        // Replace placeholders in email body with user-specific data
        const personalizedBody = replacePlaceholders(emailBody, user);
      
        return {
          to: userEmail,
          from: 'info@iadvlpune.org',
          subject: emailSubject,
          html: personalizedBody,
          attachments: messageAttachments,  // Pass the actual messageAttachments array
        };
      }));
      

      // Send messages and log details
      await Promise.all(messages.map(async (message, index) => {
        try {
          await sgMail.send(message);
          const user = batch[index]; // Get the corresponding user for logging
          console.log(`Email sent to ${user.cs_email} (cs_regno: ${user.cs_regno})`);
        } catch (error) {
          console.error(`Error sending email to ${message.to}:`, error);
          if (error.response) {
            console.error(error.response.body);
          }
        }
      }));

      // Optional: Add a delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay
    }

    //     return {
    //       from: process.env.GMAIL_USER,  // Your Gmail address
    //       to: userEmail,
    //       cc: process.env.GMAIL_CC,  // You can set this or leave it empty
    //       subject: emailSubject,  // Use template subject or the provided subject
    //       html: personalizedBody,  // Use personalized email body
    //       attachments: messageAttachments,
    //       replyTo: replyTo || process.env.GMAIL_CC,  // Default to Gmail CC if not provided
    //     };
    //   }));

    //   // Send messages and log details
    //   await Promise.all(messages.map(async (message, index) => {
    //     try {
    //       await transporter.sendMail(message);
    //       const user = batch[index]; // Get the corresponding user for logging
    //       console.log(`Email sent to ${user.cs_email} (cs_regno: ${user.cs_regno})`);
    //     } catch (error) {
    //       console.error(`Error sending email to ${message.to}:`, error);
    //       if (error.response) {
    //         console.error(error.response.body);
    //       }
    //     }
    //   }));

    //   // Optional: Add a delay between batches
    //   await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay
    // }

    res.status(200).send('Emails sent');
  } catch (error) {
    console.error('Error sending emails:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    res.status(500).send('Error sending emails');
  }
});



router.post('/reg-bulk-email', verifyToken, upload.array('attachments'), async (req, res) => {
  const BATCH_SIZE = 100; // Define the batch size here
  const { To, Body, Subject, category, QR, startDate, endDate, replyTo, temp_id, mailType, ticket_id, addon_id } = req.body;
  const attachments = req.files;

  console.log("Body", req.body);

  let emailBody;
  let emailSubject;

  // If To is provided, no need to fetch template or user data
  if (!To || !temp_id) {
    emailBody = Body;  // Directly use the provided Body
    emailSubject = Subject;  // Directly use the provided Subject
  } else {
    console.log("Im here");

    // If mailType is 'custom', fetch the template content and subject
    if (mailType === 'custom') {
      const templateQuery = `SELECT template_content, template_subject FROM cs_tbl_email_template WHERE template_id = ?`;
      const [templateData] = await pool.query(templateQuery, temp_id);



      if (templateData && templateData.length > 0) {
        // console.log("Template", templateData);

        emailBody = templateData[0].template_content;
        emailSubject = templateData[0].template_subject;
      } else {
        return res.status(400).send('Template not found');
      }
    } else {
      // Use provided Subject and Body directly when mailType is not 'custom'
      emailBody = Body;
      emailSubject = Subject;
    }
  }

  let userData = [];
  if ((mailType === 'custom' && !temp_id)) {
    emailBody = Body;
    emailSubject = Subject;
  } else {

    console.log("Im here too");
    // Fetch user data based on category, ticket_id, addon_id, and date range
    if (category && category.trim() !== '') {
      const categoryArray = Array.isArray(category) ? category : category.split(',');
      const categoryString = categoryArray.map(cat => pool.escape(cat)).join(',');
      let query = `
      SELECT users.*, tickets.ticket_mail_description AS ticket_message
      FROM cs_os_users AS users
      JOIN cs_reg_tickets AS tickets
      ON users.cs_ticket = tickets.ticket_id
      WHERE 1=1
    `;

      // Check if at least one condition is provided
      let conditions = false; // This flag will track if any condition is added

      // Add category condition if it's defined and not the string 'undefined'
      if (category && category !== 'undefined') {
        query += ` AND users.cs_reg_cat_id IN ('${category}')`;
        conditions = true;
      }

      // Add ticket condition if it's defined and not 'undefined' string
      if (ticket_id && ticket_id !== 'undefined') {
        query += ` AND users.cs_ticket = ${ticket_id}`;
        conditions = true;
      }

      // Add addon condition if it's defined and not 'undefined' string
      if (addon_id && addon_id !== 'undefined') {
        query += ` AND users.cs_addons = ${addon_id}`;
        conditions = true;
      }

      // Add date range conditions if defined
      if (startDate && endDate) {
        query += ` AND created_at BETWEEN ${pool.escape(startDate + ' 00:00:00')} AND ${pool.escape(endDate + ' 23:59:59')}`;
        conditions = true;
      } else if (startDate) {
        query += ` AND created_at >= ${pool.escape(startDate + ' 00:00:00')}`;
        conditions = true;
      } else if (endDate) {
        query += ` AND created_at <= ${pool.escape(endDate + ' 23:59:59')}`;
        conditions = true;
      }

      // If no condition is added, return an error
      if (!conditions) {
        return res.status(400).send('Please provide at least one filter: category, ticket, or addon.');
      }

      console.log("Generated SQL Query:", query);

      // Execute the query
      [userData] = await pool.query(query);
      console.log("Fetched User Data:", userData);

      if (userData.length === 0) {
        return res.status(404).send('No users found matching the criteria');
      }

    }
  }

  // If category is not provided or no users are found, handle the To field as a single recipient
  if (userData.length === 0 && To) {
    userData = [{ cs_email: To, cs_first_name: 'John', cs_last_name: 'Doe' }];
  }

  // If no users found and no 'To' provided, return an error
  if (userData.length === 0) {
    return res.status(400).send('No users found for the given criteria');
  }

  try {
    const totalEmails = userData.length;
    for (let i = 0; i < totalEmails; i += BATCH_SIZE) {
      const batch = userData.slice(i, i + BATCH_SIZE);
      const messages = await Promise.all(batch.map(async user => {
        const userEmail = user.cs_email || To;
        const messageAttachments = [];

        // Generate QR code if QR is set to 1
        if (QR === '1' && user.cs_regno) {
          const qrCodeData = await QRCode.toDataURL(user.cs_regno.toString());
          const base64Data = qrCodeData.split(',')[1];
          messageAttachments.push({
            content: base64Data,
            filename: 'qrcode.png',
            type: 'image/png',
            disposition: 'inline',
            content_id: 'qrcode'
          });
          emailBody += `<p><img src="cid:qrcode" alt="QR Code" /></p>`;
        }

        // if (attachments && attachments.length > 0) {
        //   attachments.forEach(file => {
        //     messageAttachments.push({
        //       content: file.buffer.toString('base64'),
        //       filename: file.originalname,
        //       type: file.mimetype,
        //       disposition: 'attachment'
        //     });
        //   });
        // }

        if (attachments && attachments.length > 0) {
          attachments.forEach(file => {
            messageAttachments.push({
              content: file.buffer.toString('base64'),
              filename: file.originalname,
              type: file.mimetype,
              disposition: 'attachment'
            });
          });
        }

        // Function to replace placeholders with user data
        const replacePlaceholders = (template, data) => {
          return template.replace(/{{(\w+)}}/g, (_, key) => data[key] || '');
        };

        // Replace placeholders in email body with user-specific data
        const personalizedBody = replacePlaceholders(emailBody, user);

        return {
          to: userEmail,
          from: 'info@iadvlpune.org',
          cc: process.env.GMAIL_CC,
          subject: emailSubject,
          html: personalizedBody,
          attachments: messageAttachments,
        };
      }));

      // Send messages and log details
      await Promise.all(messages.map(async (message, index) => {
        try {
          await sgMail.send(message);
          const user = batch[index]; // Get the corresponding user for logging
          console.log(`Email sent to ${user.cs_email} (cs_regno: ${user.cs_regno})`);
        } catch (error) {
          console.error(`Error sending email to ${message.to}:`, error);
          if (error.response) {
            console.error(error.response.body);
          }
        }
      }));

      // Optional: Add a delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay
    }

    console.log("Subject", emailSubject);

    //     return {
    //       from: process.env.GMAIL_USER,  // Your Gmail address
    //       to: userEmail,
    //       cc: process.env.GMAIL_CC,  // You can set this or leave it empty
    //       subject: emailSubject,  // Use template subject or the provided subject
    //       html: personalizedBody,  // Use personalized email body
    //       attachments: messageAttachments,
    //       replyTo: replyTo || process.env.GMAIL_CC,  // Default to Gmail CC if not provided
    //     };
    //   }));

    //   // Send messages and log details
    //   await Promise.all(messages.map(async (message, index) => {
    //     try {
    //       await transporter.sendMail(message);
    //       const user = batch[index]; // Get the corresponding user for logging
    //       console.log(`Email sent to ${user.cs_email} (cs_regno: ${user.cs_regno})`);
    //     } catch (error) {
    //       console.error(`Error sending email to ${message.to}:`, error);
    //       if (error.response) {
    //         console.error(error.response.body);
    //       }
    //     }
    //   }));

    //   // Optional: Add a delay between batches
    //   await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay
    // }

    res.status(200).send('Emails sent');
  } catch (error) {
    console.error('Error sending emails:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    res.status(500).send('Error sending emails');
  }
});







// Working dnt remove \\
// router.post('/bulk-email', verifyToken, upload.array('attachments'), async (req, res) => {
//   const { To, name, Body, Subject, QR } = req.body;
//   const attachments = req.files;

//   console.log("Body", Body);

//   if (!Body || !Subject) {
//     return res.status(400).send('Missing required fields');
//   }

//   // Query to fetch user data based on a specific ID (e.g., 574)
//   const userId = 575;
//   const userQuery = `
//     SELECT cs_reg_category, cs_first_name, cs_last_name, cs_regno
//     FROM cs_os_users
//     WHERE id = ${pool.escape(userId)}
//   `;

//   try {
//     let userData;
//     [userData] = await pool.query(userQuery);

//     // Function to replace placeholders
//     const replacePlaceholders = (template, data) => {
//       return template.replace(/{{(\w+)}}/g, (_, key) => data[key] || '');
//     };

//     // Use dummy data if no user is found
//     if (!userData.length) {
//       userData = [{ cs_email: To, cs_first_name: 'John', cs_last_name: 'Doe' }];
//     }

//     const messages = await Promise.all(userData.map(async user => {
//       const userEmail = user.cs_email || To;

//       // Initialize message attachments array
//       const messageAttachments = [];

//       // Generate QR code if QR is set to 1
//       if (QR === '1' && user.cs_regno) {
//         const qrCodeData = await QRCode.toDataURL(user.cs_regno.toString());
//         const base64Data = qrCodeData.split(',')[1];
//         messageAttachments.push({
//           content: base64Data,
//           filename: 'qrcode.png',
//           type: 'image/png',
//           disposition: 'inline',
//           content_id: 'qrcode'
//         });
//         Body += `<p><img src="cid:qrcode" alt="QR Code" /></p>`;
//       }

//       // Add additional attachments if present
//       if (attachments && attachments.length > 0) {
//         attachments.forEach(file => {
//           messageAttachments.push({
//             content: file.buffer.toString('base64'),
//             filename: file.originalname,
//             type: file.mimetype,
//             disposition: 'attachment'
//           });
//         });
//       }

//       // Replace placeholders in the email body
//       const personalizedBody = replacePlaceholders(Body, user);

//       const message = {
//         to: userEmail,
//         from: 'secretary@acsinet.net',
//         subject: Subject,
//         html: personalizedBody,
//         attachments: messageAttachments
//       };

//       return message;
//     }));

//     await sgMail.send(messages);
//     res.status(200).send('Email sent');
//   } catch (error) {
//     console.error('Error sending email:', error);
//     if (error.response) {
//       console.error(error.response.body);
//     }
//     res.status(500).send('Error sending email');
//   }
// });



// router.post('/bulk-badge', verifyToken, upload.array('badgeAttachment'), async (req, res) => {
//   const { To, name, Body, Subject, category, QR, Badge } = req.body;
//   const attachments = req.files;

//   console.log(req.body);
//   console.log(attachments);

//   if (!Body || !Subject) {
//     return res.status(400).send('Missing required fields');
//   }

//   try {
//     let Data = [];

//     // Determine if the category-based query should be used
//     const useCategory = category && category.trim() !== '';
//     let query;
//     if (useCategory) {
//       // Ensure category is an array
//       const categoryArray = Array.isArray(category) ? category : category.split(',');

//       // Ensure the category is properly formatted for the SQL query
//       const categoryString = categoryArray.map(cat => db.escape(cat)).join(',');

//       query = `
//         SELECT cs_first_name, cs_email, cs_regno
//         FROM cs_os_users
//         WHERE cs_reg_cat_id IN (${categoryString})
//       `;
//     }

//     if (useCategory) {
//       // Execute the query to fetch field data from the table
//       [Data] = await pool.query(query);
//     } else {
//       // When 'To' is provided and category is not used, use the provided 'To' address directly
//       Data.push({ cs_first_name: name, cs_email: To, cs_regno: '' });
//     }

//     const messages = await Promise.all(Data.map(async user => {
//       let emailBody = `<p>Hello ${user.cs_first_name || name},</p>
//                          <p>${Body}</p>`;

//       // Initialize message attachments array
//       const messageAttachments = [];

//       // Generate QR code if QR is set to 1
//       if (QR === '1' && user.cs_regno) {
//         const qrCodeData = await QRCode.toDataURL(user.cs_regno.toString());
//         const base64Data = qrCodeData.split(',')[1];

//         messageAttachments.push({
//           content: base64Data,
//           filename: 'qrcode.png',
//           type: 'image/png',
//           disposition: 'inline',
//           content_id: 'qrcode'
//         });

//         emailBody += `<p><img src="cid:qrcode" alt="QR Code" /></p>`;
//       }


//       if (attachments && attachments.length > 0) {
//         attachments.forEach(file => {
//           console.log("File Original Name:", file.originalname);
//           console.log("User's Email:", user.cs_email);

//           // Check if the current attachment is the badge for any of the user's email addresses
//           const isBadgeAttachment = user.cs_email.some(email => file.originalname.includes(email));
//           console.log("Is Badge Attachment:", isBadgeAttachment);

//           // If it's the badge attachment, add it to the message attachments
//           if (isBadgeAttachment) {
//             messageAttachments.push({
//               content: file.buffer.toString('base64'),
//               filename: file.originalname,
//               type: file.mimetype,
//               disposition: 'attachment'
//             });
//           }
//         });
//       }


//       const message = {
//         to: user.cs_email || To,
//         from: 'secretary@acsinet.net', // Your verified SendGrid email
//         subject: Subject,
//         html: emailBody,
//         attachments: messageAttachments
//       };

//       return message;
//     }));
//     if (process.env.SEND_EMAILS === 'false') {
//       // Send emails using SendGrid
//       await sgMail.send(messages);
//       res.status(200).send('Email sent');
//     } else {
//       console.log('Emails not sent, SEND_EMAILS is set to false');
//       res.status(200).send('Emails not sent, SEND_EMAILS is set to false');
//     }
//   } catch (error) {
//     console.error('Error sending email:', error);
//     if (error.response) {
//       console.error(error.response.body);
//     }
//     res.status(500).send('Error sending email');
//   }
// });


router.post('/bulk-badge', verifyToken, upload.array('badgeAttachment'), async (req, res) => {
  const { To, name, Body, Subject, category, QR, Badge, RegNo } = req.body;
  const attachments = req.files;

  console.log("req.body", req.body);
  console.log(attachments);

  if (!Body || !Subject) {
    return res.status(400).send('Missing required fields');
  }

  try {
    let messages = [];

    // Define variables for QR and email body
    let qrCodeData, base64Data, messageAttachments, emailBody;

    // Iterate over each recipient email
    for (let index = 0; index < RegNo.length; index++) {
      const no = RegNo[index];

      // Find the attachment corresponding to this email
      const attachment = attachments.find(file => file.originalname.includes(no));

      // Generate QR code if QR is set to 1
      if (QR === '1') {
        qrCodeData = await QRCode.toDataURL(no.toString());
        base64Data = qrCodeData.split(',')[1];
      }

      // If an attachment is found for this email, create the email message
      if (attachment) {
        emailBody = `<p>Hello,</p>
                     <p>${Body}</p>`;

        messageAttachments = [{
          content: attachment.buffer.toString('base64'),
          filename: attachment.originalname,
          type: attachment.mimetype,
          disposition: 'attachment'
        }];

        if (QR === '1') {
          messageAttachments.push({
            content: base64Data,
            filename: 'qrcode.png',
            type: 'image/png',
            disposition: 'inline',
            content_id: 'qrcode'
          });

          emailBody += `<p><img src="cid:qrcode" alt="QR Code" /></p>`;
        }

        const message = {
          to: To[index], // Send email to the corresponding recipient
          from: 'secretary@acsinet.net',
          subject: Subject,
          html: emailBody,
          attachments: messageAttachments
        };

        messages.push(message);
      }
    }

    // Send emails
    await sgMail.send(messages);
    res.status(200).send('Emails sent successfully');
  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).send('Error sending emails');
  }
});


// Type from cs_os_field_type
router.get('/getCat', verifyToken, async (req, res) => {
  try {


    const columnsToFetch = ['*'];

    // Construct the SQL query to fetch specific columns with pagination and search
    let query = `
    SELECT ${columnsToFetch}
    FROM cs_os_category
    WHERE cs_status = 1 
      AND cs_reg_cat_id NOT IN (0)
  `;

    // Execute the query to fetch field data from the table
    const [catData] = await pool.query(query);

    let product =
      `SELECT product_id, cs_status
      FROM cs_ad_products
    `;

    const [prodData] = await pool.query(product);

    let template =
      `SELECT template_id , template_name, template_content
    FROM cs_tbl_email_template
  `;

    const [templateData] = await pool.query(template);

    let ticket =
      `SELECT ticket_id , ticket_title, ticket_category
  FROM cs_reg_tickets
`;

    const [ticketData] = await pool.query(ticket);

    let addon =
      `SELECT addon_id , addon_title, addon_ticket_ids
FROM cs_reg_add_ons
`;

    const [addonData] = await pool.query(addon);



    res.json({ Types: catData, prodData, templateData, ticketData, addonData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



module.exports = router;