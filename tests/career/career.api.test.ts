import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";
import { loginAsAdmin } from "../helpers/admin";

const buildCareer = (
  overrides?: Partial<{
    title: string;
    department: string;
    location: string;
    type: string;
    description: string;
    requirements: string[];
  }>
) =>
  ({
    title: "Analyst",
    department: "Investment",
    location: "NYC",
    type: "full-time",
    description: "Analyze markets",
    requirements: ["Finance degree"],
    ...overrides,
  }) as const;

const registerAndGetAgent = async () => loginAsAdmin();

describe("Career API", () => {
  it("rejects creating a career without auth", async () => {
    const res = await request(app).post("/api/v1/careers").send(buildCareer());
    expect(res.status).toBe(401);
  });

  it("creates a career with auth", async () => {
    const agent = await registerAndGetAgent();
    const res = await agent.post("/api/v1/careers").send(buildCareer());

    expect(res.status).toBe(201);
    expect(res.body?.data?.title).toBe("Analyst");
  });

  it("lists careers", async () => {
    const agent = await registerAndGetAgent();
    await agent.post("/api/v1/careers").send(buildCareer());

    const res = await request(app).get("/api/v1/careers");
    expect(res.status).toBe(200);
    expect(res.body?.data?.careers?.length).toBe(1);
  });

  it("gets a career by id", async () => {
    const agent = await registerAndGetAgent();
    const created = await agent.post("/api/v1/careers").send(buildCareer());
    const id = created.body?.data?._id;

    const res = await request(app).get(`/api/v1/careers/${id}`);
    expect(res.status).toBe(200);
    expect(res.body?.data?.title).toBe("Analyst");
  });

  it("updates a career with auth", async () => {
    const agent = await registerAndGetAgent();
    const created = await agent.post("/api/v1/careers").send(buildCareer());
    const id = created.body?.data?._id;

    const res = await agent
      .patch(`/api/v1/careers/${id}`)
      .send({ title: "Senior Analyst" });

    expect(res.status).toBe(200);
    expect(res.body?.data?.title).toBe("Senior Analyst");
  });

  it("toggles career active status with auth", async () => {
    const agent = await registerAndGetAgent();
    const created = await agent.post("/api/v1/careers").send(buildCareer());
    const id = created.body?.data?._id;

    const res = await agent.patch(`/api/v1/careers/${id}/toggle-active`);
    expect(res.status).toBe(200);
    expect(res.body?.data?.isActive).toBe(false);
  });

  it("deletes a career with auth", async () => {
    const agent = await registerAndGetAgent();
    const created = await agent.post("/api/v1/careers").send(buildCareer());
    const id = created.body?.data?._id;

    const delRes = await agent.delete(`/api/v1/careers/${id}`);
    expect(delRes.status).toBe(200);

    const getRes = await request(app).get(`/api/v1/careers/${id}`);
    expect(getRes.status).toBe(404);
  });
});
