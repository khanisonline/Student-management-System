const mongoose = require("mongoose");

const marksSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course"
        },
        examType: {
            type: String,
            enum: ["quiz", "midterm", "final", "project"]
        },
        marks: {
            type: Number,
            required: true
        },
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        remarks: {
            type: String
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Marks", marksSchema);