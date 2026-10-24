
// CampusSpend Budget Management

const TRANSACTIONS_KEY = "campusSpendTransactions";
const MONTHLY_BUDGET_KEY = "campusSpendMonthlyBudget";
const CATEGORY_BUDGETS_KEY = "campusSpendCategoryBudgets";

const budgetMonth = document.getElementById("budgetMonth");
const monthlyBudgetInput = document.getElementById("monthlyBudget");
const overallBudgetForm = document.getElementById("overallBudgetForm");
const categoryBudgetForm = document.getElementById("categoryBudgetForm");
const categoryBudgetList = document.getElementById("categoryBudgetList");
const emptyBudgets = document.getElementById("emptyBudgets");
const budgetMessage = document.getElementById("budgetMessage");

let selectedMonth = getCurrentMonth();

budgetMonth.value = selectedMonth;

// Read saved transactions.
function getTransactions() {
    try {
        const data = JSON.parse(
            localStorage.getItem(TRANSACTIONS_KEY) || "[]"
        );

        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Could not read transactions:", error);
        return [];
    }
}

// Read category budgets.
function getCategoryBudgets() {
    try {
        const data = JSON.parse(
            localStorage.getItem(CATEGORY_BUDGETS_KEY) || "{}"
        );

        return data && typeof data === "object" && !Array.isArray(data)
            ? data
            : {};
    } catch (error) {
        console.error("Could not read category budgets:", error);
        return {};
    }
}

// Read the overall monthly budget.
function getMonthlyBudget() {
    const savedBudget = Number(
        localStorage.getItem(MONTHLY_BUDGET_KEY)
    );

    return Number.isFinite(savedBudget) && savedBudget >= 0
        ? savedBudget
        : 5000;
}

// Format amounts in Indian Rupees.
function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);
}

// Return the current month in YYYY-MM format.
function getCurrentMonth() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}`;
}

// Check whether a transaction belongs to the selected month.
function isInSelectedMonth(transaction) {
    return typeof transaction.date === "string" &&
        transaction.date.startsWith(selectedMonth);
}

// Calculate expense spending for a particular category.
function getCategorySpending(category) {
    return getTransactions()
        .filter(transaction =>
            transaction.type === "expense" &&
            transaction.category === category &&
            isInSelectedMonth(transaction)
        )
        .reduce((total, transaction) => {
            const amount = Number(transaction.amount);

            return total + (
                Number.isFinite(amount) && amount > 0
                    ? amount
                    : 0
            );
        }, 0);
}

// Calculate all expenses for the selected month.
function getTotalSpending() {
    return getTransactions()
        .filter(transaction =>
            transaction.type === "expense" &&
            isInSelectedMonth(transaction)
        )
        .reduce((total, transaction) => {
            const amount = Number(transaction.amount);

            return total + (
                Number.isFinite(amount) && amount > 0
                    ? amount
                    : 0
            );
        }, 0);
}

// Display a temporary success or error message.
function showMessage(message, isError = false) {
    budgetMessage.textContent = message;
    budgetMessage.classList.toggle("error", isError);

    clearTimeout(showMessage.timeout);

    showMessage.timeout = setTimeout(() => {
        budgetMessage.textContent = "";
        budgetMessage.classList.remove("error");
    }, 3500);
}

// Update the summary cards and overall progress bar.
function updateSummary() {
    const totalBudget = getMonthlyBudget();
    const totalSpent = getTotalSpending();
    const remaining = totalBudget - totalSpent;

    document.getElementById("totalBudget").textContent =
        formatCurrency(totalBudget);

    document.getElementById("totalSpent").textContent =
        formatCurrency(totalSpent);

    document.getElementById("remainingBudget").textContent =
        formatCurrency(remaining);

    const percentage = totalBudget > 0
        ? (totalSpent / totalBudget) * 100
        : totalSpent > 0 ? 100 : 0;

    document.getElementById("overallPercentage").textContent =
        `${Math.round(percentage)}%`;

    const progress = document.getElementById("overallProgress");

    progress.style.width = `${Math.min(percentage, 100)}%`;
    progress.style.background = percentage > 100
        ? "#ef4444"
        : percentage >= 80
            ? "#f59e0b"
            : "#4568e8";

    document.getElementById("remainingMessage").textContent =
        remaining < 0
            ? `${formatCurrency(Math.abs(remaining))} over budget`
            : "Available to spend";

    monthlyBudgetInput.value = totalBudget;
}

// Draw the saved category budgets.
function renderCategoryBudgets() {
    const budgets = getCategoryBudgets();

    categoryBudgetList.innerHTML = "";

    const categories = Object.keys(budgets).filter(category => {
        const limit = Number(budgets[category]);

        return Number.isFinite(limit) && limit > 0;
    });

    emptyBudgets.hidden = categories.length > 0;

    categories.sort((a, b) => a.localeCompare(b));

    categories.forEach(category => {
        const limit = Number(budgets[category]);
        const spent = getCategorySpending(category);
        const remaining = limit - spent;
        const percentage = (spent / limit) * 100;

        const card = document.createElement("article");
        card.className = "category-card";

        const top = document.createElement("div");
        top.className = "category-card-top";

        const details = document.createElement("div");

        const heading = document.createElement("h3");
        heading.textContent = category;

        const subtitle = document.createElement("p");
        subtitle.textContent = "Monthly spending limit";

        details.append(heading, subtitle);

        const actions = document.createElement("div");
        actions.className = "category-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.setAttribute(
            "aria-label",
            `Edit ${category} budget`
        );

        editButton.addEventListener("click", () => {
            document.getElementById("categoryName").value = category;
            document.getElementById("categoryLimit").value = limit;

            categoryBudgetForm.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            document.getElementById("categoryLimit").focus();
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-category";
        deleteButton.setAttribute(
            "aria-label",
            `Delete ${category} budget`
        );

        deleteButton.addEventListener("click", () => {
            const confirmed = confirm(
                `Delete the ${category} budget?`
            );

            if (!confirmed) return;

            const updatedBudgets = getCategoryBudgets();
            delete updatedBudgets[category];

            localStorage.setItem(
                CATEGORY_BUDGETS_KEY,
                JSON.stringify(updatedBudgets)
            );

            renderCategoryBudgets();
            showMessage(`${category} budget deleted.`);
        });

        actions.append(editButton, deleteButton);
        top.append(details, actions);

        const amount = document.createElement("div");
        amount.className = "category-amount";
        amount.textContent = formatCurrency(spent);

        const limitText = document.createElement("span");
        limitText.textContent = ` / ${formatCurrency(limit)}`;
        amount.appendChild(limitText);

        const progressTrack = document.createElement("div");
        progressTrack.className = "category-progress";

        const progressFill = document.createElement("div");
        progressFill.className = "category-progress-fill";

        progressFill.style.width = `${Math.min(percentage, 100)}%`;

        if (percentage > 100) {
            progressFill.classList.add("over-budget");
        }

        progressTrack.appendChild(progressFill);

        const footer = document.createElement("div");
        footer.className = "category-footer";

        const status = document.createElement("span");
        status.textContent = `${Math.round(percentage)}% used`;

        const remainingText = document.createElement("span");
        remainingText.textContent = remaining < 0
            ? `${formatCurrency(Math.abs(remaining))} over`
            : `${formatCurrency(remaining)} left`;

        footer.append(status, remainingText);

        card.append(top, amount, progressTrack, footer);
        categoryBudgetList.appendChild(card);
    });
}

// Save the overall monthly budget.
overallBudgetForm.addEventListener("submit", event => {
    event.preventDefault();

    const value = Number(monthlyBudgetInput.value);

    if (!Number.isFinite(value) || value < 0) {
        showMessage("Enter a valid budget amount.", true);
        return;
    }

    localStorage.setItem(MONTHLY_BUDGET_KEY, String(value));

    updateSummary();
    showMessage("Monthly budget saved successfully.");
});

// Save or update a category budget.
categoryBudgetForm.addEventListener("submit", event => {
    event.preventDefault();

    const category = document.getElementById("categoryName").value;
    const limit = Number(
        document.getElementById("categoryLimit").value
    );

    if (!Number.isFinite(limit) || limit <= 0) {
        showMessage("Enter a category budget greater than zero.", true);
        return;
    }

    const budgets = getCategoryBudgets();

    budgets[category] = limit;

    localStorage.setItem(
        CATEGORY_BUDGETS_KEY,
        JSON.stringify(budgets)
    );

    renderCategoryBudgets();
    categoryBudgetForm.reset();

    showMessage(`${category} budget saved successfully.`);
});

// Update figures when the selected month changes.
budgetMonth.addEventListener("change", () => {
    if (!budgetMonth.value) {
        budgetMonth.value = selectedMonth;
        return;
    }

    selectedMonth = budgetMonth.value;

    updateSummary();
    renderCategoryBudgets();
});

// Logout.
document.getElementById("logoutBtn").addEventListener("click", event => {
    event.preventDefault();

    if (confirm("Are you sure you want to log out?")) {
        window.location.href = "login.html";
    }
});

// Refresh when returning to this page after editing transactions.
window.addEventListener("focus", () => {
    updateSummary();
    renderCategoryBudgets();
});

window.addEventListener("storage", event => {
    if (
        event.key === TRANSACTIONS_KEY ||
        event.key === MONTHLY_BUDGET_KEY ||
        event.key === CATEGORY_BUDGETS_KEY
    ) {
        updateSummary();
        renderCategoryBudgets();
    }
});

// Initial page setup.
if (localStorage.getItem(MONTHLY_BUDGET_KEY) === null) {
    localStorage.setItem(MONTHLY_BUDGET_KEY, "5000");
}

updateSummary();
renderCategoryBudgets();

