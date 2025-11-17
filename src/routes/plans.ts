import type { Request, Response } from "express";
import { Router } from "express";
import { PlanService } from "../services/planService";
import { sendInternalError, sendSuccess } from "../utils/response";

const router = Router();
const planService = new PlanService();

/**
 * GET /api/v1/plans
 * プラン一覧を取得
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const plans = await planService.getAllPlans();
    return sendSuccess(res, plans, "プラン一覧を取得しました");
  } catch (error) {
    console.error("Error fetching plans:", error);
    return sendInternalError(res, "Failed to fetch plans");
  }
});

export default router;
