import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";

const buildAdmin = (overrides?: Partial<{ email: string; password: string }>) =>
  ({
    email: "admin@example.com",
    password: "Test@1234",
    ...overrides,
  }) as const;

describe("Admin API", () => {
  it("registers an admin", async () => {
    const res = await request(app)
      .post("/api/v1/admin/register")
      .send(buildAdmin());

    expect(res.status).toBe(201);
    expect(res.body?.data?.admin?.email).toBe("admin@example.com");
    expect(res.body?.data?.accessToken).toBeTruthy();
  });

  it("rejects duplicate registration", async () => {
    await request(app).post("/api/v1/admin/register").send(buildAdmin());

    const res = await request(app)
      .post("/api/v1/admin/register")
      .send(buildAdmin());

    expect(res.status).toBe(409);
  });

  it("logs in an admin", async () => {
    await request(app).post("/api/v1/admin/register").send(buildAdmin());

    const res = await request(app).post("/api/v1/admin/login").send({
      email: "admin@example.com",
      password: "Test@1234",
    });

    expect(res.status).toBe(200);
    expect(res.body?.data?.accessToken).toBeTruthy();
  });

  it("rejects login with wrong password", async () => {
    await request(app).post("/api/v1/admin/register").send(buildAdmin());

    const res = await request(app).post("/api/v1/admin/login").send({
      email: "admin@example.com",
      password: "Wrong@1234",
    });

    expect(res.status).toBe(401);
  });

  it("gets current admin with valid session", async () => {
    const agent = request.agent(app);
    await agent.post("/api/v1/admin/register").send(buildAdmin());

    const res = await agent.get("/api/v1/admin/me");

    expect(res.status).toBe(200);
    expect(res.body?.data?.email).toBe("admin@example.com");
  });

  it("rejects current admin without auth", async () => {
    const res = await request(app).get("/api/v1/admin/me");
    expect(res.status).toBe(401);
  });

  it("refreshes access token with refresh token", async () => {
    const registerRes = await request(app)
      .post("/api/v1/admin/register")
      .send(buildAdmin());

    const refreshToken = registerRes.body?.data?.refreshToken;
    const res = await request(app)
      .post("/api/v1/admin/refresh-token")
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body?.data?.accessToken).toBeTruthy();
    expect(res.body?.data?.refreshToken).toBeTruthy();
  });

  it("rejects refresh without token", async () => {
    const res = await request(app)
      .post("/api/v1/admin/refresh-token")
      .send({});

    expect(res.status).toBe(400);
  });

  it("changes password and enforces new password", async () => {
    await request(app).post("/api/v1/admin/register").send(buildAdmin());

    const agent = request.agent(app);
    await agent.post("/api/v1/admin/login").send({
      email: "admin@example.com",
      password: "Test@1234",
    });

    const changeRes = await agent
      .patch("/api/v1/admin/change-password")
      .send({
        currentPassword: "Test@1234",
        newPassword: "New@1234A",
      });

    expect(changeRes.status).toBe(200);

    const oldLogin = await request(app).post("/api/v1/admin/login").send({
      email: "admin@example.com",
      password: "Test@1234",
    });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app).post("/api/v1/admin/login").send({
      email: "admin@example.com",
      password: "New@1234A",
    });
    expect(newLogin.status).toBe(200);
  });

  it("logs out and clears session", async () => {
    const agent = request.agent(app);
    await agent.post("/api/v1/admin/register").send(buildAdmin());

    const logoutRes = await agent.post("/api/v1/admin/logout");
    expect(logoutRes.status).toBe(200);

    const meRes = await agent.get("/api/v1/admin/me");
    expect(meRes.status).toBe(401);
  });
});
