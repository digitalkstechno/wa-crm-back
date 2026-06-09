const FIRM = require("../model/firm");

exports.createFirm = async (req, res) => {
  try {
    const { name, status, superAdminId } = req.body;
    let code = req.body.code;

    if (!code) {
      const baseCode = name ? name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') : 'FRM';
      const safeBase = baseCode || 'FRM';
      let uniqueCode = safeBase + Math.floor(1000 + Math.random() * 9000);
      let isUnique = false;
      while (!isUnique) {
        const existing = await FIRM.findOne({ code: uniqueCode });
        if (!existing) {
          isUnique = true;
        } else {
          uniqueCode = safeBase + Math.floor(1000 + Math.random() * 9000);
        }
      }
      code = uniqueCode;
    }

    const firmDetails = await FIRM.create({ name, code, status, superAdminId: superAdminId || null });
    return res.status(201).json({ status: "Success", message: "Firm created successfully", data: firmDetails });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.fetchAllFirms = async (req, res) => {
  try {
    const firmsData = await FIRM.find().sort({ createdAt: -1 });
    return res.status(200).json({ status: "Success", message: "Firms fetched successfully", data: firmsData });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.fetchFirmById = async (req, res) => {
  try {
    const firmData = await FIRM.findById(req.params.id);
    if (!firmData) throw new Error("Firm not found");
    return res.status(200).json({ status: "Success", message: "Firm fetched successfully", data: firmData });
  } catch (error) {
    return res.status(404).json({ status: "Fail", message: error.message });
  }
};

exports.firmUpdate = async (req, res) => {
  try {
    const firmId = req.params.id;
    const { name, code, status, superAdminId } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (status !== undefined) updateData.status = status;
    if (superAdminId !== undefined) updateData.superAdminId = superAdminId || null;

    const updatedFirm = await FIRM.findByIdAndUpdate(firmId, updateData, { new: true });
    return res.status(200).json({ status: "Success", message: "Firm updated successfully", data: updatedFirm });
  } catch (error) {
    return res.status(404).json({ status: "Fail", message: error.message });
  }
};

exports.firmDelete = async (req, res) => {
  try {
    await FIRM.findByIdAndDelete(req.params.id);
    return res.status(200).json({ status: "Success", message: "Firm deleted successfully" });
  } catch (error) {
    return res.status(404).json({ status: "Fail", message: error.message });
  }
};

exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      throw new Error("No image file provided");
    }
    const logoUrl = `/uploads/${req.file.filename}`;
    const updatedFirm = await FIRM.findByIdAndUpdate(
      req.params.id,
      { logo: logoUrl },
      { new: true }
    );
    return res.status(200).json({ status: "Success", message: "Logo uploaded successfully", data: updatedFirm });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};
