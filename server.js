const express = require("express");
require("express-async-errors"); // lets async route handlers throw and reach the error middleware instead of crashing the process
const path = require("path");
const fs = require("fs");
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const morgan = require("morgan");

const config = require("./config");
const { sequelize } = require("./models");
const { loadUser } = require("./middleware/auth");

const app = express();

// --- View engine ---
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// --- Core middleware ---
app.use(morgan(config.nodeEnv === "development" ? "dev" : "combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

fs.mkdirSync(config.uploadFolder, { recursive: true });
app.use("/uploads", express.static(config.uploadFolder));

// --- Sessions (persisted in the same database so logins survive restarts) ---
const sessionStore = new SequelizeStore({ db: sequelize, tableName: "sessions" });
app.use(session({
  secret: config.sessionSecret,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 },
}));

app.use(loadUser);
app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});

// --- API routes ---
app.use("/api/auth", require("./routes/auth"));
app.use("/api/listings", require("./routes/listings"));
app.use("/api/wishlist", require("./routes/wishlist"));
app.use("/api", require("./routes/chat"));
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/events", require("./routes/events"));
app.use("/api/errands", require("./routes/errands"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/admin", require("./routes/admin"));

// --- Server-rendered pages ---
app.use("/", require("./routes/pages"));

// --- 404 ---
app.use((req, res) => {
  if (req.originalUrl.startsWith("/api/")) return res.status(404).json({ error: "Not found" });
  res.status(404).render("errors/404");
});

// --- Friendly error handler (no raw stack traces to normal users) ---
app.use((err, req, res, next) => {
  console.error(err); // full detail stays in the server log for debugging
  const status = err.status || (err.message && err.message.includes("Unsupported file type") ? 400 : 500);
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(status).json({ error: status === 400 ? err.message : "Something went wrong. Please try again." });
  }
  res.status(status).render(status === 403 ? "errors/403" : "errors/500");
});

async function start() {
  sessionStore.sync(); // creates the sessions table if needed
  await sequelize.sync(); // creates all model tables if they don't exist yet
  app.listen(config.port, () => {
    console.log(`Campus Connect running at http://localhost:${config.port}`);
    console.log(`Database dialect: ${config.dbDialect}`);
    console.log(`Demo mode: ${config.demoMode}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = app;
