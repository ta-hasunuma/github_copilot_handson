import type { Request, Response } from "express";
import { Router } from "express";
import { OptionService } from "../services/optionService";
import { sendInternalError, sendSuccess } from "../utils/response";

const router = Router();
const optionService = new OptionService();

/**
 * GET /api/v1/options
 * オプション一覧を取得
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const options = await optionService.getAllOptions();
    return sendSuccess(res, options, "オプション一覧を取得しました");
  } catch (error) {
    console.error("Error fetching options:", error);
    return sendInternalError(res, "Failed to fetch options");
  }
});

export default router;
