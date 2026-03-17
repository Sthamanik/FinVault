import request from "supertest";
import app from "../../src/app";
import Admin from "../../src/models/admin.model";

export const buildAdmin = (
  overrides?: Partial<{ email: string; password: string }>
) =>
  ({
    email: "admin@example.com",
    password: "Test@1234",
    ...overrides,
  }) as const;

export const seedAdmin = async (
  overrides?: Partial<{ email: string; password: string }>
) => {
  const admin = buildAdmin(overrides);
  const existing = await Admin.findOne({ email: admin.email });
  if (existing) return existing;
  return Admin.create(admin);
};

export const loginAdmin = async (
  overrides?: Partial<{ email: string; password: string }>
) => {
  const admin = buildAdmin(overrides);
  await seedAdmin(admin);
  return request(app).post("/api/v1/admin/login").send({
    email: admin.email,
    password: admin.password,
  });
};

export const loginAsAdmin = async (
  overrides?: Partial<{ email: string; password: string }>
) => {
  const admin = buildAdmin(overrides);
  await seedAdmin(admin);
  const agent = request.agent(app);
  await agent.post("/api/v1/admin/login").send({
    email: admin.email,
    password: admin.password,
  });
  return agent;
};
