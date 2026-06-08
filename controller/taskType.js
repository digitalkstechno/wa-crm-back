const TaskType = require('../model/taskType');

exports.createType = async (req, res) => {
  try {
    const { name, color } = req.body;
    const staffId = req.staff._id;

    const newType = new TaskType({
      name,
      color,
      createdBy: staffId,
    });
    await newType.save();
    res.status(201).json({ success: true, data: newType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTypes = async (req, res) => {
  try {
    const types = await TaskType.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: types });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    
    const type = await TaskType.findByIdAndUpdate(
      id,
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
    const type = await TaskType.findByIdAndDelete(id);
    if (!type) return res.status(404).json({ success: false, message: 'Type not found' });
    res.status(200).json({ success: true, message: 'Type deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
