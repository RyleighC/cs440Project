// MVC Routes: map URLs to the correct controller action.
const express = require("express");
const router = express.Router();
const authController = require("../controllers/AuthController");
const gameController = require("../controllers/GameController");

router.post("/register", authController.register);
router.post("/login",    authController.login);
router.post("/click",    gameController.click);
router.post("/upgrade",  gameController.upgrade);
router.post("/sync",     gameController.sync);

module.exports = router;
