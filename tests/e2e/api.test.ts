import { PrismaClient } from "@prisma/client";
import request from "supertest";
import app from "../../src/app";

const prisma = new PrismaClient();

describe("API Integration Tests", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Users API", () => {
    it("should create a new user", async () => {
      const userData = {
        name: `Test User ${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        phone: "03-1234-5678",
        company: "Test Company",
      };
      const response = await request(app)
        .post("/api/v1/users")
        .send(userData)
        .expect(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.name).toBe(userData.name);
      expect(response.body.data.email).toBe(userData.email);
    });

    it("should not create user with duplicate email", async () => {
      const timestamp = Date.now();
      const uniqueEmail = `duplicate_${timestamp}@example.com`;
      const userData = {
        name: "Duplicate User",
        email: uniqueEmail,
        phone: "03-1234-5678",
      };
      await request(app).post("/api/v1/users").send(userData).expect(201);
      const duplicateData = {
        name: "Duplicate User 2",
        email: uniqueEmail,
        phone: "03-9999-9999",
      };
      const response = await request(app)
        .post("/api/v1/users")
        .send(duplicateData)
        .expect(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("Email is already registered");
    });
  });

  describe("Calculate API", () => {
    it("should calculate price for personal plan", async () => {
      const plans = await prisma.plan.findMany();
      const personalPlan = plans.find((p) => p.name === "個人");
      if (!personalPlan) throw new Error("個人プランが見つかりません");
      const response = await request(app)
        .get("/api/v1/calculate")
        .query({ planId: personalPlan.id, storageSize: 10 })
        .expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalPrice).toBe(1000);
      expect(response.body.data.basePrice).toBe(500);
      expect(response.body.data.storagePrice).toBe(500);
    });

    it("should calculate price for business plan", async () => {
      const plans = await prisma.plan.findMany();
      const businessPlan = plans.find((p) => p.name === "ビジネス");
      if (!businessPlan) throw new Error("ビジネスプランが見つかりません");
      const response = await request(app)
        .get("/api/v1/calculate")
        .query({ planId: businessPlan.id, storageSize: 100 })
        .expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalPrice).toBe(4500);
    });

    it("should return error for non-existent plan", async () => {
      const response = await request(app)
        .get("/api/v1/calculate")
        .query({ planId: 9999, storageSize: 10 })
        .expect(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Subscriptions API", () => {
    it("should create a subscription", async () => {
      const userResponse = await request(app)
        .post("/api/v1/users")
        .send({
          name: `Sub Test ${Date.now()}`,
          email: `sub_${Date.now()}@example.com`,
          phone: "03-1234-5678",
        });
      const userId = userResponse.body.data.id;
      const plans = await prisma.plan.findMany();
      if (!plans[0]) throw new Error("プランが見つかりません");
      const planId = plans[0].id;
      const response = await request(app)
        .post("/api/v1/subscriptions")
        .send({ user_id: userId, plan_id: planId, storage_size: 50 })
        .expect(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.storageSize).toBe(50);
      expect(response.body.data.status).toBe("pending");
    });

    it("should not create subscription with non-existent user", async () => {
      const plans = await prisma.plan.findMany();
      if (!plans[0]) throw new Error("プランが見つかりません");
      const planId = plans[0].id;
      const response = await request(app)
        .post("/api/v1/subscriptions")
        .send({ user_id: 99999, plan_id: planId, storage_size: 50 })
        .expect(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("User not found");
    });

    it("should not create subscription with invalid storage size", async () => {
      const userResponse = await request(app)
        .post("/api/v1/users")
        .send({
          name: `Invalid Test ${Date.now()}`,
          email: `invalid_${Date.now()}@example.com`,
          phone: "03-1234-5678",
        });
      const userId = userResponse.body.data.id;
      const plans = await prisma.plan.findMany();
      if (!plans[0]) throw new Error("プランが見つかりません");
      const planId = plans[0].id;
      const response = await request(app)
        .post("/api/v1/subscriptions")
        .send({ user_id: userId, plan_id: planId, storage_size: -10 })
        .expect(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Plans API", () => {
    it("should get all plans", async () => {
      const response = await request(app).get("/api/v1/plans").expect(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty("id");
      expect(response.body.data[0]).toHaveProperty("name");
      expect(response.body.data[0]).toHaveProperty("basePrice");
      expect(response.body.data[0]).toHaveProperty("pricePerGb");
    });
  });

  describe("Debug API", () => {
    it("should get all users (debug)", async () => {
      const response = await request(app)
        .get("/api/v1/debug/users")
        .expect(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should get all subscriptions (debug)", async () => {
      const response = await request(app)
        .get("/api/v1/debug/subscriptions")
        .expect(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("Options API", () => {
    it("should get all options", async () => {
      const response = await request(app).get("/api/v1/options").expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(3);

      // PC同期クライアント
      const pcSyncOption = response.body.data.find(
        (opt: { name: string }) => opt.name === "PC同期クライアント"
      );
      expect(pcSyncOption).toBeDefined();
      expect(pcSyncOption.priceType).toBe("PER_USER");
      expect(pcSyncOption.unitPrice).toBe(100);
      expect(pcSyncOption.description).toBe("PCとのファイル自動同期");

      // セキュリティ
      const securityOption = response.body.data.find(
        (opt: { name: string }) => opt.name === "セキュリティ"
      );
      expect(securityOption).toBeDefined();
      expect(securityOption.priceType).toBe("FIXED");
      expect(securityOption.unitPrice).toBe(5000);
      expect(securityOption.description).toBe("SSO・証跡保護");

      // バックアップ
      const backupOption = response.body.data.find(
        (opt: { name: string }) => opt.name === "バックアップ"
      );
      expect(backupOption).toBeDefined();
      expect(backupOption.priceType).toBe("PER_GB");
      expect(backupOption.unitPrice).toBe(10);
      expect(backupOption.description).toBe("30日間のファイル履歴保存");
    });
  });
});
