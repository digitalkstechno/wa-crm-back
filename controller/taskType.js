const TaskType = require('../model/taskType');
const { getScopeQuery, assignScopeFields } = require('../utils/scope');

exports.createType = async (req, res) => {
  try {
    const { name, color } = req.body;
    const typeData = assignScopeFields(req, {
      name,
      color,
    });

    const newType = new TaskType(typeData);
    await newType.save();
    res.status(201).json({ success: true, data: newType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTypes = async (req, res) => {
  try {
    const scope = await getScopeQuery(req, 'TaskType');
    const types = await TaskType.find(scope).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: types });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    
    const scope = await getScopeQuery(req, 'TaskType');
    const type = await TaskType.findOneAndUpdate(
      { _id: id, ...scope },
      { name, color },
      { new: true }
    );
    if (!type) return res.status(404).json({ success: false, message: 'Type not found' });
    res.status(200).json({ success: true, data: type });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteType = async (req, res) => {
  try {
    const { id } = req.params;
    const scope = await getScopeQuery(req, 'TaskType');
    const type = await TaskType.findOneAndDelete({ _id: id, ...scope });
    if (!type) return res.status(404).json({ success: false, message: 'Type not found' });
    res.status(200).json({ success: true, message: 'Type deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
