
const express = require("express");
const router = express.Router();
const requireAdmin = require("../middleware/auth");
const db = require("../config/db");

const validBloodGroups = [
    "A+", "A-", "B+", "B-",
    "AB+", "AB-", "O+", "O-"
];

// GET: Display approved donors only
router.get("/", async (req, res) => {
    try {
        const [donors] = await db.execute(
            `SELECT id, name, bloodGroup, location, status
             FROM donors
             WHERE status = 'Approved'`
        );

        res.json({ success: true, donors });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Could not fetch donors."
        });
    }
});

// GET: Search approved donors
router.get("/search", async (req, res) => {
    try {
        const { bloodGroup, location } = req.query;

        let sql = `
            SELECT id, name, bloodGroup, location, status
            FROM donors
            WHERE status = 'Approved'
        `;

        const values = [];

        if (bloodGroup) {
            sql += " AND LOWER(bloodGroup) = LOWER(?)";
            values.push(bloodGroup);
        }

        if (location) {
            sql += " AND LOWER(location) LIKE LOWER(?)";
            values.push(`%${location}%`);
        }

        const [results] = await db.execute(sql, values);

        res.json({ success: true, donors: results });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Could not search donors."
        });
    }
});

// POST: Register a new donor
router.post("/", async (req, res) => {
    try {
        const { name, bloodGroup, location, phone } = req.body;

        if (
            typeof name !== "string" ||
            typeof location !== "string" ||
            typeof phone !== "string" ||
            !name.trim() ||
            !location.trim() ||
            !phone.trim() ||
            !bloodGroup
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields."
            });
        }

        if (!validBloodGroups.includes(bloodGroup)) {
            return res.status(400).json({
                success: false,
                message: "Invalid blood group."
            });
        }

        const [result] = await db.execute(
            `INSERT INTO donors
             (name, bloodGroup, location, phone, status)
             VALUES (?, ?, ?, ?, 'Pending')`,
            [
                name.trim(),
                bloodGroup,
                location.trim(),
                phone.trim()
            ]
        );

        res.status(201).json({
            success: true,
            message: "Donor registration submitted for admin approval!",
            donor: {
                id: result.insertId,
                name: name.trim(),
                bloodGroup,
                location: location.trim(),
                status: "Pending"
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Could not register donor."
        });
    }
});

// GET: Admin-only access to all donors
router.get("/admin/all", requireAdmin, async (req, res) => {
    try {
        const [donors] = await db.execute(
            "SELECT * FROM donors ORDER BY id DESC"
        );

        res.json({ success: true, donors });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Could not fetch donor records."
        });
    }
});

// PATCH: Admin approves or deactivates a donor
router.patch("/admin/:id/status", requireAdmin, async (req, res) => {
    try {
        const donorId = Number(req.params.id);
        const { status } = req.body;

        if (!Number.isInteger(donorId) || donorId < 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid donor ID."
            });
        }

        if (!["Approved", "Deactivated"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid donor status."
            });
        }

        const [result] = await db.execute(
            "UPDATE donors SET status = ? WHERE id = ?",
            [status, donorId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Donor not found."
            });
        }

        const [rows] = await db.execute(
            "SELECT * FROM donors WHERE id = ?",
            [donorId]
        );

        res.json({
            success: true,
            message: `Donor ${status.toLowerCase()} successfully!`,
            donor: rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Could not update donor status."
        });
    }
});

module.exports = router;
