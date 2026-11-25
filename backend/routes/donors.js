
const express = require("express");
const router = express.Router();
const requireAdmin = require("../middleware/auth");

// Temporary donor records (will be replaced with MySQL later)
let donors = [
    {
        id: 1,
        name: "Rahul",
        bloodGroup: "O+",
        location: "Kolkata",
        phone: "9000000001",
        status: "Approved"
    },
    {
        id: 2,
        name: "Priya",
        bloodGroup: "B+",
        location: "Durgapur",
        phone: "9000000002",
        status: "Approved"
    }
];

const validBloodGroups = [
    "A+", "A-", "B+", "B-",
    "AB+", "AB-", "O+", "O-"
];

// GET: Display approved donors only
router.get("/", (req, res) => {
    const approvedDonors = donors
        .filter(donor => donor.status === "Approved")
        .map(({ phone, ...donor }) => donor);

    res.json({
        success: true,
        donors: approvedDonors
    });
});

// GET: Search approved donors
router.get("/search", (req, res) => {
    const { bloodGroup, location } = req.query;

    let results = donors.filter(
        donor => donor.status === "Approved"
    );

    if (bloodGroup) {
        results = results.filter(donor =>
            donor.bloodGroup.toLowerCase() ===
            bloodGroup.toLowerCase()
        );
    }

    if (location) {
        results = results.filter(donor =>
            donor.location.toLowerCase().includes(
                location.toLowerCase()
            )
        );
    }

    results = results.map(({ phone, ...donor }) => donor);

    res.json({
        success: true,
        donors: results
    });
});

// POST: Register a new donor (Pending approval)
router.post("/", (req, res) => {
    const { name, bloodGroup, location, phone } = req.body;

    if (!name || !bloodGroup || !location || !phone) {
        return res.status(400).json({
            success: false,
            message: "Please provide all required fields."
        });
    }

    if (
        typeof name !== "string" ||
        typeof location !== "string" ||
        typeof phone !== "string" ||
        !name.trim() ||
        !location.trim() ||
        !phone.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "Please enter valid donor details."
        });
    }

    if (!validBloodGroups.includes(bloodGroup)) {
        return res.status(400).json({
            success: false,
            message: "Invalid blood group."
        });
    }

    const newDonor = {
        id: donors.length
            ? Math.max(...donors.map(donor => donor.id)) + 1
            : 1,
        name: name.trim(),
        bloodGroup,
        location: location.trim(),
        phone: phone.trim(),
        status: "Pending"
    };

    donors.push(newDonor);

    res.status(201).json({
        success: true,
        message: "Donor registration submitted for admin approval!",
        donor: {
            id: newDonor.id,
            name: newDonor.name,
            bloodGroup: newDonor.bloodGroup,
            location: newDonor.location,
            status: newDonor.status
        }
    });
});

// GET: Admin-only access to all donor records
router.get("/admin/all", requireAdmin, (req, res) => {
    res.json({
        success: true,
        donors: donors
    });
});

// PATCH: Admin approves or deactivates a donor
router.patch("/admin/:id/status", requireAdmin, (req, res) => {
    const donorId = Number(req.params.id);
    const { status } = req.body;

    if (!["Approved", "Deactivated"].includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid donor status."
        });
    }

    const donor = donors.find(item => item.id === donorId);

    if (!donor) {
        return res.status(404).json({
            success: false,
            message: "Donor not found."
        });
    }

    donor.status = status;

    res.json({
        success: true,
        message: `Donor ${status.toLowerCase()} successfully!`,
        donor: donor
    });
});

module.exports = router;
