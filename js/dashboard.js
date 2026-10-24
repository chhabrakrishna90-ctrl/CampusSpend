document.addEventListener("DOMContentLoaded", function () {
const currency = new Intl.NumberFormat("en-IN", {
style: "currency",
currency: "INR",
maximumFractionDigits: 2
});


// Display today's date
const dateElement = document.getElementById("currentDate");

if (dateElement) {
    dateElement.textContent = new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// Demo transaction data
// Later, these records can come from the transactions page.
const transactions = JSON.parse(
    localStorage.getItem("campusSpendTransactions") || "[]"
);

const currentMonth = new Date().getMonth();
const currentYear = new Date().getFullYear();

const monthlyTransactions = transactions.filter(function (transaction) {
    if (!transaction.date) return false;

    const date = new Date(transaction.date);

    return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
    );
});

let income = 0;
let expenses = 0;

monthlyTransactions.forEach(function (transaction) {
    const amount = Number(transaction.amount) || 0;

    if (transaction.type === "income") {
        income += amount;
    } else if (transaction.type === "expense") {
        expenses += amount;
    }
});

// Calculate the current balance from this month's records.
const balance = income - expenses;

// Budget demo value
const budget = Number(
    localStorage.getItem("campusSpendMonthlyBudget")
) || 5000;

const remaining = Math.max(budget - expenses, 0);
const percentage = budget > 0
    ? Math.min((expenses / budget) * 100, 100)
    : 0;

document.getElementById("totalBalance").textContent =
    currency.format(balance);

document.getElementById("totalIncome").textContent =
    currency.format(income);

document.getElementById("totalExpenses").textContent =
    currency.format(expenses);

document.getElementById("monthlyBudget").textContent =
    currency.format(budget);

document.getElementById("budgetSpent").textContent =
    currency.format(expenses);

document.getElementById("budgetRemaining").textContent =
    currency.format(remaining);

document.getElementById("budgetPercentage").textContent =
    Math.round(percentage) + "%";

document.getElementById("budgetProgress").style.width =
    percentage + "%";

document.getElementById("budgetCirclePercentage").textContent =
    Math.round(percentage) + "%";

document.getElementById("budgetCircle").style.background =
    `conic-gradient(#5367e8 ${percentage}%, #edf0f7 ${percentage}%)`;

// Display recent transactions
const transactionTable = document.getElementById("recentTransactions");

if (transactions.length > 0) {
    const recentTransactions = [...transactions]
        .sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        })
        .slice(0, 5);

    transactionTable.innerHTML = "";

    recentTransactions.forEach(function (transaction) {
        const row = document.createElement("tr");
        const isIncome = transaction.type === "income";

        const nameCell = document.createElement("td");
        nameCell.textContent = transaction.name || "Transaction";

        const categoryCell = document.createElement("td");
        categoryCell.textContent = transaction.category || "Other";

        const dateCell = document.createElement("td");
        dateCell.textContent = transaction.date
            ? new Date(transaction.date).toLocaleDateString("en-IN")
            : "—";

        const amountCell = document.createElement("td");
        amountCell.textContent =
            (isIncome ? "+ " : "− ") +
            currency.format(Number(transaction.amount) || 0);

        amountCell.className = isIncome
            ? "amount-income"
            : "amount-expense";

        const typeCell = document.createElement("td");
        const badge = document.createElement("span");

        badge.className = "type-badge " +
            (isIncome ? "income" : "expense");

        badge.textContent = isIncome ? "Income" : "Expense";
        typeCell.appendChild(badge);

        row.append(
            nameCell,
            categoryCell,
            dateCell,
            amountCell,
            typeCell
        );

        transactionTable.appendChild(row);
    });
}

// Demo logout
const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", function () {
        window.location.href = "login.html";
    });
}


});
