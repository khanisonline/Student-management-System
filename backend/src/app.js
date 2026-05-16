const express = require("express");
const cors = require("cors");
const path=require("path");

const app = express();

const _dirname=path.resolve();




app.use(cors({
  origin:"https://student-management-system-q78d.onrender.com",
  credentials: true
}));

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok"
  });
});

const authRoutes = require("./modules/auth/auth.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const teacherRoutes = require("./modules/teacher/teacher.routes");
const studentRoutes = require("./modules/student/student.routes");
const examRoutes = require("./modules/exam/exam.routes");
const aiRoutes = require("./modules/ai/ai.routes");
const assignmentRoutes = require("./modules/assignment/assignment.routes");
const notificationRoutes = require("./modules/notification/notification.routes");
const studentRequestRoutes = require("./modules/studentRequest/studentRequest.routes");
const enrollmentRoutes = require("./modules/enrollment/enrollment.routes");

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/ai", aiRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/assignments", assignmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/student-requests", studentRequestRoutes);
app.use("/api/enrollment", enrollmentRoutes);


 if(process.env.NODE_ENV ==="production"){
  app.use(express.static (path.join(_dirname, "../frontend/dist")));
 }

  app.use ((req,res)=>{
     res.sendFile(path.join(_dirname,"../frontend/dist/index.html"));
  });

module.exports = app;
