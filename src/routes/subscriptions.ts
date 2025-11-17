import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validation";
import { PlanService } from "../services/planService";
import { SubscriptionService } from "../services/subscriptionService";
import { UserService } from "../services/userService";
import { sendInternalError, sendSuccess, sendValidationError } from "../utils/response";

const router = Router();
const subscriptionService = new SubscriptionService();
const userService = new UserService();
const planService = new PlanService();

const subscriptionCreateSchema = z.object({
  user_id: z.number().positive(),
  plan_id: z.number().positive(),
  storage_size: z.number().positive(),
});

interface CreateSubscriptionRequest {
  user_id: number;
  plan_id: number;
  storage_size: number;
}

/**
 * POST /api/v1/subscriptions
 * プラン申し込み
 */
router.post(
  "/",
  validateBody(subscriptionCreateSchema),
  async (
    req: Request<Record<string, never>, Record<string, never>, CreateSubscriptionRequest>,
    res: Response,
  ) => {
    try {
      const { user_id, plan_id, storage_size } = req.body;

      // ユーザーの存在確認
      if (!(await userService.userExists(user_id))) {
        return sendValidationError(res, "User not found");
      }

      // プランの存在確認
      if (!(await planService.planExists(plan_id))) {
        return sendValidationError(res, "Plan not found");
      }

      // プラン申し込みを作成
      const subscription = await subscriptionService.createSubscription({
        userId: user_id,
        planId: plan_id,
        storageSize: storage_size,
      });

      return sendSuccess(res, subscription, "申し込みが正常に作成されました", 201);
    } catch (error) {
      console.error("Error creating subscription:", error);
      return sendInternalError(res, "Failed to create subscription");
    }
  },
);

export default router;
