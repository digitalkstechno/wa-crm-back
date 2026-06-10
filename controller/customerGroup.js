const CustomerGroup = require('../model/customerGroup');
const Customer = require('../model/customer');
const { getScopeQuery, assignScopeFields } = require('../utils/scope');

exports.createGroup = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const groupData = assignScopeFields(req, { name, description, color });
    const group = await CustomerGroup.create(groupData);
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

    const scope = await getScopeQuery(req, 'CustomerGroup');
    const customerScope = await getScopeQuery(req, 'Customer');

    const query = {
      ...scope,
      ...(search ? { name: { $regex: search, $options: 'i' } } : {})
    };

    const [groups, total] = await Promise.all([
      CustomerGroup.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      CustomerGroup.countDocuments(query),
    ]);

    const groupsWithCount = await Promise.all(
      groups.map(async (g) => {
        const count = await Customer.countDocuments({ group: g._id, ...customerScope });
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
    const scope = await getScopeQuery(req, 'CustomerGroup');
    const group = await CustomerGroup.findOneAndUpdate(
      { _id: req.params.id, ...scope },
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
    const scope = await getScopeQuery(req, 'CustomerGroup');
    const customerScope = await getScopeQuery(req, 'Customer');
    const group = await CustomerGroup.findOneAndDelete({ _id: req.params.id, ...scope });
    if (!group) throw new Error('Group not found');
    await Customer.updateMany({ group: req.params.id, ...customerScope }, { group: null });
    return res.status(200).json({ status: 'Success', message: 'Group deleted' });
  } catch (error) {
    return res.status(400).json({ status: 'Fail', message: error.message });
  }
};

exports.fetchAllGroups = async (req, res) => {
  try {
    const scope = await getScopeQuery(req, 'CustomerGroup');
    const customerScope = await getScopeQuery(req, 'Customer');
    const groups = await CustomerGroup.find(scope).populate({
      path: 'members',
      match: customerScope,
      select: 'name phone _id', // Changed fullName to name
    });
    
    // Add count for each group
    const groupsWithCount = groups.map(g => ({
      ...g.toObject(),
      count: g.members?.length || 0
    }));

    return res.status(200).json({
      status: "Success",
      message: "Customer-Groups fetched successfully",
      data: groupsWithCount,
    });
  } catch (error) {
    return res.status(500).json({
      status: "Fail",
      message: error.message,
    });
  }
};
