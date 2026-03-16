const CustomerGroup = require('../model/customerGroup');
const Customer = require('../model/customer');

exports.createGroup = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const group = await CustomerGroup.create({ name, description, color });
    return res.status(201).json({ status: 'Success', data: group });
  } catch (error) {
    return res.status(400).json({ status: 'Fail', message: error.message });
  }
};

exports.getAllGroups = async (req, res) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;

    const query = search ? { name: { $regex: search, $options: 'i' } } : {};

    const [groups, total] = await Promise.all([
      CustomerGroup.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      CustomerGroup.countDocuments(query),
    ]);

    const groupsWithCount = await Promise.all(
      groups.map(async (g) => {
        const count = await Customer.countDocuments({ group: g._id });
        return { ...g.toObject(), count };
      })
    );

    return res.status(200).json({
      status: 'Success',
      data: groupsWithCount,
      pagination: {
        totalRecords: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    return res.status(500).json({ status: 'Fail', message: error.message });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const group = await CustomerGroup.findByIdAndUpdate(
      req.params.id,
      { name, description, color },
      { new: true }
    );
    if (!group) throw new Error('Group not found');
    return res.status(200).json({ status: 'Success', data: group });
  } catch (error) {
    return res.status(400).json({ status: 'Fail', message: error.message });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const group = await CustomerGroup.findByIdAndDelete(req.params.id);
    if (!group) throw new Error('Group not found');
    await Customer.updateMany({ group: req.params.id }, { group: null });
    return res.status(200).json({ status: 'Success', message: 'Group deleted' });
  } catch (error) {
    return res.status(400).json({ status: 'Fail', message: error.message });
  }
};
