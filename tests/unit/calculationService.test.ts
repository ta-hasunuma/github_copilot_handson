import type { Plan } from "@prisma/client";
import { CalculationService } from "../../src/services/calculationService";

// Prismaクライアントのモック
const mockPlanFindUnique = jest.fn();

jest.mock("../../src/lib/prisma", () => ({
  __esModule: true,
  default: {
    plan: {
      findUnique: (...args: unknown[]) => mockPlanFindUnique(...args),
    },
  },
}));

describe("CalculationService", () => {
  let calculationService: CalculationService;

  beforeEach(() => {
    calculationService = new CalculationService();
    jest.clearAllMocks();
  });

  describe("calculatePrice", () => {
    it("should calculate price for personal plan correctly", async () => {
      const mockPlan: Plan = {
        id: 1,
        name: "個人",
        basePrice: 1000.0,
        pricePerGb: 100.0,
        description: "個人ユーザー向けの基本プラン",
        createdAt: new Date(),
      };

      mockPlanFindUnique.mockResolvedValue(mockPlan);

      const result = await calculationService.calculatePrice(1, 10);

      expect(result).toEqual({
        planId: 1,
        planName: "個人",
        basePrice: 1000.0,
        storageSize: 10,
        storagePrice: 1000.0,
        totalPrice: 2000.0,
      });
    });

    it("should calculate price for business plan correctly", async () => {
      const mockPlan: Plan = {
        id: 2,
        name: "ビジネス",
        basePrice: 5000.0,
        pricePerGb: 80.0,
        description: "小規模チーム向けプラン",
        createdAt: new Date(),
      };

      mockPlanFindUnique.mockResolvedValue(mockPlan);

      const result = await calculationService.calculatePrice(2, 100);

      expect(result).toEqual({
        planId: 2,
        planName: "ビジネス",
        basePrice: 5000.0,
        storageSize: 100,
        storagePrice: 8000.0,
        totalPrice: 13000.0,
      });
    });

    it("should calculate price for enterprise plan correctly", async () => {
      const mockPlan: Plan = {
        id: 3,
        name: "エンタープライズ",
        basePrice: 20000.0,
        pricePerGb: 50.0,
        description: "大規模組織向けプラン",
        createdAt: new Date(),
      };

      mockPlanFindUnique.mockResolvedValue(mockPlan);

      const result = await calculationService.calculatePrice(3, 1000);

      expect(result).toEqual({
        planId: 3,
        planName: "エンタープライズ",
        basePrice: 20000.0,
        storageSize: 1000,
        storagePrice: 50000.0,
        totalPrice: 70000.0,
      });
    });

    it("should handle zero storage size", async () => {
      const mockPlan: Plan = {
        id: 1,
        name: "個人",
        basePrice: 1000.0,
        pricePerGb: 100.0,
        description: "個人ユーザー向けの基本プラン",
        createdAt: new Date(),
      };

      mockPlanFindUnique.mockResolvedValue(mockPlan);

      const result = await calculationService.calculatePrice(1, 0);

      expect(result).toEqual({
        planId: 1,
        planName: "個人",
        basePrice: 1000.0,
        storageSize: 0,
        storagePrice: 0,
        totalPrice: 1000.0,
      });
    });

    it("should return null when plan not found", async () => {
      mockPlanFindUnique.mockResolvedValue(null);

      const result = await calculationService.calculatePrice(999, 10);

      expect(result).toBeNull();
    });

    it("should handle large storage sizes", async () => {
      const mockPlan: Plan = {
        id: 3,
        name: "エンタープライズ",
        basePrice: 20000.0,
        pricePerGb: 50.0,
        description: "大規模組織向けプラン",
        createdAt: new Date(),
      };

      mockPlanFindUnique.mockResolvedValue(mockPlan);

      const result = await calculationService.calculatePrice(3, 10000);

      expect(result).toEqual({
        planId: 3,
        planName: "エンタープライズ",
        basePrice: 20000.0,
        storageSize: 10000,
        storagePrice: 500000.0,
        totalPrice: 520000.0,
      });
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
        createdAt: new Date(),
      };

      mockPlanFindUnique.mockResolvedValue(mockPlan);

      const result = await calculationService.planExists(1);

      expect(result).toBe(true);
    });

    it("should return false when plan does not exist", async () => {
      mockPlanFindUnique.mockResolvedValue(null);

      const result = await calculationService.planExists(999);

      expect(result).toBe(false);
    });
  });
});
