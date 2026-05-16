const Section = require("../section/section.model");
const Enrollment = require("../enrollment/enrollment.model");
const Attendance = require("../attendance/attendance.model");
const Course = require("../course/course.model");
const Marks = require("../marks/marks.model");
const Assignment = require("../assignment/assignment.model");

async function getAccessibleSections(userId) {
  const taughtCourses = await Course.find({ teacher: userId }).select("section");
  const taughtSectionIds = [...new Set(taughtCourses.map((course) => String(course.section)).filter(Boolean))];

  return Section.find({
    $or: [
      { classTeacher: userId },
      { _id: { $in: taughtSectionIds } }
    ]
  })
    .populate("department", "name")
    .sort({ semester: 1, name: 1 });
}

async function teacherCanAccessSection(userId, sectionId) {
  const section = await Section.findOne({
    _id: sectionId,
    classTeacher: userId
  }).select("_id");

  if (section) {
    return true;
  }

  const course = await Course.findOne({
    section: sectionId,
    teacher: userId
  }).select("_id");

  return Boolean(course);
}

exports.getTeacherDashboard = async (req, res) => {
  try {
    const sections = await getAccessibleSections(req.user._id);
    const sectionIds = sections.map((section) => section._id);

    const [courses, assignments, attendanceSessions, enrollments] = await Promise.all([
      Course.find({ teacher: req.user._id }).populate("section", "name semester"),
      Assignment.find({ createdBy: req.user._id }).populate("section", "name"),
      Attendance.find({ section: { $in: sectionIds } }),
      Enrollment.find({ section: { $in: sectionIds } })
    ]);

    const sectionStats = sections.map((section) => ({
      id: section._id,
      label: section.name,
      department: section.department?.name,
      semester: section.semester,
      value: enrollments.filter(
        (entry) => entry.section.toString() === section._id.toString()
      ).length
    }));

    res.status(200).json({
      success: true,
      summary: {
        sections: sections.length,
        courses: courses.length,
        assignments: assignments.length,
        students: enrollments.length,
        attendanceSessions: attendanceSessions.length
      },
      sectionStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMySections = async (req, res) => {
  try {
    const sections = await getAccessibleSections(req.user._id);

    res.status(200).json({
      success: true,
      sections
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({
      teacher: req.user._id
    })
      .populate("section", "name semester")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      courses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStudentsInSection = async (req, res) => {
  try {
    const { id } = req.params;
    const hasAccess = await teacherCanAccessSection(req.user._id, id);

    if (!hasAccess) {
      return res.status(403).json({
        message: "Access denied to this section"
      });
    }

    const enrollments = await Enrollment.find({ section: id })
      .populate("student", "fullName email")
      .sort({ rollNumber: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      students: enrollments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { sectionId, courseId, records } = req.body;

    const course = await Course.findOne({
      _id: courseId,
      teacher: req.user._id,
      section: sectionId
    });

    if (!course) {
      return res.status(403).json({
        message: "Not allowed for this course"
      });
    }

    const sanitizedRecords = records.map((record) => ({
      ...record,
      status: record.status === "late" ? "present" : record.status
    }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const exists = await Attendance.findOne({
      section: sectionId,
      course: courseId,
      date: today
    });

    if (exists) {
      return res.status(400).json({
        message: "Attendance already marked for today"
      });
    }

    const attendance = await Attendance.create({
      section: sectionId,
      course: courseId,
      date: today,
      records: sanitizedRecords
    });

    res.status(201).json({
      success: true,
      attendance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const { sectionId, courseId } = req.params;

    const course = await Course.findOne({
      _id: courseId,
      teacher: req.user._id,
      section: sectionId
    });

    if (!course) {
      return res.status(403).json({
        message: "Not allowed for this course"
      });
    }

    const attendance = await Attendance.find({
      section: sectionId,
      course: courseId
    })
      .populate("records.student", "fullName")
      .populate("course", "name");

    res.status(200).json({
      success: true,
      attendance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addMarks = async (req, res) => {
  try {
    const { studentId, courseId, examType, marks, remarks } = req.body;

    const course = await Course.findOne({
      _id: courseId,
      teacher: req.user._id
    });

    if (!course) {
      return res.status(403).json({
        message: "Not allowed for this course"
      });
    }

    const newMarks = await Marks.create({
      student: studentId,
      course: courseId,
      examType,
      marks,
      teacher: req.user._id,
      remarks
    });

    res.status(201).json({
      success: true,
      newMarks
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateMarks = async (req, res) => {
  try {
    const mark = await Marks.findById(req.params.id);

    if (!mark) {
      return res.status(404).json({
        message: "Marks not found"
      });
    }

    if (mark.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Not allowed to update this record"
      });
    }

    Object.assign(mark, req.body);
    await mark.save();

    res.status(200).json({
      success: true,
      mark
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMarks = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findOne({
      _id: courseId,
      teacher: req.user._id
    });

    if (!course) {
      return res.status(403).json({
        message: "Not allowed for this course"
      });
    }

    const marks = await Marks.find({ course: courseId })
      .populate("student", "fullName")
      .populate("course", "name");

    res.status(200).json({
      success: true,
      marks
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createAssignment = async (req, res) => {
  try {
    const { title, sectionId, dueDate, totalMarks } = req.body;
    const hasAccess = await teacherCanAccessSection(req.user._id, sectionId);

    if (!hasAccess) {
      return res.status(403).json({
        message: "Not allowed for this section"
      });
    }

    const assignment = await Assignment.create({
      title,
      section: sectionId,
      dueDate,
      totalMarks,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      assignment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      createdBy: req.user._id
    }).populate("section", "name");

    res.status(200).json({
      success: true,
      assignments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
