// GameService - SOA: self-contained service that owns its routes,
// business logic, and data access for the game domain.
const express = require("express");
const router = express.Router();
const db = require("../database/db");

const UPGRADE_CONFIG = {
  perClick: { base: 10, multiplier: 1.5 },
  auto1:    { base: 20, multiplier: 1.6 },
  auto2:    { base: 50, multiplier: 1.7 }
};

router.post("/click", (req, res) => {
  db.get("SELECT * FROM users WHERE id=?", [req.body.id], (err, row) => {
    if (!row) return res.status(400).json({ error: "User not found" });
    const user = { ...row };
    applyAutoIncome(user);
    user.score += user.perClick;
    saveUser(user, () => res.json(user));
  });
});

router.post("/upgrade", (req, res) => {
  const { id, type } = req.body;
  db.get("SELECT * FROM users WHERE id=?", [id], (err, row) => {
    if (!row) return res.status(400).json({ error: "User not found" });
    const user = { ...row };
    applyAutoIncome(user);

    const config = UPGRADE_CONFIG[type];
    if (!config) return res.status(400).json({ error: "Invalid upgrade type" });

    const cost = Math.floor(config.base * Math.pow(config.multiplier, user[type]));
    if (user.score < cost) return res.status(400).json({ error: "Not enough score" });

    user.score -= cost;
    user[type] += 1;
    saveUser(user, () => res.json(user));
  });
});

router.post("/sync", (req, res) => {
  db.get("SELECT * FROM users WHERE id=?", [req.body.id], (err, row) => {
    if (!row) return res.status(400).json({ error: "User not found" });
    const user = { ...row };
    applyAutoIncome(user);
    saveUser(user, () => res.json(user));
  });
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

function saveUser(user, callback) {
  db.run(
    "UPDATE users SET score=?, auto1=?, auto2=?, perClick=?, lastUpdate=? WHERE id=?",
    [user.score, user.auto1, user.auto2, user.perClick, user.lastUpdate, user.id],
    callback
  );
}

module.exports = router;
