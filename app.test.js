const request = require("supertest");
const fs = require("fs");
const path = require("path");

process.env.NODE_ENV = "test";
process.env.OUTPUT_DIR = path.join(__dirname, "test-output");
const app = require("./server");

describe("healthz", () => {
  it("returns ok", async () => {
    const res = await request(app).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("history routes", () => {
  const historyPath = path.join(process.env.OUTPUT_DIR, "history.json");
  const sample = { emp1: { "2025-week-01": { Mon: "Onsite" } } };

  beforeAll(() => {
    if (!fs.existsSync(process.env.OUTPUT_DIR)) {
      fs.mkdirSync(process.env.OUTPUT_DIR, { recursive: true });
    }
  });

  it("saves history (file fallback works even if redis is unavailable)", async () => {
    const res = await request(app)
      .post("/save-history")
      .send(sample)
      .set("Content-Type", "application/json");
    expect(res.status).toBe(200);
    const saved = JSON.parse(fs.readFileSync(historyPath, "utf8"));
    expect(saved).toEqual(sample);
  });

  it("reads history via /history", async () => {
    const res = await request(app).get("/history");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(sample);
  });
});
