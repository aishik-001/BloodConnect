
const express = require("express");
const router = express.Router();
const requireAdmin = require("../middleware/auth");
const db = require("../config/db");

const validBloodGroups = [
    "A+", "A-", "B+", "B-",
    "AB+", "AB-", "O+", "O-"
];

// POST: Submit a new blood request
router.post("/", async (req, res) => {
    try {
        const {
            requesterName,
            bloodGroup,
            location,
            units,
            message
        } = req.body;

        if (
            typeof requesterName !== "string" ||
            typeof location !== "string" ||
            !requesterName.trim() ||
            !location.trim() ||
            !bloodGroup ||
            units === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all required fields."
            });
        }

        if (!validBloodGroups.includes(bloodGroup)) {
            return res.status(400).json({
                success: false,
                message: "Invalid blood group."
            });
        }

        const unitCount = Number(units);

        if (
            !Number.isInteger(unitCount) ||
            unitCount < 1 ||
            unitCount > 20
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid number of units (1–20)."
            });
        }

        const cleanMessage =
            typeof message === "string" ? message.trim() : "";

        const [result] = await db.execute(
            `INSERT INTO blood_requests
            (requesterName, bloodGroup, location, units, message, status)
            VALUES (?, ?, ?, ?, ?, 'Pending')`,
            [
                requesterName.trim(),
                bloodGroup,
                location.trim(),
                unitCount,
                cleanMessage
            ]
        );

        const [rows] = await db.execute(
            "SELECT * FROM blood_requests WHERE id = ?",
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: "Blood request submitted successfully!",
            request: rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Could not submit blood request."
        });
    }
});

// GET: Admin-only access to all blood requests
router.get("/admin/all", requireAdmin, async (req, res) => {
    try {
        const [requests] = await db.execute(
            "SELECT * FROM blood_requests ORDER BY id DESC"
        );

        res.json({
            success: true,
            requests
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Could not fetch blood requests."
        });
    }
});

module.exports = router;
