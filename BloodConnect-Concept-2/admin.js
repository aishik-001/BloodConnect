
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

// Prevent HTML injection
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Load donor records
async function loadDashboard() {

    statusMessage.textContent = "Loading donor records...";
    donorTable.innerHTML = "";

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error("Please log in as admin again.");
            }

            throw new Error("Could not load donor records.");
        }

        const data = await response.json();

        allDonors = data.donors || [];

        updateStatistics();
        renderDonors();

        statusMessage.textContent =
            "Successfully connected to BloodConnect backend.";

    } catch (error) {

        statusMessage.textContent = error.message;

        console.error("Dashboard error:", error);
    }
}

// Update statistics
function updateStatistics() {

    totalDonors.textContent = allDonors.length;

    const groups = new Set(
        allDonors.map(donor => donor.bloodGroup)
    );

    const locations = new Set(
        allDonors.map(donor =>
            String(donor.location || "").toLowerCase()
        )
    );

    totalGroups.textContent = groups.size;
    totalLocations.textContent = locations.size;
}

// Render donor table
function renderDonors() {

    const search = searchInput.value.trim().toLowerCase();
    const blood = bloodFilter.value;

    const filteredDonors = allDonors.filter(donor => {

        const matchesSearch =
            String(donor.name || "").toLowerCase().includes(search) ||
            String(donor.location || "").toLowerCase().includes(search);

        const matchesBlood =
            !blood || donor.bloodGroup === blood;

        return matchesSearch && matchesBlood;
    });

    if (filteredDonors.length === 0) {

        donorTable.innerHTML = "";
        emptyMessage.hidden = false;

        return;
    }

    emptyMessage.hidden = true;

    donorTable.innerHTML = filteredDonors.map(donor => {

        const status = donor.status || "Pending";
        const statusClass = status.toLowerCase();

        let actionButtons = "";

        if (status === "Pending") {

            actionButtons = `
                <button
                    class="approve-btn"
                    data-id="${Number(donor.id)}"
                    data-status="Approved">
                    Approve
                </button>

                <button
                    class="reject-btn"
                    data-id="${Number(donor.id)}"
                    data-status="Deactivated">
                    Reject
                </button>
            `;

        } else if (status === "Approved") {

            actionButtons = `
                <button
                    class="reject-btn"
                    data-id="${Number(donor.id)}"
                    data-status="Deactivated">
                    Deactivate
                </button>
            `;

        } else if (status === "Deactivated") {

            actionButtons = `
                <button
                    class="approve-btn"
                    data-id="${Number(donor.id)}"
                    data-status="Approved">
                    Reactivate
                </button>
            `;
        }

        return `
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

                <td>
                    <span class="status-badge ${escapeHTML(statusClass)}">
                        ${escapeHTML(status)}
                    </span>
                </td>

                <td>
                    <div class="action-buttons">
                        ${actionButtons}
                    </div>
                </td>
            </tr>
        `;

    }).join("");
}

// Handle approve, reject, deactivate and reactivate
donorTable.addEventListener("click", async event => {

    const button = event.target.closest("button[data-status]");

    if (!button) return;

    const donorId = button.dataset.id;
    const newStatus = button.dataset.status;

    const actionName = newStatus === "Approved"
        ? "approve/reactivate"
        : "deactivate";

    const confirmed = confirm(
        `Are you sure you want to ${actionName} this donor?`
    );

    if (!confirmed) return;

    button.disabled = true;
    statusMessage.textContent = "Updating donor status...";

    try {

        const response = await fetch(
            `/api/donors/admin/${donorId}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: newStatus
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to update donor."
            );
        }

        await loadDashboard();

        statusMessage.textContent = result.message;

    } catch (error) {

        statusMessage.textContent = error.message;

        console.error("Donor update error:", error);

        button.disabled = false;
    }
});

// Search and filter
searchInput.addEventListener("input", renderDonors);
bloodFilter.addEventListener("change", renderDonors);

// Refresh dashboard
refreshBtn.addEventListener("click", loadDashboard);

// Load dashboard when page opens
loadDashboard();
// Admin logout
const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", async () => {
    try {
        const response = await fetch("/api/admin/logout", {
            method: "POST",
            credentials: "same-origin"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Logout failed.");
        }

        window.location.replace("/admin-login.html");

    } catch (error) {
        alert(error.message);
    }
});
