const StudentRequest = require("./studentRequest.model");

exports.getRequests = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    const { status } = req.query;
    const filter = status && status !== "all" ? { status } : { status: "pending" };

    const requests = await StudentRequest.find(filter)
      .populate("student", "fullName email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests: requests.filter((request) => request.student)
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};
