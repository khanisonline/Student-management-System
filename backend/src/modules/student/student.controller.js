const Enrollment = require("../enrollment/enrollment.model");
const Attendance = require("../attendance/attendance.model");
const Marks = require("../marks/marks.model");
const Assignment = require("../assignment/assignment.model");
const Leave = require("../leave/leave.model");
const Exam = require("../exam/exam.model");
const Notification = require("../notification/notification.model");
const Submission = require("../assignment/submission.model");
const Course = require("../course/course.model");
const {
  generateInsights,
  generateDetailedStudentAnalysis
} = require("../ai/groq.service");

function buildEnrollmentOverview(enrollment) {
  if (!enrollment) {
    return null;
  }

  return {
    section: enrollment.section.name,
    semester: enrollment.section.semester,
    department: enrollment.section.department?.name,
    rollNumber: enrollment.rollNumber
  };
}

function buildAttendanceSummary(attendanceRecords, studentId) {
  const summary = attendanceRecords.reduce(
    (accumulator, attendance) => {
      attendance.records.forEach((record) => {
        if (record.student.toString() === studentId.toString()) {
          accumulator.total += 1;
          if (record.status === "present") accumulator.present += 1;
          if (record.status === "absent") accumulator.absent += 1;
          if (record.status === "leave") accumulator.leave += 1;
        }
      });

      return accumulator;
    },
    { total: 0, present: 0, absent: 0, leave: 0 }
  );

  return {
    ...summary,
    attendancePercent: summary.total
      ? Number(((summary.present / summary.total) * 100).toFixed(1))
      : 0
  };
}

async function getStudentAcademicContext(studentId) {
  const enrollment = await Enrollment.findOne({ student: studentId }).populate({
    path: "section",
    populate: { path: "department", select: "name" }
  });

  const [marks, attendanceRecords, leaves, notifications] = await Promise.all([
    Marks.find({ student: studentId }).populate("course", "name").populate("teacher", "fullName"),
    Attendance.find({ "records.student": studentId }).populate("course", "name"),
    Leave.find({ student: studentId }).sort({ createdAt: -1 }),
    Notification.find({ user: studentId }).sort({ createdAt: -1 })
  ]);

  let assignments = [];
  let exams = [];
  let sectionCourses = [];

  if (enrollment) {
    [assignments, exams, sectionCourses] = await Promise.all([
      Assignment.find({ section: enrollment.section._id })
        .populate("createdBy", "fullName")
        .sort({ dueDate: 1 }),
      Exam.find({ section: enrollment.section._id })
        .populate("course", "name")
        .sort({ date: 1 }),
      Course.find({ section: enrollment.section._id })
        .populate("teacher", "fullName")
        .sort({ name: 1 })
    ]);
  }

  const submissions = await Submission.find({
    student: studentId,
    assignment: { $in: assignments.map((assignment) => assignment._id) }
  });

  const assignmentSummary = assignments.map((assignment) => ({
    ...assignment.toObject(),
    status: submissions.some(
      (submission) =>
        submission.assignment.toString() === assignment._id.toString()
    )
      ? "submitted"
      : "pending"
  }));

  const attendanceSummary = buildAttendanceSummary(attendanceRecords, studentId);
  const averageMarks = marks.length
    ? marks.reduce((sum, mark) => sum + Number(mark.marks), 0) / marks.length
    : 0;

  return {
    enrollment,
    marks,
    attendanceRecords,
    attendanceSummary,
    attendancePercent: attendanceSummary.attendancePercent,
    averageMarks: Number(averageMarks.toFixed(1)),
    leaves,
    notifications,
    assignments: assignmentSummary,
    exams,
    sectionCourses,
    submissions
  };
}

exports.getDashboard = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user._id
    }).populate({
      path: "section",
      populate: { path: "department", select: "name" }
    });

    if (!enrollment) {
      return res.status(404).json({ message: "Not enrolled" });
    }

    res.status(200).json({
      success: true,
      data: buildEnrollmentOverview(enrollment)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({
      "records.student": req.user._id
    }).populate("course", "name");

    res.status(200).json({
      success: true,
      attendance: records
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyMarks = async (req, res) => {
  try {
    const marks = await Marks.find({
      student: req.user._id
    })
      .populate("course", "name")
      .populate("teacher", "fullName");

    res.status(200).json({
      success: true,
      marks
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user._id
    });

    if (!enrollment) {
      return res.status(200).json({
        success: true,
        assignments: []
      });
    }

    const assignments = await Assignment.find({
      section: enrollment.section
    }).populate("createdBy", "fullName");

    res.status(200).json({
      success: true,
      assignments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.applyLeave = async (req, res) => {
  try {
    const { fromDate, toDate, reason } = req.body;

    const overlap = await Leave.findOne({
      student: req.user._id,
      $or: [
        {
          fromDate: { $lte: toDate },
          toDate: { $gte: fromDate }
        }
      ]
    });

    if (overlap) {
      return res.status(400).json({
        message: "Leave dates overlap with existing leave"
      });
    }

    const leave = await Leave.create({
      student: req.user._id,
      fromDate,
      toDate,
      reason
    });

    res.status(201).json({
      success: true,
      leave
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({
      student: req.user._id
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      leaves
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDatesheet = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({ student: req.user._id });

    if (!enrollment) {
      return res.json({ success: true, exams: [] });
    }

    const exams = await Exam.find({
      section: enrollment.section
    }).populate("course", "name");

    res.json({ success: true, exams });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFullDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;
    const context = await getStudentAcademicContext(studentId);

    res.json({
      success: true,
      overview: {
        student: req.user,
        enrollment: buildEnrollmentOverview(context.enrollment)
      },
      summary: {
        courses: context.sectionCourses.length,
        assignments: context.assignments.length,
        pendingAssignments: context.assignments.filter(
          (assignment) => assignment.status === "pending"
        ).length,
        marksPublished: context.marks.length,
        averageMarks: context.averageMarks,
        attendancePercent: context.attendancePercent,
        unreadNotifications: context.notifications.filter(
          (notification) => !notification.isRead
        ).length
      },
      charts: {
        marksByCourse: context.marks.map((mark) => ({
          label: mark.course?.name || "Course",
          value: mark.marks
        })),
        attendanceBreakdown: [
          { label: "Present", value: context.attendanceSummary.present },
          { label: "Absent", value: context.attendanceSummary.absent },
          { label: "Leave", value: context.attendanceSummary.leave }
        ],
        assignmentsByStatus: [
          {
            label: "Pending",
            value: context.assignments.filter(
              (assignment) => assignment.status === "pending"
            ).length
          },
          {
            label: "Submitted",
            value: context.assignments.filter(
              (assignment) => assignment.status === "submitted"
            ).length
          }
        ]
      },
      sectionCourses: context.sectionCourses,
      assignments: context.assignments,
      exams: context.exams,
      leaves: context.leaves,
      notifications: context.notifications.slice(0, 8)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStudentInsights = async (req, res) => {
  try {
    const studentId = req.user._id;
    const context = await getStudentAcademicContext(studentId);
    const insights = await generateInsights({
      marks: context.marks,
      attendancePercent: context.attendancePercent
    });

    res.json({
      success: true,
      dashboard: {
        overview: {
          performance: insights.performance || "Stable",
          riskLevel: insights.riskLevel || "Medium",
          summary: insights.summary || "Insights generated successfully."
        },
        stats: {
          avgMarks: insights.avgMarks || context.averageMarks,
          attendance: insights.attendance || context.attendancePercent
        },
        subjects: {
          weak: insights.weakSubjects || [],
          strong: insights.topSubjects || []
        },
        recommendations: insights.recommendations || [],
        alerts: insights.alerts || [],
        trend:
          insights.avgMarks > 70
            ? "Improving"
            : insights.avgMarks < 40
              ? "Declining"
              : "Stable"
      },
      fallback: insights.summary?.toLowerCase().includes("fallback") || insights.summary?.toLowerCase().includes("unavailable")
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.analyzeStudentPerformance = async (req, res) => {
  try {
    const studentId = req.user._id;
    const {
      focusArea = "overall performance",
      question = ""
    } = req.body || {};

    const context = await getStudentAcademicContext(studentId);
    const analysis = await generateDetailedStudentAnalysis({
      studentName: req.user.fullName,
      enrollment: buildEnrollmentOverview(context.enrollment),
      focusArea,
      question,
      marks: context.marks,
      attendancePercent: context.attendancePercent,
      pendingAssignments: context.assignments.filter(
        (assignment) => assignment.status === "pending"
      ).length,
      submittedAssignments: context.assignments.filter(
        (assignment) => assignment.status === "submitted"
      ).length,
      sectionCourses: context.sectionCourses,
      leaveCount: context.leaves.length
    });

    res.json({
      success: true,
      analysis,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.body;

    const submission = await Submission.create({
      student: req.user._id,
      assignment: assignmentId,
      fileUrl: req.file.filename
    });

    res.status(201).json({
      success: true,
      submission
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
