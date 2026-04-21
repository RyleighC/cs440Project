const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3002;
const DB_DIR = process.env.DB_DIR || path.join(__dirname, "data");
const DB_PATH = path.join(DB_DIR, "player.db");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Player DB connection error:", err.message);
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS player_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    score INTEGER DEFAULT 0,
    auto1 INTEGER DEFAULT 0,
    auto2 INTEGER DEFAULT 0,
    perClick INTEGER DEFAULT 1,
    lastUpdate INTEGER DEFAULT 0
  )
`);

const VALID_UPGRADES = new Set(["perClick", "auto1", "auto2"]);

app.use(express.json());

app.get("/health", (_, res) => {
  res.json({ service: "player-service", status: "ok" });
});

app.post("/bootstrap", (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  db.run(
    "INSERT OR IGNORE INTO player_state (username, lastUpdate) VALUES (?, ?)",
    [username, Date.now()],
    () => loadAndSyncPlayer(username, res)
  );
});

app.post("/click", (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  loadAndSyncPlayer(username, res, (player) => {
    player.score += player.perClick;
  });
});

app.post("/sync", (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  loadAndSyncPlayer(username, res);
});

app.get("/internal/state/:username", (req, res) => {
  loadAndSyncPlayer(req.params.username, res);
});

app.post("/internal/purchase", (req, res) => {
  const { username, type, cost } = req.body;
  if (!username || !type || typeof cost !== "number") {
    return res.status(400).json({ error: "username, type, and numeric cost are required" });
  }

  if (!VALID_UPGRADES.has(type)) {
    return res.status(400).json({ error: "Invalid upgrade type" });
  }

  loadAndSyncPlayer(username, res, (player) => {
    if (player.score < cost) {
      throw new Error("Not enough score");
    }

    player.score -= cost;
    player[type] += 1;
  });
});

function loadAndSyncPlayer(username, res, mutation) {
  db.get("SELECT * FROM player_state WHERE username = ?", [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    if (!row) {
      return res.status(404).json({ error: "Player not found" });
    }

    const player = { ...row };
    applyAutoIncome(player);

    try {
      if (typeof mutation === "function") {
        mutation(player);
      }
    } catch (mutationError) {
      return res.status(400).json({ error: mutationError.message });
    }

    return savePlayer(player, (saveError) => {
      if (saveError) {
        return res.status(500).json({ error: "Failed to save player state" });
      }
      return res.json(player);
    });
  });
}

function applyAutoIncome(player) {
  const now = Date.now();
  if (!player.lastUpdate) {
    player.lastUpdate = now;
    return;
  }

  const seconds = Math.floor((now - player.lastUpdate) / 1000);
  if (seconds <= 0) {
    return;
  }

  player.score += ((player.auto1 * 1) + (player.auto2 * 5)) * seconds;
  player.lastUpdate = now;
}

function savePlayer(player, callback) {
  db.run(
    `
      UPDATE player_state
      SET score = ?, auto1 = ?, auto2 = ?, perClick = ?, lastUpdate = ?
      WHERE username = ?
    `,
    [player.score, player.auto1, player.auto2, player.perClick, player.lastUpdate, player.username],
    callback
  );
}

app.listen(PORT, () => {
  console.log(`player-service running on http://localhost:${PORT}`);
});
