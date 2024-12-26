
  var jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  // console.log("token from middleware:", token);

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  // Extract the token from the "Bearer <token>" format
  const tokenParts = token.split(' ');
  const tokenValue = tokenParts[1];

  jwt.verify(tokenValue, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      console.error("Token verification failed:", err.message);
      return res.status(401).json({ message: 'Unauthorized' });
    }
    console.log("Token verified successfully");
    req.user = decoded; // Set the decoded user object in the request
    next();
  });
};

module.exports = verifyToken;

