const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

// Protect routes - verify JWT
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Token is invalid. User not found.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Your account has been deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token has expired. Please login again.' });
    }
    res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource.`
      });
    }
    next();
  };
};

// Ensure school admin can only access their own school's data
const schoolIsolation = (req, res, next) => {
  if (req.user.role === 'super_admin') return next();
  
  const schoolIdFromParam = req.params.schoolId || req.body.schoolId || req.query.schoolId;
  
  if (schoolIdFromParam && schoolIdFromParam !== req.user.schoolId?.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own school data.'
    });
  }
  
  // Auto-inject schoolId for school_admin
  if (req.user.role === 'school_admin') {
    req.schoolId = req.user.schoolId;
  }
  
  next();
};

module.exports = { protect, authorize, schoolIsolation };
