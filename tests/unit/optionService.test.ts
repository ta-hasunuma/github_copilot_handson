import type { Option } from "@prisma/client";
import { OptionService } from "../../src/services/optionService";

// Prismaクライアントのモック
const mockOptionFindUnique = jest.fn();
const mockOptionFindMany = jest.fn();

jest.mock("../../src/lib/prisma", () => ({
  __esModule: true,
  default: {
    option: {
      findUnique: (...args: unknown[]) => mockOptionFindUnique(...args),
      findMany: (...args: unknown[]) => mockOptionFindMany(...args),
    },
  },
}));

describe("OptionService", () => {
  let optionService: OptionService;

  beforeEach(() => {
    optionService = new OptionService();
    jest.clearAllMocks();
  });

  describe("getAllOptions", () => {
    it("should return all options sorted by id", async () => {
      const mockOptions: Option[] = [
        {
          id: 1,
          name: "PC同期クライアント",
          description: "PCとのファイル自動同期",
          priceType: "PER_USER",
          unitPrice: 100.0,
          createdAt: new Date("2025-11-17T05:00:00Z"),
        },
        {
          id: 2,
          name: "セキュリティ",
          description: "SSO・証跡保護",
          priceType: "FIXED",
          unitPrice: 5000.0,
          createdAt: new Date("2025-11-17T05:00:00Z"),
        },
        {
          id: 3,
          name: "バックアップ",
          description: "30日間のファイル履歴保存",
          priceType: "PER_GB",
          unitPrice: 10.0,
          createdAt: new Date("2025-11-17T05:00:00Z"),
        },
      ];

      mockOptionFindMany.mockResolvedValue(mockOptions);

      const result = await optionService.getAllOptions();

      expect(result).toEqual(mockOptions);
      expect(mockOptionFindMany).toHaveBeenCalledWith({
        orderBy: {
          id: "asc",
        },
      });
    });

    it("should return empty array when no options exist", async () => {
      mockOptionFindMany.mockResolvedValue([]);

      const result = await optionService.getAllOptions();

      expect(result).toEqual([]);
    });
  });

  describe("getOptionById", () => {
    it("should return option when found", async () => {
      const mockOption: Option = {
        id: 1,
        name: "PC同期クライアント",
        description: "PCとのファイル自動同期",
        priceType: "PER_USER",
        unitPrice: 100.0,
        createdAt: new Date("2025-11-17T05:00:00Z"),
      };

      mockOptionFindUnique.mockResolvedValue(mockOption);

      const result = await optionService.getOptionById(1);

      expect(result).toEqual(mockOption);
      expect(mockOptionFindUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should return null when option not found", async () => {
      mockOptionFindUnique.mockResolvedValue(null);

      const result = await optionService.getOptionById(999);

      expect(result).toBeNull();
    });
  });

  describe("getOptionByName", () => {
    it("should return option when found by name", async () => {
      const mockOption: Option = {
        id: 1,
        name: "PC同期クライアント",
        description: "PCとのファイル自動同期",
        priceType: "PER_USER",
        unitPrice: 100.0,
        createdAt: new Date("2025-11-17T05:00:00Z"),
      };

      mockOptionFindUnique.mockResolvedValue(mockOption);

      const result = await optionService.getOptionByName("PC同期クライアント");

      expect(result).toEqual(mockOption);
      expect(mockOptionFindUnique).toHaveBeenCalledWith({
        where: { name: "PC同期クライアント" },
      });
    });

    it("should return null when option not found by name", async () => {
      mockOptionFindUnique.mockResolvedValue(null);

      const result = await optionService.getOptionByName(
        "存在しないオプション"
      );

      expect(result).toBeNull();
    });

    it("should handle special characters in option name", async () => {
      const mockOption: Option = {
        id: 2,
        name: "セキュリティ",
        description: "SSO・証跡保護",
        priceType: "FIXED",
        unitPrice: 5000.0,
        createdAt: new Date("2025-11-17T05:00:00Z"),
      };

      mockOptionFindUnique.mockResolvedValue(mockOption);

      const result = await optionService.getOptionByName("セキュリティ");

      expect(result).toEqual(mockOption);
    });
  });

  describe("optionExists", () => {
    it("should return true when option exists", async () => {
      const mockOption: Option = {
        id: 1,
        name: "PC同期クライアント",
        description: "PCとのファイル自動同期",
        priceType: "PER_USER",
        unitPrice: 100.0,
        createdAt: new Date("2025-11-17T05:00:00Z"),
      };

      mockOptionFindUnique.mockResolvedValue(mockOption);

      const result = await optionService.optionExists(1);

      expect(result).toBe(true);
    });

    it("should return false when option does not exist", async () => {
      mockOptionFindUnique.mockResolvedValue(null);

      const result = await optionService.optionExists(999);

      expect(result).toBe(false);
    });

    it("should return true for valid option IDs", async () => {
      const mockOption: Option = {
        id: 3,
        name: "バックアップ",
        description: "30日間のファイル履歴保存",
        priceType: "PER_GB",
        unitPrice: 10.0,
        createdAt: new Date("2025-11-17T05:00:00Z"),
      };

      mockOptionFindUnique.mockResolvedValue(mockOption);

      const result = await optionService.optionExists(3);

      expect(result).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should handle database errors in getAllOptions", async () => {
      mockOptionFindMany.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(optionService.getAllOptions()).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle database errors in getOptionById", async () => {
      mockOptionFindUnique.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(optionService.getOptionById(1)).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle database errors in getOptionByName", async () => {
      mockOptionFindUnique.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(
        optionService.getOptionByName("PC同期クライアント")
      ).rejects.toThrow("Database connection failed");
    });

    it("should handle database errors in optionExists", async () => {
      mockOptionFindUnique.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(optionService.optionExists(1)).rejects.toThrow(
        "Database connection failed"
      );
    });
  });
});
