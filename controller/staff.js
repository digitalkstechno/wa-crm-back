const STAFF = require("../model/staff");
const { encryptData, decryptData } = require("../utils/crypto");
const jwt = require("jsonwebtoken");

exports.createStaff = async (req, res) => {
  try {
    const { 
      fullName, email, phone, password, roleType, firmId, parentId, managerId, 
      teamId, department, designation, status, joiningDate, notes, 
      employeeCode, profileImage, permissions 
    } = req.body;

    const staffDetails = await STAFF.create({
      fullName,
      email,
      phone,
      password: encryptData(password),
      roleType,
      firmId: firmId || null,
      parentId: parentId || null,
      managerId: managerId || null,
      teamId: teamId || null,
      department,
      designation,
      status,
      joiningDate,
      notes,
      employeeCode,
      profileImage,
      permissions
    });

    return res.status(201).json({
      status: "Success",
      message: "Staff created successfully",
      data: staffDetails,
    });
  } catch (error) {
    return res.status(400).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.loginStaff = async (req, res) => {
  try {
    const { email, password } = req.body;
    const staffverify = await STAFF.findOne({ email });
    if (!staffverify) {
      throw new Error("Invalid Email or password");
    }
    const decryptedPassword = decryptData(staffverify.password);
    if (String(decryptedPassword) !== password) {
      throw new Error("Invalid password");
    }
    const token = jwt.sign({ id: staffverify._id }, process.env.JWT_SECRET_KEY);
    return res.status(200).json({
      status: "Success",
      message: "Staff logged in successfully",
      data: staffverify,
      token,
    });
  } catch (error) {
    return res.status(400).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.fetchAllStaffs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = {
      $or: [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ],
    };

    const totalStaff = await STAFF.countDocuments(query);
    const staffsData = await STAFF.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: "Success",
      message: "Staffs fetched successfully",
      pagination: {
        totalRecords: totalStaff,
        currentPage: page,
        totalPages: Math.ceil(totalStaff / limit),
        limit,
      },
      data: staffsData,
    });
  } catch (error) {
    return res.status(500).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.fetchStaffById = async (req, res) => {
  try {
    const staffData = await STAFF.findById(req.params.id);
    if (!staffData) throw new Error("Staff not found");
    return res.status(200).json({
      status: "Success",
      message: "Staff fetched successfully",
      data: staffData,
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const { fullName, email, phone, currentPassword, newPassword } = req.body;
    const staff = await STAFF.findById(req.staff._id);

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;

    if (newPassword) {
      if (!currentPassword) throw new Error('Current password is required');
      const decrypted = decryptData(staff.password);
      if (String(decrypted) !== currentPassword) throw new Error('Current password is incorrect');
      updateData.password = encryptData(newPassword);
    }

    const updated = await STAFF.findByIdAndUpdate(req.staff._id, updateData, { new: true });
    return res.status(200).json({ status: 'Success', message: 'Profile updated successfully', data: updated });
  } catch (error) {
    return res.status(400).json({ status: 'Fail', message: error.message });
  }
};

exports.getCurrentStaff = async (req, res) => {
  try {
    return res.status(200).json({
      status: "Success",
      data: req.staff,
    });
  } catch (error) {
    return res.status(500).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.staffUpdate = async (req, res) => {
  try {
    const staffId = req.params.id;
    const oldStaff = await STAFF.findById(staffId);
    if (!oldStaff) throw new Error("Staff not found");

    const { 
      fullName, email, phone, password, roleType, firmId, parentId, managerId, 
      teamId, department, designation, status, joiningDate, notes, 
      employeeCode, profileImage, permissions 
    } = req.body;
    
    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (password) updateData.password = encryptData(password);
    
    if (roleType !== undefined) updateData.roleType = roleType;
    if (firmId !== undefined) updateData.firmId = firmId || null;
    if (parentId !== undefined) updateData.parentId = parentId || null;
    if (managerId !== undefined) updateData.managerId = managerId || null;
    if (teamId !== undefined) updateData.teamId = teamId || null;
    if (department !== undefined) updateData.department = department;
    if (designation !== undefined) updateData.designation = designation;
    if (status !== undefined) updateData.status = status;
    if (joiningDate !== undefined) updateData.joiningDate = joiningDate;
    if (notes !== undefined) updateData.notes = notes;
    if (employeeCode !== undefined) updateData.employeeCode = employeeCode;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (permissions !== undefined) updateData.permissions = permissions;

    const updatedStaff = await STAFF.findByIdAndUpdate(staffId, updateData, { new: true });
    return res.status(200).json({
      status: "Success",
      message: "Staff updated successfully",
      data: updatedStaff,
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.staffDelete = async (req, res) => {
  try {
    const oldStaff = await STAFF.findById(req.params.id);
    if (!oldStaff) throw new Error("Staff not found");
    await STAFF.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      status: "Success",
      message: "Staff deleted successfully",
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.fetchHierarchy = async (req, res) => {
  try {
    const staffsData = await STAFF.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json({
      status: "Success",
      message: "Staff hierarchy fetched successfully",
      data: staffsData,
    });
  } catch (error) {
    return res.status(500).json({
      status: "Fail",
      message: error.message,
    });
  }
};
