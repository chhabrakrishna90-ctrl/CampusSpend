
// ==========================================
// CampusSpend - Authentication
// Frontend demonstration only
// ==========================================


// 1. SHOW / HIDE PASSWORD
document.querySelectorAll("[data-toggle-password], #togglePassword")
    .forEach(function (button) {

        button.addEventListener("click", function () {

            const inputId = button.dataset.togglePassword || "password";
            const passwordInput = document.getElementById(inputId);

            if (!passwordInput) return;

            const isPassword = passwordInput.type === "password";

            passwordInput.type = isPassword ? "text" : "password";

            button.setAttribute("aria-pressed", String(isPassword));
            button.setAttribute(
                "aria-label",
                isPassword ? "Hide password" : "Show password"
            );
        });
    });


// 2. DISPLAY FORM MESSAGES
function showMessage(element, message, type) {

    if (!element) return;

    element.textContent = message;

    element.style.color =
        type === "success" ? "#15803d" : "#dc2626";
}


// 3. LOGIN FORM
const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const email = document
            .getElementById("email")
            .value.trim()
            .toLowerCase();

        const password = document
            .getElementById("password")
            .value;

        const message = document.getElementById("loginMessage");

        if (!email || !password) {
            showMessage(
                message,
                "Please enter your email and password.",
                "error"
            );
            return;
        }

        // Read demo accounts saved by the registration form.
        // Do not use localStorage authentication for a real application.
        let users = [];

        try {
            users = JSON.parse(
                localStorage.getItem("campusSpendDemoUsers") || "[]"
            );
        } catch (error) {
            showMessage(
                message,
                "Unable to read demo account data.",
                "error"
            );
            return;
        }

        const user = users.find(function (item) {
            return item.email === email && item.password === password;
        });

        if (!user) {
            showMessage(
                message,
                "Account not found or password is incorrect. Please register first.",
                "error"
            );
            return;
        }

        // Store only basic demo session information.
        // Never store passwords in a real application.
        sessionStorage.setItem(
            "campusSpendDemoSession",
            JSON.stringify({
                name: user.name,
                email: user.email
            })
        );

        showMessage(
            message,
            "Login successful! Opening your dashboard...",
            "success"
        );

        setTimeout(function () {
            window.location.href = "dashboard.html";
        }, 800);
    });
}


// 4. REGISTRATION FORM
const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const name = document
            .getElementById("fullName")
            .value.trim();

        const email = document
            .getElementById("email")
            .value.trim()
            .toLowerCase();

        const college = document
            .getElementById("college")
            .value.trim();

        const password = document
            .getElementById("password")
            .value;

        const confirmPassword = document
            .getElementById("confirmPassword")
            .value;

        const terms = document.getElementById("terms");

        const message = document.getElementById("registerMessage");


        // Validate required fields.
        if (!name || !email || !college || !password || !confirmPassword) {
            showMessage(
                message,
                "Please complete all required fields.",
                "error"
            );
            return;
        }


        // Check minimum password length.
        if (password.length < 8) {
            showMessage(
                message,
                "Your password must contain at least 8 characters.",
                "error"
            );
            return;
        }


        // Check password confirmation.
        if (password !== confirmPassword) {
            showMessage(
                message,
                "Passwords do not match. Please try again.",
                "error"
            );
            return;
        }


        // Check terms acceptance.
        if (!terms.checked) {
            showMessage(
                message,
                "Please agree to the Terms and Privacy Policy.",
                "error"
            );
            return;
        }


        // Load existing demo accounts.
        let users = [];

        try {
            users = JSON.parse(
                localStorage.getItem("campusSpendDemoUsers") || "[]"
            );
        } catch (error) {
            showMessage(
                message,
                "Unable to read demo account data.",
                "error"
            );
            return;
        }


        // Prevent duplicate email registrations.
        const existingUser = users.some(function (user) {
            return user.email === email;
        });

        if (existingUser) {
            showMessage(
                message,
                "An account with this email already exists. Please log in.",
                "error"
            );
            return;
        }


        // Save a demo account.
        // This is intentionally not secure enough for real users.
        users.push({
            name: name,
            email: email,
            college: college,
            password: password
        });

        try {
            localStorage.setItem(
                "campusSpendDemoUsers",
                JSON.stringify(users)
            );
        } catch (error) {
            showMessage(
                message,
                "Unable to save the demo account in this browser.",
                "error"
            );
            return;
        }


        showMessage(
            message,
            "Demo account created successfully! Redirecting to login...",
            "success"
        );

        registerForm.reset();

        setTimeout(function () {
            window.location.href = "login.html";
        }, 1200);
    });
}


// 5. FORGOT PASSWORD DEMO MESSAGE
const forgotPassword = document.getElementById("forgotPassword");

if (forgotPassword) {

    forgotPassword.addEventListener("click", function (event) {

        event.preventDefault();

        const message = document.getElementById("loginMessage");

        showMessage(
            message,
            "Password recovery will be available after backend integration.",
            "error"
        );
    });
}

