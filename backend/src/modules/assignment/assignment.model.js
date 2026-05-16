const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        section: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Section"
        },
        dueDate: {
            type: Date
        },
        totalMarks: {
            type: Number
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { timestamps: true }
);




module.exports = mongoose.model("Assignment", assignmentSchema);

