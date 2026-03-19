import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";
import { loginAsAdmin } from "../helpers/admin";

const buildContact = (
  overrides?: Partial<{
    name: string;
    email: string;
    subject: string;
    message: string;
  }>
) =>
  ({
    name: "Alex",
    email: "alex@example.com",
    subject: "General Inquiry",
    message: "I would like to know more about your services.",
    ...overrides,
  }) as const;

const registerAndGetAgent = async () => loginAsAdmin();

describe("Contact API", () => {
  it("creates a contact (public)", async () => {
    const res = await request(app).post("/api/v1/contacts").send(buildContact());
    expect(res.status).toBe(201);
    expect(res.body?.data?.email).toBe("alex@example.com");
  });

  it("gets contacts with auth", async () => {
    await request(app).post("/api/v1/contacts").send(buildContact());
    const agent = await registerAndGetAgent();

    const res = await agent.get("/api/v1/contacts");
    expect(res.status).toBe(200);
    expect(res.body?.data?.contacts?.length).toBe(1);
  });

  it("updates contact status with auth", async () => {
    const created = await request(app)
      .post("/api/v1/contacts")
      .send(buildContact());
    const id = created.body?.data?._id;
    const agent = await registerAndGetAgent();

    const res = await agent.patch(`/api/v1/contacts/${id}/status`).send({
      status: "read",
    });
    expect(res.status).toBe(200);
    expect(res.body?.data?.status).toBe("read");
  });

  it("soft deletes, restores, and hard deletes a contact with auth", async () => {
    const created = await request(app)
      .post("/api/v1/contacts")
      .send(buildContact());
    const id = created.body?.data?._id;
    const agent = await registerAndGetAgent();

    const delRes = await agent.patch(`/api/v1/contacts/${id}/delete`);
    expect(delRes.status).toBe(200);

    const getRes = await agent.get(`/api/v1/contacts/${id}`);
    expect(getRes.status).toBe(404);

    const restoreRes = await agent.patch(`/api/v1/contacts/${id}/restore`);
    expect(restoreRes.status).toBe(200);

    const restoredRes = await agent.get(`/api/v1/contacts/${id}`);
    expect(restoredRes.status).toBe(200);

    const softDeleteAgainRes = await agent.patch(`/api/v1/contacts/${id}/delete`);
    expect(softDeleteAgainRes.status).toBe(200);

    const hardDeleteRes = await agent.delete(`/api/v1/contacts/${id}/hard-delete`);
    expect(hardDeleteRes.status).toBe(200);

    const finalGetRes = await agent.get(`/api/v1/contacts/${id}`);
    expect(finalGetRes.status).toBe(404);
  });
});
