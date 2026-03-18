import request from "supertest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import app from "../../src/app";
import * as emailQueue from "../../src/queues/email.queue";

const buildContact = (overrides?: Record<string, string>) => ({
  name: "Alex",
  email: "alex@example.com",
  subject: "General Inquiry",
  message: "I would like to know more about your services.",
  ...overrides,
});

describe("Contact email queue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enqueues a contact notification after successful submission", async () => {
    const enqueueSpy = vi.spyOn(emailQueue, "enqueueContactNotification");

    const res = await request(app)
      .post("/api/v1/contacts")
      .send(buildContact());

    expect(res.status).toBe(201);

    // Give fire-and-forget a tick to resolve
    await new Promise((r) => setTimeout(r, 0));

    expect(enqueueSpy).toHaveBeenCalledOnce();
    expect(enqueueSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Alex",
        email: "alex@example.com",
        subject: "General Inquiry",
      })
    );
  });

  it("does not enqueue when contact submission fails validation", async () => {
    const enqueueSpy = vi.spyOn(emailQueue, "enqueueContactNotification");

    const res = await request(app)
      .post("/api/v1/contacts")
      .send({ name: "Alex" }); // missing required fields

    expect(res.status).toBe(400);
    expect(enqueueSpy).not.toHaveBeenCalled();
  });

  it("still returns 201 even if enqueue throws", async () => {
    vi.spyOn(emailQueue, "enqueueContactNotification").mockRejectedValueOnce(
      new Error("Redis down")
    );

    const res = await request(app)
      .post("/api/v1/contacts")
      .send(buildContact({ email: "other@example.com" }));

    // HTTP response must not be affected by queue failure
    expect(res.status).toBe(201);
  });
});