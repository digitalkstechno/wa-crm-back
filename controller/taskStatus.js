const TASK_STATUS = require('../model/taskStatus');

const DEFAULT_STATUSES = [
  { name: 'Todo', color: '#6b7280', order: 0 },
  { name: 'In Progress', color: '#3b82f6', order: 1 },
  { name: 'Done', color: '#10b981', order: 2 },
  { name: 'Cancelled', color: '#ef4444', order: 3 },
];

exports.getStatuses = async (req, res) => {
  try {
    let statuses = await TASK_STATUS.find({ createdBy: req.user._id }).sort({ order: 1 }).lean();

    // Seed defaults for new users
    if (statuses.length === 0) {
      const docs = DEFAULT_STATUSES.map(s => ({ ...s, createdBy: req.user._id }));
      statuses = await TASK_STATUS.insertMany(docs);
    }

    return res.status(200).json({ status: 'Success', data: statuses });
  } catch (error) {
    return res.status(500).json({ status: 'Fail', message: error.message });
  }
};

exports.createStatus = async (req, res) => {
  try {
    const count = await TASK_STATUS.countDocuments({ createdBy: req.user._id });
    const taskStatus = await TASK_STATUS.create({ ...req.body, order: count, createdBy: req.user._id });
    return res.status(201).json({ status: 'Success', data: taskStatus });
  } catch (error) {
    return res.status(400).json({ status: 'Fail', message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const taskStatus = await TASK_STATUS.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!taskStatus) throw new Error('Status not found');
    return res.status(200).json({ status: 'Success', data: taskStatus });
  } catch (error) {
    return res.status(400).json({ status: 'Fail', message: error.message });
  }
};

exports.deleteStatus = async (req, res) => {
  try {
    const taskStatus = await TASK_STATUS.findByIdAndDelete(req.params.id);
    if (!taskStatus) throw new Error('Status not found');
    return res.status(200).json({ status: 'Success', message: 'Status deleted' });
  } catch (error) {
    return res.status(404).json({ status: 'Fail', message: error.message });
  }
};

// Reorder: accepts [{ _id, order }]
exports.reorderStatuses = async (req, res) => {
  try {
    const updates = req.body.statuses;
    await Promise.all(updates.map(({ _id, order }) => TASK_STATUS.findByIdAndUpdate(_id, { order })));
    return res.status(200).json({ status: 'Success' });
  } catch (error) {
    return res.status(400).json({ status: 'Fail', message: error.message });
  }
};
