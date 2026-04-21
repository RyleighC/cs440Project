const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3001;
const DB_DIR = process.env.DB_DIR || path.join(__dirname, "data");
const DB_PATH = path.join(DB_DIR, "auth.db");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Auth DB connection error:", err.message);
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )
`);

app.use(express.json());

app.get("/health", (_, res) => {
  res.json({ service: "auth-service", status: "ok" });
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  db.run(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username, password],
    function registerCallback(err) {
      if (err) {
        return res.status(400).json({ error: "User already exists" });
      }

      return res.json({
        message: "Registered successfully",
        userId: this.lastID
      });
    }
  );
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  db.get(
    "SELECT id, username FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      if (!row) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = Buffer.from(row.username, "utf8").toString("base64url");
      return res.json({
        token,
        user: {
          id: row.id,
          username: row.username
        }
      });
    }
  );
});

app.listen(PORT, () => {
  console.log(`auth-service running on http://localhost:${PORT}`);
});
