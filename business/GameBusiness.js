// Business Layer: GameBusiness
// Contains ONLY game rules and calculations.
// No HTTP knowledge (no req/res). Calls the Data layer below it.
const UserDao = require("../data/UserDao");

const UPGRADE_CONFIG = {
  perClick: { base: 10, multiplier: 1.5 },
  auto1:    { base: 20, multiplier: 1.6 },
  auto2:    { base: 50, multiplier: 1.7 }
};

const GameBusiness = {
  applyAutoIncome(user) {
    const now = Date.now();
    if (!user.lastUpdate) { user.lastUpdate = now; return; }
    const seconds = Math.floor((now - user.lastUpdate) / 1000);
    if (seconds > 0) {
      user.score += ((user.auto1 * 1) + (user.auto2 * 5)) * seconds;
      user.lastUpdate = now;
    }
  },

  click(userId, callback) {
    UserDao.findById(userId, (err, row) => {
      if (!row) return callback(new Error("User not found"));
      const user = { ...row };
      GameBusiness.applyAutoIncome(user);
      user.score += user.perClick;
      UserDao.update(user, () => callback(null, user));
    });
  },

  upgrade(userId, type, callback) {
    UserDao.findById(userId, (err, row) => {
      if (!row) return callback(new Error("User not found"));
      const user = { ...row };
      GameBusiness.applyAutoIncome(user);

      const config = UPGRADE_CONFIG[type];
      if (!config) return callback(new Error("Invalid upgrade type"));

      const cost = Math.floor(config.base * Math.pow(config.multiplier, user[type]));
      if (user.score < cost) return callback(new Error("Not enough score"));

      user.score -= cost;
      user[type] += 1;
      UserDao.update(user, () => callback(null, user));
    });
  },

  sync(userId, callback) {
    UserDao.findById(userId, (err, row) => {
      if (!row) return callback(new Error("User not found"));
      const user = { ...row };
      GameBusiness.applyAutoIncome(user);
      UserDao.update(user, () => callback(null, user));
    });
  }
};

module.exports = GameBusiness;
