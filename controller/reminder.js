const REMINDER = require("../model/reminder");

exports.createReminder = async (req, res) => {
  try {
    const reminderData = {
      ...req.body,
      createdBy: req.user._id, // Set by authMiddleware
    };

    const reminder = await REMINDER.create(reminderData);

    return res.status(201).json({
      status: "Success",
      message: "Reminder created successfully",
      data: reminder,
    });
  } catch (error) {
    return res.status(400).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.getReminders = async (req, res) => {
  try {
    const { status, type } = req.query;
    const query = { createdBy: req.user._id };

    if (status) query.status = status;
    if (type) query.type = type;

    // Logic for "Upcoming" vs "Completed" vs "Failed" based on tab
    // Upcoming = Scheduled | Pending
    // Completed = Sent
    // Failed = Failed
    const filterType = req.query.filterType || 'all';
    if (filterType === 'upcoming') {
      query.status = { $in: ['Scheduled', 'Pending'] };
    } else if (filterType === 'completed') {
      query.status = 'Sent';
    } else if (filterType === 'failed') {
      query.status = 'Failed';
    }

    const reminders = await REMINDER.find(query)
      .populate('customer')
      .populate('customers')
      .populate('groups')
      .populate('template')
      .sort({ scheduledAt: 1 });

    // Optional: Add stats to response
    const stats = {
      sent: await REMINDER.countDocuments({ createdBy: req.user._id, status: 'Sent' }),
      pending: await REMINDER.countDocuments({ createdBy: req.user._id, status: { $in: ['Scheduled', 'Pending'] } }),
      failed: await REMINDER.countDocuments({ createdBy: req.user._id, status: 'Failed' }),
    };

    return res.status(200).json({
      status: "Success",
      message: "Reminders fetched successfully",
      data: reminders,
      stats,
    });
  } catch (error) {
    return res.status(500).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.getReminderById = async (req, res) => {
  try {
    const reminder = await REMINDER.findById(req.params.id)
      .populate('customer')
      .populate('customers')
      .populate('groups')
      .populate('template');

    if (!reminder) throw new Error("Reminder not found");

    return res.status(200).json({
      status: "Success",
      data: reminder,
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.updateReminder = async (req, res) => {
  try {
    const reminder = await REMINDER.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!reminder) throw new Error("Reminder not found");

    return res.status(200).json({
      status: "Success",
      message: "Reminder updated successfully",
      data: reminder,
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.deleteReminder = async (req, res) => {
  try {
    const reminder = await REMINDER.findByIdAndDelete(req.params.id);
    if (!reminder) throw new Error("Reminder not found");

    return res.status(200).json({
      status: "Success",
      message: "Reminder deleted successfully",
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};
