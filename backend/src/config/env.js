require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

module.exports = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  jwt: {
    secret: process.env.JWT_SECRET || "your-super-secret-key-change-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  paginate: {
    defaultLimit: 10,
    maxLimit: 100,
  },
};

