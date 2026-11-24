
const express = require("express");
const session = require("express-session");
const path = require("path");
require("dotenv").config();

const donorRoutes = require("./routes/donors");
const adminRoutes = require("./routes/admin");
const requireAdmin = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 5000;

// Your actual frontend folder
const frontendPath = path.join(
    __dirname,
    "..",
    "BloodConnect-Concept-2"
);

console.log("Frontend folder:", frontendPath);

// Check required environment variables
if (
    !process.env.ADMIN_USERNAME ||
    !process.env.ADMIN_PASSWORD_HASH ||
    !process.env.SESSION_SECRET
) {
    console.error("Missing admin credentials or session secret in .env");
    process.exit(1);
}

// Middleware
app.use(express.json());

app.use(session({
    name: "bloodconnect.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 2 * 60 * 60 * 1000
    }
}));

// Backend health check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "BloodConnect backend is running!"
    });
});

// Admin authentication routes
app.use("/api/admin", adminRoutes);

// Donor routes
app.use("/api/donors", donorRoutes);

// Protect admin dashboard from direct access
app.get("/admin.html", requireAdmin, (req, res) => {
    res.sendFile(path.join(frontendPath, "admin.html"));
});

// Serve frontend files
app.use(express.static(frontendPath));

// Start server
app.listen(PORT, () => {
    console.log("--------------------------------");
    console.log("BloodConnect server is running!");
    console.log(`Website: http://localhost:${PORT}`);
    console.log("--------------------------------");
});
