// AuthService - SOA: self-contained service that owns its routes,
// business logic, and data access for the authentication domain.
const express = require("express");
const router = express.Router();
const db = require("../database/db");

router.post("/register", (req, res) => {
  const { username, password } = req.body;
  db.run(
    "INSERT INTO users (username, password, lastUpdate) VALUES (?, ?, ?)",
    [username, password, Date.now()],
    (err) => {
      if (err) return res.status(400).json({ error: "User already exists" });
      res.json({ message: "Registered successfully" });
    }
  );
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE username=? AND password=?",
    [username, password],
    (err, row) => {
      if (!row) return res.status(400).json({ error: "Invalid credentials" });

      const user = { ...row };
      applyAutoIncome(user);

      db.run(
        "UPDATE users SET score=?, lastUpdate=? WHERE id=?",
        [user.score, user.lastUpdate, user.id],
        () => res.json(user)
      );
    }
  );
});

function applyAutoIncome(user) {
  const now = Date.now();
  if (!user.lastUpdate) { user.lastUpdate = now; return; }
  const seconds = Math.floor((now - user.lastUpdate) / 1000);
  if (seconds > 0) {
    user.score += ((user.auto1 * 1) + (user.auto2 * 5)) * seconds;
    user.lastUpdate = now;
  }
}

module.exports = router;
