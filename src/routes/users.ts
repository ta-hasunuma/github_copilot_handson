import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validation";
import { UserService } from "../services/userService";
import {
  sendInternalError,
  sendSuccess,
  sendValidationError,
} from "../utils/response";

const router = Router();
const userService = new UserService();

// Validation schemas
const userCreateSchema = z.object({
  // email: 必須、有効なメール形式
  email: z.string().email("有効なメールアドレスを入力してください"),

  // name: 必須、1-50文字、特殊文字制限
  name: z
    .string()
    .min(1, "名前は必須です")
    .max(50, "名前は50文字以内で入力してください")
    .regex(
      /^[a-zA-Z0-9ぁ-んァ-ヶー一-龠々\s\-_]+$/,
      "名前に使用できない文字が含まれています"
    ),

  // phone: 任意、日本の電話番号形式
  phone: z
    .string()
    .regex(
      /^(0\d{1,4}-?\d{1,4}-?\d{4}|0\d{9,10})$/,
      "有効な日本の電話番号を入力してください（例: 03-1234-5678, 090-1234-5678）"
    )
    .optional()
    .or(z.literal("")),

  // company: 任意、1-100文字
  company: z
    .string()
    .min(1, "会社名は1文字以上で入力してください")
    .max(100, "会社名は100文字以内で入力してください")
    .optional()
    .or(z.literal("")),
});

interface CreateUserRequest {
  email: string;
  name: string;
  phone?: string;
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
    req: Request<
      Record<string, never>,
      Record<string, never>,
      CreateUserRequest
    >,
    res: Response
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
        phone: phone || null,
        company: company || null,
      });

      return sendSuccess(res, user, "ユーザーが正常に登録されました", 201);
    } catch (error) {
      console.error("Error creating user:", error);
      return sendInternalError(res, "Failed to create user");
    }
  }
);

export default router;
