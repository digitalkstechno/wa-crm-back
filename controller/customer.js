const Customer = require('../model/customer');
const CustomerGroup = require('../model/customerGroup');
const ExcelJS = require('exceljs');


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

exports.exportExcel = async (req, res) => {
  try {
    const { groupId } = req.query;
    const query = groupId ? { group: groupId } : {};

    const [customers, groups] = await Promise.all([
      Customer.find(query).populate('group', 'name').sort({ createdAt: -1 }),
      CustomerGroup.find().select('name'),
    ]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Customers');

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: '_id', width: 25 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Group', key: 'groupName', width: 20 },
      { header: 'Tags', key: 'tags', width: 30 },
      { header: 'Notes', key: 'notes', width: 40 },
    ];

    // Style the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Prepare group names for dropdown
    const groupNames = groups.map((g) => g.name);
    const groupListString = `"${groupNames.join(',')}"`;

    // Add data and data validation
    customers.forEach((customer, index) => {
      const rowIndex = index + 2; // 1-based index, +1 for header
      const rowData = {
        _id: customer._id.toString(),
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        groupName: customer.group ? customer.group.name : '',
        tags: (customer.tags || []).join(', '),
        notes: customer.notes,
      };
      const row = worksheet.addRow(rowData);

      // Add data validation to Group column (column 5)
      if (groupNames.length > 0) {
        row.getCell(5).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [groupListString],
        };
      }
    });

    // Also add validation for some empty rows at the bottom to allow adding new entries with dropdown
    for (let i = customers.length + 2; i <= customers.length + 100; i++) {
        if (groupNames.length > 0) {
            worksheet.getCell(`E${i}`).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [groupListString],
            };
        }
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'customers.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Error:', error);
    return res.status(500).json({ status: 'Fail', message: error.message });
  }
};
