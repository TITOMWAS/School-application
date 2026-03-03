const express = require("express");
const cors = require("cors");
const userRoutes = require("./modules/users/user.routes");
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

app.use(notFoundHandler);
app.use(errorMiddleware);

module.exports = app;

