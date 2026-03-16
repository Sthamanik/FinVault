import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";

const buildAdmin = (overrides?: Partial<{ email: string; password: string }>) =>
  ({
    email: "admin@example.com",
    password: "Test@1234",
    ...overrides,
  }) as const;

const buildService = (
  overrides?: Partial<{
    title: string;
    shortDescription: string;
    longDescription: string;
    ctaLink: string;
    investmentFocus: string;
  }>
) =>
  ({
    title: "Wealth Growth",
    shortDescription: "Short summary",
    longDescription: "Long description",
    ctaLink: "https://example.com",
    investmentFocus: "Growth",
    ...overrides,
  }) as const;

const registerAndGetAgent = async () => {
  const agent = request.agent(app);
  await agent.post("/api/v1/admin/register").send(buildAdmin());
  return agent;
};

const sendServiceForm = (
  agent: request.SuperTest<request.Test>,
  data: ReturnType<typeof buildService>
) => {
  return agent
    .post("/api/v1/services")
    .field("title", data.title)
    .field("shortDescription", data.shortDescription)
    .field("longDescription", data.longDescription ?? "")
    .field("ctaLink", data.ctaLink ?? "")
    .field("investmentFocus", data.investmentFocus ?? "");
};

describe("Service API", () => {
  it("rejects creating a service without auth", async () => {
    const data = buildService();
    const res = await request(app)
      .post("/api/v1/services")
      .field("title", data.title)
      .field("shortDescription", data.shortDescription);

    expect(res.status).toBe(401);
  });

  it("creates a service with auth", async () => {
    const agent = await registerAndGetAgent();

    const res = await sendServiceForm(agent, buildService());

    expect(res.status).toBe(201);
    expect(res.body?.data?.title).toBe("Wealth Growth");
  });

  it("lists services with pagination", async () => {
    const agent = await registerAndGetAgent();
    await sendServiceForm(agent, buildService({ title: "Alpha" }));
    await sendServiceForm(agent, buildService({ title: "Beta" }));

    const res = await request(app)
      .get("/api/v1/services")
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body?.data?.services?.length).toBe(2);
    expect(res.body?.data?.pagination?.total).toBe(2);
  });

  it("fetches a service by id", async () => {
    const agent = await registerAndGetAgent();
    const created = await sendServiceForm(agent, buildService());
    const id = created.body?.data?._id;

    const res = await request(app).get(`/api/v1/services/${id}`);

    expect(res.status).toBe(200);
    expect(res.body?.data?.title).toBe("Wealth Growth");
  });

  it("updates a service with auth", async () => {
    const agent = await registerAndGetAgent();
    const created = await sendServiceForm(agent, buildService());
    const id = created.body?.data?._id;

    const res = await agent
      .patch(`/api/v1/services/${id}`)
      .field("title", "Updated Title");

    expect(res.status).toBe(200);
    expect(res.body?.data?.title).toBe("Updated Title");
  });

  it("toggles service active status with auth", async () => {
    const agent = await registerAndGetAgent();
    const created = await sendServiceForm(agent, buildService());
    const id = created.body?.data?._id;

    const res = await agent.patch(`/api/v1/services/${id}/toggle-active`);

    expect(res.status).toBe(200);
    expect(res.body?.data?.isActive).toBe(false);
  });

  it("deletes a service with auth and hides it from public", async () => {
    const agent = await registerAndGetAgent();
    const created = await sendServiceForm(agent, buildService());
    const id = created.body?.data?._id;

    const delRes = await agent.delete(`/api/v1/services/${id}`);
    expect(delRes.status).toBe(200);

    const getRes = await request(app).get(`/api/v1/services/${id}`);
    expect(getRes.status).toBe(404);
  });
});
