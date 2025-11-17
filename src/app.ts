import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
// ルーターのインポート
import calculateRouter from "./routes/calculate";
import debugRouter from "./routes/debug";
import healthRouter from "./routes/health";
import plansRouter from "./routes/plans";
import subscriptionsRouter from "./routes/subscriptions";
import usersRouter from "./routes/users";

// 環境変数の読み込み
dotenv.config();

const app = express();
const API_VERSION = process.env.API_VERSION || "v1";

// セキュリティミドルウェア
app.use(helmet());
app.use(cors());
app.use(compression());

// レート制限
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15分
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10), // 最大100リクエスト
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests from this IP, please try again later",
    },
  },
});
app.use(limiter);

// JSONパーサー
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ヘルスチェック (レート制限の対象外)
app.use("/health", healthRouter);

// APIルートの設定
app.use(`/api/${API_VERSION}/calculate`, calculateRouter);
app.use(`/api/${API_VERSION}/users`, usersRouter);
app.use(`/api/${API_VERSION}/subscriptions`, subscriptionsRouter);
app.use(`/api/${API_VERSION}/plans`, plansRouter);
app.use(`/api/${API_VERSION}/debug`, debugRouter);

// 404ハンドラー
app.use("*", (_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Endpoint not found",
    },
  });
});

// エラーハンドラー
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      },
    });
  }
);

export default app;
