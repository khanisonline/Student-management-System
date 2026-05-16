const Assignment = require("./assignment.model");
const Submission = require("./submission.model");
const Enrollment = require("../enrollment/enrollment.model");

exports.getStudentAssignments = async (req, res) => {
  const userId = req.user.id;

  const enrollment = await Enrollment.findOne({ student: userId });

  if (!enrollment) {
    return res.json({
      success: true,
      assignments: []
    });
  }

  const assignments = await Assignment.find({ section: enrollment.section })
    .populate("createdBy", "fullName")
    .lean();
  const submissions = await Submission.find({ student: userId });

  const result = assignments.map((assignment) => {
    const submitted = submissions.find(
      (submission) => submission.assignment.toString() === assignment._id.toString()
    );

    return {
      ...assignment,
      status: submitted ? "submitted" : "pending"
    };
  });

  res.json({
    success: true,
    assignments: result
  });
};

exports.submitAssignment = async (req, res) => {
  const userId = req.user.id;
  const { assignmentId, fileUrl } = req.body;

  if (!fileUrl) {
    return res.status(400).json({
      message: "File is required"
    });
  }

  const exists = await Submission.findOne({
    assignment: assignmentId,
    student: userId
  });

  if (exists) {
    return res.status(400).json({
      message: "Already submitted"
    });
  }

  const submission = await Submission.create({
    assignment: assignmentId,
    student: userId,
    fileUrl
  });

  res.json({
    success: true,
    submission
  });
};
