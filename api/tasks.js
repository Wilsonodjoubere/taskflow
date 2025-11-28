import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DB_FILE = join('/tmp', 'tasks.json');

export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const readTasks = () => {
    try {
      if (!existsSync(DB_FILE)) return [];
      return JSON.parse(readFileSync(DB_FILE, 'utf8'));
    } catch {
      return [];
    }
  };

  const writeTasks = (tasks) => {
    writeFileSync(DB_FILE, JSON.stringify(tasks, null, 2));
  };

  // GET all tasks
  if (req.method === 'GET') {
    const tasks = readTasks();
    return res.status(200).json(tasks);
  }

  // POST new task
  if (req.method === 'POST') {
    const { title, description, priority = 'medium' } = req.body;
    
    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title required' });
    }

    const tasks = readTasks();
    const newTask = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description?.trim() || '',
      priority,
      completed: false,
      createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    writeTasks(tasks);
    
    return res.status(201).json(newTask);
  }

  // PUT update task
  if (req.method === 'PUT') {
    const { id, completed } = req.body;
    
    const tasks = readTasks();
    const taskIndex = tasks.findIndex(task => task.id === id);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    tasks[taskIndex].completed = completed;
    writeTasks(tasks);
    
    return res.status(200).json(tasks[taskIndex]);
  }

  // DELETE task
  if (req.method === 'DELETE') {
    const { id } = req.body;
    
    const tasks = readTasks();
    const filteredTasks = tasks.filter(task => task.id !== id);
    
    if (tasks.length === filteredTasks.length) {
      return res.status(404).json({ error: 'Task not found' });
    }

    writeTasks(filteredTasks);
    return res.status(200).json({ message: 'Task deleted' });
  }

  return res.status(404).json({ error: 'Method not allowed' });
}
