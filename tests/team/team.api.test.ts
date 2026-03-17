import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";
import { loginAsAdmin } from "../helpers/admin";

const buildTeam = (
  overrides?: Partial<{
    name: string;
    role: string;
    bio: string;
    phone: string;
  }>
) =>
  ({
    name: "Jordan Lee",
    role: "Portfolio Manager",
    bio: "Experienced in equities.",
    phone: "+15551234567",
    ...overrides,
  }) as const;

const registerAndGetAgent = async () => loginAsAdmin();

describe("Team API", () => {
  it("rejects creating a team member without auth", async () => {
    const data = buildTeam();
    const res = await request(app)
      .post("/api/v1/teams")
      .field("name", data.name)
      .field("role", data.role)
      .field("phone", data.phone);

    expect(res.status).toBe(401);
  });

  it("creates a team member with auth", async () => {
    const agent = await registerAndGetAgent();
    const data = buildTeam();

    const res = await agent
      .post("/api/v1/teams")
      .field("name", data.name)
      .field("role", data.role)
      .field("bio", data.bio)
      .field("phone", data.phone);

    expect(res.status).toBe(201);
    expect(res.body?.data?.name).toBe("Jordan Lee");
  });

  it("lists team members", async () => {
    const agent = await registerAndGetAgent();
    await agent
      .post("/api/v1/teams")
      .field("name", "A")
      .field("role", "R")
      .field("phone", "+15551234567");

    const res = await request(app).get("/api/v1/teams");
    expect(res.status).toBe(200);
    expect(res.body?.data?.teams?.length).toBe(1);
  });

  it("gets a team member by id", async () => {
    const agent = await registerAndGetAgent();
    const created = await agent
      .post("/api/v1/teams")
      .field("name", "A")
      .field("role", "R")
      .field("phone", "+15551234567");
    const id = created.body?.data?._id;

    const res = await request(app).get(`/api/v1/teams/${id}`);
    expect(res.status).toBe(200);
    expect(res.body?.data?.name).toBe("A");
  });

  it("updates a team member with auth", async () => {
    const agent = await registerAndGetAgent();
    const created = await agent
      .post("/api/v1/teams")
      .field("name", "A")
      .field("role", "R")
      .field("phone", "+15551234567");
    const id = created.body?.data?._id;

    const res = await agent
      .patch(`/api/v1/teams/${id}`)
      .field("role", "Updated Role");

    expect(res.status).toBe(200);
    expect(res.body?.data?.role).toBe("Updated Role");
  });

  it("toggles team member active status with auth", async () => {
    const agent = await registerAndGetAgent();
    const created = await agent
      .post("/api/v1/teams")
      .field("name", "A")
      .field("role", "R")
      .field("phone", "+15551234567");
    const id = created.body?.data?._id;

    const res = await agent.patch(`/api/v1/teams/${id}/toggle-active`);
    expect(res.status).toBe(200);
    expect(res.body?.data?.isActive).toBe(false);
  });

  it("deletes a team member with auth", async () => {
    const agent = await registerAndGetAgent();
    const created = await agent
      .post("/api/v1/teams")
      .field("name", "A")
      .field("role", "R")
      .field("phone", "+15551234567");
    const id = created.body?.data?._id;

    const delRes = await agent.delete(`/api/v1/teams/${id}`);
    expect(delRes.status).toBe(200);

    const getRes = await request(app).get(`/api/v1/teams/${id}`);
    expect(getRes.status).toBe(404);
  });
});
