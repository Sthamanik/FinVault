import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import app from "../../src/app";
import Career from "../../src/models/career.model";
import { loginAsAdmin } from "../helpers/admin";
import * as emailQueue from "../../src/queues/email.queue";

const buildCareer = () => ({
  title: "Analyst",
  department: "Investment",
  location: "NYC",
  type: "full-time",
  description: "Analyze markets",
  requirements: ["Finance degree"],
});

const createTempPdf = () => {
  const filePath = path.join(
    os.tmpdir(),
    `resume-${Date.now()}-${Math.random().toString(16).slice(2)}.pdf`
  );
  fs.writeFileSync(filePath, "fake pdf content");
  return filePath;
};

const submitApplication = async (jobId: string, email = "taylor@example.com") => {
  const resumePath = createTempPdf();
  try {
    return await request(app)
      .post(`/api/v1/applications/${jobId}`)
      .field("name", "Taylor")
      .field("email", email)
      .attach("resume", resumePath, {
        filename: "resume.pdf",
        contentType: "application/pdf",
      });
  } finally {
    if (fs.existsSync(resumePath)) fs.unlinkSync(resumePath);
  }
};

describe("Application email queue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enqueues application notification after successful submission", async () => {
    const enqueueSpy = vi.spyOn(emailQueue, "enqueueApplicationNotification");
    const career = await Career.create(buildCareer());

    const res = await submitApplication(career._id.toString());
    expect(res.status).toBe(201);

    await new Promise((r) => setTimeout(r, 0));

    expect(enqueueSpy).toHaveBeenCalledOnce();
    expect(enqueueSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        applicantName: "Taylor",
        applicantEmail: "taylor@example.com",
        jobTitle: "Analyst",
      })
    );
  });

  it("does not enqueue if job does not exist", async () => {
    const enqueueSpy = vi.spyOn(emailQueue, "enqueueApplicationNotification");
    const fakeJobId = "000000000000000000000000";

    const resumePath = createTempPdf();
    try {
      const res = await request(app)
        .post(`/api/v1/applications/${fakeJobId}`)
        .field("name", "Taylor")
        .field("email", "taylor@example.com")
        .attach("resume", resumePath, {
          filename: "resume.pdf",
          contentType: "application/pdf",
        });
      expect(res.status).toBe(404);
    } finally {
      if (fs.existsSync(resumePath)) fs.unlinkSync(resumePath);
    }

    expect(enqueueSpy).not.toHaveBeenCalled();
  });

  it("does not enqueue on duplicate application", async () => {
    const enqueueSpy = vi.spyOn(emailQueue, "enqueueApplicationNotification");
    const career = await Career.create(buildCareer());

    // First application
    await submitApplication(career._id.toString());
    enqueueSpy.mockClear();

    // Duplicate
    const res = await submitApplication(career._id.toString());
    expect(res.status).toBe(409);
    expect(enqueueSpy).not.toHaveBeenCalled();
  });

  it("still returns 201 even if enqueue throws", async () => {
    vi.spyOn(emailQueue, "enqueueApplicationNotification").mockRejectedValueOnce(
      new Error("Redis down")
    );
    const career = await Career.create(buildCareer());

    const res = await submitApplication(career._id.toString());
    expect(res.status).toBe(201);
  });

  it("enqueues status notification when application status is updated", async () => {
    const statusSpy = vi.spyOn(emailQueue, "enqueueApplicationStatusNotification");
    const career = await Career.create(buildCareer());
    const agent = await loginAsAdmin();

    const submitted = await submitApplication(career._id.toString());
    const applicationId = submitted.body?.data?._id;

    const res = await agent
      .patch(`/api/v1/applications/${applicationId}/status`)
      .send({ status: "shortlisted" });

    expect(res.status).toBe(200);
    expect(res.body?.data?.status).toBe("shortlisted");

    await new Promise((r) => setTimeout(r, 0));

    expect(statusSpy).toHaveBeenCalledOnce();
    expect(statusSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        applicantEmail: "taylor@example.com",
        jobTitle: "Analyst",
        oldStatus: "pending",
        newStatus: "shortlisted",
        applicationId,
      })
    );
  });

  it("enqueues correct old and new status on status change", async () => {
    const statusSpy = vi.spyOn(emailQueue, "enqueueApplicationStatusNotification");
    const career = await Career.create(buildCareer());
    const agent = await loginAsAdmin();

    const submitted = await submitApplication(career._id.toString());
    const applicationId = submitted.body?.data?._id;

    // Move to reviewed first
    await agent
        .patch(`/api/v1/applications/${applicationId}/status`)
        .send({ status: "reviewed" });

    // Wait for fire-and-forget to resolve
    await new Promise((r) => setTimeout(r, 0));
    statusSpy.mockClear();

    // Then reject
    await agent
        .patch(`/api/v1/applications/${applicationId}/status`)
        .send({ status: "rejected" });

    // Wait for fire-and-forget to resolve
    await new Promise((r) => setTimeout(r, 0));

    expect(statusSpy).toHaveBeenCalledWith(
        expect.objectContaining({
        oldStatus: "reviewed",
        newStatus: "rejected",
        })
    );
    });

  it("rejects status update with invalid status value", async () => {
    const statusSpy = vi.spyOn(emailQueue, "enqueueApplicationStatusNotification");
    const career = await Career.create(buildCareer());
    const agent = await loginAsAdmin();

    const submitted = await submitApplication(career._id.toString());
    const applicationId = submitted.body?.data?._id;

    const res = await agent
      .patch(`/api/v1/applications/${applicationId}/status`)
      .send({ status: "hired" }); // not a valid status

    expect(res.status).toBe(400);
    expect(statusSpy).not.toHaveBeenCalled();
  });
});