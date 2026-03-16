const Customer = require('../model/customer');

exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, email, tags, group, notes } = req.body;
    const customer = await Customer.create({ name, phone, email, tags, group: group || null, notes });
    await customer.populate('group', 'name color');
    return res.status(201).json({ status: 'Success', data: customer });
  } catch (error) {
    return res.status(400).json({ status: 'Fail', message: error.message });
  }
};

exports.getAllCustomers = async (req, res) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [customers, total] = await Promise.all([
      Customer.find(query).populate('group', 'name color').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Customer.countDocuments(query),
    ]);

    return res.status(200).json({
      status: 'Success',
      data: customers,
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

exports.updateCustomer = async (req, res) => {
  try {
    const { name, phone, email, tags, group, notes } = req.body;
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, phone, email, tags, group: group || null, notes },
      { new: true }
    ).populate('group', 'name color');
    if (!customer) throw new Error('Customer not found');
    return res.status(200).json({ status: 'Success', data: customer });
  } catch (error) {
    return res.status(400).json({ status: 'Fail', message: error.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) throw new Error('Customer not found');
    return res.status(200).json({ status: 'Success', message: 'Customer deleted' });
  } catch (error) {
    return res.status(400).json({ status: 'Fail', message: error.message });
  }
};
