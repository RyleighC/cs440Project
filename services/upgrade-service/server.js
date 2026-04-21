const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3003;
const PLAYER_SERVICE_URL = process.env.PLAYER_SERVICE_URL || "http://localhost:3002";
const DB_DIR = process.env.DB_DIR || path.join(__dirname, "data");
const DB_PATH = path.join(DB_DIR, "upgrade.db");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Upgrade DB connection error:", err.message);
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS upgrade_purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    upgradeType TEXT NOT NULL,
    cost INTEGER NOT NULL,
    purchasedAt INTEGER NOT NULL
  )
`);

const UPGRADE_CONFIG = {
  perClick: { base: 10, multiplier: 1.5 },
  auto1: { base: 20, multiplier: 1.6 },
  auto2: { base: 50, multiplier: 1.7 }
};

app.use(express.json());

app.get("/health", (_, res) => {
  res.json({ service: "upgrade-service", status: "ok" });
});

app.post("/buy", async (req, res) => {
  const { username, type } = req.body;
  if (!username || !type) {
    return res.status(400).json({ error: "username and type are required" });
  }

  const config = UPGRADE_CONFIG[type];
  if (!config) {
    return res.status(400).json({ error: "Invalid upgrade type" });
  }

  try {
    const playerResponse = await fetch(`${PLAYER_SERVICE_URL}/internal/state/${encodeURIComponent(username)}`);
    if (!playerResponse.ok) {
      const payload = await safeJson(playerResponse);
      return res.status(playerResponse.status).json(payload);
    }

    const player = await playerResponse.json();
    const cost = Math.floor(config.base * Math.pow(config.multiplier, player[type]));

    const purchaseResponse = await fetch(`${PLAYER_SERVICE_URL}/internal/purchase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, type, cost })
    });

    const purchasePayload = await safeJson(purchaseResponse);
    if (!purchaseResponse.ok) {
      return res.status(purchaseResponse.status).json(purchasePayload);
    }

    db.run(
      "INSERT INTO upgrade_purchases (username, upgradeType, cost, purchasedAt) VALUES (?, ?, ?, ?)",
      [username, type, cost, Date.now()],
      (err) => {
        if (err) {
          return res.status(500).json({ error: "Purchase succeeded but failed to record upgrade event" });
        }

        return res.json(purchasePayload);
      }
    );
  } catch (error) {
    return res.status(502).json({ error: "Could not reach player-service" });
  }
});

async function safeJson(response) {
  try {
    return await response.json();
  } catch (err) {
    return { error: "Invalid response from downstream service" };
  }
}

app.listen(PORT, () => {
  console.log(`upgrade-service running on http://localhost:${PORT}`);
});
