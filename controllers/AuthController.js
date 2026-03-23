// MVC Controller: receives HTTP requests, delegates to the Model,
// and sends back the response. Contains no business logic or SQL.
const User = require("../models/User");

exports.register = (req, res) => {
  const { username, password } = req.body;
  User.create(username, password, (err) => {
    if (err) return res.status(400).json({ error: "User already exists" });
    res.json({ message: "Registered successfully" });
  });
};

exports.login = (req, res) => {
  const { username, password } = req.body;
  User.findByCredentials(username, password, (err, user) => {
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    user.applyAutoIncome();
    user.save(() => res.json(user));
  });
};
