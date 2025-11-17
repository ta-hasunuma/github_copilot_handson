import type { Plan, Subscription, User } from "@prisma/client";
import { SubscriptionService } from "../../src/services/subscriptionService";

// Prismaクライアントのモック
const mockSubscriptionCreate = jest.fn();
const mockSubscriptionFindUnique = jest.fn();
const mockSubscriptionFindMany = jest.fn();

jest.mock("../../src/lib/prisma", () => ({
  __esModule: true,
  default: {
    subscription: {
      create: (...args: unknown[]) => mockSubscriptionCreate(...args),
      findUnique: (...args: unknown[]) => mockSubscriptionFindUnique(...args),
      findMany: (...args: unknown[]) => mockSubscriptionFindMany(...args),
    },
  },
}));

describe("SubscriptionService", () => {
  let subscriptionService: SubscriptionService;

  beforeEach(() => {
    subscriptionService = new SubscriptionService();
    jest.clearAllMocks();
  });

  describe("createSubscription", () => {
    it("should create a new subscription successfully", async () => {
      const subscriptionData = {
        userId: 1,
        planId: 2,
        storageSize: 100,
      };

      const mockSubscription: Subscription = {
        id: 1,
        userId: 1,
        planId: 2,
        storageSize: 100,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSubscriptionCreate.mockResolvedValue(mockSubscription);

      const result = await subscriptionService.createSubscription(subscriptionData);

      expect(result).toEqual(mockSubscription);
      expect(mockSubscriptionCreate).toHaveBeenCalledWith({
        data: {
          userId: 1,
          planId: 2,
          storageSize: 100,
          status: "pending",
        },
      });
      expect(mockSubscriptionCreate).toHaveBeenCalledTimes(1);
    });

    it("should create subscription with minimum storage size", async () => {
      const subscriptionData = {
        userId: 1,
        planId: 1,
        storageSize: 1,
      };

      const mockSubscription: Subscription = {
        id: 2,
        userId: 1,
        planId: 1,
        storageSize: 1,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSubscriptionCreate.mockResolvedValue(mockSubscription);

      const result = await subscriptionService.createSubscription(subscriptionData);

      expect(result.storageSize).toBe(1);
    });
  });

  describe("getSubscriptionById", () => {
    it("should return subscription with user and plan details", async () => {
      const mockUser: User = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        phone: "03-1234-5678",
        company: "Test Company",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPlan: Plan = {
        id: 2,
        name: "ビジネス",
        basePrice: 5000.0,
        pricePerGb: 80.0,
        description: "小規模チーム向けプラン",
        createdAt: new Date(),
      };

      const mockSubscription = {
        id: 1,
        userId: 1,
        planId: 2,
        storageSize: 100,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
        plan: mockPlan,
      };

      mockSubscriptionFindUnique.mockResolvedValue(mockSubscription);

      const result = await subscriptionService.getSubscriptionById(1);

      expect(result).toEqual(mockSubscription);
      expect(mockSubscriptionFindUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          user: true,
          plan: true,
        },
      });
    });

    it("should return null when subscription not found", async () => {
      mockSubscriptionFindUnique.mockResolvedValue(null);

      const result = await subscriptionService.getSubscriptionById(999);

      expect(result).toBeNull();
    });
  });

  describe("getSubscriptionsByUserId", () => {
    it("should return all subscriptions for a user", async () => {
      const mockUser: User = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        phone: "03-1234-5678",
        company: "Test Company",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPlan: Plan = {
        id: 2,
        name: "ビジネス",
        basePrice: 5000.0,
        pricePerGb: 80.0,
        description: "小規模チーム向けプラン",
        createdAt: new Date(),
      };

      const mockSubscriptions = [
        {
          id: 1,
          userId: 1,
          planId: 2,
          storageSize: 100,
          status: "pending",
          createdAt: new Date("2025-11-06T10:00:00Z"),
          updatedAt: new Date("2025-11-06T10:00:00Z"),
          user: mockUser,
          plan: mockPlan,
        },
        {
          id: 2,
          userId: 1,
          planId: 2,
          storageSize: 200,
          status: "active",
          createdAt: new Date("2025-11-06T09:00:00Z"),
          updatedAt: new Date("2025-11-06T09:00:00Z"),
          user: mockUser,
          plan: mockPlan,
        },
      ];

      mockSubscriptionFindMany.mockResolvedValue(mockSubscriptions);

      const result = await subscriptionService.getSubscriptionsByUserId(1);

      expect(result).toEqual(mockSubscriptions);
      expect(mockSubscriptionFindMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: {
          user: true,
          plan: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });

    it("should return empty array when user has no subscriptions", async () => {
      mockSubscriptionFindMany.mockResolvedValue([]);

      const result = await subscriptionService.getSubscriptionsByUserId(999);

      expect(result).toEqual([]);
    });
  });

  describe("getAllSubscriptions", () => {
    it("should return all subscriptions with details", async () => {
      const mockUser: User = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        phone: "03-1234-5678",
        company: "Test Company",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPlan: Plan = {
        id: 2,
        name: "ビジネス",
        basePrice: 5000.0,
        pricePerGb: 80.0,
        description: "小規模チーム向けプラン",
        createdAt: new Date(),
      };

      const mockSubscriptions = [
        {
          id: 1,
          userId: 1,
          planId: 2,
          storageSize: 100,
          status: "pending",
          createdAt: new Date("2025-11-06T10:00:00Z"),
          updatedAt: new Date("2025-11-06T10:00:00Z"),
          user: mockUser,
          plan: mockPlan,
        },
      ];

      mockSubscriptionFindMany.mockResolvedValue(mockSubscriptions);

      const result = await subscriptionService.getAllSubscriptions();

      expect(result).toEqual(mockSubscriptions);
      expect(mockSubscriptionFindMany).toHaveBeenCalledWith({
        include: {
          user: true,
          plan: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });

    it("should return empty array when no subscriptions exist", async () => {
      mockSubscriptionFindMany.mockResolvedValue([]);

      const result = await subscriptionService.getAllSubscriptions();

      expect(result).toEqual([]);
    });
  });
});
