const TaskStatus = require('../model/taskStatus');
const { getScopeQuery, assignScopeFields } = require('../utils/scope');

exports.createStatus = async (req, res) => {
  try {
    const { name, color, order } = req.body;
    const statusData = assignScopeFields(req, {
      name,
      color,
      order: order || 0,
    });

    const newStatus = new TaskStatus(statusData);
    await newStatus.save();
    res.status(201).json({ success: true, data: newStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStatuses = async (req, res) => {
  try {
    const scope = await getScopeQuery(req, 'TaskStatus');
    const statuses = await TaskStatus.find(scope).sort({ order: 1 });
    res.status(200).json({ success: true, data: statuses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, order } = req.body;
    
    const scope = await getScopeQuery(req, 'TaskStatus');
    const status = await TaskStatus.findOneAndUpdate(
      { _id: id, ...scope },
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
    const scope = await getScopeQuery(req, 'TaskStatus');
    const status = await TaskStatus.findOneAndDelete({ _id: id, ...scope });
    if (!status) return res.status(404).json({ success: false, message: 'Status not found' });
    res.status(200).json({ success: true, message: 'Status deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.reorderStatuses = async (req, res) => {
  try {
    const { statuses } = req.body; // array of { id, order }
    const scope = await getScopeQuery(req, 'TaskStatus');
    if (statuses && Array.isArray(statuses)) {
      await Promise.all(statuses.map(s => TaskStatus.findOneAndUpdate({ _id: s.id, ...scope }, { order: s.order })));
    }
    res.status(200).json({ success: true, message: 'Statuses reordered' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
