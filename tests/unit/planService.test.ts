import type { Plan } from "@prisma/client";
import { PlanService } from "../../src/services/planService";

// Prismaクライアントのモック
const mockPlanFindUnique = jest.fn();
const mockPlanFindMany = jest.fn();

jest.mock("../../src/lib/prisma", () => ({
  __esModule: true,
  default: {
    plan: {
      findUnique: (...args: unknown[]) => mockPlanFindUnique(...args),
      findMany: (...args: unknown[]) => mockPlanFindMany(...args),
    },
  },
}));

describe("PlanService", () => {
  let planService: PlanService;

  beforeEach(() => {
    planService = new PlanService();
    jest.clearAllMocks();
  });

  describe("getAllPlans", () => {
    it("should return all plans sorted by base price", async () => {
      const mockPlans: Plan[] = [
        {
          id: 1,
          name: "個人",
          basePrice: 1000.0,
          pricePerGb: 100.0,
          description: "個人ユーザー向けの基本プラン",
          createdAt: new Date("2025-11-06T09:00:00Z"),
        },
        {
          id: 2,
          name: "ビジネス",
          basePrice: 5000.0,
          pricePerGb: 80.0,
          description: "小規模チーム向けプラン",
          createdAt: new Date("2025-11-06T09:00:00Z"),
        },
        {
          id: 3,
          name: "エンタープライズ",
          basePrice: 20000.0,
          pricePerGb: 50.0,
          description: "大規模組織向けプラン",
          createdAt: new Date("2025-11-06T09:00:00Z"),
        },
      ];

      mockPlanFindMany.mockResolvedValue(mockPlans);

      const result = await planService.getAllPlans();

      expect(result).toEqual(mockPlans);
      expect(mockPlanFindMany).toHaveBeenCalledWith({
        orderBy: {
          basePrice: "asc",
        },
      });
    });

    it("should return empty array when no plans exist", async () => {
      mockPlanFindMany.mockResolvedValue([]);

      const result = await planService.getAllPlans();

      expect(result).toEqual([]);
    });
  });

  describe("getPlanById", () => {
    it("should return plan when found", async () => {
      const mockPlan: Plan = {
        id: 1,
        name: "個人",
        basePrice: 1000.0,
        pricePerGb: 100.0,
        description: "個人ユーザー向けの基本プラン",
        createdAt: new Date("2025-11-06T09:00:00Z"),
      };

      mockPlanFindUnique.mockResolvedValue(mockPlan);

      const result = await planService.getPlanById(1);

      expect(result).toEqual(mockPlan);
      expect(mockPlanFindUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should return null when plan not found", async () => {
      mockPlanFindUnique.mockResolvedValue(null);

      const result = await planService.getPlanById(999);

      expect(result).toBeNull();
    });
  });

  describe("planExists", () => {
    it("should return true when plan exists", async () => {
      const mockPlan: Plan = {
        id: 1,
        name: "個人",
        basePrice: 1000.0,
        pricePerGb: 100.0,
        description: "個人ユーザー向けの基本プラン",
        createdAt: new Date("2025-11-06T09:00:00Z"),
      };

      mockPlanFindUnique.mockResolvedValue(mockPlan);

      const result = await planService.planExists(1);

      expect(result).toBe(true);
    });

    it("should return false when plan does not exist", async () => {
      mockPlanFindUnique.mockResolvedValue(null);

      const result = await planService.planExists(999);

      expect(result).toBe(false);
    });
  });
});
