const Template = require('../model/template');
const { getScopeQuery, assignScopeFields } = require('../utils/scope');

exports.createTemplate = async (req, res) => {
  try {
    const { name, body, assignedTo } = req.body;
    const templateData = assignScopeFields(req, { name, body, assignedTo: assignedTo || null });
    const template = await Template.create(templateData);
    return res.status(201).json({ status: 'Success', data: template });
  } catch (error) {
    return res.status(400).json({ status: 'Fail', message: error.message });
  }
};

exports.getAllTemplates = async (req, res) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const scope = await getScopeQuery(req, 'Template');
    const query = {
      ...scope,
      ...(search ? { $or: [{ name: { $regex: search, $options: 'i' } }, { body: { $regex: search, $options: 'i' } }] } : {})
    };

    const [templates, total] = await Promise.all([
      Template.find(query).populate('assignedTo', 'fullName email').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Template.countDocuments(query),
    ]);

    return res.status(200).json({
      status: 'Success',
      data: templates,
      pagination: { totalRecords: total, currentPage: page, totalPages: Math.ceil(total / limit), limit },
    });
  } catch (error) {
    return res.status(500).json({ status: 'Fail', message: error.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const { name, body, assignedTo } = req.body;
    const scope = await getScopeQuery(req, 'Template');
    const template = await Template.findOneAndUpdate(
      { _id: req.params.id, ...scope },
      { name, body, assignedTo: assignedTo || null },
      { new: true }
    ).populate('assignedTo', 'fullName email');
    if (!template) throw new Error('Template not found');
    return res.status(200).json({ status: 'Success', data: template });
  } catch (error) {
    return res.status(400).json({ status: 'Fail', message: error.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const scope = await getScopeQuery(req, 'Template');
    const template = await Template.findOneAndDelete({ _id: req.params.id, ...scope });
    if (!template) throw new Error('Template not found');
    return res.status(200).json({ status: 'Success', message: 'Template deleted' });
  } catch (error) {
    return res.status(400).json({ status: 'Fail', message: error.message });
  }
};
