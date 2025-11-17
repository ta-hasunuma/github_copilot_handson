import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { validateQuery } from "../middleware/validation";
import { CalculationService } from "../services/calculationService";
import {
  sendInternalError,
  sendNotFoundError,
  sendSuccess,
} from "../utils/response";

const router = Router();
const calculationService = new CalculationService();

// クエリパラメータは文字列で来るので、coerceで数値に変換
const calculateQuerySchema = z.object({
  // planId: 必須、有効なプランID（正の整数）
  planId: z.coerce
    .number({ required_error: "プランIDは必須です" })
    .int("プランIDは整数である必要があります")
    .positive("プランIDは正の数である必要があります"),

  // storageSize: 必須、1-10000の数値
  storageSize: z.coerce
    .number({ required_error: "ストレージサイズは必須です" })
    .int("ストレージサイズは整数である必要があります")
    .min(1, "ストレージサイズは1GB以上である必要があります")
    .max(10000, "ストレージサイズは10000GB以下である必要があります"),
});

/**
 * GET /api/v1/calculate
 * 料金計算
 * クエリパラメータ: planId, storageSize
 */
router.get(
  "/",
  validateQuery(calculateQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const planId = parseInt(req.query.planId as string, 10);
      const storageSize = parseInt(req.query.storageSize as string, 10);

      // プランの存在チェック
      if (!(await calculationService.planExists(planId))) {
        return sendNotFoundError(res, "Plan");
      }

      // 料金計算
      const result = await calculationService.calculatePrice(
        planId,
        storageSize
      );

      if (!result) {
        return sendNotFoundError(res, "Plan");
      }

      return sendSuccess(res, result, "料金計算が完了しました");
    } catch (error) {
      console.error("Error calculating price:", error);
      return sendInternalError(res, "Failed to calculate price");
    }
  }
);

export default router;
