// server.js
// A simple Express.js backend for a Todo list API

const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Middleware to include static content from 'public' folder
app.use(express.static('public'))

// Serve index.html from 'public' at the '/' path
app.get('/',(req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
})

// Initialize SQLite DB
const db = new sqlite3.Database('todos.db', (err) => {
  if (err) {
    return console.error('Error opening database:', err.message);
  }
  console.log('Connected to the todos database.');
});

db.run(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    priority TEXT NOT NULL,
    isComplete INTEGER DEFAULT 0,
    isFun INTEGER
  )
`, (err) => {
  if (err) {
    return console.error("Error creating table:", err.message);
  }
  console.log("todos table created (if it didn't already exist).");
});


// GET all todo items at the '/todos' path
app.get('/todos', (req, res) => {
  db.all("SELECT * FROM todos", (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Error retrieving todos' });
    }
    res.json(rows);
  });
})

// GET a specific todo item by ID
app.get('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.get('SELECT * FROM todos WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Error retrieving todo'})
    }
    if(!row){
      return res.status(404).json({ message: 'Todo item not found' });
    }
    res.json(row);
  });
});

// POST a new todo item
app.post('/todos', (req, res) => {
  const { name, priority = 'low', isFun } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  const insertQuery = `
    INSERT INTO todos (name, priority, isFun)
    VALUES (?, ?, ?)
  `;
  db.run(insertQuery, [name, priority, isFun ? 1 : 0], function(err){
    if(err){
      return res.status(500).json({ message: 'Error creating todo' });
    }
    db.get('SELECT * FROM todos WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'Error retrieving todo'})
      }
      res.status(201).json(row);
    });
  });
});

// DELETE a todo item by ID
app.delete('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  db.run('DELETE FROM todos WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting todo'})
    }
    if(this.changes === 0){
      return res.status(404).json({ message: 'Todo item not found' });
    }
    res.json({ message: `Todo item ${id} deleted.` });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Todo API server running at http://localhost:${port}`);
});