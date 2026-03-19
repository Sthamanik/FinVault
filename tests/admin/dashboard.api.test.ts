import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";
import { loginAsAdmin } from "../helpers/admin";
import Blog from "../../src/models/blog.model";
import Contact from "../../src/models/contact.model";
import Career from "../../src/models/career.model";
import Application from "../../src/models/application.model";
import Team from "../../src/models/team.model";
import Reward from "../../src/models/reward.model";
import Service from "../../src/models/service.model";

/** Seed a blog directly — schema is simple, no enums */
const seedBlog = (overrides = {}) =>
  Blog.create({
    title: `Blog ${Date.now()}`,
    content: "Some content",
    author: "Admin",
    status: "published",
    ...overrides,
  });

/** Seed a contact via HTTP so enum validation is handled by the app */
const seedContactViaApi = async (agent: ReturnType<typeof request.agent>) =>
  agent.post("/api/v1/contacts").send({
    name: "John Doe",
    email: `contact+${Date.now()}@example.com`,
    subject: "General Inquiry",
    message: "Hello there, I have a question about your services.",
  });

/** Seed a career directly — no enums on required fields */
const seedCareer = (overrides = {}) =>
  Career.create({
    title: "Analyst",
    department: "Investment",
    location: "NYC",
    type: "full-time",
    description: "Analyze markets",
    requirements: ["Finance degree"],
    ...overrides,
  });

/** Seed a service directly */
const seedService = (overrides = {}) =>
  Service.create({
    title: `Service ${Date.now()}`,
    shortDescription: "Short description of the service.",
    ...overrides,
  });

/** Submit a job application via HTTP */
const createTempPdf = () => {
  const filePath = path.join(
    os.tmpdir(),
    `resume-${Date.now()}-${Math.random().toString(16).slice(2)}.pdf`
  );
  fs.writeFileSync(filePath, "fake pdf content");
  return filePath;
};

const submitApplication = async (jobId: string, email = "applicant@example.com") => {
  const resumePath = createTempPdf();
  try {
    return await request(app)
      .post(`/api/v1/applications/${jobId}`)
      .field("name", "Jane")
      .field("email", email)
      .attach("resume", resumePath, {
        filename: "resume.pdf",
        contentType: "application/pdf",
      });
  } finally {
    if (fs.existsSync(resumePath)) fs.unlinkSync(resumePath);
  }
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Dashboard API", () => {

  // ── Auth ────────────────────────────────────────────────────────────────────

  it("rejects unauthenticated request", async () => {
    const res = await request(app).get("/api/v1/dashboard");
    expect(res.status).toBe(401);
  });

  // ── Shape ───────────────────────────────────────────────────────────────────

  it("returns 200 with correct top-level shape", async () => {
    const agent = await loginAsAdmin();
    const res = await agent.get("/api/v1/dashboard");

    expect(res.status).toBe(200);
    expect(res.body?.data).toMatchObject({
      counts: expect.any(Object),
      recent: expect.any(Object),
      breakdowns: expect.any(Object),
    });
  });

  it("counts object contains all expected module keys", async () => {
    const agent = await loginAsAdmin();
    const res = await agent.get("/api/v1/dashboard");

    expect(res.body?.data?.counts).toMatchObject({
      blogs: expect.any(Number),
      services: expect.any(Number),
      team: expect.any(Number),
      rewards: expect.any(Number),
      contacts: expect.any(Number),
      careers: expect.any(Number),
      applications: expect.any(Number),
    });
  });

  it("recent object contains contacts and applications arrays", async () => {
    const agent = await loginAsAdmin();
    const res = await agent.get("/api/v1/dashboard");

    expect(Array.isArray(res.body?.data?.recent?.contacts)).toBe(true);
    expect(Array.isArray(res.body?.data?.recent?.applications)).toBe(true);
  });

  it("breakdowns object contains contacts and applications keys", async () => {
    const agent = await loginAsAdmin();
    const res = await agent.get("/api/v1/dashboard");

    expect(res.body?.data?.breakdowns).toMatchObject({
      contacts: expect.any(Object),
      applications: expect.any(Object),
    });
  });

  // ── Count accuracy ──────────────────────────────────────────────────────────

  it("reflects newly created blog in count", async () => {
    const agent = await loginAsAdmin();

    const before = (await agent.get("/api/v1/dashboard")).body?.data?.counts?.blogs;
    await seedBlog();
    const after = (await agent.get("/api/v1/dashboard")).body?.data?.counts?.blogs;

    expect(after).toBe(before + 1);
  });

  it("reflects newly created contact in count", async () => {
    const agent = await loginAsAdmin();

    const before = (await agent.get("/api/v1/dashboard")).body?.data?.counts?.contacts;
    await seedContactViaApi(agent);
    const after = (await agent.get("/api/v1/dashboard")).body?.data?.counts?.contacts;

    expect(after).toBe(before + 1);
  });

  it("reflects newly created career in count", async () => {
    const agent = await loginAsAdmin();

    const before = (await agent.get("/api/v1/dashboard")).body?.data?.counts?.careers;
    await seedCareer();
    const after = (await agent.get("/api/v1/dashboard")).body?.data?.counts?.careers;

    expect(after).toBe(before + 1);
  });

  it("reflects newly created application in count", async () => {
    const agent = await loginAsAdmin();

    const before = (await agent.get("/api/v1/dashboard")).body?.data?.counts?.applications;
    const career = await seedCareer();
    await submitApplication(career._id.toString(), `app+${Date.now()}@example.com`);
    const after = (await agent.get("/api/v1/dashboard")).body?.data?.counts?.applications;

    expect(after).toBe(before + 1);
  });

  it("does not count soft-deleted blog", async () => {
    const agent = await loginAsAdmin();

    // Seed and immediately soft-delete a blog
    const blog = await seedBlog();
    await Blog.findByIdAndUpdate(blog._id, { isDeleted: true });

    const before = (await agent.get("/api/v1/dashboard")).body?.data?.counts?.blogs;
    // Seed one more live blog
    await seedBlog();
    const after = (await agent.get("/api/v1/dashboard")).body?.data?.counts?.blogs;

    // Only the live blog increments; soft-deleted one stays excluded
    expect(after).toBe(before + 1);
  });

  // ── Recent items ────────────────────────────────────────────────────────────

  it("recent contacts returns at most 5 items", async () => {
    const agent = await loginAsAdmin();

    for (let i = 0; i < 6; i++) {
      await agent.post("/api/v1/contacts").send({
        name: "Bulk User",
        email: `bulk+${i}+${Date.now()}@example.com`,
        subject: "General Inquiry",
        message: "Seeding contact for dashboard test purposes.",
      });
    }

    const res = await agent.get("/api/v1/dashboard");
    expect(res.body?.data?.recent?.contacts.length).toBeLessThanOrEqual(5);
  });

  it("recent contacts include expected fields", async () => {
    const agent = await loginAsAdmin();
    await seedContactViaApi(agent);

    const res = await agent.get("/api/v1/dashboard");
    const contact = res.body?.data?.recent?.contacts?.[0];

    expect(contact).toHaveProperty("name");
    expect(contact).toHaveProperty("email");
    expect(contact).toHaveProperty("status");
    expect(contact).toHaveProperty("createdAt");
  });

  it("recent applications returns at most 5 items", async () => {
    const agent = await loginAsAdmin();
    const career = await seedCareer();

    for (let i = 0; i < 6; i++) {
      await submitApplication(career._id.toString(), `multi+${i}+${Date.now()}@example.com`);
    }

    const res = await agent.get("/api/v1/dashboard");
    expect(res.body?.data?.recent?.applications.length).toBeLessThanOrEqual(5);
  });

  it("recent applications have career title populated", async () => {
    const agent = await loginAsAdmin();
    const career = await seedCareer();
    await submitApplication(career._id.toString(), `pop+${Date.now()}@example.com`);

    const res = await agent.get("/api/v1/dashboard");
    const application = res.body?.data?.recent?.applications?.[0];

    expect(application?.jobId).toHaveProperty("title");
  });

  // ── Status breakdowns ───────────────────────────────────────────────────────

  it("contact breakdown reflects seeded contact status", async () => {
    const agent = await loginAsAdmin();
    await seedContactViaApi(agent);

    const res = await agent.get("/api/v1/dashboard");
    const breakdown = res.body?.data?.breakdowns?.contacts;

    // contacts default to "new" status
    expect(typeof breakdown?.new).toBe("number");
    expect(breakdown.new).toBeGreaterThanOrEqual(1);
  });

  it("application breakdown reflects pending status after submission", async () => {
    const agent = await loginAsAdmin();
    const career = await seedCareer();
    await submitApplication(career._id.toString(), `pend+${Date.now()}@example.com`);

    const res = await agent.get("/api/v1/dashboard");
    const breakdown = res.body?.data?.breakdowns?.applications;

    // applications default to "pending"
    expect(typeof breakdown?.pending).toBe("number");
    expect(breakdown.pending).toBeGreaterThanOrEqual(1);
  });

  it("application breakdown updates after status change to shortlisted", async () => {
    const agent = await loginAsAdmin();
    const career = await seedCareer();
    const submitted = await submitApplication(
      career._id.toString(),
      `sc+${Date.now()}@example.com`
    );
    const applicationId = submitted.body?.data?._id;

    await agent
      .patch(`/api/v1/applications/${applicationId}/status`)
      .send({ status: "shortlisted" });

    const res = await agent.get("/api/v1/dashboard");
    const breakdown = res.body?.data?.breakdowns?.applications;

    expect(typeof breakdown?.shortlisted).toBe("number");
    expect(breakdown.shortlisted).toBeGreaterThanOrEqual(1);
  });

  // ── Empty database ──────────────────────────────────────────────────────────

  it("returns zero counts when database is empty", async () => {
    await Promise.all([
      Blog.deleteMany({}),
      Contact.deleteMany({}),
      Career.deleteMany({}),
      Application.deleteMany({}),
      Team.deleteMany({}),
      Reward.deleteMany({}),
      Service.deleteMany({}),
    ]);

    const agent = await loginAsAdmin();
    const res = await agent.get("/api/v1/dashboard");
    const counts = res.body?.data?.counts;

    expect(counts.blogs).toBe(0);
    expect(counts.contacts).toBe(0);
    expect(counts.careers).toBe(0);
    expect(counts.applications).toBe(0);
    expect(counts.team).toBe(0);
    expect(counts.rewards).toBe(0);
    expect(counts.services).toBe(0);
  });

  it("returns empty arrays and breakdowns when database is empty", async () => {
    await Promise.all([
      Blog.deleteMany({}),
      Contact.deleteMany({}),
      Career.deleteMany({}),
      Application.deleteMany({}),
      Team.deleteMany({}),
      Reward.deleteMany({}),
      Service.deleteMany({}),
    ]);

    const agent = await loginAsAdmin();
    const res = await agent.get("/api/v1/dashboard");

    expect(res.body?.data?.recent?.contacts).toEqual([]);
    expect(res.body?.data?.recent?.applications).toEqual([]);
    expect(res.body?.data?.breakdowns?.contacts).toEqual({});
    expect(res.body?.data?.breakdowns?.applications).toEqual({});
  });
});