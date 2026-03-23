// Model-View-Controller Architecture
// Models own data + DB logic. Controllers handle HTTP. Views are in /views.
const express = require("express");
const bodyParser = require("body-parser");
const routes = require("./routes/index");

const app = express();
app.use(bodyParser.json());
app.use(express.static("views")); // Views directory serves the HTML/CSS/JS

app.use("/", routes);

app.listen(3002, () => console.log("MVC server running on http://localhost:3002"));
