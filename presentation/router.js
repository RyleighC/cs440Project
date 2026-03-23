// Presentation Layer: router
// Responsible ONLY for HTTP: parsing requests and formatting responses.
// No business logic. Delegates everything to the Business layer above it.
const express = require("express");
const router = express.Router();
const AuthBusiness = require("../business/AuthBusiness");
const GameBusiness = require("../business/GameBusiness");

router.post("/register", (req, res) => {
  AuthBusiness.register(req.body.username, req.body.password, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(result);
  });
});

router.post("/login", (req, res) => {
  AuthBusiness.login(req.body.username, req.body.password, (err, user) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(user);
  });
});

router.post("/click", (req, res) => {
  GameBusiness.click(req.body.id, (err, user) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(user);
  });
});

router.post("/upgrade", (req, res) => {
  GameBusiness.upgrade(req.body.id, req.body.type, (err, user) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(user);
  });
});

router.post("/sync", (req, res) => {
  GameBusiness.sync(req.body.id, (err, user) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(user);
  });
});

module.exports = router;
