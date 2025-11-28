import { createServer } from "http";
import { readFileSync, writeFileSync, existsSync } from "fs";

const DB_FILE = "tasks.json";
const PORT = 5000;

const readTasks = () => {
  try {
    if (!existsSync(DB_FILE)) return [];
    return JSON.parse(readFileSync(DB_FILE, "utf8"));
  } catch {
    return [];
  }
};

const writeTasks = (tasks) => {
  writeFileSync(DB_FILE, JSON.stringify(tasks, null, 2));
};

const server = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "OK", message: "Backend running" }));
    return;
  }

  if (req.method === "GET" && req.url === "/api/tasks") {
    const tasks = readTasks();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))));
    return;
  }

  if (req.method === "POST" && req.url === "/api/tasks") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const { title, description, priority = "medium" } = JSON.parse(body);
        if (!title?.trim()) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Title required" }));
          return;
        }

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
        
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify(newTask));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  if (req.method === "PUT" && req.url.startsWith("/api/tasks/")) {
    const id = req.url.split("/")[3];
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const { completed } = JSON.parse(body);
        const tasks = readTasks();
        const taskIndex = tasks.findIndex(task => task.id === id);
        
        if (taskIndex === -1) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Task not found" }));
          return;
        }

        tasks[taskIndex].completed = completed;
        writeTasks(tasks);
        
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(tasks[taskIndex]));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  if (req.method === "DELETE" && req.url.startsWith("/api/tasks/")) {
    const id = req.url.split("/")[3];
    const tasks = readTasks();
    const filteredTasks = tasks.filter(task => task.id !== id);
    
    if (tasks.length === filteredTasks.length) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Task not found" }));
      return;
    }

    writeTasks(filteredTasks);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Task deleted" }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Route not found" }));
});

server.listen(PORT, () => {
  console.log(" Backend HTTP ES Module démarré sur http://localhost:" + PORT);
});
