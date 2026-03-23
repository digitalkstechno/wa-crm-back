const TASK = require('../model/task');

exports.createTask = async (req, res) => {
  try {
    const task = await TASK.create({ ...req.body, createdBy: req.user._id });
    return res.status(201).json({ status: 'Success', data: task });
  } catch (error) {
    return res.status(400).json({ status: 'Fail', message: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const query = { createdBy: req.user._id };
    if (req.query.status) query.status = req.query.status;

    const tasks = await TASK.find(query)
      .populate('assignedTo', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();

    const statsAgg = await TASK.aggregate([
      { $match: { createdBy: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = { Todo: 0, 'In Progress': 0, Done: 0, Cancelled: 0 };
    statsAgg.forEach(s => { stats[s._id] = s.count; });

    return res.status(200).json({ status: 'Success', data: tasks, stats });
  } catch (error) {
    return res.status(500).json({ status: 'Fail', message: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await TASK.findById(req.params.id).populate('assignedTo', 'fullName email').lean();
    if (!task) throw new Error('Task not found');
    return res.status(200).json({ status: 'Success', data: task });
  } catch (error) {
    return res.status(404).json({ status: 'Fail', message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await TASK.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!task) throw new Error('Task not found');
    return res.status(200).json({ status: 'Success', data: task });
  } catch (error) {
    return res.status(400).json({ status: 'Fail', message: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await TASK.findByIdAndDelete(req.params.id);
    if (!task) throw new Error('Task not found');
    return res.status(200).json({ status: 'Success', message: 'Task deleted' });
  } catch (error) {
    return res.status(404).json({ status: 'Fail', message: error.message });
  }
};
