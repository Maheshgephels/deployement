// server.js
const express = require('express');
const cors = require('cors'); // Import the cors module
const { pool, pool2 } = require('./config/database'); // Import the connection pools
// var queue = require('express-queue');
const port = process.env.PORT || 4000;
const app = express();
const path = require('path');

// Import the API router
const userRouter = require('./routes/api/users');


app.use(express.json({ limit: '50mb' }));


// app.use(queue({ activeLimit: 1, queuedLimit: -1 }));


// const queueMiddleware = queue({ activeLimit: 1, queuedLimit: -1 });

// // Function to determine if request should be queued
// const shouldQueue = (req) => {
//   return ['POST', 'PUT'].includes(req.method);
// };

// // Apply the queue middleware conditionally
// app.use((req, res, next) => {
//   if (shouldQueue(req)) {
//     console.log(`Queuing request: ${req.method} ${req.url}`);
//     queueMiddleware(req, res, next);
//   } else {
//     console.log(`Processing request without queue: ${req.method} ${req.url}`);
//     next();
//   }
// });



// const { pool } = mysql.createConnection({
//     host: "localhost",
//     user: "gephelss_nodeuse",
//     password: "Bbbm)wR(t!u&",
//     database: "gephelss_csonsite_db",
//   });
//   const { pool } = mysql.createConnection({
//       host: "localhost",
//       user: "root",
//       password: "",
//       database: "eventapp",
//     });

app.use(cors());

// app.use(cors({
//     origin: 'http://192.168.0.34:3000',
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//     credentials: true,
//     allowedHeaders: 'Content-Type, Authorization',
//   }));
app.use(express.json());


// Middleware to parse incoming request bodies
app.use(express.urlencoded({ extended: true })); // For form data


// Serve static files from the React app
app.use('/build', express.static(path.join(__dirname, '')));

app.use('/app-icon', express.static(path.join(__dirname, 'app-icon')));

//Page-icon
app.use('/page-icon', express.static(path.join(__dirname, 'page-icon')));

app.use('/map-assets', express.static(path.join(__dirname, 'map-assets')));

app.use('/faculty-profile', express.static(path.join(__dirname, 'faculty-profile')));

app.use('/faculty-cv', express.static(path.join(__dirname, 'faculty-cv')));

app.use('/session-tumbnail', express.static(path.join(__dirname, 'session-tumbnail')));


app.use('/exhibitor-assets', express.static(path.join(__dirname, 'exhibitor-assets')));

app.use('/eventlogoimage', express.static(path.join(__dirname, 'eventlogoimage')));

app.use('/eventbackgroundimage', express.static(path.join(__dirname, 'eventbackgroundimage')));

app.use('/faculty-cv', express.static(path.join(__dirname, 'faculty-cv')));

app.use('/document1', express.static(path.join(__dirname, 'document1')));
app.use('/document2', express.static(path.join(__dirname, 'document2')));
app.use('/document3', express.static(path.join(__dirname, 'document3')));
app.use('/document4', express.static(path.join(__dirname, 'document4')));
app.use('/document5', express.static(path.join(__dirname, 'document5')));
app.use('/profile', express.static(path.join(__dirname, 'profile')));


app.use('/Editor', express.static(path.join(__dirname, 'Editor')));
app.use('/qrCodes', express.static(path.join(__dirname, 'qrCodes')));
app.use('/Header_Footer', express.static(path.join(__dirname, 'Header_Footer')));


app.use('/page-assets', express.static(path.join(__dirname, 'page-assets')));









// For Badge images
app.use('/badgeimg', express.static(path.join(__dirname, 'badgeimg')));


//Auth
const authRoutes = require('./routes/api/authRoutes');

const rolesRoutes = require('./routes/OnsiteAdmin/rolesRoutes');
const categoryRoutes = require('./routes/OnsiteAdmin/categoryRoutes');
const appsettingRoutes = require('./routes/OnsiteAdmin/appsettingRoutes');
const workshopRoutes = require('./routes/OnsiteAdmin/workshopRoutes');
const fieldRoutes = require('./routes/OnsiteAdmin/fieldsRoutes');
const userRoutes = require('./routes/OnsiteAdmin/userRoutes');
const reportRoutes = require('./routes/OnsiteAdmin/reportRoutes');
const scanRecordsRoutes = require('./routes/OnsiteAdmin/scanFacilityRoutes');
const widgets = require('./routes/api/widgets');
const loginRoutes = require('./routes/OnsiteAdmin/loginuserRoutes');
const superAdminRoutes = require('./routes/OnsiteAdmin/superAdminRoutes');
const sendgridRoutes = require('./routes/OnsiteAdmin/sendgridRoutes');
const feedbackRoutes = require('./routes/OnsiteAdmin/feedbackRoutes');


//createbadge
const createbadgeRoutes = require('./routes/OnsiteAdmin/createbadge');
const exportBadgeRoutes = require('./routes/OnsiteAdmin/exportBadgeRoutes');

//Certificate
const certificateRoutes = require('./routes/OnsiteAdmin/certificateRoutes');
const exportCertRoutes = require('./routes/OnsiteAdmin/exportCertRoutes');

//Event admin
const notificationRoutes = require('./routes/EventAdmin/notificationRoutes');
const facultyRoutes = require('./routes/EventAdmin/facultyRoutes');
const eventuserRoutes = require('./routes/EventAdmin/userRoutes');
const eventWidgets = require('./routes/EventAdmin/eventWidgets');
const AppLayout = require('./routes/EventAdmin/AppLayout');
const pageRoutes = require('./routes/EventAdmin/pageRoutes');
const hallRoutes = require('./routes/EventAdmin/HallRoute');
const locationRoutes = require('./routes/EventAdmin/LocationRoutes');
const exhibitorRoutes = require('./routes/EventAdmin/exhibitorRoutes');
const eventcategory = require('./routes/EventAdmin/EventcategoryRoutes');
const eventsetting = require('./routes/EventAdmin/EventSettingRoutes');
const session =  require('./routes/EventAdmin/sessionRoutes');
const programday = require('./routes/EventAdmin/programday');
const eventrole = require('./routes/EventAdmin/roleRoutes');
const editor = require('./routes/EventAdmin/Editor');


//Registration module

const ticketRoutes =require('./routes/Registration/ticketroute');
const regfieldRoutes = require('./routes/Registration/fieldsRoutes')
const reguserRoutes = require('./routes/Registration/userRoutes');
const regcatRoutes = require('./routes/Registration/regRoutes');
const regworkshopRoutes = require('./routes/Registration/workshopRoutes');
const addonRoutes = require('./routes/Registration/addonRoute');
const discountRoutes = require('./routes/Registration/discountRoutes');
const paymentRoutes = require('./routes/Registration/paymentRoutes');
const regreportRoutes = require('./routes/Registration/reportRoutes');
const regWidgets = require('./routes/Registration/regWidgets');
const regsetting = require('./routes/Registration/RegSettingRoutes');
const allocationRoutes = require('./routes/Registration/allocationRoute');

// User
const userdashboardroutes = require('./routes/User/Dashbaord');
// const packageroutes =require('./routes/Registration/packageRoute')
const UuserRoutes = require('./routes/User/userRoutes');

const directuserRoutes = require('./routes/User/Directuserroutes');



const connectDB = async () => {
    try {
        await pool.getConnection({
            host: "localhost",
            user: "root",
            password: "",
            database: "eventadmin",
        });;
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
    
// db.connect((err) => {
//     if (err) {
//       console.error('Error connecting to database: ' + err.stack);
//       return;
//     }
//     console.log('Connected to database as id ' + db.threadId);
//   });

// app.listen(port, () => {
//   console.log(`listening on port ${port} `);
// });
   
app.use('/api/user', userRouter);
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
app.use('/api/feedback', feedbackRoutes);
app.use('/api/superAdmin', superAdminRoutes);
app.use('/api/sendgrid', sendgridRoutes);


// Certificate 
app.use('/api/certificate', certificateRoutes);
app.use('/api/exportcert', exportCertRoutes);

//Auth
app.use('/api/auth', authRoutes);


//Event Admin
app.use('/api/notification', notificationRoutes);
app.use('/api/faculty',facultyRoutes);
app.use('/api/eventuser',eventuserRoutes);
app.use('/api/eventdata',eventWidgets);
app.use('/api/applayout',AppLayout);
app.use('/api/page',pageRoutes);
app.use('/api/hall',hallRoutes);
app.use('/api/Location',locationRoutes);
app.use('/api/eventcategory',eventcategory);

app.use('/api/eventsetting',eventsetting);
app.use('/api/session', session);

app.use('/api/exhibitor', exhibitorRoutes);
app.use('/api/programday', programday);
app.use('/api/eventrole', eventrole);

app.use('/api/editor', editor);

//Registration admin

app.use('/api/ticketRoutes',ticketRoutes);
app.use('/api/regfield',regfieldRoutes);
app.use('/api/reguser', reguserRoutes);
app.use('/api/regcatgory', regcatRoutes);
app.use('/api/regworkshop', regworkshopRoutes);
app.use('/api/addonRoutes',addonRoutes);
app.use('/api/discountRoutes',discountRoutes);
app.use('/api/paymentRoutes',paymentRoutes);
app.use('/api/reports', regreportRoutes);
app.use('/api/regsetting', regsetting);

app.use('/api/regWidgets',regWidgets);

app.use('/api/allocation',allocationRoutes);

//User
app.use('/api/userdashboard',userdashboardroutes);
app.use('/api/register',UuserRoutes);
app.use('/api/directuser',directuserRoutes);












