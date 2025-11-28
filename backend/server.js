import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();
const PORT = 5000;
const DB_FILE = "tasks.json";

app.use(cors());
app.use(express.json());

// Lire les tâches
const readTasks = () => {
  try {
    if (!fs.existsSync(DB_FILE)) return [];
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    return [];
  }
};

// Écrire les tâches
const writeTasks = (tasks) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(tasks, null, 2));
};

// Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Backend running" });
});

app.get("/api/tasks", (req, res) => {
  const tasks = readTasks();
  res.json(tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.post("/api/tasks", (req, res) => {
  const { title, description, priority = "medium" } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: "Title required" });

  const tasks = readTasks();
  const newTask = {
    id: Date.now().toString(),
    title: title.trim(),
    description: description?.trim() || "",
    priority,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  writeTasks(tasks);
  res.status(201).json(newTask);
});

app.put("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  
  const tasks = readTasks();
  const taskIndex = tasks.findIndex(task => task.id === id);
  if (taskIndex === -1) return res.status(404).json({ error: "Task not found" });

  tasks[taskIndex].completed = completed;
  writeTasks(tasks);
  res.json(tasks[taskIndex]);
});

app.delete("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  const tasks = readTasks();
  const filteredTasks = tasks.filter(task => task.id !== id);
  
  if (tasks.length === filteredTasks.length) {
    return res.status(404).json({ error: "Task not found" });
  }

  writeTasks(filteredTasks);
  res.json({ message: "Task deleted" });
});

app.listen(PORT, () => {
  console.log(" Backend running on http://localhost:" + PORT);
});
