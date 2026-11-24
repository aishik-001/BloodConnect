
const API_URL = "/api/donors/admin/all";

const donorTable = document.getElementById("donorTable");
const totalDonors = document.getElementById("totalDonors");
const totalGroups = document.getElementById("totalGroups");
const totalLocations = document.getElementById("totalLocations");

const searchInput = document.getElementById("searchInput");
const bloodFilter = document.getElementById("bloodFilter");

const statusMessage = document.getElementById("statusMessage");
const emptyMessage = document.getElementById("emptyMessage");
const refreshBtn = document.getElementById("refreshBtn");

let allDonors = [];

// Prevent HTML injection when displaying donor data
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Load donor records from backend
async function loadDashboard() {

    statusMessage.textContent = "Loading donor records...";
    donorTable.innerHTML = "";

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Could not load donor records.");
        }

        const data = await response.json();

        allDonors = data.donors || [];

        updateStatistics();
        renderDonors();

        statusMessage.textContent =
            "Successfully connected to BloodConnect backend.";

    } catch (error) {

        statusMessage.textContent =
            "Backend connection failed. Please start your server.";

        console.error(error);
    }
}

// Update dashboard statistics
function updateStatistics() {

    totalDonors.textContent = allDonors.length;

    const groups = new Set(
        allDonors.map(donor => donor.bloodGroup)
    );

    const locations = new Set(
        allDonors.map(donor => donor.location.toLowerCase())
    );

    totalGroups.textContent = groups.size;
    totalLocations.textContent = locations.size;
}

// Display donor table
function renderDonors() {

    const search = searchInput.value.trim().toLowerCase();
    const blood = bloodFilter.value;

    const filteredDonors = allDonors.filter(donor => {

        const matchesSearch =
            donor.name.toLowerCase().includes(search) ||
            donor.location.toLowerCase().includes(search);

        const matchesBlood =
            !blood || donor.bloodGroup === blood;

        return matchesSearch && matchesBlood;
    });

    donorTable.innerHTML = filteredDonors.map(donor => `

        <tr>
            <td>
                <span class="donor-name">
                    ${escapeHTML(donor.name)}
                </span>
            </td>

            <td>
                <span class="blood-badge">
                    ${escapeHTML(donor.bloodGroup)}
                </span>
            </td>

            <td>${escapeHTML(donor.location)}</td>

            <td>${escapeHTML(donor.phone)}</td>
        </tr>

    `).join("");

    emptyMessage.hidden = filteredDonors.length !== 0;
}

// Search and filter events
searchInput.addEventListener("input", renderDonors);
bloodFilter.addEventListener("change", renderDonors);

// Refresh dashboard
refreshBtn.addEventListener("click", loadDashboard);

// Load dashboard on page opening
loadDashboard();
