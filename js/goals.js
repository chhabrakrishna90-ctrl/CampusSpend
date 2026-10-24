
// CampusSpend Savings Goals

const GOALS_KEY = "campusSpendSavingsGoals";

const goalFormPanel = document.getElementById("goalFormPanel");
const goalForm = document.getElementById("goalForm");
const goalsList = document.getElementById("goalsList");
const emptyGoals = document.getElementById("emptyGoals");
const goalFilter = document.getElementById("goalFilter");
const goalMessage = document.getElementById("goalMessage");

// Read goals safely from localStorage.
function getGoals() {
    try {
        const goals = JSON.parse(
            localStorage.getItem(GOALS_KEY) || "[]"
        );

        if (!Array.isArray(goals)) {
            return [];
        }

        return goals.filter(goal =>
            goal &&
            typeof goal.id === "string" &&
            typeof goal.name === "string" &&
            Number.isFinite(Number(goal.target)) &&
            Number(goal.target) > 0 &&
            Number.isFinite(Number(goal.saved)) &&
            Number(goal.saved) >= 0
        );
    } catch (error) {
        console.error("Unable to load savings goals:", error);
        return [];
    }
}

// Save goals.
function saveGoals(goals) {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

// Format money in Indian Rupees.
function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);
}

// Create an HTML element safely.
function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

// Show success or error messages.
function showMessage(message, isError = false) {
    goalMessage.textContent = message;
    goalMessage.classList.toggle("error", isError);

    clearTimeout(showMessage.timeout);

    showMessage.timeout = setTimeout(() => {
        goalMessage.textContent = "";
        goalMessage.classList.remove("error");
    }, 3500);
}

// Show or hide the create-goal form.
function openForm() {
    goalFormPanel.hidden = false;

    goalFormPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    document.getElementById("goalName").focus();
}

function closeForm() {
    goalFormPanel.hidden = true;
    goalForm.reset();
    document.getElementById("goalInitial").value = "0";
}

// Calculate and display the summary cards.
function renderSummary(goals) {
    const totalSaved = goals.reduce(
        (sum, goal) => sum + Number(goal.saved),
        0
    );

    const totalRemaining = goals.reduce(
        (sum, goal) =>
            sum + Math.max(Number(goal.target) - Number(goal.saved), 0),
        0
    );

    const completed = goals.filter(
        goal => Number(goal.saved) >= Number(goal.target)
    ).length;

    document.getElementById("totalGoals").textContent =
        goals.length;

    document.getElementById("totalSaved").textContent =
        formatCurrency(totalSaved);

    document.getElementById("totalRemaining").textContent =
        formatCurrency(totalRemaining);

    document.getElementById("completedGoals").textContent =
        completed;
}

// Select an icon for each category.
function getCategoryIcon(category) {
    const icons = {
        "Education": "📚",
        "Technology": "💻",
        "Travel": "✈️",
        "Emergency Fund": "🛡️",
        "Personal": "🎯",
        "Other": "💰"
    };

    return icons[category] || "💰";
}

// Create a contribution form for an individual goal.
function createContributionForm(goal, completed) {
    const form = createElement("form", "contribution-form");

    const group = createElement("div", "input-group");
    const label = createElement(
        "label",
        "",
        "Add savings contribution (₹)"
    );

    const input = document.createElement("input");
    input.type = "number";
    input.min = "0.01";
    input.step = "0.01";
    input.placeholder = "Enter amount";
    input.required = true;
    input.disabled = completed;

    const button = createElement(
        "button",
        "",
        completed ? "Goal Reached" : "Add Savings"
    );

    button.type = "submit";
    button.disabled = completed;

    group.append(label, input);
    form.append(group, button);

    form.addEventListener("submit", event => {
        event.preventDefault();

        const amount = Number(input.value);

        if (!Number.isFinite(amount) || amount <= 0) {
            showMessage(
                "Enter a contribution greater than zero.",
                true
            );
            return;
        }

        const goals = getGoals();
        const currentGoal = goals.find(item => item.id === goal.id);

        if (!currentGoal) {
            showMessage("This goal could not be found.", true);
            return;
        }

        const currentSaved = Number(currentGoal.saved);
        const target = Number(currentGoal.target);

        if (currentSaved >= target) {
            showMessage("This goal has already been completed.", true);
            return;
        }

        // Never allow savings to exceed the target.
        const remaining = target - currentSaved;

        if (amount > remaining) {
            showMessage(
                `You can add up to ${formatCurrency(remaining)} to this goal.`,
                true
            );
            return;
        }

        currentGoal.saved = currentSaved + amount;

        saveGoals(goals);
        renderGoals();

        showMessage(
            currentGoal.saved >= target
                ? `Congratulations! You reached "${currentGoal.name}".`
                : `Savings added to "${currentGoal.name}".`
        );
    });

    return form;
}

// Create a goal card.
function createGoalCard(goal) {
    const target = Number(goal.target);
    const saved = Number(goal.saved);
    const completed = saved >= target;
    const percentage = Math.min((saved / target) * 100, 100);

    const card = createElement("article", "goal-card");

    const top = createElement("div", "goal-card-top");
    const titleArea = createElement("div", "goal-card-title-area");

    const icon = createElement(
        "div",
        "goal-emoji",
        getCategoryIcon(goal.category)
    );

    const titleDetails = document.createElement("div");

    const title = createElement("h3", "goal-title", goal.name);
    const category = createElement(
        "p",
        "goal-category",
        goal.category || "Other"
    );

    titleDetails.append(title, category);
    titleArea.append(icon, titleDetails);

    const actions = createElement("div", "goal-card-actions");

    const editButton = createElement("button", "goal-action-btn", "Edit");
    editButton.type = "button";
    editButton.setAttribute("aria-label", `Edit ${goal.name}`);

    editButton.addEventListener("click", () => {
        editGoal(goal.id);
    });

    const deleteButton = createElement(
        "button",
        "goal-action-btn delete",
        "Delete"
    );

    deleteButton.type = "button";
    deleteButton.setAttribute("aria-label", `Delete ${goal.name}`);

    deleteButton.addEventListener("click", () => {
        deleteGoal(goal.id);
    });

    actions.append(editButton, deleteButton);
    top.append(titleArea, actions);

    const description = goal.description
        ? createElement("p", "goal-description", goal.description)
        : null;

    const amountRow = createElement("div", "goal-amount-row");

    const currentAmount = createElement(
        "div",
        "goal-current-amount",
        formatCurrency(saved)
    );

    currentAmount.appendChild(
        createElement(
            "small",
            "",
            completed ? "Target reached!" : "Amount saved"
        )
    );

    const targetAmount = createElement(
        "div",
        "goal-target-amount",
        `Target: ${formatCurrency(target)}`
    );

    amountRow.append(currentAmount, targetAmount);

    const progressTrack = createElement(
        "div",
        "goal-progress-track"
    );

    const progressFill = createElement(
        "div",
        "goal-progress-fill"
    );

    progressFill.style.width = `${percentage}%`;

    if (completed) {
        progressFill.classList.add("completed");
    }

    progressTrack.appendChild(progressFill);

    const progressInfo = createElement(
        "div",
        "goal-progress-info"
    );

    progressInfo.append(
        createElement("span", "", `${Math.round(percentage)}% completed`),
        createElement(
            "span",
            "",
            `${formatCurrency(Math.max(target - saved, 0))} remaining`
        )
    );

    card.append(top);

    if (description) {
        card.appendChild(description);
    }

    card.append(amountRow, progressTrack, progressInfo);

    if (goal.deadline) {
        const deadlineDate = new Date(
            `${goal.deadline}T00:00:00`
        );

        const deadlineText = deadlineDate.toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );

        card.appendChild(
            createElement(
                "div",
                "goal-deadline",
                `Target date: ${deadlineText}`
            )
        );
    }

    let statusText = "In Progress";
    let statusClass = "goal-status";

    if (completed) {
        statusText = "Completed";
        statusClass += " completed-status";
    } else if (
        goal.deadline &&
        goal.deadline < getToday()
    ) {
        statusText = "Past Target Date";
        statusClass += " overdue-status";
    }

    card.appendChild(
        createElement("span", statusClass, statusText)
    );

    card.appendChild(
        createContributionForm(goal, completed)
    );

    return card;
}

// Return today's date in YYYY-MM-DD format.
function getToday() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Render goals according to the selected filter.
function renderGoals() {
    const goals = getGoals();

    renderSummary(goals);
    goalsList.replaceChildren();

    const filter = goalFilter.value;

    const filteredGoals = goals.filter(goal => {
        const completed = Number(goal.saved) >= Number(goal.target);

        if (filter === "active") {
            return !completed;
        }

        if (filter === "completed") {
            return completed;
        }

        return true;
    });

    emptyGoals.hidden = filteredGoals.length > 0;

    if (filteredGoals.length === 0) {
        const heading = emptyGoals.querySelector("h3");
        const description = emptyGoals.querySelector("p");
        const button = document.getElementById("emptyCreateGoal");

        if (goals.length === 0) {
            heading.textContent = "No savings goals yet";
            description.textContent =
                "Create your first goal and start planning your savings.";
            button.hidden = false;
        } else {
            heading.textContent = "No goals found";
            description.textContent =
                "Try selecting a different filter.";
            button.hidden = true;
        }
    }

    filteredGoals.forEach(goal => {
        goalsList.appendChild(createGoalCard(goal));
    });
}

// Create a new goal.
goalForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("goalName").value.trim();
    const category = document.getElementById("goalCategory").value;
    const target = Number(document.getElementById("goalTarget").value);
    const initial = Number(document.getElementById("goalInitial").value);
    const deadline = document.getElementById("goalDeadline").value;
    const description = document.getElementById("goalDescription").value.trim();

    if (!name) {
        showMessage("Please enter a goal name.", true);
        return;
    }

    if (!Number.isFinite(target) || target <= 0) {
        showMessage("The target must be greater than zero.", true);
        return;
    }

    if (
        !Number.isFinite(initial) ||
        initial < 0 ||
        initial > target
    ) {
        showMessage(
            "Already saved must be between zero and the target amount.",
            true
        );
        return;
    }

    if (deadline && deadline < getToday()) {
        showMessage("Choose today or a future target date.", true);
        return;
    }

    const goals = getGoals();

    const newGoal = {
        id: crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name,
        category,
        target,
        saved: initial,
        deadline,
        description,
        createdAt: new Date().toISOString()
    };

    goals.push(newGoal);

    try {
        saveGoals(goals);
    } catch (error) {
        showMessage("Unable to save your goal in browser storage.", true);
        return;
    }

    closeForm();
    goalFilter.value = "all";
    renderGoals();

    showMessage(`Savings goal "${name}" created successfully.`);
});

// Edit a goal.
function editGoal(id) {
    const goals = getGoals();
    const goal = goals.find(item => item.id === id);

    if (!goal) {
        showMessage("Goal not found.", true);
        return;
    }

    const newName = prompt("Enter goal name:", goal.name);

    if (newName === null) {
        return;
    }

    const name = newName.trim();

    if (!name) {
        showMessage("Goal name cannot be empty.", true);
        return;
    }

    const newTargetInput = prompt(
        "Enter new target amount in ₹:",
        String(goal.target)
    );

    if (newTargetInput === null) {
        return;
    }

    const newTarget = Number(newTargetInput);

    if (!Number.isFinite(newTarget) || newTarget <= 0) {
        showMessage("Enter a valid target amount.", true);
        return;
    }

    if (newTarget < Number(goal.saved)) {
        showMessage(
            "The target cannot be lower than the amount already saved.",
            true
        );
        return;
    }

    goal.name = name;
    goal.target = newTarget;

    try {
        saveGoals(goals);
    } catch (error) {
        showMessage("Unable to save the changes.", true);
        return;
    }

    renderGoals();
    showMessage("Savings goal updated successfully.");
}

// Delete a goal.
function deleteGoal(id) {
    const goals = getGoals();
    const goal = goals.find(item => item.id === id);

    if (!goal) {
        showMessage("Goal not found.", true);
        return;
    }

    if (!confirm(`Delete the savings goal "${goal.name}"?`)) {
        return;
    }

    saveGoals(goals.filter(item => item.id !== id));
    renderGoals();

    showMessage(`Savings goal "${goal.name}" deleted.`);
}

// Form buttons.
document.getElementById("openGoalForm").addEventListener(
    "click",
    openForm
);

document.getElementById("emptyCreateGoal").addEventListener(
    "click",
    openForm
);

document.getElementById("closeGoalForm").addEventListener(
    "click",
    closeForm
);

document.getElementById("cancelGoal").addEventListener(
    "click",
    closeForm
);

goalFilter.addEventListener("change", renderGoals);

// Logout.
document.getElementById("logoutBtn").addEventListener(
    "click",
    event => {
        event.preventDefault();

        if (confirm("Are you sure you want to log out?")) {
            window.location.href = "login.html";
        }
    }
);

// Refresh if another browser tab updates savings goals.
window.addEventListener("storage", event => {
    if (event.key === GOALS_KEY) {
        renderGoals();
    }
});

// Initial page setup.
renderGoals();

