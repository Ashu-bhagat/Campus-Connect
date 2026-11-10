require("dotenv").config();
const path = require("path");

function toBool(v, fallback = false) {
  if (v === undefined || v === null || v === "") return fallback;
  return String(v).trim().toLowerCase() === "true" || v === "1";
}

module.exports = {
  port: process.env.PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
  nodeEnv: process.env.NODE_ENV || "development",

  dbDialect: process.env.DB_DIALECT || "sqlite",
  dbStorage: process.env.DB_STORAGE === ":memory:"
    ? ":memory:"
    : path.resolve(process.cwd(), process.env.DB_STORAGE || "./data/campus_connect.sqlite"),
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: process.env.DB_PORT || 3306,
  dbName: process.env.DB_NAME || "campus_connect",
  dbUser: process.env.DB_USER || "root",
  dbPassword: process.env.DB_PASSWORD || "",

  universityEmailDomain: (process.env.UNIVERSITY_EMAIL_DOMAIN || "cuk.ac.in").toLowerCase(),

  demoMode: toBool(process.env.DEMO_MODE, true),
  demoOtpCode: process.env.DEMO_OTP_CODE || "123456",

  uploadFolder: path.resolve(process.cwd(), process.env.UPLOAD_FOLDER || "./uploads"),
  maxUploadBytes: (parseInt(process.env.MAX_UPLOAD_MB, 10) || 8) * 1024 * 1024,
  allowedImageExt: new Set(["jpg", "jpeg", "png", "webp"]),

  listingsPerPage: 12,
};
