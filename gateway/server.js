const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const PLAYER_SERVICE_URL = process.env.PLAYER_SERVICE_URL || "http://localhost:3002";
const UPGRADE_SERVICE_URL = process.env.UPGRADE_SERVICE_URL || "http://localhost:3003";

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/health", (_, res) => {
  res.json({ service: "api-gateway", status: "ok" });
});

app.post("/api/auth/register", async (req, res) => {
  return proxyPost(`${AUTH_SERVICE_URL}/register`, req.body, res);
});

app.post("/api/auth/login", async (req, res) => {
  return proxyPost(`${AUTH_SERVICE_URL}/login`, req.body, res);
});

app.post("/api/player/bootstrap", requireAuth, async (req, res) => {
  return proxyPost(`${PLAYER_SERVICE_URL}/bootstrap`, { username: req.user }, res);
});

app.post("/api/player/click", requireAuth, async (req, res) => {
  return proxyPost(`${PLAYER_SERVICE_URL}/click`, { username: req.user }, res);
});

app.post("/api/player/sync", requireAuth, async (req, res) => {
  return proxyPost(`${PLAYER_SERVICE_URL}/sync`, { username: req.user }, res);
});

app.post("/api/upgrade/buy", requireAuth, async (req, res) => {
  return proxyPost(
    `${UPGRADE_SERVICE_URL}/buy`,
    { username: req.user, type: req.body.type },
    res
  );
});

app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [, token] = authHeader.split(" ");
  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  try {
    const username = Buffer.from(token, "base64url").toString("utf8");
    if (!username) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = username;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

async function proxyPost(url, payload, res) {
  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {})
    });

    const body = await safeJson(upstream);
    return res.status(upstream.status).json(body);
  } catch (error) {
    return res.status(502).json({ error: "Downstream service unavailable" });
  }
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch (err) {
    return { error: "Invalid JSON response from downstream service" };
  }
}

app.listen(PORT, () => {
  console.log(`api-gateway running on http://localhost:${PORT}`);
});
