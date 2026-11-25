
const express = require("express");
const router = express.Router();
const requireAdmin = require("../middleware/auth");

// Temporary blood requests (will be replaced with MySQL later)
let requests = [];

const validBloodGroups = [
    "A+", "A-", "B+", "B-",
    "AB+", "AB-", "O+", "O-"
];

// POST: Submit a new blood request
router.post("/", (req, res) => {

    const {
        requesterName,
        bloodGroup,
        location,
        units,
        message
    } = req.body;

    // Check required fields
    if (
        !requesterName ||
        !bloodGroup ||
        !location ||
        units === undefined
    ) {
        return res.status(400).json({
            success: false,
            message: "Please fill in all required fields."
        });
    }

    // Validate blood group
    if (!validBloodGroups.includes(bloodGroup)) {
        return res.status(400).json({
            success: false,
            message: "Invalid blood group."
        });
    }

    // Validate units
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

    // Create new request
    const newRequest = {
        id: requests.length
            ? Math.max(...requests.map(request => request.id)) + 1
            : 1,

        requesterName: String(requesterName).trim(),
        bloodGroup,
        location: String(location).trim(),
        units: unitCount,
        message: message ? String(message).trim() : "",
        status: "Pending",
        createdAt: new Date().toISOString()
    };

    requests.push(newRequest);

    res.status(201).json({
        success: true,
        message: "Blood request submitted successfully!",
        request: newRequest
    });
});

// GET: Admin-only access to all blood requests
router.get("/admin/all", requireAdmin, (req, res) => {
    res.json({
        success: true,
        requests: requests
    });
});

module.exports = router;
