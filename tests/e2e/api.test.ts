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

  describe("Subscription Options API", () => {
    let testSubscriptionId: number;
    let testOptionId: number;

    beforeEach(async () => {
      // テスト用ユーザー作成
      const userResponse = await request(app)
        .post("/api/v1/users")
        .send({
          name: `Option Test User ${Date.now()}`,
          email: `option_test_${Date.now()}@example.com`,
          phone: "03-1234-5678",
        });
      const userId = userResponse.body.data.id;

      // テスト用契約作成
      const plans = await prisma.plan.findMany();
      if (!plans[0]) throw new Error("プランが見つかりません");
      const subscriptionResponse = await request(app)
        .post("/api/v1/subscriptions")
        .send({
          user_id: userId,
          plan_id: plans[0].id,
          storage_size: 100,
        });
      testSubscriptionId = subscriptionResponse.body.data.id;

      // テスト用オプションID取得
      const options = await prisma.option.findMany();
      if (!options[0]) throw new Error("オプションが見つかりません");
      testOptionId = options[0].id; // PC同期クライアント
    });

    describe("POST /api/v1/subscriptions/:id/options", () => {
      it("should add option to subscription successfully", async () => {
        const response = await request(app)
          .post(`/api/v1/subscriptions/${testSubscriptionId}/options`)
          .send({
            optionId: testOptionId,
            quantity: 5,
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.subscriptionId).toBe(testSubscriptionId);
        expect(response.body.data.optionId).toBe(testOptionId);
        expect(response.body.data.quantity).toBe(5);
        expect(response.body.data.price).toBe(500); // 100 * 5
      });

      it("should return 400 for invalid optionId", async () => {
        const response = await request(app)
          .post(`/api/v1/subscriptions/${testSubscriptionId}/options`)
          .send({
            optionId: -1,
            quantity: 5,
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it("should return 400 for invalid quantity", async () => {
        const response = await request(app)
          .post(`/api/v1/subscriptions/${testSubscriptionId}/options`)
          .send({
            optionId: testOptionId,
            quantity: 0,
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it("should return 404 for non-existent subscription", async () => {
        const response = await request(app)
          .post("/api/v1/subscriptions/99999/options")
          .send({
            optionId: testOptionId,
            quantity: 5,
          })
          .expect(404);

        expect(response.body.success).toBe(false);
      });

      it("should return 404 for non-existent option", async () => {
        const response = await request(app)
          .post(`/api/v1/subscriptions/${testSubscriptionId}/options`)
          .send({
            optionId: 99999,
            quantity: 5,
          })
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });

    describe("GET /api/v1/subscriptions/:id/options", () => {
      it("should get empty list when no options added", async () => {
        const response = await request(app)
          .get(`/api/v1/subscriptions/${testSubscriptionId}/options`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(0);
      });

      it("should get subscription options list", async () => {
        // オプション追加
        await request(app)
          .post(`/api/v1/subscriptions/${testSubscriptionId}/options`)
          .send({
            optionId: testOptionId,
            quantity: 5,
          });

        const response = await request(app)
          .get(`/api/v1/subscriptions/${testSubscriptionId}/options`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].quantity).toBe(5);
        expect(response.body.data[0].option).toBeDefined();
        expect(response.body.data[0].option.name).toBe("PC同期クライアント");
      });

      it("should return 404 for non-existent subscription", async () => {
        const response = await request(app)
          .get("/api/v1/subscriptions/99999/options")
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });

    describe("PUT /api/v1/subscriptions/:id/options/:optionId", () => {
      beforeEach(async () => {
        // オプション追加
        await request(app)
          .post(`/api/v1/subscriptions/${testSubscriptionId}/options`)
          .send({
            optionId: testOptionId,
            quantity: 5,
          });
      });

      it("should update option quantity successfully", async () => {
        const response = await request(app)
          .put(
            `/api/v1/subscriptions/${testSubscriptionId}/options/${testOptionId}`
          )
          .send({
            quantity: 10,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.quantity).toBe(10);
        expect(response.body.data.price).toBe(1000); // 100 * 10
      });

      it("should return 400 for invalid quantity", async () => {
        const response = await request(app)
          .put(
            `/api/v1/subscriptions/${testSubscriptionId}/options/${testOptionId}`
          )
          .send({
            quantity: 0,
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it("should return 404 for non-existent subscription option", async () => {
        const response = await request(app)
          .put(`/api/v1/subscriptions/${testSubscriptionId}/options/99999`)
          .send({
            quantity: 10,
          })
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });

    describe("DELETE /api/v1/subscriptions/:id/options/:optionId", () => {
      beforeEach(async () => {
        // オプション追加
        await request(app)
          .post(`/api/v1/subscriptions/${testSubscriptionId}/options`)
          .send({
            optionId: testOptionId,
            quantity: 5,
          });
      });

      it("should delete subscription option successfully", async () => {
        const response = await request(app)
          .delete(
            `/api/v1/subscriptions/${testSubscriptionId}/options/${testOptionId}`
          )
          .expect(200);

        expect(response.body.success).toBe(true);

        // 削除確認
        const getResponse = await request(app)
          .get(`/api/v1/subscriptions/${testSubscriptionId}/options`)
          .expect(200);
        expect(getResponse.body.data.length).toBe(0);
      });

      it("should return 404 for non-existent subscription option", async () => {
        const response = await request(app)
          .delete(`/api/v1/subscriptions/${testSubscriptionId}/options/99999`)
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });
  });
});
