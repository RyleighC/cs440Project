// Layered Architecture
// Strict horizontal layers: Presentation -> Business -> Data -> Database
// Each layer only communicates with the layer directly below it.
const express = require("express");
const bodyParser = require("body-parser");
const router = require("./presentation/router");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

app.use("/", router);

app.listen(3003, () => console.log("Layered server running on http://localhost:3003"));
