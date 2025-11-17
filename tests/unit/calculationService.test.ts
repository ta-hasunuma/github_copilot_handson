import type { Option, Plan, Subscription } from "@prisma/client";
import { CalculationService } from "../../src/services/calculationService";

// Prismaクライアントのモック
const mockPlanFindUnique = jest.fn();
const mockSubscriptionFindUnique = jest.fn();
const mockSubscriptionOptionFindMany = jest.fn();

jest.mock("../../src/lib/prisma", () => ({
  __esModule: true,
  default: {
    plan: {
      findUnique: (...args: unknown[]) => mockPlanFindUnique(...args),
    },
    subscription: {
      findUnique: (...args: unknown[]) => mockSubscriptionFindUnique(...args),
    },
    subscriptionOption: {
      findMany: (...args: unknown[]) => mockSubscriptionOptionFindMany(...args),
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

  describe("calculateTotalPrice", () => {
    it("should calculate total price without options", async () => {
      const mockPlan: Plan = {
        id: 1,
        name: "個人",
        basePrice: 500.0,
        pricePerGb: 50.0,
        description: "個人ユーザー向けの基本プラン",
        createdAt: new Date(),
      };

      const mockSubscription: Subscription & { plan: Plan } = {
        id: 1,
        userId: 1,
        planId: 1,
        storageSize: 10,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: mockPlan,
      };

      mockSubscriptionFindUnique.mockResolvedValue(mockSubscription);
      mockSubscriptionOptionFindMany.mockResolvedValue([]);

      const result = await calculationService.calculateTotalPrice(1);

      // 基本料金500 + ストレージ料金500 (50 * 10) = 1000
      expect(result).toBe(1000.0);
    });

    it("should calculate total price with PC同期クライアント option", async () => {
      const mockPlan: Plan = {
        id: 1,
        name: "個人",
        basePrice: 500.0,
        pricePerGb: 50.0,
        description: "個人ユーザー向けの基本プラン",
        createdAt: new Date(),
      };

      const mockSubscription: Subscription & { plan: Plan } = {
        id: 1,
        userId: 1,
        planId: 1,
        storageSize: 10,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: mockPlan,
      };

      const mockOption: Option = {
        id: 1,
        name: "PC同期クライアント",
        description: "PCとのファイル自動同期",
        priceType: "PER_USER",
        unitPrice: 100.0,
        createdAt: new Date(),
      };

      const mockSubscriptionOptions = [
        {
          id: 1,
          subscriptionId: 1,
          optionId: 1,
          quantity: 5,
          price: 500.0,
          createdAt: new Date(),
          updatedAt: new Date(),
          option: mockOption,
        },
      ];

      mockSubscriptionFindUnique.mockResolvedValue(mockSubscription);
      mockSubscriptionOptionFindMany.mockResolvedValue(mockSubscriptionOptions);

      const result = await calculationService.calculateTotalPrice(1);

      // 基本料金500 + ストレージ料金500 + オプション料金500 = 1500
      expect(result).toBe(1500.0);
    });

    it("should calculate total price with セキュリティ option", async () => {
      const mockPlan: Plan = {
        id: 2,
        name: "ビジネス",
        basePrice: 1500.0,
        pricePerGb: 30.0,
        description: "小規模チーム向けプラン",
        createdAt: new Date(),
      };

      const mockSubscription: Subscription & { plan: Plan } = {
        id: 2,
        userId: 1,
        planId: 2,
        storageSize: 100,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: mockPlan,
      };

      const mockOption: Option = {
        id: 2,
        name: "セキュリティ",
        description: "SSO・証跡保護",
        priceType: "FIXED",
        unitPrice: 5000.0,
        createdAt: new Date(),
      };

      const mockSubscriptionOptions = [
        {
          id: 2,
          subscriptionId: 2,
          optionId: 2,
          quantity: 1,
          price: 5000.0,
          createdAt: new Date(),
          updatedAt: new Date(),
          option: mockOption,
        },
      ];

      mockSubscriptionFindUnique.mockResolvedValue(mockSubscription);
      mockSubscriptionOptionFindMany.mockResolvedValue(mockSubscriptionOptions);

      const result = await calculationService.calculateTotalPrice(2);

      // 基本料金1500 + ストレージ料金3000 (30 * 100) + オプション料金5000 = 9500
      expect(result).toBe(9500.0);
    });

    it("should calculate total price with バックアップ option", async () => {
      const mockPlan: Plan = {
        id: 1,
        name: "個人",
        basePrice: 500.0,
        pricePerGb: 50.0,
        description: "個人ユーザー向けの基本プラン",
        createdAt: new Date(),
      };

      const mockSubscription: Subscription & { plan: Plan } = {
        id: 3,
        userId: 1,
        planId: 1,
        storageSize: 50,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: mockPlan,
      };

      const mockOption: Option = {
        id: 3,
        name: "バックアップ",
        description: "30日間のファイル履歴保存",
        priceType: "PER_GB",
        unitPrice: 10.0,
        createdAt: new Date(),
      };

      const mockSubscriptionOptions = [
        {
          id: 3,
          subscriptionId: 3,
          optionId: 3,
          quantity: 50,
          price: 500.0,
          createdAt: new Date(),
          updatedAt: new Date(),
          option: mockOption,
        },
      ];

      mockSubscriptionFindUnique.mockResolvedValue(mockSubscription);
      mockSubscriptionOptionFindMany.mockResolvedValue(mockSubscriptionOptions);

      const result = await calculationService.calculateTotalPrice(3);

      // 基本料金500 + ストレージ料金2500 (50 * 50) + オプション料金500 (10 * 50) = 3500
      expect(result).toBe(3500.0);
    });

    it("should calculate total price with multiple options", async () => {
      const mockPlan: Plan = {
        id: 2,
        name: "ビジネス",
        basePrice: 1500.0,
        pricePerGb: 30.0,
        description: "小規模チーム向けプラン",
        createdAt: new Date(),
      };

      const mockSubscription: Subscription & { plan: Plan } = {
        id: 4,
        userId: 1,
        planId: 2,
        storageSize: 100,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: mockPlan,
      };

      const mockOptions = [
        {
          id: 1,
          subscriptionId: 4,
          optionId: 1,
          quantity: 5,
          price: 500.0,
          createdAt: new Date(),
          updatedAt: new Date(),
          option: {
            id: 1,
            name: "PC同期クライアント",
            description: "PCとのファイル自動同期",
            priceType: "PER_USER",
            unitPrice: 100.0,
            createdAt: new Date(),
          },
        },
        {
          id: 2,
          subscriptionId: 4,
          optionId: 2,
          quantity: 1,
          price: 5000.0,
          createdAt: new Date(),
          updatedAt: new Date(),
          option: {
            id: 2,
            name: "セキュリティ",
            description: "SSO・証跡保護",
            priceType: "FIXED",
            unitPrice: 5000.0,
            createdAt: new Date(),
          },
        },
        {
          id: 3,
          subscriptionId: 4,
          optionId: 3,
          quantity: 100,
          price: 1000.0,
          createdAt: new Date(),
          updatedAt: new Date(),
          option: {
            id: 3,
            name: "バックアップ",
            description: "30日間のファイル履歴保存",
            priceType: "PER_GB",
            unitPrice: 10.0,
            createdAt: new Date(),
          },
        },
      ];

      mockSubscriptionFindUnique.mockResolvedValue(mockSubscription);
      mockSubscriptionOptionFindMany.mockResolvedValue(mockOptions);

      const result = await calculationService.calculateTotalPrice(4);

      // 基本料金1500 + ストレージ料金3000 + PC同期500 + セキュリティ5000 + バックアップ1000 = 11000
      expect(result).toBe(11000.0);
    });

    it("should return null when subscription not found", async () => {
      mockSubscriptionFindUnique.mockResolvedValue(null);

      const result = await calculationService.calculateTotalPrice(999);

      expect(result).toBeNull();
    });
  });

  describe("calculatePriceBreakdown", () => {
    it("should return price breakdown without options", async () => {
      const mockPlan: Plan = {
        id: 1,
        name: "個人",
        basePrice: 500.0,
        pricePerGb: 50.0,
        description: "個人ユーザー向けの基本プラン",
        createdAt: new Date(),
      };

      const mockSubscription: Subscription & { plan: Plan } = {
        id: 1,
        userId: 1,
        planId: 1,
        storageSize: 10,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: mockPlan,
      };

      mockSubscriptionFindUnique.mockResolvedValue(mockSubscription);
      mockSubscriptionOptionFindMany.mockResolvedValue([]);

      const result = await calculationService.calculatePriceBreakdown(1);

      expect(result).toEqual({
        planId: 1,
        planName: "個人",
        storageSize: 10,
        basePrice: 500.0,
        storagePrice: 500.0,
        options: [],
        totalPrice: 1000.0,
      });
    });

    it("should return price breakdown with options", async () => {
      const mockPlan: Plan = {
        id: 2,
        name: "ビジネス",
        basePrice: 1500.0,
        pricePerGb: 30.0,
        description: "小規模チーム向けプラン",
        createdAt: new Date(),
      };

      const mockSubscription: Subscription & { plan: Plan } = {
        id: 2,
        userId: 1,
        planId: 2,
        storageSize: 100,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: mockPlan,
      };

      const mockOptions = [
        {
          id: 1,
          subscriptionId: 2,
          optionId: 1,
          quantity: 5,
          price: 500.0,
          createdAt: new Date(),
          updatedAt: new Date(),
          option: {
            id: 1,
            name: "PC同期クライアント",
            description: "PCとのファイル自動同期",
            priceType: "PER_USER",
            unitPrice: 100.0,
            createdAt: new Date(),
          },
        },
        {
          id: 2,
          subscriptionId: 2,
          optionId: 2,
          quantity: 1,
          price: 5000.0,
          createdAt: new Date(),
          updatedAt: new Date(),
          option: {
            id: 2,
            name: "セキュリティ",
            description: "SSO・証跡保護",
            priceType: "FIXED",
            unitPrice: 5000.0,
            createdAt: new Date(),
          },
        },
      ];

      mockSubscriptionFindUnique.mockResolvedValue(mockSubscription);
      mockSubscriptionOptionFindMany.mockResolvedValue(mockOptions);

      const result = await calculationService.calculatePriceBreakdown(2);

      expect(result).toEqual({
        planId: 2,
        planName: "ビジネス",
        storageSize: 100,
        basePrice: 1500.0,
        storagePrice: 3000.0,
        options: [
          {
            optionId: 1,
            optionName: "PC同期クライアント",
            quantity: 5,
            unitPrice: 100.0,
            totalPrice: 500.0,
          },
          {
            optionId: 2,
            optionName: "セキュリティ",
            quantity: 1,
            unitPrice: 5000.0,
            totalPrice: 5000.0,
          },
        ],
        totalPrice: 10000.0,
      });
    });

    it("should return null when subscription not found", async () => {
      mockSubscriptionFindUnique.mockResolvedValue(null);

      const result = await calculationService.calculatePriceBreakdown(999);

      expect(result).toBeNull();
    });
  });
});
