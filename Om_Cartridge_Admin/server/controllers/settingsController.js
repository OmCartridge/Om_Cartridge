const Settings = require('../models/Settings');

// GET /api/settings
const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({});
    }

    // Don't expose SMTP password
    const data = settings.toObject();
    if (data.smtp) {
      data.smtp.password = data.smtp.password ? '***' : '';
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// PUT /api/settings
const updateSettings = async (req, res, next) => {
  try {
    const { business, bank, invoice, smtp } = req.body;

    let settings = await Settings.findOne({});
    if (!settings) {
      settings = new Settings({});
    }

    if (business) {
      settings.business = { ...settings.business.toObject(), ...business };
    }
    if (bank) {
      settings.bank = { ...settings.bank.toObject(), ...bank };
    }
    if (invoice) {
      settings.invoice = { ...settings.invoice.toObject(), ...invoice };
    }
    if (smtp) {
      const current = settings.smtp.toObject();
      settings.smtp = {
        ...current,
        host: smtp.host !== undefined ? smtp.host : current.host,
        port: smtp.port !== undefined ? smtp.port : current.port,
        user: smtp.user !== undefined ? smtp.user : current.user,
        from: smtp.from !== undefined ? smtp.from : current.from,
        // Only update password if it's not "***"
        password: smtp.password && smtp.password !== '***' ? smtp.password : current.password,
      };
    }

    await settings.save();

    // Return without SMTP password
    const data = settings.toObject();
    if (data.smtp) data.smtp.password = data.smtp.password ? '***' : '';

    res.json({ success: true, message: 'Settings updated successfully', data });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings };
