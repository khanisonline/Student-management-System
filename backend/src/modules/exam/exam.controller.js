const Exam = require("./exam.model");

// CREATE EXAM
exports.createExam = async (req, res) => {
  try {
    const { course, section, date, time, type, venue } = req.body;

    const exam = await Exam.create({
      course,
      section,
      date,
      time,
      type,
      venue
    });

    res.status(201).json({
      success: true,
      exam
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};