// Data Layer: UserDao (Data Access Object)
// Responsible ONLY for SQL queries. No business logic lives here.
const db = require("./db");

const UserDao = {
  create(username, password, callback) {
    db.run(
      "INSERT INTO users (username, password, lastUpdate) VALUES (?, ?, ?)",
      [username, password, Date.now()],
      callback
    );
  },

  findByCredentials(username, password, callback) {
    db.get(
      "SELECT * FROM users WHERE username=? AND password=?",
      [username, password],
      callback
    );
  },

  findById(id, callback) {
    db.get("SELECT * FROM users WHERE id=?", [id], callback);
  },

  update(user, callback) {
    db.run(
      "UPDATE users SET score=?, auto1=?, auto2=?, perClick=?, lastUpdate=? WHERE id=?",
      [user.score, user.auto1, user.auto2, user.perClick, user.lastUpdate, user.id],
      callback
    );
  }
};

module.exports = UserDao;
