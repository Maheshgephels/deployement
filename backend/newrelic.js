require('newrelic');

exports.config = {
    app_name: ['Consoft Application'], // Replace with your application's name
    license_key: '97a358c5fe9eec7cfe35f04663d2e840FFFFNRAL', // Replace with your New Relic license key
    logging: {
        level: 'trace', // Logging level: 'trace', 'debug', 'info', 'warn', 'error', or 'fatal'
    },
};
