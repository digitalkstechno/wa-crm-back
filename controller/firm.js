const FIRM = require("../model/firm");

exports.createFirm = async (req, res) => {
  try {
    const { name, code, status } = req.body;
    const firmDetails = await FIRM.create({ name, code, status });
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
    const { name, code, status } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (status !== undefined) updateData.status = status;

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
