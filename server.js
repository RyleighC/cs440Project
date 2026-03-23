// REST / Service-Oriented Architecture
// The server is a thin host that mounts independent services.
// Each service owns its own routes, logic, and data access.
const express = require("express");
const bodyParser = require("body-parser");

const authService = require("./services/AuthService");
const gameService = require("./services/GameService");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

app.use("/", authService);
app.use("/", gameService);

app.listen(3001, () => console.log("REST/SOA server running on http://localhost:3001"));
