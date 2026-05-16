const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    section: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
    date: Date,
    time: String,
    type: {
        type: String,
        enum: ["midterm", "final", "quiz"]
    },
    venue: String
});

module.exports = mongoose.model("Exam", examSchema);