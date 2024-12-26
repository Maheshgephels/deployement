const express = require('express');
const queue = require('express-queue');

const queueMiddleware = queue({ activeLimit: 1, queuedLimit: -1 });

module.exports = (req, res, next) => {
  if (queueMiddleware.active > 0) {
    // If there is an active request, respond with an error message
    return res.status(429).json({ message: 'Server is busy. Please wait and try again later.' });
  }
  console.log(`Queuing request for route ${req.url}`);
  queueMiddleware(req, res, next);
};