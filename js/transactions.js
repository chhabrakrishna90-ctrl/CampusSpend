document.addEventListener("DOMContentLoaded", function () {
const STORAGE_KEY = "campusSpendTransactions";


const currency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
});

const formSection = document.getElementById("transactionFormSection");
const form = document.getElementById("transactionForm");
const tableBody = document.getElementById("transactionTableBody");
const emptyState = document.getElementById("emptyState");
const formMessage = document.getElementById("formMessage");

const nameInput = document.getElementById("transactionName");
const amountInput = document.getElementById("transactionAmount");
const typeInput = document.getElementById("transactionType");
const categoryInput = document.getElementById("transactionCategory");
const dateInput = document.getElementById("transactionDate");
const noteInput = document.getElementById("transactionNote");

const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const categoryFilter = document.getElementById("categoryFilter");

function loadTransactions() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.error("Could not read saved transactions:", error);
        return [];
    }
}

let transactions = loadTransactions();

function saveTransactions() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
        return true;
    } catch (error) {
        console.error("Could not save transactions:", error);
        alert("Your browser could not save the transaction. Check available storage.");
        return false;
    }
}

function todayString() {
    const now = new Date();
    const localDate = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000
    );

    return localDate.toISOString().slice(0, 10);
}

dateInput.value = todayString();
dateInput.max = todayString();

function isCurrentMonth(transaction) {
    if (!transaction.date) return false;

    const transactionDate = new Date(transaction.date + "T12:00:00");
    const today = new Date();

    return (
        transactionDate.getMonth() === today.getMonth() &&
        transactionDate.getFullYear() === today.getFullYear()
    );
}

function updateSummary() {
    let income = 0;
    let expenses = 0;

    transactions.filter(isCurrentMonth).forEach(function (transaction) {
        const amount = Number(transaction.amount) || 0;

        if (transaction.type === "income") {
            income += amount;
        } else if (transaction.type === "expense") {
            expenses += amount;
        }
    });

    document.getElementById("incomeTotal").textContent =
        currency.format(income);

    document.getElementById("expenseTotal").textContent =
        currency.format(expenses);

    document.getElementById("netTotal").textContent =
        currency.format(income - expenses);
}

function createCell(text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    return cell;
}

function renderTransactions() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedType = typeFilter.value;
    const selectedCategory = categoryFilter.value;

    const filtered = transactions
        .filter(function (transaction) {
            const searchableText = [
                transaction.name,
                transaction.category,
                transaction.note,
                transaction.date
            ].join(" ").toLowerCase();

            const matchesSearch = searchableText.includes(searchTerm);

            const matchesType =
                selectedType === "all" ||
                transaction.type === selectedType;

            const matchesCategory =
                selectedCategory === "all" ||
                transaction.category === selectedCategory;

            return matchesSearch && matchesType && matchesCategory;
        })
        .sort(function (a, b) {
            return b.date.localeCompare(a.date);
        });

    tableBody.replaceChildren();

    document.getElementById("recordCount").textContent =
        filtered.length + (filtered.length === 1 ? " record" : " records");

    emptyState.hidden = filtered.length !== 0;

    filtered.forEach(function (transaction) {
        const row = document.createElement("tr");
        const isIncome = transaction.type === "income";

        const nameCell = createCell(transaction.name || "Transaction");
        const categoryCell = createCell(transaction.category || "Other");

        const dateCell = createCell(
            transaction.date
                ? new Date(transaction.date + "T12:00:00")
                    .toLocaleDateString("en-IN")
                : "—"
        );

        const amountCell = createCell(
            (isIncome ? "+ " : "− ") +
            currency.format(Number(transaction.amount) || 0)
        );

        amountCell.className = isIncome
            ? "amount-income"
            : "amount-expense";

        const typeCell = document.createElement("td");
        const badge = document.createElement("span");

        badge.className = "type-badge " +
            (isIncome ? "income" : "expense");

        badge.textContent = isIncome ? "Income" : "Expense";
        typeCell.appendChild(badge);

        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";
        deleteButton.setAttribute(
            "aria-label",
            "Delete transaction " + (transaction.name || "")
        );

        deleteButton.addEventListener("click", function () {
            const confirmed = confirm(
                "Delete this transaction? This cannot be undone."
            );

            if (!confirmed) return;

            const originalIndex = transactions.findIndex(function (item) {
                return item.id === transaction.id;
            });

            if (originalIndex === -1) return;

            const removed = transactions.splice(originalIndex, 1)[0];

            if (!saveTransactions()) {
                transactions.splice(originalIndex, 0, removed);
                return;
            }

            updateSummary();
            renderTransactions();
        });

        actionCell.appendChild(deleteButton);

        row.append(
            nameCell,
            categoryCell,
            dateCell,
            amountCell,
            typeCell,
            actionCell
        );

        tableBody.appendChild(row);
    });
}

function openForm() {
    formSection.hidden = false;
    formMessage.textContent = "";
    nameInput.focus();

    formSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function closeForm() {
    formSection.hidden = true;
    formMessage.textContent = "";
    form.reset();
    dateInput.value = todayString();
}

document.getElementById("openFormButton").addEventListener(
    "click",
    openForm
);

document.getElementById("closeFormButton").addEventListener(
    "click",
    closeForm
);

document.getElementById("cancelFormButton").addEventListener(
    "click",
    closeForm
);

form.addEventListener("submit", function (event) {
    event.preventDefault();
    formMessage.textContent = "";

    const name = nameInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const date = dateInput.value;
    const note = noteInput.value.trim();

    if (!name) {
        formMessage.textContent = "Please enter a transaction name.";
        nameInput.focus();
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) {
        formMessage.textContent = "Enter a valid amount greater than zero.";
        amountInput.focus();
        return;
    }

    if (!["income", "expense"].includes(type)) {
        formMessage.textContent = "Select a valid transaction type.";
        return;
    }

    if (!date || date > todayString()) {
        formMessage.textContent = "Choose a valid date that is not in the future.";
        dateInput.focus();
        return;
    }

    const transaction = {
        id: (
            window.crypto && typeof window.crypto.randomUUID === "function"
        )
            ? window.crypto.randomUUID()
            : Date.now().toString() + Math.random().toString(16).slice(2),
        name: name,
        amount: amount,
        type: type,
        category: category,
        date: date,
        note: note
    };

    transactions.push(transaction);

    if (!saveTransactions()) {
        transactions.pop();
        return;
    }

    updateSummary();
    renderTransactions();
    closeForm();
});

searchInput.addEventListener("input", renderTransactions);
typeFilter.addEventListener("change", renderTransactions);
categoryFilter.addEventListener("change", renderTransactions);

document.getElementById("logoutButton").addEventListener("click", function () {
    window.location.href = "login.html";
});

updateSummary();
renderTransactions();

});
