import type { User } from "@prisma/client";
import { UserService } from "../../src/services/userService";

// Prismaクライアントのモック
const mockUserCreate = jest.fn();
const mockUserFindUnique = jest.fn();
const mockUserFindMany = jest.fn();

jest.mock("../../src/lib/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      create: (...args: unknown[]) => mockUserCreate(...args),
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
    },
  },
}));

describe("UserService", () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe("createUser", () => {
    it("should create a new user successfully", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        phone: "03-1234-5678",
        company: "Test Company",
      };

      const mockUser: User = {
        id: 1,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserCreate.mockResolvedValue(mockUser);

      const result = await userService.createUser(userData);

      expect(result).toEqual(mockUser);
      expect(mockUserCreate).toHaveBeenCalledWith({
        data: userData,
      });
      expect(mockUserCreate).toHaveBeenCalledTimes(1);
    });

    it("should handle optional company field", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        phone: "03-1234-5678",
      };

      const mockUser: User = {
        id: 1,
        ...userData,
        company: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserCreate.mockResolvedValue(mockUser);

      const result = await userService.createUser(userData);

      expect(result).toEqual(mockUser);
      expect(result.company).toBeNull();
    });
  });

  describe("getUserById", () => {
    it("should return user when found", async () => {
      const mockUser: User = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        phone: "03-1234-5678",
        company: "Test Company",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserFindUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserById(1);

      expect(result).toEqual(mockUser);
      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should return null when user not found", async () => {
      mockUserFindUnique.mockResolvedValue(null);

      const result = await userService.getUserById(999);

      expect(result).toBeNull();
    });
  });

  describe("getUserByEmail", () => {
    it("should return user when email exists", async () => {
      const mockUser: User = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        phone: "03-1234-5678",
        company: "Test Company",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserFindUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserByEmail("test@example.com");

      expect(result).toEqual(mockUser);
      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
    });

    it("should return null when email does not exist", async () => {
      mockUserFindUnique.mockResolvedValue(null);

      const result = await userService.getUserByEmail("nonexistent@example.com");

      expect(result).toBeNull();
    });
  });

  describe("isEmailUsed", () => {
    it("should return true when email is already used", async () => {
      const mockUser: User = {
        id: 1,
        name: "Existing User",
        email: "existing@example.com",
        phone: "03-1234-5678",
        company: "Test Company",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserFindUnique.mockResolvedValue(mockUser);

      const result = await userService.isEmailUsed("existing@example.com");

      expect(result).toBe(true);
    });

    it("should return false when email is not used", async () => {
      mockUserFindUnique.mockResolvedValue(null);

      const result = await userService.isEmailUsed("available@example.com");

      expect(result).toBe(false);
    });
  });

  describe("userExists", () => {
    it("should return true when user exists", async () => {
      const mockUser: User = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        phone: "03-1234-5678",
        company: "Test Company",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserFindUnique.mockResolvedValue(mockUser);

      const result = await userService.userExists(1);

      expect(result).toBe(true);
    });

    it("should return false when user does not exist", async () => {
      mockUserFindUnique.mockResolvedValue(null);

      const result = await userService.userExists(999);

      expect(result).toBe(false);
    });
  });

  describe("getAllUsers", () => {
    it("should return all users sorted by creation date", async () => {
      const mockUsers: User[] = [
        {
          id: 2,
          name: "User 2",
          email: "user2@example.com",
          phone: "03-2222-2222",
          company: "Company 2",
          createdAt: new Date("2025-11-06T10:00:00Z"),
          updatedAt: new Date("2025-11-06T10:00:00Z"),
        },
        {
          id: 1,
          name: "User 1",
          email: "user1@example.com",
          phone: "03-1111-1111",
          company: "Company 1",
          createdAt: new Date("2025-11-06T09:00:00Z"),
          updatedAt: new Date("2025-11-06T09:00:00Z"),
        },
      ];

      mockUserFindMany.mockResolvedValue(mockUsers);

      const result = await userService.getAllUsers();

      expect(result).toEqual(mockUsers);
      expect(mockUserFindMany).toHaveBeenCalledWith({
        orderBy: {
          createdAt: "desc",
        },
      });
    });

    it("should return empty array when no users exist", async () => {
      mockUserFindMany.mockResolvedValue([]);

      const result = await userService.getAllUsers();

      expect(result).toEqual([]);
    });
  });
});
