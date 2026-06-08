const User = require('../model/user');
const UserGroup = require('../model/userGroup');
const ExcelJS = require('exceljs');


exports.createUser = async (req, res) => {
  try {
    const { name, phone, email, tags, group, notes } = req.body;
    const user = await User.create({ name, phone, email, tags, group: group || null, notes });
    await user.populate('group', 'name color');
    return res.status(201).json({ status: 'Success', data: user });
  } catch (error) {
    return res.status(400).json({ status: 'Fail', message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
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

    const [users, total] = await Promise.all([
      User.find(query).populate('group', 'name color').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      status: 'Success',
      data: users,
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

exports.updateUser = async (req, res) => {
  try {
    const { name, phone, email, tags, group, notes } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, phone, email, tags, group: group || null, notes },
      { new: true }
    ).populate('group', 'name color');
    if (!user) throw new Error('User not found');
    return res.status(200).json({ status: 'Success', data: user });
  } catch (error) {
    return res.status(400).json({ status: 'Fail', message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) throw new Error('User not found');
    return res.status(200).json({ status: 'Success', message: 'User deleted' });
  } catch (error) {
    return res.status(400).json({ status: 'Fail', message: error.message });
  }
};

exports.exportExcel = async (req, res) => {
  try {
    const { groupId } = req.query;
    const query = groupId ? { group: groupId } : {};

    const [users, groups] = await Promise.all([
      User.find(query).populate('group', 'name').sort({ createdAt: -1 }),
      UserGroup.find().select('name'),
    ]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

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
    users.forEach((user, index) => {
      const rowIndex = index + 2; // 1-based index, +1 for header
      const rowData = {
        _id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        groupName: user.group ? user.group.name : '',
        tags: (user.tags || []).join(', '),
        notes: user.notes,
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
    for (let i = users.length + 2; i <= users.length + 100; i++) {
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
      'attachment; filename=' + 'users.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Error:', error);
    return res.status(500).json({ status: 'Fail', message: error.message });
  }
};
