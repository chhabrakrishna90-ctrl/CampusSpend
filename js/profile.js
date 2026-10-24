
// CampusSpend Profile Settings

const PROFILE_KEY = "campusSpendProfile";
const PREFERENCES_KEY = "campusSpendPreferences";
const USERS_KEY = "campusSpendDemoUsers";

const profileForm = document.getElementById("profileForm");
const preferencesForm = document.getElementById("preferencesForm");
const profileMessage = document.getElementById("profileMessage");

// Read saved JSON safely.
function readJSON(key, fallback) {
    try {
        const value = localStorage.getItem(key);

        if (value === null) {
            return fallback;
        }

        return JSON.parse(value);
    } catch (error) {
        console.error(`Could not read ${key}:`, error);
        return fallback;
    }
}

// Save JSON safely.
function writeJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Could not save ${key}:`, error);
        showMessage("Unable to save. Check your browser storage.", true);
        return false;
    }
}

// Get the profile saved by this page.
function getProfile() {
    const profile = readJSON(PROFILE_KEY, {});

    return profile && typeof profile === "object" &&
        !Array.isArray(profile)
        ? profile
        : {};
}

// Get the current preferences.
function getPreferences() {
    const preferences = readJSON(PREFERENCES_KEY, {});

    return preferences && typeof preferences === "object" &&
        !Array.isArray(preferences)
        ? preferences
        : {};
}

// Display messages.
function showMessage(message, isError = false) {
    profileMessage.textContent = message;
    profileMessage.classList.toggle("error", isError);

    clearTimeout(showMessage.timeout);

    showMessage.timeout = setTimeout(() => {
        profileMessage.textContent = "";
        profileMessage.classList.remove("error");
    }, 3500);
}

// Generate initials from a name.
function getInitials(name) {
    const parts = String(name || "CampusSpend")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) {
        return "CS";
    }

    return parts
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join("");
}

// Fill the profile form.
function loadProfile() {
    const profile = getProfile();

    document.getElementById("fullName").value =
        profile.name || "";

    document.getElementById("email").value =
        profile.email || "";

    document.getElementById("college").value =
        profile.college || "";

    document.getElementById("course").value =
        profile.course || "";

    updateProfileDisplay(profile);
}

// Update the overview and sidebar.
function updateProfileDisplay(profile) {
    const name = profile.name || "Student Account";
    const email = profile.email || "No email saved";
    const initials = getInitials(profile.name || "CampusSpend");

    document.getElementById("overviewName").textContent = name;
    document.getElementById("overviewEmail").textContent = email;

    document.getElementById("profileAvatar").textContent = initials;
    document.getElementById("sidebarAvatar").textContent = initials;

    document.getElementById("sidebarName").textContent = name;
    document.getElementById("sidebarEmail").textContent = email;
}

// Save profile information.
profileForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const college = document.getElementById("college").value.trim();
    const course = document.getElementById("course").value.trim();

    if (!name || !email) {
        showMessage("Name and email are required.", true);
        return;
    }

    const profile = {
        name,
        email,
        college,
        course,
        updatedAt: new Date().toISOString()
    };

    if (!writeJSON(PROFILE_KEY, profile)) {
        return;
    }

    updateProfileDisplay(profile);
    showMessage("Profile saved successfully.");
});

// Reset the form to the currently saved profile.
profileForm.addEventListener("reset", () => {
    setTimeout(loadProfile, 0);
});

// Load preferences.
function loadPreferences() {
    const preferences = getPreferences();

    document.getElementById("currency").value =
        preferences.currency || "INR";

    document.getElementById("budgetReminder").checked =
        preferences.budgetReminder === true;

    document.getElementById("savingsReminder").checked =
        preferences.savingsReminder === true;
}

// Save preferences.
preferencesForm.addEventListener("submit", event => {
    event.preventDefault();

    const preferences = {
        currency: document.getElementById("currency").value,
        budgetReminder:
            document.getElementById("budgetReminder").checked,
        savingsReminder:
            document.getElementById("savingsReminder").checked,
        updatedAt: new Date().toISOString()
    };

    if (!writeJSON(PREFERENCES_KEY, preferences)) {
        return;
    }

    showMessage(
        "Preferences saved. Currency selection currently affects this page's saved setting only."
    );
});

// Clear only the profile and preferences saved by this page.
document.getElementById("clearProfileBtn").addEventListener(
    "click",
    () => {
        const confirmed = confirm(
            "Clear your saved profile and preferences? Your transactions, budgets, and savings goals will not be deleted."
        );

        if (!confirmed) {
            return;
        }

        try {
            localStorage.removeItem(PROFILE_KEY);
            localStorage.removeItem(PREFERENCES_KEY);

            loadProfile();
            loadPreferences();

            showMessage("Saved profile and preferences cleared.");
        } catch (error) {
            showMessage("Unable to clear saved information.", true);
        }
    }
);

// Demo logout.
document.getElementById("logoutBtn").addEventListener(
    "click",
    event => {
        event.preventDefault();

        if (confirm("Are you sure you want to log out?")) {
            window.location.href = "login.html";
        }
    }
);

// Refresh if another browser tab updates the profile.
window.addEventListener("storage", event => {
    if (event.key === PROFILE_KEY) {
        loadProfile();
    }

    if (event.key === PREFERENCES_KEY) {
        loadPreferences();
    }
});

// Initial setup.
loadProfile();
loadPreferences();

