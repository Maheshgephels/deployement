const admin = require('firebase-admin');
const serviceAccount = require('./consoft-event-app-firebase-adminsdk-erxxq-80bea5f18b.json'); // Replace with the path to your Firebase service account key file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  //  projectId: 'consoft-event-app',
   databaseURL: 'https://consoft-event-app.firebaseio.com'


});


module.exports = admin;


