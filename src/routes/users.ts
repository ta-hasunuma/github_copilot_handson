import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validation";
import { UserService } from "../services/userService";
import { sendInternalError, sendSuccess, sendValidationError } from "../utils/response";

const router = Router();
const userService = new UserService();

// Validation schemas
const userCreateSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  phone: z.string(),
  company: z.string().optional(),
});

interface CreateUserRequest {
  email: string;
  name: string;
  phone: string;
  company?: string;
}

/**
 * POST /api/v1/users
 * ユーザー登録
 */
router.post(
  "/",
  validateBody(userCreateSchema),
  async (
    req: Request<Record<string, never>, Record<string, never>, CreateUserRequest>,
    res: Response,
  ) => {
    try {
      const { email, name, phone, company } = req.body;

      // メールアドレスの重複チェック
      if (await userService.isEmailUsed(email)) {
        return sendValidationError(res, "Email is already registered");
      }

      const user = await userService.createUser({
        email,
        name,
        phone,
        company: company || null,
      });

      return sendSuccess(res, user, "ユーザーが正常に登録されました", 201);
    } catch (error) {
      console.error("Error creating user:", error);
      return sendInternalError(res, "Failed to create user");
    }
  },
);

export default router;
