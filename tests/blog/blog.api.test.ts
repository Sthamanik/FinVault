import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";
import { loginAsAdmin } from "../helpers/admin";

const buildBlog = (
  overrides?: Partial<{
    title: string;
    content: string;
    author: string;
    status: "draft" | "published";
  }>
) =>
  ({
    title: "Market Trends",
    content: "Content about market trends.",
    author: "Admin",
    status: "draft",
    ...overrides,
  }) as const;

const registerAndGetAgent = async () => loginAsAdmin();

describe("Blog API", () => {
  it("rejects creating a blog without auth", async () => {
    const data = buildBlog();
    const res = await request(app)
      .post("/api/v1/blogs")
      .field("title", data.title)
      .field("content", data.content);

    expect(res.status).toBe(401);
  });

  it("creates a blog with auth", async () => {
    const agent = await registerAndGetAgent();
    const data = buildBlog();

    const res = await agent
      .post("/api/v1/blogs")
      .field("title", data.title)
      .field("content", data.content)
      .field("author", data.author)
      .field("status", data.status);

    expect(res.status).toBe(201);
    expect(res.body?.data?.title).toBe("Market Trends");
    expect(res.body?.data?.slug).toBe("market-trends");
  });

  it("lists blogs", async () => {
    const agent = await registerAndGetAgent();
    const data = buildBlog();

    await agent
      .post("/api/v1/blogs")
      .field("title", data.title)
      .field("content", data.content);

    const res = await request(app).get("/api/v1/blogs");
    expect(res.status).toBe(200);
    expect(res.body?.data?.blogs?.length).toBe(1);
  });

  it("rejects getting a blog by id without auth", async () => {
    const agent = await registerAndGetAgent();
    const created = await agent
      .post("/api/v1/blogs")
      .field("title", "Blog One")
      .field("content", "Hello world");

    const id = created.body?.data?._id;
    const res = await request(app).get(`/api/v1/blogs/${id}`);
    expect(res.status).toBe(401);
  });

  it("gets a blog by id with auth", async () => {
    const agent = await registerAndGetAgent();
    const created = await agent
      .post("/api/v1/blogs")
      .field("title", "Blog One")
      .field("content", "Hello world");

    const id = created.body?.data?._id;
    const res = await agent.get(`/api/v1/blogs/${id}`);

    expect(res.status).toBe(200);
    expect(res.body?.data?.title).toBe("Blog One");
  });

  it("gets a blog by slug (public)", async () => {
    const agent = await registerAndGetAgent();
    await agent
      .post("/api/v1/blogs")
      .field("title", "Blog One")
      .field("content", "Hello world");

    const res = await request(app).get("/api/v1/blogs/slug/blog-one");

    expect(res.status).toBe(200);
    expect(res.body?.data?.title).toBe("Blog One");
    expect(res.body?.data?.slug).toBe("blog-one");
  });

  it("returns 404 for non-existent slug", async () => {
    const res = await request(app).get("/api/v1/blogs/slug/non-existent-slug");
    expect(res.status).toBe(404);
  });

  it("updates a blog with auth", async () => {
    const agent = await registerAndGetAgent();
    const created = await agent
      .post("/api/v1/blogs")
      .field("title", "Blog One")
      .field("content", "Hello world");

    const id = created.body?.data?._id;
    const res = await agent
      .patch(`/api/v1/blogs/${id}`)
      .field("title", "Updated Blog");

    expect(res.status).toBe(200);
    expect(res.body?.data?.title).toBe("Updated Blog");
  });

  it("soft deletes, restores, and hard deletes a blog with auth", async () => {
    const agent = await registerAndGetAgent();
    const created = await agent
      .post("/api/v1/blogs")
      .field("title", "Blog One")
      .field("content", "Hello world");

    const id = created.body?.data?._id;
    const delRes = await agent.patch(`/api/v1/blogs/${id}/delete`);
    expect(delRes.status).toBe(200);

    const getRes = await request(app).get("/api/v1/blogs/slug/blog-one");
    expect(getRes.status).toBe(404);

    const restoreRes = await agent.patch(`/api/v1/blogs/${id}/restore`);
    expect(restoreRes.status).toBe(200);

    const restoredRes = await request(app).get("/api/v1/blogs/slug/blog-one");
    expect(restoredRes.status).toBe(200);

    const softDeleteAgainRes = await agent.patch(`/api/v1/blogs/${id}/delete`);
    expect(softDeleteAgainRes.status).toBe(200);

    const hardDeleteRes = await agent.delete(`/api/v1/blogs/${id}/hard-delete`);
    expect(hardDeleteRes.status).toBe(200);

    const finalGetRes = await request(app).get("/api/v1/blogs/slug/blog-one");
    expect(finalGetRes.status).toBe(404);
  });
});
