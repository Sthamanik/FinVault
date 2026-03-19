import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";
import Career from "../../src/models/career.model";
import { loginAsAdmin } from "../helpers/admin";

const buildCareer = () =>
  ({
    title: "Analyst",
    department: "Investment",
    location: "NYC",
    type: "full-time",
    description: "Analyze markets",
    requirements: ["Finance degree"],
  });

const createTempFile = (ext = ".pdf") => {
  const filePath = path.join(
    os.tmpdir(),
    `resume-${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`
  );
  fs.writeFileSync(filePath, "fake");
  return filePath;
};

describe("Application API", () => {
  it("submits an application with resume", async () => {
    const career = await Career.create(buildCareer());
    const resumePath = createTempFile(".pdf");

    try {
      const res = await request(app)
        .post(`/api/v1/applications/${career._id}`)
        .field("name", "Taylor")
        .field("email", "taylor@example.com")
        .attach("resume", resumePath, {
          filename: "resume.pdf",
          contentType: "application/pdf",
        });

      expect(res.status).toBe(201);
      expect(res.body?.data?.name).toBe("Taylor");
    } finally {
      if (fs.existsSync(resumePath)) {
        fs.unlinkSync(resumePath);
      }
    }
  });

  it("soft deletes, restores, and hard deletes an application with auth", async () => {
    const career = await Career.create(buildCareer());
    const resumePath = createTempFile(".pdf");
    const agent = await loginAsAdmin();

    try {
      const created = await request(app)
        .post(`/api/v1/applications/${career._id}`)
        .field("name", "Taylor")
        .field("email", "taylor@example.com")
        .attach("resume", resumePath, {
          filename: "resume.pdf",
          contentType: "application/pdf",
        });

      expect(created.status).toBe(201);

      const id = created.body?.data?._id;

      const softDeleteRes = await agent.patch(`/api/v1/applications/${id}/delete`);
      expect(softDeleteRes.status).toBe(200);

      const getAfterDeleteRes = await agent.get(`/api/v1/applications/${id}`);
      expect(getAfterDeleteRes.status).toBe(404);

      const restoreRes = await agent.patch(`/api/v1/applications/${id}/restore`);
      expect(restoreRes.status).toBe(200);

      const getAfterRestoreRes = await agent.get(`/api/v1/applications/${id}`);
      expect(getAfterRestoreRes.status).toBe(200);

      const softDeleteAgainRes = await agent.patch(`/api/v1/applications/${id}/delete`);
      expect(softDeleteAgainRes.status).toBe(200);

      const hardDeleteRes = await agent.delete(`/api/v1/applications/${id}/hard-delete`);
      expect(hardDeleteRes.status).toBe(200);

      const finalGetRes = await agent.get(`/api/v1/applications/${id}`);
      expect(finalGetRes.status).toBe(404);
    } finally {
      if (fs.existsSync(resumePath)) {
        fs.unlinkSync(resumePath);
      }
    }
  });
});
