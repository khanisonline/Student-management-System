const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        section: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Section",
            required: true
        },
        rollNumber: {
            type: Number,
            required: true
        }
    },
    { timestamps: true }
);

// Prevent duplicate roll numbers in same section
enrollmentSchema.index({ section: 1, rollNumber: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);