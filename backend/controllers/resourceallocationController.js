const resourceAllocationService = require("../services/resourceallocationService");

// Get suggested members
const getSuggestedMembers = async (req, res) => {
  try {
    const result = await resourceAllocationService.getSuggestedMembers(req.body);
    return res.status(result.status).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Server Error",
    });
  }
};

module.exports = { getSuggestedMembers };