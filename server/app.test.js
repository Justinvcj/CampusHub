import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "./app.js";

describe("CampusHub API", () => {
  it("reports service health", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, service: "CampusHub API" });
  });
  it("returns structured 404 errors", async () => {
    const response = await request(app).get("/api/does-not-exist");
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
  it("protects private endpoints", async () => {
    const response = await request(app).get("/api/events");
    expect(response.status).toBe(401);
  });
});
