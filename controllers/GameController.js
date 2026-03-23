// MVC Controller: receives HTTP requests, delegates to the Model,
// and sends back the response. Contains no business logic or SQL.
const User = require("../models/User");

exports.click = (req, res) => {
  User.findById(req.body.id, (err, user) => {
    if (!user) return res.status(400).json({ error: "User not found" });
    user.applyAutoIncome();
    user.click();
    user.save(() => res.json(user));
  });
};

exports.upgrade = (req, res) => {
  const { id, type } = req.body;
  User.findById(id, (err, user) => {
    if (!user) return res.status(400).json({ error: "User not found" });
    user.applyAutoIncome();
    try {
      user.buyUpgrade(type);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    user.save(() => res.json(user));
  });
};

exports.sync = (req, res) => {
  User.findById(req.body.id, (err, user) => {
    if (!user) return res.status(400).json({ error: "User not found" });
    user.applyAutoIncome();
    user.save(() => res.json(user));
  });
};
