const REMINDER = require('../model/reminder');
const Customer = require('../model/customer');

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last30Days = new Date(now);
    last30Days.setDate(last30Days.getDate() - 29);

    const [
      totalCustomers,
      statsAgg,
      chartAgg,
      recentReminders,
    ] = await Promise.all([
      Customer.countDocuments(),

      // Stats aggregation
      REMINDER.aggregate([
        { $match: { createdBy: userId } },
        {
          $group: {
            _id: null,
            activeReminders: { $sum: { $cond: [{ $in: ['$status', ['Scheduled', 'Pending']] }, 1, 0] } },
            sentToday: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'Sent'] }, { $gte: ['$scheduledAt', todayStart] }] }, 1, 0] } },
            failedToday: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'Failed'] }, { $gte: ['$scheduledAt', todayStart] }] }, 1, 0] } },
            totalSent: { $sum: { $cond: [{ $eq: ['$status', 'Sent'] }, 1, 0] } },
            totalPending: { $sum: { $cond: [{ $in: ['$status', ['Scheduled', 'Pending']] }, 1, 0] } },
            totalFailed: { $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] } },
          },
        },
      ]),

      // Last 30 days chart — group by date
      REMINDER.aggregate([
        {
          $match: {
            createdBy: userId,
            status: 'Sent',
            scheduledAt: { $gte: last30Days },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%d %b', date: '$scheduledAt' },
            },
            sent: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, name: '$_id', sent: 1 } },
      ]),

      // Recent 5 reminders
      REMINDER.find({ createdBy: userId })
        .sort({ scheduledAt: -1 })
        .limit(5)
        .populate('customers', 'name')
        .populate('template', 'name')
        .select('title status scheduledAt recipientType newName customers groups')
        .lean(),
    ]);

    const s = statsAgg[0] || { activeReminders: 0, sentToday: 0, failedToday: 0, totalSent: 0, totalPending: 0, totalFailed: 0 };
    const total = s.totalSent + s.totalPending + s.totalFailed || 1;

    return res.status(200).json({
      status: 'Success',
      data: {
        stats: {
          totalCustomers,
          activeReminders: s.activeReminders,
          sentToday: s.sentToday,
          failedToday: s.failedToday,
        },
        chart: chartAgg,
        pie: [
          { name: 'Sent', value: Math.round((s.totalSent / total) * 100), color: '#10b981' },
          { name: 'Pending', value: Math.round((s.totalPending / total) * 100), color: '#3b82f6' },
          { name: 'Failed', value: Math.round((s.totalFailed / total) * 100), color: '#ef4444' },
        ],
        recentActivity: recentReminders.map(r => ({
          _id: r._id,
          title: r.title,
          status: r.status,
          scheduledAt: r.scheduledAt,
          customerName:
            r.recipientType === 'customers' && r.customers?.length
              ? r.customers[0].name
              : r.newName || 'Unknown',
        })),
      },
    });
  } catch (error) {
    return res.status(500).json({ status: 'Fail', message: error.message });
  }
};
