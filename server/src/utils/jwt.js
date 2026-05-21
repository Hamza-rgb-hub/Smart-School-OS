const jwt = require('jsonwebtoken');

const generateToken = (userId, role, schoolId = null) => {
  const payload = { id: userId, role, schoolId };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id, user.role, user.schoolId);
  
  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    schoolId: user.schoolId,
    avatar: user.avatar
  };

  res.status(statusCode).json({
    success: true,
    message,
    token,
    data: userData
  });
};

module.exports = { generateToken, verifyToken, sendTokenResponse };
