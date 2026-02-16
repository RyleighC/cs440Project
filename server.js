const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));


class DatabaseManager {
  constructor() {
    this.db = new sqlite3.Database("./database.db");
    this.initialize();
  }

  initialize() {
    this.db.run(`
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
  }

  createUser(username, password, callback) {
    this.db.run(
      "INSERT INTO users (username, password, lastUpdate) VALUES (?, ?, ?)",
      [username, password, Date.now()],
      callback
    );
  }

  getUser(username, password, callback) {
    this.db.get(
      "SELECT * FROM users WHERE username=? AND password=?",
      [username, password],
      callback
    );
  }

  getUserById(id, callback) {
    this.db.get("SELECT * FROM users WHERE id=?", [id], callback);
  }

  updateUser(user, callback) {
    this.db.run(
      `UPDATE users 
       SET score=?, auto1=?, auto2=?, perClick=?, lastUpdate=? 
       WHERE id=?`,
      [
        user.score,
        user.auto1,
        user.auto2,
        user.perClick,
        user.lastUpdate,
        user.id
      ],
      callback
    );
  }
}


class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.score = data.score;
    this.auto1 = data.auto1;
    this.auto2 = data.auto2;
    this.perClick = data.perClick;
    this.lastUpdate = data.lastUpdate;
  }
}

class GameService {
  constructor(database) {
    this.database = database;
  }

  calculateCost(base, level, multiplier) {
    return Math.floor(base * Math.pow(multiplier, level));
  }

  getUpgradeConfig(type) {
    const configs = {
      perClick: { base: 10, multiplier: 1.5 },
      auto1: { base: 20, multiplier: 1.6 },
      auto2: { base: 50, multiplier: 1.7 }
    };
    return configs[type];
  }

  applyAutoIncome(user) {
    const now = Date.now();

    if (!user.lastUpdate) {
      user.lastUpdate = now;
      return;
    }

    const secondsPassed = Math.floor((now - user.lastUpdate) / 1000);

    if (secondsPassed > 0) {
      const incomePerSecond =
        (user.auto1 * 1) +
        (user.auto2 * 5);

      const totalIncome = incomePerSecond * secondsPassed;

      user.score += totalIncome;
      user.lastUpdate = now;
    }
  }

  click(user) {
    user.score += user.perClick;
  }

  buyUpgrade(user, type) {
    const config = this.getUpgradeConfig(type);
    if (!config) throw new Error("Invalid upgrade type");

    const level = user[type];
    const cost = this.calculateCost(config.base, level, config.multiplier);

    if (user.score < cost) {
      throw new Error("Not enough score");
    }

    user.score -= cost;
    user[type] += 1;
  }
}

const database = new DatabaseManager();
const gameService = new GameService(database);


app.post("/register", (req, res) => {
  database.createUser(req.body.username, req.body.password, (err) => {
    if (err) return res.status(400).json({ error: "User exists" });
    res.json({ message: "Registered successfully" });
  });
});

app.post("/login", (req, res) => {
  database.getUser(req.body.username, req.body.password, (err, row) => {
    if (!row) return res.status(400).json({ error: "Invalid login" });

    const user = new User(row);

    gameService.applyAutoIncome(user);

    database.updateUser(user, () => {
      res.json(user);
    });
  });
});

app.post("/click", (req, res) => {
  database.getUserById(req.body.id, (err, row) => {
    if (!row) return res.status(400).json({ error: "User not found" });

    const user = new User(row);

    gameService.applyAutoIncome(user);
    gameService.click(user);

    database.updateUser(user, () => {
      res.json(user);
    });
  });
});

app.post("/upgrade", (req, res) => {
  const { id, type } = req.body;

  database.getUserById(id, (err, row) => {
    if (!row) return res.status(400).json({ error: "User not found" });

    const user = new User(row);

    gameService.applyAutoIncome(user);

    try {
      gameService.buyUpgrade(user, type);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    database.updateUser(user, () => {
      res.json(user);
    });
  });
});
app.post("/sync", (req, res) => {
  database.getUserById(req.body.id, (err, row) => {
    if (!row) return res.status(400).json({ error: "User not found" });

    const user = new User(row);
    gameService.applyAutoIncome(user);

    database.updateUser(user, () => {
      res.json(user);
    });
  });
});
app.listen(3000, () =>
  console.log("Server running on http://localhost:3000")

);
