const REMINDER = require("../model/reminder");

exports.createReminder = async (req, res) => {
  try {
    const reminderData = {
      ...req.body,
      createdBy: req.user._id,
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { createdBy: req.user._id };

    const filterType = req.query.filterType || 'all';
    if (filterType === 'upcoming') {
      query.status = { $in: ['Scheduled', 'Pending'] };
    } else if (filterType === 'completed') {
      query.status = 'Sent';
    } else if (filterType === 'failed') {
      query.status = 'Failed';
    }

    // Run data + count + stats in parallel (single DB roundtrip pattern)
    const [reminders, total, statsAgg] = await Promise.all([
      REMINDER.find(query)
        .populate('customer', 'name phone')
        .populate('customers', 'name phone')
        .populate('groups', 'name color')
        .populate('template', 'name body')
        .sort({ scheduledAt: filterType === 'completed' ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      REMINDER.countDocuments(query),
      // Single aggregation for all stats instead of 3 separate countDocuments
      REMINDER.aggregate([
        { $match: { createdBy: req.user._id } },
        {
          $group: {
            _id: null,
            sent: { $sum: { $cond: [{ $eq: ['$status', 'Sent'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $in: ['$status', ['Scheduled', 'Pending']] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const stats = statsAgg[0] || { sent: 0, pending: 0, failed: 0 };

    return res.status(200).json({
      status: "Success",
      data: reminders,
      stats: { sent: stats.sent, pending: stats.pending, failed: stats.failed },
      pagination: {
        totalRecords: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
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
      .populate('customer', 'name phone')
      .populate('customers', 'name phone')
      .populate('groups', 'name color')
      .populate('template', 'name body')
      .lean();

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
    const reminder = await REMINDER.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
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
