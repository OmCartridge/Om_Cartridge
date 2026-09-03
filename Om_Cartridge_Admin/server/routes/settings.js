const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, requireAdmin } = require('../middleware/auth');

// Read settings — any authenticated user
router.get('/', protect, getSettings);

// Update settings — admin only (bank, SMTP, business details)
router.put('/', protect, requireAdmin, updateSettings);

module.exports = router;
