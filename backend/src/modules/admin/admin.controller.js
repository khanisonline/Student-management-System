const User = require("../auth/auth.model");
const Department = require("../department/department.model");
const Section = require("../section/section.model");
const Course = require("../course/course.model");
const Enrollment = require("../enrollment/enrollment.model");
const Leave = require("../leave/leave.model");
const Exam = require("../exam/exam.model");
const Assignment = require("../assignment/assignment.model");
const StudentRequest = require("../studentRequest/studentRequest.model");

exports.getAdminDashboard = async (req, res) => {
    try {
        const [
            users,
            departments,
            sections,
            courses,
            exams,
            assignments,
            enrollments,
            pendingRequests,
            pendingLeaves
        ] = await Promise.all([
            User.find().select("-password"),
            Department.find(),
            Section.find(),
            Course.find(),
            Exam.countDocuments(),
            Assignment.countDocuments(),
            Enrollment.find(),
            StudentRequest.countDocuments({ status: "pending" }),
            Leave.countDocuments({ status: "pending" })
        ]);

        const userBreakdown = {
            admin: users.filter((user) => user.role === "admin").length,
            teacher: users.filter((user) => user.role === "teacher").length,
            student: users.filter((user) => user.role === "student").length
        };

        const sectionEnrollment = sections.map((section) => ({
            id: section._id,
            label: section.name,
            semester: section.semester,
            value: enrollments.filter(
                (entry) => entry.section.toString() === section._id.toString()
            ).length
        }));

        res.status(200).json({
            success: true,
            summary: {
                totalUsers: users.length,
                departments: departments.length,
                sections: sections.length,
                courses: courses.length,
                exams,
                assignments,
                pendingRequests,
                pendingLeaves
            },
            charts: {
                userBreakdown,
                sectionEnrollment
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;

        if (!["teacher", "student"].includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = await User.create({ fullName, email, password, role });

        res.status(201).json({ success: true, user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getDepartments = async (req, res) => {
    try {
        const departments = await Department.find()
            .populate("teachers", "fullName email role")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            departments
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createDepartment = async (req, res) => {
    try {
        const { name } = req.body;
        const dept = await Department.create({ name });

        res.status(201).json({ success: true, dept });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.assignTeacherToDepartment = async (req, res) => {
    try {
        const { departmentId, teacherId } = req.body;

        const dept = await Department.findById(departmentId);
        if (!dept) return res.status(404).json({ message: "Department not found" });

        if (!dept.teachers.includes(teacherId)) {
            dept.teachers.push(teacherId);
            await dept.save();
        }

        res.status(200).json({ success: true, dept });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getSections = async (req, res) => {
    try {
        const sections = await Section.find()
            .populate("department", "name")
            .populate("classTeacher", "fullName email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            sections
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createSection = async (req, res) => {
    try {
        const { name, semester, department } = req.body;
        const section = await Section.create({ name, semester, department });

        res.status(201).json({ success: true, section });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.assignTeacherToSection = async (req, res) => {
    try {
        const { sectionId, teacherId } = req.body;

        const section = await Section.findByIdAndUpdate(
            sectionId,
            { classTeacher: teacherId },
            { returnDocument: "after" }
        );

        res.status(200).json({ success: true, section });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.assignStudentToSection = async (req, res) => {
    try {
        const { studentId, sectionId, rollNumber } = req.body;

        const existing = await Enrollment.findOne({ student: studentId });
        if (existing) {
            return res.status(400).json({
                message: "Student already assigned to a section"
            });
        }

        const enrollment = await Enrollment.create({
            student: studentId,
            section: sectionId,
            rollNumber
        });

        res.status(201).json({ success: true, enrollment });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getCourses = async (req, res) => {
    try {
        const courses = await Course.find()
            .populate("section", "name semester")
            .populate("teacher", "fullName email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            courses
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createCourse = async (req, res) => {
    try {
        const { name, creditHours, section, teacher } = req.body;

        const course = await Course.create({
            name,
            creditHours,
            section,
            teacher
        });

        res.status(201).json({ success: true, course });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;
        const filter = role ? { role } : {};
        const users = await User.find(filter).select("-password");

        res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const updates = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { returnDocument: "after" }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User ${user.isActive ? "activated" : "deactivated"}`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllLeaves = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};

        const leaves = await Leave.find(filter)
            .populate("student", "fullName email")
            .populate("reviewedBy", "fullName")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            leaves
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getExams = async (req, res) => {
    try {
        const exams = await Exam.find()
            .populate("course", "name")
            .populate("section", "name semester")
            .sort({ date: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            exams
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.reviewLeave = async (req, res) => {
    try {
        const { status, note } = req.body;

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({
                message: "Invalid status"
            });
        }

        const leave = await Leave.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({
                message: "Leave not found"
            });
        }

        leave.status = status;
        leave.reviewedBy = req.user._id;
        leave.note = note;
        await leave.save();

        res.status(200).json({
            success: true,
            leave
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
