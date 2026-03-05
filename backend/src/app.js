const express = require("express");
const cors = require("cors");
const userRoutes = require("./modules/users/user.routes");
const academicYearRoutes = require("./modules/academic-years/academic-year.routes");
const classRoutes = require("./modules/classes/class.routes");
const timetableRoutes = require("./modules/timetable/timetable.routes");
const attendanceRoutes = require("./modules/attendance/attendance.routes");
const { errorMiddleware, notFoundHandler } = require("./middlewares/error.middleware");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.use("/api/auth", userRoutes);
app.use("/api/academic", academicYearRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/attendance", attendanceRoutes);

app.use(notFoundHandler);
app.use(errorMiddleware);

module.exports = app;

