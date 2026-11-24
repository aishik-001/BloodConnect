
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
        phone: "9000000001"
    },
    {
        id: 2,
        name: "Priya",
        bloodGroup: "B+",
        location: "Durgapur",
        phone: "9000000002"
    }
];

// GET: Display all donors (public demo directory)
router.get("/", (req, res) => {
    res.json({
        success: true,
        donors: donors
    });
});

// GET: Search donors by blood group and location
router.get("/search", (req, res) => {
    const { bloodGroup, location } = req.query;

    let results = donors;

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

    res.json({
        success: true,
        donors: results
    });
});

// POST: Register a new donor
router.post("/", (req, res) => {
    const { name, bloodGroup, location, phone } = req.body;

    if (!name || !bloodGroup || !location || !phone) {
        return res.status(400).json({
            success: false,
            message: "Please provide all required fields."
        });
    }

    const validBloodGroups = [
        "A+", "A-", "B+", "B-",
        "AB+", "AB-", "O+", "O-"
    ];

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
        phone: phone.trim()
    };

    donors.push(newDonor);

    res.status(201).json({
        success: true,
        message: "Donor registered successfully!",
        donor: newDonor
    });
});

// GET: Admin-only access to all donor records
router.get("/admin/all", requireAdmin, (req, res) => {
    res.json({
        success: true,
        donors: donors
    });
});

module.exports = router;
