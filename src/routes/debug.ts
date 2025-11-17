import type { Request, Response } from "express";
import { Router } from "express";
import { SubscriptionService } from "../services/subscriptionService";
import { UserService } from "../services/userService";
import { sendInternalError, sendSuccess } from "../utils/response";

const router = Router();
const userService = new UserService();
const subscriptionService = new SubscriptionService();

/**
 * GET /api/v1/debug/users
 * デバッグ用：全ユーザー一覧を取得
 */
router.get("/users", async (_req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();
    return sendSuccess(res, users, "ユーザー一覧を取得しました");
  } catch (error) {
    console.error("Error fetching users:", error);
    return sendInternalError(res, "Failed to fetch users");
  }
});

/**
 * GET /api/v1/debug/subscriptions
 * デバッグ用：全プラン申し込み一覧を取得
 */
router.get("/subscriptions", async (_req: Request, res: Response) => {
  try {
    const subscriptions = await subscriptionService.getAllSubscriptions();
    return sendSuccess(res, subscriptions, "プラン申し込み一覧を取得しました");
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return sendInternalError(res, "Failed to fetch subscriptions");
  }
});

export default router;
