const Marks = require("../marks/marks.model");
const Attendance = require("../attendance/attendance.model");
const { generateInsights } = require("./groq.service");

exports.getAIInsights = async (req, res) => {
  try {
    const studentId = req.user._id;

    // 📊 Get marks
    const marks = await Marks.find({ student: studentId })
      .populate("course", "name");

    // 📊 Calculate attendance %
    const attendanceRecords = await Attendance.find({
      "records.student": studentId
    });

    let total = 0, present = 0;

    attendanceRecords.forEach(a => {
      a.records.forEach(r => {
        if (r.student.toString() === studentId.toString()) {
          total++;
          if (r.status === "present") present++;
        }
      });
    });

    const attendancePercent = total ? (present / total) * 100 : 0;

    // 🤖 Call AI
    const insights = await generateInsights({
      marks,
      attendancePercent
    });

    // 📈 Trend logic
    let trend = "Stable";
    if (insights.avgMarks > 70) trend = "Improving";
    else if (insights.avgMarks < 40) trend = "Declining";

    // 🧱 Dashboard structure
    const dashboard = {
      overview: {
        performance: insights.performance || "Unknown",
        riskLevel: insights.riskLevel || "Unknown",
        summary: insights.summary || "No summary available"
      },

      stats: {
        avgMarks: insights.avgMarks || 0,
        attendance: insights.attendance || attendancePercent
      },

      subjects: {
        weak: insights.weakSubjects || [],
        strong: insights.topSubjects || []
      },

      recommendations: insights.recommendations || [],
      alerts: insights.alerts || [],
      trend
    };

    res.json({
      success: true,
      dashboard
    });

  } catch (error) {
    console.error("AI Controller Error:", error.message);

    res.status(500).json({
      success: false,
      message: "AI service failed",
      fallback: {
        performance: "Unknown",
        riskLevel: "Unknown",
        summary: "Unable to generate insights"
      }
    });
  }
};