const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const errorHandler = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');

// Routes
const authRoutes = require('./routes/auth');
const schoolRoutes = require('./routes/schools');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const classRoutes = require('./routes/classes');
const dashboardRoutes = require('./routes/dashboard');
const feeRoutes = require('./routes/fees');
const reportRoutes = require('./routes/reports');
const attendanceRoutes = require('./routes/attendance');
const superAdminRoutes = require('./routes/superAdmin');

const app = express();


// ======================
// Security Middleware
// ======================

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);


// ======================
// Rate Limiting
// ======================

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

app.use('/api', limiter);


// Auth limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
  },
});

app.use('/api/auth', authLimiter);


// ======================
// Body Parser
// ======================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


// ======================
// CORS
// ======================

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);


// ======================
// Logging
// ======================

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}


// ======================
// Static Folder
// ======================

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);


// ======================
// Routes
// ======================

app.use('/api/auth', authRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/super-admin', superAdminRoutes);


// ======================
// Health Check
// ======================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart School OS API is running',
    timestamp: new Date().toISOString(),
  });
});


// ======================
// Error Handling
// ======================

app.use(notFound);
app.use(errorHandler);

module.exports = app;