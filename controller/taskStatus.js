const TaskStatus = require('../model/taskStatus');

exports.createStatus = async (req, res) => {
  try {
    const { name, color, order } = req.body;
    const staffId = req.user._id;

    const newStatus = new TaskStatus({
      name,
      color,
      order: order || 0,
      createdBy: staffId,
    });
    await newStatus.save();
    res.status(201).json({ success: true, data: newStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStatuses = async (req, res) => {
  try {
    const statuses = await TaskStatus.find().sort({ order: 1 });
    res.status(200).json({ success: true, data: statuses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, order } = req.body;
    
    const status = await TaskStatus.findByIdAndUpdate(
      id,
      { name, color, order },
      { new: true }
    );
    if (!status) return res.status(404).json({ success: false, message: 'Status not found' });
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const status = await TaskStatus.findByIdAndDelete(id);
    if (!status) return res.status(404).json({ success: false, message: 'Status not found' });
    res.status(200).json({ success: true, message: 'Status deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.reorderStatuses = async (req, res) => {
  try {
    const { statuses } = req.body; // array of { id, order }
    if (statuses && Array.isArray(statuses)) {
      await Promise.all(statuses.map(s => TaskStatus.findByIdAndUpdate(s.id, { order: s.order })));
    }
    res.status(200).json({ success: true, message: 'Statuses reordered' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
