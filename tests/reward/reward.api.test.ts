import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";
import { loginAsAdmin } from "../helpers/admin";

const buildReward = (
  overrides?: Partial<{
    title: string;
    issuer: string;
    description: string;
  }>
) =>
  ({
    title: "Best Fund Manager",
    issuer: "Finance Awards",
    description: "Awarded for top performance",
    ...overrides,
  }) as const;

const registerAndGetAgent = async () => loginAsAdmin();

describe("Reward API", () => {
  it("rejects creating a reward without auth", async () => {
    const data = buildReward();
    const res = await request(app)
      .post("/api/v1/rewards")
      .field("title", data.title)
      .field("issuer", data.issuer);

    expect(res.status).toBe(401);
  });

  it("creates a reward with auth", async () => {
    const agent = await registerAndGetAgent();
    const data = buildReward();

    const res = await agent
      .post("/api/v1/rewards")
      .field("title", data.title)
      .field("issuer", data.issuer)
      .field("description", data.description ?? "");

    expect(res.status).toBe(201);
    expect(res.body?.data?.title).toBe("Best Fund Manager");
  });

  it("lists rewards", async () => {
    const agent = await registerAndGetAgent();
    await agent
      .post("/api/v1/rewards")
      .field("title", "Award 1")
      .field("issuer", "Issuer 1");

    const res = await request(app).get("/api/v1/rewards");
    expect(res.status).toBe(200);
    expect(res.body?.data?.rewards?.length).toBe(1);
  });

  it("gets a reward by id", async () => {
    const agent = await registerAndGetAgent();
    const created = await agent
      .post("/api/v1/rewards")
      .field("title", "Award 1")
      .field("issuer", "Issuer 1");

    const id = created.body?.data?._id;
    const res = await request(app).get(`/api/v1/rewards/${id}`);
    expect(res.status).toBe(200);
    expect(res.body?.data?.title).toBe("Award 1");
  });

  it("updates a reward with auth", async () => {
    const agent = await registerAndGetAgent();
    const created = await agent
      .post("/api/v1/rewards")
      .field("title", "Award 1")
      .field("issuer", "Issuer 1");

    const id = created.body?.data?._id;
    const res = await agent
      .patch(`/api/v1/rewards/${id}`)
      .field("title", "Updated Award");

    expect(res.status).toBe(200);
    expect(res.body?.data?.title).toBe("Updated Award");
  });

  it("soft deletes, restores, and hard deletes a reward with auth", async () => {
    const agent = await registerAndGetAgent();
    const created = await agent
      .post("/api/v1/rewards")
      .field("title", "Award 1")
      .field("issuer", "Issuer 1");

    const id = created.body?.data?._id;
    const delRes = await agent.patch(`/api/v1/rewards/${id}/delete`);
    expect(delRes.status).toBe(200);

    const getRes = await request(app).get(`/api/v1/rewards/${id}`);
    expect(getRes.status).toBe(404);

    const restoreRes = await agent.patch(`/api/v1/rewards/${id}/restore`);
    expect(restoreRes.status).toBe(200);

    const restoredRes = await request(app).get(`/api/v1/rewards/${id}`);
    expect(restoredRes.status).toBe(200);

    const softDeleteAgainRes = await agent.patch(`/api/v1/rewards/${id}/delete`);
    expect(softDeleteAgainRes.status).toBe(200);

    const hardDeleteRes = await agent.delete(`/api/v1/rewards/${id}/hard-delete`);
    expect(hardDeleteRes.status).toBe(200);

    const finalGetRes = await request(app).get(`/api/v1/rewards/${id}`);
    expect(finalGetRes.status).toBe(404);
  });
});
