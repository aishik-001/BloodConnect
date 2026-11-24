
const API_URL = "http://localhost:5000/api";

// Get HTML elements
const grid = document.getElementById("donorGrid");
const count = document.getElementById("resultCount");
const empty = document.getElementById("emptyState");

const bloodFilter = document.getElementById("bloodFilter");
const locationFilter = document.getElementById("locationFilter");
const searchBtn = document.getElementById("searchBtn");

const donorForm = document.getElementById("donorForm");
const formMessage = document.getElementById("formMessage");

// Generate initials from donor name
function getInitials(name) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(word => word[0])
        .join("")
        .toUpperCase();
}

// Display donors on the website
function displayDonors(donors) {

    if (!donors || donors.length === 0) {
        grid.innerHTML = "";
        count.textContent = "0 donors found";
        empty.hidden = false;
        return;
    }

    empty.hidden = true;

    grid.innerHTML = donors.map(donor => {

        const initials = getInitials(donor.name);

        return `
            <article class="donor-card">

                <div class="donor-head">
                    <div class="donor-avatar">
                        ${initials}
                    </div>

                    <span class="blood-pill">
                        ${donor.bloodGroup}
                    </span>
                </div>

                <h3>${donor.name}</h3>

                <p class="place">
                    ${donor.location}
                </p>

                <div class="donor-meta">
                    <span>● Listed donor</span>
                    <span>BloodConnect</span>
                </div>

            </article>
        `;

    }).join("");

    count.textContent =
        `${donors.length} donor${donors.length === 1 ? "" : "s"} found`;
}

// Fetch donors from backend
async function loadDonors() {

    try {

        grid.innerHTML = "<p>Loading donors...</p>";

        const response = await fetch(`${API_URL}/donors`);

        if (!response.ok) {
            throw new Error("Unable to load donors.");
        }

        const data = await response.json();

        displayDonors(data.donors);

    } catch (error) {

        grid.innerHTML = "";

        count.textContent = "Connection failed";

        empty.hidden = false;
        empty.textContent =
            "Cannot connect to the backend. Please start your server.";

        console.error("Donor loading error:", error);
    }
}

// Search donors
async function searchDonors() {

    const bloodGroup = bloodFilter.value;
    const location = locationFilter.value.trim();

    const params = new URLSearchParams();

    if (bloodGroup) {
        params.append("bloodGroup", bloodGroup);
    }

    if (location) {
        params.append("location", location);
    }

    try {

        grid.innerHTML = "<p>Searching donors...</p>";

        const response = await fetch(
            `${API_URL}/donors/search?${params.toString()}`
        );

        if (!response.ok) {
            throw new Error("Search failed.");
        }

        const data = await response.json();

        displayDonors(data.donors);

    } catch (error) {

        grid.innerHTML = "";
        count.textContent = "Search failed";

        empty.hidden = false;
        empty.textContent =
            "Unable to search donors. Check your backend connection.";

        console.error("Search error:", error);
    }
}

// Search button
searchBtn.addEventListener("click", searchDonors);

// Search when filters change
bloodFilter.addEventListener("change", searchDonors);

locationFilter.addEventListener("input", searchDonors);

// Register a new donor
donorForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const formData = new FormData(donorForm);

    const donorData = {
        name: formData.get("name").trim(),
        bloodGroup: formData.get("blood"),
        location: formData.get("location").trim(),
        phone: formData.get("phone").trim()
    };

    formMessage.textContent = "Registering donor...";
    
    try {

        const response = await fetch(`${API_URL}/donors`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(donorData)

        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Registration failed.");
        }

        formMessage.textContent =
            "Donor registered successfully!";

        formMessage.style.color = "green";

        donorForm.reset();

        // Refresh donor directory
        await loadDonors();

    } catch (error) {

        formMessage.textContent =
            error.message || "Unable to register donor.";

        formMessage.style.color = "red";

        console.error("Registration error:", error);
    }

});

// Load donors when website opens
loadDonors();
