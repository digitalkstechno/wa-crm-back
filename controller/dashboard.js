const REMINDER = require('../model/reminder');
const User = require('../model/user');
const Task = require('../model/task');
const TaskStatus = require('../model/taskStatus');

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last30Days = new Date(now);
    last30Days.setDate(last30Days.getDate() - 29);

    // Get basic counts
    const totalUsers = await User.countDocuments();
    const totalTasks = await Task.countDocuments();
    
    // For pending tasks, we assume any task status that doesn't sound like "Completed" or "Done" is pending.
    // To be safe, let's just get the count of all tasks and maybe group them by status.
    
    // Aggregations
    const [
      reminderStatsAgg,
      reminderChartAgg,
      taskStatusAgg,
      recentTasks,
    ] = await Promise.all([
      // 1. Reminder Stats
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

      // 2. Reminder Chart (Last 30 days)
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

      // 3. Task Status Aggregation
      Task.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // 4. Recent Tasks (Last 5 created/updated)
      Task.find()
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('status')
        .populate('customer', 'name phone email')
        .populate('assignedTo', 'fullName email')
        .lean(),
    ]);

    // Format Reminder Stats
    const rs = reminderStatsAgg[0] || { activeReminders: 0, sentToday: 0, failedToday: 0, totalSent: 0, totalPending: 0, totalFailed: 0 };
    const rTotal = rs.totalSent + rs.totalPending + rs.totalFailed || 1;

    // Format Task Status Pie Chart
    // Need to populate status names and colors
    const populatedTaskStatuses = await TaskStatus.populate(taskStatusAgg, { path: '_id' });
    let pendingTasksCount = 0;
    
    const taskPie = populatedTaskStatuses.map(item => {
      const statusObj = item._id || { name: 'Unknown', color: '#9ca3af' };
      // Arbitrary logic: if status name contains "Done" or "Completed", it's not pending
      const isCompleted = ['done', 'completed'].includes(statusObj.name.toLowerCase());
      if (!isCompleted) {
        pendingTasksCount += item.count;
      }
      return {
        name: statusObj.name,
        value: item.count,
        color: statusObj.color || '#3b82f6'
      };
    });

    return res.status(200).json({
      status: 'Success',
      data: {
        stats: {
          totalUsers,
          totalTasks,
          pendingTasks: pendingTasksCount,
          activeReminders: rs.activeReminders,
          sentToday: rs.sentToday,
          failedToday: rs.failedToday,
        },
        chart: reminderChartAgg,
        pie: {
          reminders: [
            { name: 'Sent', value: Math.round((rs.totalSent / rTotal) * 100), color: '#10b981' },
            { name: 'Pending', value: Math.round((rs.totalPending / rTotal) * 100), color: '#3b82f6' },
            { name: 'Failed', value: Math.round((rs.totalFailed / rTotal) * 100), color: '#ef4444' },
          ],
          tasks: taskPie,
        },
        recentActivity: recentTasks.map(t => ({
          _id: t._id,
          taskId: t.taskId,
          title: t.title,
          status: t.status ? t.status.name : 'Unknown',
          statusColor: t.status ? t.status.color : '#9ca3af',
          priority: t.priority || 'Medium',
          dueDate: t.dueDate,
          userName: t.customer ? t.customer.name : 'Unassigned',
          assignee: t.assignedTo ? t.assignedTo.fullName : 'Unassigned',
        })),
      },
    });
  } catch (error) {
    return res.status(500).json({ status: 'Fail', message: error.message });
  }
};
