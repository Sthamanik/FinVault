import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";

const buildAdmin = (overrides?: Partial<{ email: string; password: string }>) =>
  ({
    email: "admin@example.com",
    password: "Test@1234",
    ...overrides,
  }) as const;

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

const registerAndGetAgent = async () => {
  const agent = request.agent(app);
  await agent.post("/api/v1/admin/register").send(buildAdmin());
  return agent;
};

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

  it("gets a blog by id", async () => {
    const agent = await registerAndGetAgent();
    const created = await agent
      .post("/api/v1/blogs")
      .field("title", "Blog One")
      .field("content", "Hello world");

    const id = created.body?.data?._id;
    const res = await request(app).get(`/api/v1/blogs/${id}`);

    expect(res.status).toBe(200);
    expect(res.body?.data?.title).toBe("Blog One");
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

  it("deletes a blog with auth", async () => {
    const agent = await registerAndGetAgent();
    const created = await agent
      .post("/api/v1/blogs")
      .field("title", "Blog One")
      .field("content", "Hello world");

    const id = created.body?.data?._id;
    const delRes = await agent.delete(`/api/v1/blogs/${id}`);
    expect(delRes.status).toBe(200);

    const getRes = await request(app).get(`/api/v1/blogs/${id}`);
    expect(getRes.status).toBe(404);
  });
});
