import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validation";
import { SubscriptionOptionService } from "../services/subscriptionOptionService";
import { SubscriptionService } from "../services/subscriptionService";
import {
  sendInternalError,
  sendNotFound,
  sendSuccess,
  sendValidationError,
} from "../utils/response";

const router = Router();
const subscriptionOptionService = new SubscriptionOptionService();
const subscriptionService = new SubscriptionService();

// バリデーションスキーマ
const addOptionSchema = z.object({
  optionId: z
    .number({ required_error: "オプションIDは必須です" })
    .int("オプションIDは整数である必要があります")
    .positive("オプションIDは正の数である必要があります"),
  quantity: z
    .number({ required_error: "数量は必須です" })
    .int("数量は整数である必要があります")
    .positive("数量は正の数である必要があります"),
});

const updateQuantitySchema = z.object({
  quantity: z
    .number({ required_error: "数量は必須です" })
    .int("数量は整数である必要があります")
    .positive("数量は正の数である必要があります"),
});

interface AddOptionRequest {
  optionId: number;
  quantity: number;
}

interface UpdateQuantityRequest {
  quantity: number;
}

/**
 * POST /api/v1/subscriptions/:id/options
 * 契約にオプションを追加
 */
router.post(
  "/:id/options",
  validateBody(addOptionSchema),
  async (
    req: Request<{ id: string }, Record<string, never>, AddOptionRequest>,
    res: Response
  ) => {
    try {
      const subscriptionId = Number.parseInt(req.params.id, 10);
      const { optionId, quantity } = req.body;

      // 契約の存在確認
      const subscription = await subscriptionService.getSubscriptionById(
        subscriptionId
      );
      if (!subscription) {
        return sendNotFound(res, "Subscription not found");
      }

      // オプション追加
      const subscriptionOption =
        await subscriptionOptionService.addOptionToSubscription({
          subscriptionId,
          optionId,
          quantity,
        });

      return sendSuccess(
        res,
        subscriptionOption,
        "オプションが正常に追加されました",
        201
      );
    } catch (error) {
      console.error("Error adding option to subscription:", error);
      if (error instanceof Error && error.message === "Option not found") {
        return sendNotFound(res, "Option not found");
      }
      if (
        error instanceof Error &&
        error.message === "Option already added to this subscription"
      ) {
        return sendValidationError(
          res,
          "Option already added to this subscription"
        );
      }
      return sendInternalError(res, "Failed to add option to subscription");
    }
  }
);

/**
 * GET /api/v1/subscriptions/:id/options
 * 契約に紐づくオプション一覧を取得
 */
router.get(
  "/:id/options",
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const subscriptionId = Number.parseInt(req.params.id, 10);

      // 契約の存在確認
      const subscription = await subscriptionService.getSubscriptionById(
        subscriptionId
      );
      if (!subscription) {
        return sendNotFound(res, "Subscription not found");
      }

      // オプション一覧取得
      const options = await subscriptionOptionService.getSubscriptionOptions(
        subscriptionId
      );

      return sendSuccess(res, options, "オプション一覧を取得しました");
    } catch (error) {
      console.error("Error fetching subscription options:", error);
      return sendInternalError(res, "Failed to fetch subscription options");
    }
  }
);

/**
 * PUT /api/v1/subscriptions/:id/options/:optionId
 * オプションの数量を更新
 */
router.put(
  "/:id/options/:optionId",
  validateBody(updateQuantitySchema),
  async (
    req: Request<
      { id: string; optionId: string },
      Record<string, never>,
      UpdateQuantityRequest
    >,
    res: Response
  ) => {
    try {
      const subscriptionId = Number.parseInt(req.params.id, 10);
      const optionId = Number.parseInt(req.params.optionId, 10);
      const { quantity } = req.body;

      // 契約オプションを取得
      const options = await subscriptionOptionService.getSubscriptionOptions(
        subscriptionId
      );
      const subscriptionOption = options.find(
        (opt) => opt.optionId === optionId
      );

      if (!subscriptionOption) {
        return sendNotFound(res, "Subscription option not found");
      }

      // 数量更新
      const updatedOption =
        await subscriptionOptionService.updateOptionQuantity(
          subscriptionOption.id,
          quantity
        );

      return sendSuccess(res, updatedOption, "数量が正常に更新されました");
    } catch (error) {
      console.error("Error updating option quantity:", error);
      return sendInternalError(res, "Failed to update option quantity");
    }
  }
);

/**
 * DELETE /api/v1/subscriptions/:id/options/:optionId
 * 契約からオプションを削除
 */
router.delete(
  "/:id/options/:optionId",
  async (req: Request<{ id: string; optionId: string }>, res: Response) => {
    try {
      const subscriptionId = Number.parseInt(req.params.id, 10);
      const optionId = Number.parseInt(req.params.optionId, 10);

      // 契約オプションを取得
      const options = await subscriptionOptionService.getSubscriptionOptions(
        subscriptionId
      );
      const subscriptionOption = options.find(
        (opt) => opt.optionId === optionId
      );

      if (!subscriptionOption) {
        return sendNotFound(res, "Subscription option not found");
      }

      // オプション削除
      await subscriptionOptionService.removeOptionFromSubscription(
        subscriptionOption.id
      );

      return sendSuccess(res, null, "オプションが正常に削除されました");
    } catch (error) {
      console.error("Error removing option from subscription:", error);
      return sendInternalError(
        res,
        "Failed to remove option from subscription"
      );
    }
  }
);

export default router;
