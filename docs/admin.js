
const API_URL = "/api/donors/admin/all";
const REQUEST_API_URL = "/api/requests/admin/all";

const donorTable = document.getElementById("donorTable");
const totalDonors = document.getElementById("totalDonors");
const totalGroups = document.getElementById("totalGroups");
const totalLocations = document.getElementById("totalLocations");

const searchInput = document.getElementById("searchInput");
const bloodFilter = document.getElementById("bloodFilter");

const statusMessage = document.getElementById("statusMessage");
const emptyMessage = document.getElementById("emptyMessage");
const refreshBtn = document.getElementById("refreshBtn");

const requestTable = document.getElementById("requestTable");
const requestStatus = document.getElementById("requestStatus");
const requestEmptyMessage = document.getElementById("requestEmptyMessage");

let allDonors = [];
let allRequests = [];

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

// Load dashboard data
async function loadDashboard() {
    statusMessage.textContent = "Loading donor records...";
    donorTable.innerHTML = "";

    requestStatus.textContent = "Loading blood requests...";
    requestTable.innerHTML = "";

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Could not load donor records. Please log in again.");
        }

        const data = await response.json();

        allDonors = data.donors || [];

        updateStatistics();
        renderDonors();

        statusMessage.textContent =
            "Successfully connected to BloodConnect backend.";

    } catch (error) {
        statusMessage.textContent = error.message;
        console.error("Donor dashboard error:", error);
    }

    // Load blood requests separately
    await loadRequests();
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

// Load blood requests from MySQL
async function loadRequests() {
    requestStatus.textContent = "Loading blood requests...";

    try {
        const response = await fetch(REQUEST_API_URL);

        if (!response.ok) {
            throw new Error("Could not load blood requests.");
        }

        const data = await response.json();

        allRequests = data.requests || [];

        renderRequests();

        requestStatus.textContent =
            "Successfully loaded blood requests from MySQL.";

    } catch (error) {
        requestStatus.textContent = error.message;
        console.error("Blood request error:", error);
    }
}

// Render blood requests
function renderRequests() {
    if (allRequests.length === 0) {
        requestTable.innerHTML = "";
        requestEmptyMessage.hidden = false;
        return;
    }

    requestEmptyMessage.hidden = true;

    requestTable.innerHTML = allRequests.map(request => {
        const status = request.status || "Pending";

        const date = request.createdAt
            ? new Date(request.createdAt).toLocaleString()
            : "Not available";

        return `
            <tr>
                <td>${escapeHTML(request.requesterName)}</td>

                <td>
                    <span class="blood-badge">
                        ${escapeHTML(request.bloodGroup)}
                    </span>
                </td>

                <td>${escapeHTML(request.location)}</td>

                <td>${escapeHTML(request.units)}</td>

                <td>${escapeHTML(request.message || "No message")}</td>

                <td>
                    <span class="status-badge ${escapeHTML(status.toLowerCase())}">
                        ${escapeHTML(status)}
                    </span>
                </td>

                <td>${escapeHTML(date)}</td>
            </tr>
        `;
    }).join("");
}

// Handle donor approval and deactivation
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
            throw new Error(result.message || "Unable to update donor.");
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

// Load dashboard when page opens
loadDashboard();
