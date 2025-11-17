import type { Option, SubscriptionOption } from "@prisma/client";
import { SubscriptionOptionService } from "../../src/services/subscriptionOptionService";

// Prismaクライアントのモック
const mockSubscriptionOptionCreate = jest.fn();
const mockSubscriptionOptionUpdate = jest.fn();
const mockSubscriptionOptionDelete = jest.fn();
const mockSubscriptionOptionFindUnique = jest.fn();
const mockSubscriptionOptionFindMany = jest.fn();
const mockOptionFindUnique = jest.fn();

jest.mock("../../src/lib/prisma", () => ({
  __esModule: true,
  default: {
    subscriptionOption: {
      create: (...args: unknown[]) => mockSubscriptionOptionCreate(...args),
      update: (...args: unknown[]) => mockSubscriptionOptionUpdate(...args),
      delete: (...args: unknown[]) => mockSubscriptionOptionDelete(...args),
      findUnique: (...args: unknown[]) =>
        mockSubscriptionOptionFindUnique(...args),
      findMany: (...args: unknown[]) => mockSubscriptionOptionFindMany(...args),
    },
    option: {
      findUnique: (...args: unknown[]) => mockOptionFindUnique(...args),
    },
  },
}));

describe("SubscriptionOptionService", () => {
  let subscriptionOptionService: SubscriptionOptionService;

  beforeEach(() => {
    subscriptionOptionService = new SubscriptionOptionService();
    jest.clearAllMocks();
  });

  describe("addOptionToSubscription", () => {
    it("should add PC同期クライアント option with PER_USER pricing", async () => {
      const mockOption: Option = {
        id: 1,
        name: "PC同期クライアント",
        description: "PCとのファイル自動同期",
        priceType: "PER_USER",
        unitPrice: 100.0,
        createdAt: new Date(),
      };

      const mockSubscriptionOption: SubscriptionOption = {
        id: 1,
        subscriptionId: 1,
        optionId: 1,
        quantity: 5,
        price: 500.0, // 100 * 5
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOptionFindUnique.mockResolvedValue(mockOption);
      mockSubscriptionOptionCreate.mockResolvedValue(mockSubscriptionOption);

      const result = await subscriptionOptionService.addOptionToSubscription({
        subscriptionId: 1,
        optionId: 1,
        quantity: 5,
      });

      expect(result).toEqual(mockSubscriptionOption);
      expect(mockOptionFindUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockSubscriptionOptionCreate).toHaveBeenCalledWith({
        data: {
          subscriptionId: 1,
          optionId: 1,
          quantity: 5,
          price: 500.0,
        },
      });
    });

    it("should add セキュリティ option with FIXED pricing", async () => {
      const mockOption: Option = {
        id: 2,
        name: "セキュリティ",
        description: "SSO・証跡保護",
        priceType: "FIXED",
        unitPrice: 5000.0,
        createdAt: new Date(),
      };

      const mockSubscriptionOption: SubscriptionOption = {
        id: 2,
        subscriptionId: 1,
        optionId: 2,
        quantity: 1,
        price: 5000.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOptionFindUnique.mockResolvedValue(mockOption);
      mockSubscriptionOptionCreate.mockResolvedValue(mockSubscriptionOption);

      const result = await subscriptionOptionService.addOptionToSubscription({
        subscriptionId: 1,
        optionId: 2,
        quantity: 1,
      });

      expect(result).toEqual(mockSubscriptionOption);
      expect(mockSubscriptionOptionCreate).toHaveBeenCalledWith({
        data: {
          subscriptionId: 1,
          optionId: 2,
          quantity: 1,
          price: 5000.0,
        },
      });
    });

    it("should add バックアップ option with PER_GB pricing", async () => {
      const mockOption: Option = {
        id: 3,
        name: "バックアップ",
        description: "30日間のファイル履歴保存",
        priceType: "PER_GB",
        unitPrice: 10.0,
        createdAt: new Date(),
      };

      const mockSubscriptionOption: SubscriptionOption = {
        id: 3,
        subscriptionId: 1,
        optionId: 3,
        quantity: 50,
        price: 500.0, // 10 * 50
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOptionFindUnique.mockResolvedValue(mockOption);
      mockSubscriptionOptionCreate.mockResolvedValue(mockSubscriptionOption);

      const result = await subscriptionOptionService.addOptionToSubscription({
        subscriptionId: 1,
        optionId: 3,
        quantity: 50,
      });

      expect(result).toEqual(mockSubscriptionOption);
      expect(mockSubscriptionOptionCreate).toHaveBeenCalledWith({
        data: {
          subscriptionId: 1,
          optionId: 3,
          quantity: 50,
          price: 500.0,
        },
      });
    });

    it("should throw error when option not found", async () => {
      mockOptionFindUnique.mockResolvedValue(null);

      await expect(
        subscriptionOptionService.addOptionToSubscription({
          subscriptionId: 1,
          optionId: 999,
          quantity: 1,
        })
      ).rejects.toThrow("Option not found");
    });
  });

  describe("updateOptionQuantity", () => {
    it("should update quantity for PER_USER option", async () => {
      const mockOption: Option = {
        id: 1,
        name: "PC同期クライアント",
        description: "PCとのファイル自動同期",
        priceType: "PER_USER",
        unitPrice: 100.0,
        createdAt: new Date(),
      };

      const mockExistingSubscriptionOption: SubscriptionOption & {
        option: Option;
      } = {
        id: 1,
        subscriptionId: 1,
        optionId: 1,
        quantity: 5,
        price: 500.0,
        createdAt: new Date(),
        updatedAt: new Date(),
        option: mockOption,
      };

      const mockUpdatedSubscriptionOption: SubscriptionOption = {
        id: 1,
        subscriptionId: 1,
        optionId: 1,
        quantity: 10,
        price: 1000.0, // 100 * 10
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSubscriptionOptionFindUnique.mockResolvedValue(
        mockExistingSubscriptionOption
      );
      mockSubscriptionOptionUpdate.mockResolvedValue(
        mockUpdatedSubscriptionOption
      );

      const result = await subscriptionOptionService.updateOptionQuantity(
        1,
        10
      );

      expect(result).toEqual(mockUpdatedSubscriptionOption);
      expect(mockSubscriptionOptionUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          quantity: 10,
          price: 1000.0,
        },
      });
    });

    it("should update quantity for PER_GB option", async () => {
      const mockOption: Option = {
        id: 3,
        name: "バックアップ",
        description: "30日間のファイル履歴保存",
        priceType: "PER_GB",
        unitPrice: 10.0,
        createdAt: new Date(),
      };

      const mockExistingSubscriptionOption: SubscriptionOption & {
        option: Option;
      } = {
        id: 3,
        subscriptionId: 1,
        optionId: 3,
        quantity: 50,
        price: 500.0,
        createdAt: new Date(),
        updatedAt: new Date(),
        option: mockOption,
      };

      const mockUpdatedSubscriptionOption: SubscriptionOption = {
        id: 3,
        subscriptionId: 1,
        optionId: 3,
        quantity: 100,
        price: 1000.0, // 10 * 100
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSubscriptionOptionFindUnique.mockResolvedValue(
        mockExistingSubscriptionOption
      );
      mockSubscriptionOptionUpdate.mockResolvedValue(
        mockUpdatedSubscriptionOption
      );

      const result = await subscriptionOptionService.updateOptionQuantity(
        3,
        100
      );

      expect(result).toEqual(mockUpdatedSubscriptionOption);
      expect(mockSubscriptionOptionUpdate).toHaveBeenCalledWith({
        where: { id: 3 },
        data: {
          quantity: 100,
          price: 1000.0,
        },
      });
    });

    it("should throw error when subscription option not found", async () => {
      mockSubscriptionOptionFindUnique.mockResolvedValue(null);

      await expect(
        subscriptionOptionService.updateOptionQuantity(999, 10)
      ).rejects.toThrow("Subscription option not found");
    });
  });

  describe("removeOptionFromSubscription", () => {
    it("should remove option from subscription", async () => {
      mockSubscriptionOptionDelete.mockResolvedValue({
        id: 1,
        subscriptionId: 1,
        optionId: 1,
        quantity: 5,
        price: 500.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await subscriptionOptionService.removeOptionFromSubscription(1);

      expect(mockSubscriptionOptionDelete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockSubscriptionOptionDelete).toHaveBeenCalledTimes(1);
    });

    it("should handle deletion of non-existent option", async () => {
      mockSubscriptionOptionDelete.mockRejectedValue(
        new Error("Record not found")
      );

      await expect(
        subscriptionOptionService.removeOptionFromSubscription(999)
      ).rejects.toThrow("Record not found");
    });
  });

  describe("getSubscriptionOptions", () => {
    it("should return all options for a subscription", async () => {
      const mockOptions = [
        {
          id: 1,
          subscriptionId: 1,
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
          subscriptionId: 1,
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

      mockSubscriptionOptionFindMany.mockResolvedValue(mockOptions);

      const result = await subscriptionOptionService.getSubscriptionOptions(1);

      expect(result).toEqual(mockOptions);
      expect(mockSubscriptionOptionFindMany).toHaveBeenCalledWith({
        where: { subscriptionId: 1 },
        include: {
          option: true,
        },
      });
    });

    it("should return empty array when subscription has no options", async () => {
      mockSubscriptionOptionFindMany.mockResolvedValue([]);

      const result = await subscriptionOptionService.getSubscriptionOptions(1);

      expect(result).toEqual([]);
    });
  });

  describe("calculateOptionPrice", () => {
    it("should calculate price for FIXED option", async () => {
      const mockOption: Option = {
        id: 2,
        name: "セキュリティ",
        description: "SSO・証跡保護",
        priceType: "FIXED",
        unitPrice: 5000.0,
        createdAt: new Date(),
      };

      mockOptionFindUnique.mockResolvedValue(mockOption);

      const result = await subscriptionOptionService.calculateOptionPrice(2, 1);

      expect(result).toBe(5000.0);
    });

    it("should calculate price for PER_USER option", async () => {
      const mockOption: Option = {
        id: 1,
        name: "PC同期クライアント",
        description: "PCとのファイル自動同期",
        priceType: "PER_USER",
        unitPrice: 100.0,
        createdAt: new Date(),
      };

      mockOptionFindUnique.mockResolvedValue(mockOption);

      const result = await subscriptionOptionService.calculateOptionPrice(1, 5);

      expect(result).toBe(500.0);
    });

    it("should calculate price for PER_GB option", async () => {
      const mockOption: Option = {
        id: 3,
        name: "バックアップ",
        description: "30日間のファイル履歴保存",
        priceType: "PER_GB",
        unitPrice: 10.0,
        createdAt: new Date(),
      };

      mockOptionFindUnique.mockResolvedValue(mockOption);

      const result = await subscriptionOptionService.calculateOptionPrice(
        3,
        50
      );

      expect(result).toBe(500.0);
    });

    it("should calculate price for large quantities", async () => {
      const mockOption: Option = {
        id: 1,
        name: "PC同期クライアント",
        description: "PCとのファイル自動同期",
        priceType: "PER_USER",
        unitPrice: 100.0,
        createdAt: new Date(),
      };

      mockOptionFindUnique.mockResolvedValue(mockOption);

      const result = await subscriptionOptionService.calculateOptionPrice(
        1,
        1000
      );

      expect(result).toBe(100000.0);
    });

    it("should handle zero quantity", async () => {
      const mockOption: Option = {
        id: 1,
        name: "PC同期クライアント",
        description: "PCとのファイル自動同期",
        priceType: "PER_USER",
        unitPrice: 100.0,
        createdAt: new Date(),
      };

      mockOptionFindUnique.mockResolvedValue(mockOption);

      const result = await subscriptionOptionService.calculateOptionPrice(1, 0);

      expect(result).toBe(0);
    });

    it("should throw error when option not found", async () => {
      mockOptionFindUnique.mockResolvedValue(null);

      await expect(
        subscriptionOptionService.calculateOptionPrice(999, 5)
      ).rejects.toThrow("Option not found");
    });
  });

  describe("error handling", () => {
    it("should handle database errors in addOptionToSubscription", async () => {
      mockOptionFindUnique.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(
        subscriptionOptionService.addOptionToSubscription({
          subscriptionId: 1,
          optionId: 1,
          quantity: 5,
        })
      ).rejects.toThrow("Database connection failed");
    });

    it("should handle database errors in getSubscriptionOptions", async () => {
      mockSubscriptionOptionFindMany.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(
        subscriptionOptionService.getSubscriptionOptions(1)
      ).rejects.toThrow("Database connection failed");
    });
  });
});
