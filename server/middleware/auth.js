const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  console.log('Auth middleware running, checking authorization header');
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No valid authorization header found');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Token extracted from header');

  try {
    console.log('Verifying JWT token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('JWT verified, user ID:', decoded.id);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('User found in database, ID:', user._id);
    req.user = user;
    next();
  } catch (err) {
    console.error('Error in auth middleware:', err);
    res.status(401).json({ message: 'Token is not valid', error: err.message });
  }
};
