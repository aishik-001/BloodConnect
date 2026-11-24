
const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const requireAdmin = require("../middleware/auth");

// Admin login
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Enter username and password."
            });
        }

        const validUsername =
            username === process.env.ADMIN_USERNAME;

        const validPassword = await bcrypt.compare(
            password,
            process.env.ADMIN_PASSWORD_HASH || ""
        );

        if (!validUsername || !validPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });
        }

        req.session.isAdmin = true;

        req.session.save((error) => {
            if (error) {
                return res.status(500).json({
                    success: false,
                    message: "Could not create login session."
                });
            }

            res.json({
                success: true,
                message: "Login successful."
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error during login."
        });
    }
});

// Check whether admin is logged in
router.get("/me", requireAdmin, (req, res) => {
    res.json({ success: true, isAdmin: true });
});

// Admin logout
router.post("/logout", requireAdmin, (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Logout failed."
            });
        }

        res.clearCookie("bloodconnect.sid");
        res.json({
            success: true,
            message: "Logged out successfully."
        });
    });
});

module.exports = router;
