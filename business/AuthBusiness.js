// Business Layer: AuthBusiness
// Contains ONLY business rules for authentication.
// No HTTP knowledge (no req/res). Calls the Data layer below it.
const UserDao = require("../data/UserDao");
const GameBusiness = require("./GameBusiness");

const AuthBusiness = {
  register(username, password, callback) {
    UserDao.create(username, password, (err) => {
      if (err) return callback(new Error("User already exists"));
      callback(null, { message: "Registered successfully" });
    });
  },

  login(username, password, callback) {
    UserDao.findByCredentials(username, password, (err, row) => {
      if (!row) return callback(new Error("Invalid credentials"));
      const user = { ...row };
      GameBusiness.applyAutoIncome(user);
      UserDao.update(user, () => callback(null, user));
    });
  }
};

module.exports = AuthBusiness;
