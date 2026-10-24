
// CampusSpend Reports

const TRANSACTIONS_KEY = "campusSpendTransactions";
const MONTHLY_BUDGET_KEY = "campusSpendMonthlyBudget";

const reportMonth = document.getElementById("reportMonth");

let selectedMonth = getCurrentMonth();

reportMonth.value = selectedMonth;

// Get current month as YYYY-MM.
function getCurrentMonth() {
    const now = new Date();

    return `${now.getFullYear()}-${String(
        now.getMonth() + 1
    ).padStart(2, "0")}`;
}

// Read transactions from localStorage.
function getTransactions() {
    try {
        const transactions = JSON.parse(
            localStorage.getItem(TRANSACTIONS_KEY) || "[]"
        );

        return Array.isArray(transactions) ? transactions : [];
    } catch (error) {
        console.error("Unable to load transactions:", error);
        return [];
    }
}

// Format values as Indian Rupees.
function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);
}

// Format large chart values more compactly.
function formatCompactCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        notation: "compact",
        maximumFractionDigits: 1
    }).format(amount);
}

// Keep only transactions for the selected month.
function getMonthlyTransactions() {
    return getTransactions().filter(transaction =>
        typeof transaction.date === "string" &&
        transaction.date.startsWith(selectedMonth)
    );
}

// Convert transaction amount to a valid positive number.
function getAmount(transaction) {
    const amount = Number(transaction.amount);

    return Number.isFinite(amount) && amount > 0
        ? amount
        : 0;
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

// Calculate income, expenses, and savings.
function calculateSummary() {
    const transactions = getMonthlyTransactions();

    const income = transactions
        .filter(transaction => transaction.type === "income")
        .reduce((sum, transaction) => sum + getAmount(transaction), 0);

    const expenses = transactions
        .filter(transaction => transaction.type === "expense")
        .reduce((sum, transaction) => sum + getAmount(transaction), 0);

    return {
        transactions,
        income,
        expenses,
        savings: income - expenses
    };
}

// Update financial summary cards.
function renderSummary(summary) {
    document.getElementById("reportIncome").textContent =
        formatCurrency(summary.income);

    document.getElementById("reportExpenses").textContent =
        formatCurrency(summary.expenses);

    const savingsElement = document.getElementById("reportSavings");

    savingsElement.textContent = formatCurrency(summary.savings);
    savingsElement.style.color =
        summary.savings < 0 ? "#dc2626" : "#16a34a";

    const savedBudget = localStorage.getItem(MONTHLY_BUDGET_KEY);
    const budget = savedBudget === null ? 5000 : Number(savedBudget);

    const validBudget = Number.isFinite(budget) && budget > 0
        ? budget
        : 0;

    const percentage = validBudget > 0
        ? (summary.expenses / validBudget) * 100
        : 0;

    document.getElementById("reportBudgetUsed").textContent =
        `${Math.round(percentage)}%`;

    document.getElementById("reportBudgetText").textContent =
        validBudget > 0
            ? `${formatCurrency(summary.expenses)} of ${formatCurrency(validBudget)}`
            : "No valid monthly budget set";
}

// Render the income vs expense bar chart.
function renderComparisonChart(summary) {
    const maxValue = Math.max(
        summary.income,
        summary.expenses,
        1
    );

    const incomeHeight = summary.income > 0
        ? Math.max((summary.income / maxValue) * 175, 5)
        : 0;

    const expenseHeight = summary.expenses > 0
        ? Math.max((summary.expenses / maxValue) * 175, 5)
        : 0;

    document.getElementById("incomeBar").style.height =
        `${incomeHeight}px`;

    document.getElementById("expenseBar").style.height =
        `${expenseHeight}px`;

    document.getElementById("incomeChartValue").textContent =
        formatCompactCurrency(summary.income);

    document.getElementById("expenseChartValue").textContent =
        formatCompactCurrency(summary.expenses);

    const note = document.getElementById("comparisonNote");

    if (summary.income === 0 && summary.expenses === 0) {
        note.textContent =
            "Add transactions to see your financial comparison.";
    } else if (summary.income > summary.expenses) {
        note.textContent =
            "Your recorded income is greater than your expenses.";
    } else if (summary.expenses > summary.income) {
        note.textContent =
            "Your recorded expenses are greater than your income.";
    } else {
        note.textContent =
            "Your recorded income and expenses are equal.";
    }
}

// Render category-wise expenses.
function renderCategoryReport(summary) {
    const container = document.getElementById("categoryReport");
    const emptyMessage = document.getElementById("emptyCategoryReport");

    container.replaceChildren();

    const categoryTotals = {};

    summary.transactions
        .filter(transaction => transaction.type === "expense")
        .forEach(transaction => {
            const category =
                String(transaction.category || "Other");

            categoryTotals[category] =
                (categoryTotals[category] || 0) + getAmount(transaction);
        });

    const categories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);

    emptyMessage.hidden = categories.length > 0;

    const totalExpenses = summary.expenses;

    categories.forEach(([category, amount]) => {
        const percentage = totalExpenses > 0
            ? (amount / totalExpenses) * 100
            : 0;

        const item = createElement(
            "div",
            "category-report-item"
        );

        const top = createElement(
            "div",
            "category-report-top"
        );

        top.append(
            createElement("span", "category-report-name", category),
            createElement(
                "span",
                "category-report-amount",
                formatCurrency(amount)
            )
        );

        const track = createElement(
            "div",
            "category-report-track"
        );

        const fill = createElement(
            "div",
            "category-report-fill"
        );

        fill.style.width = `${percentage}%`;

        track.appendChild(fill);

        const footer = createElement(
            "div",
            "category-report-footer"
        );

        footer.append(
            createElement(
                "span",
                "",
                `${percentage.toFixed(1)}% of expenses`
            ),
            createElement(
                "span",
                "",
                `${summary.transactions.filter(
                    transaction =>
                        transaction.type === "expense" &&
                        String(transaction.category || "Other") === category
                ).length} transactions`
            )
        );

        item.append(top, track, footer);
        container.appendChild(item);
    });
}

// Render the transaction table.
function renderTransactions(summary) {
    const tbody = document.getElementById("reportTransactions");
    const emptyMessage = document.getElementById("emptyTransactions");

    tbody.replaceChildren();

    const transactions = [...summary.transactions].sort((a, b) =>
        String(b.date || "").localeCompare(String(a.date || ""))
    );

    document.getElementById("transactionCount").textContent =
        `${transactions.length} transaction${transactions.length === 1 ? "" : "s"}`;

    emptyMessage.hidden = transactions.length > 0;

    transactions.forEach(transaction => {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");

        nameCell.appendChild(
            createElement(
                "span",
                "transaction-name",
                String(transaction.name || "Unnamed transaction")
            )
        );

        if (transaction.note) {
            nameCell.appendChild(
                createElement(
                    "span",
                    "transaction-note",
                    String(transaction.note)
                )
            );
        }

        const categoryCell = createElement(
            "td",
            "",
            String(transaction.category || "Other")
        );

        const dateCell = createElement(
            "td",
            "",
            String(transaction.date || "—")
        );

        const typeCell = document.createElement("td");

        const isIncome = transaction.type === "income";

        typeCell.appendChild(
            createElement(
                "span",
                `type-badge ${isIncome ? "income-badge" : "expense-badge"}`,
                isIncome ? "Income" : "Expense"
            )
        );

        const amountCell = createElement(
            "td",
            `amount-cell ${isIncome ? "income-amount" : "expense-amount"}`,
            `${isIncome ? "+" : "-"}${formatCurrency(getAmount(transaction))}`
        );

        row.append(
            nameCell,
            categoryCell,
            dateCell,
            typeCell,
            amountCell
        );

        tbody.appendChild(row);
    });
}

// Refresh the complete report.
function renderReport() {
    const summary = calculateSummary();

    renderSummary(summary);
    renderComparisonChart(summary);
    renderCategoryReport(summary);
    renderTransactions(summary);
}

// Download the selected month's transactions as a CSV file.
function exportCSV() {
    const transactions = getMonthlyTransactions();

    if (transactions.length === 0) {
        document.getElementById("reportMessage").textContent =
            "There are no transactions to export for this month.";
        return;
    }

    const headers = [
        "Name",
        "Category",
        "Date",
        "Type",
        "Amount",
        "Note"
    ];

    const rows = transactions.map(transaction => [
        transaction.name || "",
        transaction.category || "Other",
        transaction.date || "",
        transaction.type || "",
        getAmount(transaction),
        transaction.note || ""
    ]);

    // Escape commas, quotes, and newlines for valid CSV.
    const escapeCSV = value =>
        `"${String(value).replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
        .map(row => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `CampusSpend_Report_${selectedMonth}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    document.getElementById("reportMessage").textContent =
        "Your report has been exported successfully.";
}

// Update report when the month changes.
reportMonth.addEventListener("change", () => {
    if (!reportMonth.value) {
        reportMonth.value = selectedMonth;
        return;
    }

    selectedMonth = reportMonth.value;

    document.getElementById("reportMessage").textContent = "";

    renderReport();
});

// Export button.
document.getElementById("exportBtn").addEventListener(
    "click",
    exportCSV
);

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

// Refresh when returning from another page.
window.addEventListener("focus", renderReport);

window.addEventListener("storage", event => {
    if (
        event.key === TRANSACTIONS_KEY ||
        event.key === MONTHLY_BUDGET_KEY
    ) {
        renderReport();
    }
});

// Initial report.
renderReport();

