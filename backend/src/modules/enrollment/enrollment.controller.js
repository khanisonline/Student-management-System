const Enrollment = require("./enrollment.model");
const StudentRequest = require("../studentRequest/studentRequest.model");
const Section = require("../section/section.model");

exports.approveStudent = async (req, res) => {
  try {
    const { requestId, sectionId, rollNumber } = req.body;

    const request = await StudentRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        message: "Request not found"
      });
    }

    if (request.status === "rejected") {
      return res.status(400).json({
        message: "Rejected requests cannot be approved"
      });
    }

    const section = await Section.findById(sectionId);

    if (!section) {
      return res.status(404).json({
        message: "Section not found"
      });
    }

    const existingEnrollment = await Enrollment.findOne({
      student: request.student
    });

    if (existingEnrollment) {
      if (request.status !== "approved") {
        request.status = "approved";
        await request.save();
      }

      return res.json({
        success: true,
        enrollment: existingEnrollment,
        message: "Student is already assigned to a section"
      });
    }

    const duplicateRollNumber = await Enrollment.findOne({
      section: sectionId,
      rollNumber
    });

    if (duplicateRollNumber) {
      return res.status(400).json({
        message: "Roll number already exists in this section"
      });
    }

    const enrollment = await Enrollment.create({
      student: request.student,
      section: sectionId,
      rollNumber
    });

    request.status = "approved";
    await request.save();

    res.json({
      success: true,
      enrollment
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

exports.rejectStudent = async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await StudentRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        message: "Request not found"
      });
    }

    if (request.status === "approved") {
      return res.status(400).json({
        message: "Approved requests cannot be rejected"
      });
    }

    if (request.status !== "rejected") {
      request.status = "rejected";
      await request.save();
    }

    res.json({
      success: true,
      request
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

exports.getMyEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user.id
    }).populate("section", "name semester");

    if (!enrollment) {
      return res.json({
        success: true,
        status: "pending"
      });
    }

    res.json({
      success: true,
      status: "approved",
      enrollment
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
