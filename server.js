const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const { createClient } = require("redis");

const app = express();
const PORT = 3000;

// Redis client setup
const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = process.env.REDIS_PORT || "6379";
const redisPassword = process.env.REDIS_PASSWORD || "";
const redisUrl = redisPassword
  ? `redis://:${encodeURIComponent(redisPassword)}@${redisHost}:${redisPort}`
  : `redis://${redisHost}:${redisPort}`;

const redisClient = createClient({ url: redisUrl });

redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

async function connectRedis() {
  if (process.env.NODE_ENV === "test") {
    return;
  }
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log("Connected to Redis");
    }
  } catch (err) {
    console.error("Failed to connect to Redis:", err.message);
  }
}

connectRedis();

// Lightweight health endpoint for container healthcheck
app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Middleware
app.use(bodyParser.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// Serve input JSON files
app.use("/input", express.static(path.join(__dirname, "input")));

// Serve output folder (for history.json)
app.use("/output", express.static(path.join(__dirname, "output")));

// Resolve output directory (configurable for tests)
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.join(__dirname, "output");

// API to get history data
app.get("/history", async (req, res) => {
  const historyPath = path.join(OUTPUT_DIR, "history.json");
  try {
    // Try Redis first
    await connectRedis();
    const value = await redisClient.get("history");
    if (value) {
      res.status(200).json(JSON.parse(value));
      return;
    }
  } catch (err) {
    console.warn("Redis read failed, falling back to file:", err.message);
  }

  // Fallback to file
  fs.readFile(historyPath, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.status(200).json({});
      } else {
        console.error("Error reading history.json:", err);
        res.status(500).send("Failed to read history");
      }
      return;
    }
    try {
      res.status(200).json(JSON.parse(data || "{}"));
    } catch (parseErr) {
      console.error("Error parsing history.json:", parseErr);
      res.status(200).json({});
    }
  });
});

// API to save history data
app.post("/save-history", async (req, res) => {
  const historyPath = path.join(OUTPUT_DIR, "history.json");
  const json = JSON.stringify(req.body, null, 2);

  // Write to Redis (best-effort)
  try {
    await connectRedis();
    await redisClient.set("history", json);
  } catch (err) {
    console.warn(
      "Redis write failed, continuing with file write:",
      err.message,
    );
  }

  // Always write to file as fallback/persistence
  fs.writeFile(historyPath, json, "utf8", (err) => {
    if (err) {
      console.error("Error saving history.json:", err);
      res.status(500).send("Failed to save history.json");
    } else {
      console.log("History successfully saved.");
      res.status(200).send("Saved");
    }
  });
});

// Start server unless running under tests
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
