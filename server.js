// ===== In-memory task list =====
let tasks = [
  {
    id: 1,
    text: "Learn Express",
    completed: false,
    dueDate: "2025-09-20",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    text: "Build To-Do App",
    completed: false,
    dueDate: "2025-09-25",
    createdAt: new Date().toISOString(),
  },
];
let nextId = 3;

const express = require("express");
const app = express();
const PORT = 3000;

// ===== Middleware =====
app.use(express.json());
app.use(express.static("public")); // serve index.html, script.js, styles.css

// ===== Routes =====

// Get all tasks
app.get("/api/tasks", (req, res) => {
  res.json(tasks);
});

// Add a new task
app.post("/api/tasks", (req, res) => {
  const { text, dueDate } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Task text is required" });
  }

  const newTask = {
    id: nextId++,
    text,
    completed: false,
    dueDate: dueDate || null,
    createdAt: new Date().toISOString(),
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

// Get task stats
app.get("/api/stats", (req, res) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const upcoming = total - completed;

  res.json({ total, completed, upcoming });
});

// Update a task
app.put("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { text, completed, dueDate } = req.body;

  const task = tasks.find((t) => t.id === parseInt(id));
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  if (text !== undefined) task.text = text;
  if (completed !== undefined) task.completed = completed;
  if (dueDate !== undefined) task.dueDate = dueDate;

  res.json(task);
});

// Delete a task
app.delete("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  tasks = tasks.filter((t) => t.id !== parseInt(id));
  res.status(204).end();
});

// ===== Start server =====
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
