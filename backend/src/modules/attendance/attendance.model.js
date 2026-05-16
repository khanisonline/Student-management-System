const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
    {
        section: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Section"
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course"
        },
        date: {
            type: Date,
            required: true
        },
        records: [
            {
                student: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                },
                status: {
                    type: String,
                    enum: ["present", "absent", "leave"],
                    required: true
                }
            }
        ]
    },
    { timestamps: true }
);

// Prevent duplicate attendance per day
attendanceSchema.index({ section: 1, course: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);