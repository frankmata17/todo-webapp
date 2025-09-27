// ===== To-Do List App (Web + API) =====
// Features: add / edit (inline) / delete / toggle complete tasks
// Views: list or card view, dark mode, and a recursion demo (countdown).

let currentView = "list"; // "list" or "cards"

// Restore dark mode if previously enabled
if (localStorage.getItem("darkMode") === "enabled") {
  document.body.classList.add("dark");
}

/* ===== Event listeners (wire up UI elements) ===== */
const form = document.getElementById("task-form");
if (form) {
  // Intercept form submit (prevents page reload)
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    addTask();
  });
}

// Switch between list and card view
document.getElementById("listViewBtn")?.addEventListener("click", () => {
  currentView = "list";
  loadTasks();
});
document.getElementById("cardViewBtn")?.addEventListener("click", () => {
  currentView = "cards";
  loadTasks();
});

// Dark mode toggle
const darkToggle = document.getElementById("darkModeToggle");
if (darkToggle) {
  darkToggle.addEventListener("click", toggleDarkMode);
}

/* ===== Backend / API functions ===== */

// Fetch all tasks from the backend and render them
async function loadTasks() {
  try {
    const res = await fetch("/api/tasks");
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const tasks = await res.json();
    renderTasks(tasks);
  } catch (err) {
    console.error("Error loading tasks:", err);
  }
}

// Send a new task to the backend then reload
async function addTask() {
  const input = document.getElementById("task-input");
  const dateInput = document.getElementById("task-date");
  if (!input) return console.error("Missing #task-input element in HTML");

  const text = input.value.trim();
  const dueDate = dateInput ? dateInput.value || null : null;

  if (!text) {
    alert("Task cannot be empty!");
    return;
  }

  try {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, dueDate })
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || res.statusText || "Failed to add task");
    }

    // Clear inputs and refresh list
    input.value = "";
    if (dateInput) dateInput.value = "";
    await loadTasks();
  } catch (err) {
    console.error("Add task failed:", err);
    alert("Failed to add task: " + err.message);
  }
}

// Toggle a task's completed state on the backend and refresh
async function toggleTask(id, completed) {
  try {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed })
    });
    if (!res.ok) throw new Error("Failed to toggle task");
    await loadTasks();
  } catch (err) {
    console.error("Toggle failed:", err);
  }
}

// Delete task by id then refresh
async function deleteTask(id) {
  try {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) throw new Error("Failed to delete");
    await loadTasks();
  } catch (err) {
    console.error("Delete failed:", err);
  }
}

/* ===== UI / Rendering functions ===== */

// Render the list of tasks into #taskContainer using currentView
function renderTasks(tasks) {
  const container = document.getElementById("taskContainer");
  if (!container) return console.error("Missing #taskContainer element in HTML");
  container.innerHTML = "";
  container.className = currentView === "cards" ? "cards" : "";

  tasks.forEach((task) => {
    if (currentView === "list") {
      // --- List view (single column list items) ---
      const li = document.createElement("li");

      const textEl = document.createElement("span");
      textEl.textContent = task.text;

      const dueEl = document.createElement("span");
      dueEl.textContent = ` (Due: ${task.dueDate || "N/A"})`;

      if (task.completed) li.classList.add("completed");

      // Action buttons
      const toggleBtn = createButton(task.completed ? "✅" : "✔️", () => toggleTask(task.id, task.completed));
      const editBtn = createButton("✏️", () => makeEditable(task, textEl, dueEl));
      const deleteBtn = createButton("🗑️", () => deleteTask(task.id), "delete");

      li.append(textEl, dueEl, toggleBtn, editBtn, deleteBtn);
      container.appendChild(li);
    } else {
      // --- Card view (tile cards) ---
      const card = document.createElement("div");
      card.className = "task-card";
      if (task.completed) card.classList.add("completed");

      const textEl = document.createElement("p");
      textEl.textContent = task.text;

      const dueEl = document.createElement("small");
      dueEl.textContent = `Due: ${task.dueDate || "N/A"}`;

      const actions = document.createElement("div");
      actions.className = "task-actions";

      const toggleBtn = createButton(task.completed ? "✅" : "✔️", () => toggleTask(task.id, task.completed));
      const editBtn = createButton("✏️", () => makeEditable(task, textEl, dueEl));
      const deleteBtn = createButton("🗑️", () => deleteTask(task.id), "delete");

      actions.append(toggleBtn, editBtn, deleteBtn);
      card.append(textEl, dueEl, actions);
      container.appendChild(card);
    }
  });
}

// Helper: create a button with icon and click handler
function createButton(icon, action, extraClass = "") {
  const btn = document.createElement("button");
  btn.innerHTML = icon;
  if (extraClass) btn.classList.add(extraClass);
  btn.onclick = action;
  return btn;
}

/* ===== Inline editing support ===== */

// Replace task text & due date elements with inputs so user can edit inline.
// Saves to backend on blur or Enter.
function makeEditable(task, textEl, dueEl) {
  // Create editable inputs
  const textInput = document.createElement("input");
  textInput.type = "text";
  textInput.value = task.text;
  textInput.className = "edit-text";

  const dueInput = document.createElement("input");
  dueInput.type = "date";
  dueInput.value = task.dueDate || "";
  dueInput.className = "edit-date";

  // Swap elements for inputs
  try {
    textEl.replaceWith(textInput);
    dueEl.replaceWith(dueInput);
  } catch (err) {
    // If replaceWith fails (different element types), still try to insert next to them
    textEl.parentNode?.insertBefore(textInput, textEl);
    dueEl.parentNode?.insertBefore(dueInput, dueEl);
    textEl.remove();
    dueEl.remove();
  }

  textInput.focus();

  // Save helper
  const saveChanges = async () => {
    const newText = textInput.value.trim();
    const newDueDate = dueInput.value || null;

    if (newText === "") {
      alert("Task cannot be empty!");
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText, dueDate: newDueDate })
      });
      if (!res.ok) throw new Error("Failed to save edits");
      await loadTasks();
    } catch (err) {
      console.error("Edit save failed:", err);
      alert("Could not save changes.");
    }
  };

  // Save on blur or Enter
  textInput.addEventListener("blur", saveChanges);
  dueInput.addEventListener("blur", saveChanges);
  textInput.addEventListener("keydown", (e) => { if (e.key === "Enter") textInput.blur(); });
  dueInput.addEventListener("keydown", (e) => { if (e.key === "Enter") dueInput.blur(); });
}

/* ===== Dark Mode ===== */

// Toggle dark mode and persist preference
function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark") ? "enabled" : "disabled");
}

/* ===== Recursion demo (simple countdown) ===== */

// Demonstrate recursion in console (not required for UI)
function countdown(seconds) {
  if (seconds <= 0) {
    console.log("Countdown finished!");
    return;
  }
  console.log(seconds);
  setTimeout(() => countdown(seconds - 1), 1000);
}
countdown(5);

/* ===== Initial load ===== */
document.addEventListener("DOMContentLoaded", loadTasks);
