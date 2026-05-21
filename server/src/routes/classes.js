const express = require('express');
const { body } = require('express-validator');
const { getClasses, getClass, createClass, updateClass, deleteClass } = require('../controllers/classController');
const { protect, authorize, schoolIsolation } = require('../middleware/auth');
const router = express.Router();

router.use(protect, authorize('school_admin', 'super_admin'), schoolIsolation);
router.get('/', getClasses);
router.get('/:id', getClass);
router.post('/', [body('name').trim().notEmpty().withMessage('Class name is required')], createClass);
router.put('/:id', updateClass);
router.delete('/:id', deleteClass);

module.exports = router;
