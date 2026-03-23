// Data Layer: database connection
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db", (err) => {
  if (err) console.error("Database connection error:", err.message);
});

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    score INTEGER DEFAULT 0,
    auto1 INTEGER DEFAULT 0,
    auto2 INTEGER DEFAULT 0,
    perClick INTEGER DEFAULT 1,
    lastUpdate INTEGER DEFAULT 0
  )
`);

module.exports = db;
