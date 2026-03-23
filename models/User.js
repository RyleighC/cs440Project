// MVC Model: owns the data structure AND all database operations for users.
// Controllers ask the model for data — the model knows how to persist itself.
const db = require("./db");

const UPGRADE_CONFIG = {
  perClick: { base: 10, multiplier: 1.5 },
  auto1:    { base: 20, multiplier: 1.6 },
  auto2:    { base: 50, multiplier: 1.7 }
};

class User {
  constructor(row) {
    this.id = row.id;
    this.username = row.username;
    this.score = row.score;
    this.auto1 = row.auto1;
    this.auto2 = row.auto2;
    this.perClick = row.perClick;
    this.lastUpdate = row.lastUpdate;
  }

  // --- Database operations (model owns persistence) ---

  static create(username, password, callback) {
    db.run(
      "INSERT INTO users (username, password, lastUpdate) VALUES (?, ?, ?)",
      [username, password, Date.now()],
      (err) => callback(err)
    );
  }

  static findByCredentials(username, password, callback) {
    db.get(
      "SELECT * FROM users WHERE username=? AND password=?",
      [username, password],
      (err, row) => callback(err, row ? new User(row) : null)
    );
  }

  static findById(id, callback) {
    db.get("SELECT * FROM users WHERE id=?", [id], (err, row) => {
      callback(err, row ? new User(row) : null);
    });
  }

  save(callback) {
    db.run(
      "UPDATE users SET score=?, auto1=?, auto2=?, perClick=?, lastUpdate=? WHERE id=?",
      [this.score, this.auto1, this.auto2, this.perClick, this.lastUpdate, this.id],
      callback
    );
  }

  // --- Business rules (model owns its own logic) ---

  applyAutoIncome() {
    const now = Date.now();
    if (!this.lastUpdate) { this.lastUpdate = now; return; }
    const seconds = Math.floor((now - this.lastUpdate) / 1000);
    if (seconds > 0) {
      this.score += ((this.auto1 * 1) + (this.auto2 * 5)) * seconds;
      this.lastUpdate = now;
    }
  }

  click() {
    this.score += this.perClick;
  }

  buyUpgrade(type) {
    const config = UPGRADE_CONFIG[type];
    if (!config) throw new Error("Invalid upgrade type");
    const cost = Math.floor(config.base * Math.pow(config.multiplier, this[type]));
    if (this.score < cost) throw new Error("Not enough score");
    this.score -= cost;
    this[type] += 1;
  }
}

module.exports = User;
