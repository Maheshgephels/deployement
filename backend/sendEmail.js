require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./config/database');
const path = require('path');
const sgMail = require('@sendgrid/mail');
const bodyParser = require('body-parser');

const port = process.env.PORT || 4000;
const app = express();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Serve static files from the React app
app.use('/build', express.static(path.join(__dirname, '')));
app.use('/app-icon', express.static(path.join(__dirname, 'app-icon')));
// For Badge images
app.use('/badgeimg', express.static(path.join(__dirname, 'badgeimg')));

// Auth
const authRoutes = require('./routes/api/authRoutes');
const rolesRoutes = require('./routes/OnsiteApp/rolesRoutes');
const categoryRoutes = require('./routes/OnsiteApp/categoryRoutes');
const appsettingRoutes = require('./routes/OnsiteApp/appsettingRoutes');
const workshopRoutes = require('./routes/OnsiteApp/workshopRoutes');
const fieldRoutes = require('./routes/OnsiteApp/fieldsRoutes');
const userRoutes = require('./routes/OnsiteApp/userRoutes');
const reportRoutes = require('./routes/OnsiteApp/reportRoutes');
const scanRecordsRoutes = require('./routes/OnsiteApp/scanFacilityRoutes');
const widgets = require('./routes/api/widgets');
const loginRoutes = require('./routes/OnsiteApp/loginuserRoutes');
const superAdminRoutes = require('./routes/OnsiteApp/superAdminRoutes');
const sendgridRoutes = require('./routes/OnsiteApp/sendgridRoutes')

// Create badge
const createbadgeRoutes = require('./routes/OnsiteApp/createbadge');
const exportBadgeRoutes = require('./routes/OnsiteApp/exportBadgeRoutes');

// Connect to the database
const connectDB = async () => {
    try {
        await pool.getConnection({
            host: "localhost",
            user: "root",
            password: "",
            database: "eventapp",
        });
        console.log('MySQL connected successfully!');
    } catch (error) {
        console.error('MySQL connection error:', error);
        process.exit(1); // Exit process on failure
    }
};

connectDB()
    .then(() => {
        // Start server after successful connection
        app.listen(port, () => console.log(`Server listening on port ${port}`));
    })
    .catch(error => {
        console.error(error);
        process.exit(1); // Exit process on failure
    });

// Add your existing routes
app.use('/api/user', userRoutes);
app.use('/api/role', rolesRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/setting', appsettingRoutes);
app.use('/api/workshop', workshopRoutes);
app.use('/api/field', fieldRoutes);
app.use('/api/manageuser', userRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/scanrecords', scanRecordsRoutes);
app.use('/api/widgets', widgets);
app.use('/api/login', loginRoutes);
app.use('/api/badge', createbadgeRoutes);
app.use('/api/export', exportBadgeRoutes);
app.use('/api/superAdmin', superAdminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sendgrid', authRoutes);


// New endpoint to send email
app.post('/send-email', async (req, res) => {
    const { to, name, message, subject } = req.body;

    if (!to || !name || !message || !subject) {
        return res.status(400).send('Missing required fields');
    }

    const msg = {
        to,
        from: 'secretary@acsinet.net', // Your verified SendGrid email
        subject,
        html: `<p>Hello ${name},</p><p>${message}</p><p>Best regards,<br />Your Company</p>`,
    };

    try {
        await sgMail.send(msg);
        res.status(200).send('Email sent');
    } catch (error) {
        console.error('Error sending email:', error);
        if (error.response) {
            console.error(error.response.body);
        }
        res.status(500).send('Error sending email');
    }
});
