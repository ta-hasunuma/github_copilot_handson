import type { Request, Response } from "express";
import { Router } from "express";
import prisma from "../lib/prisma";
import { sendSuccess } from "../utils/response";

const router = Router();

/**
 * GET /health
 * ヘルスチェックエンドポイント
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const timestamp = new Date().toISOString();
    let databaseStatus = "healthy";
    let databaseResponseTime = 0;

    // データベース接続確認
    try {
      const startTime = Date.now();
      // シンプルなクエリでDB接続を確認
      await prisma.$queryRaw`SELECT 1`;
      const endTime = Date.now();
      databaseResponseTime = endTime - startTime;
    } catch (dbError) {
      console.error("Database health check failed:", dbError);
      databaseStatus = "unhealthy";
    }

    const healthData = {
      service: "Stash API",
      status: databaseStatus === "healthy" ? "healthy" : "degraded",
      timestamp,
      database: databaseStatus,
      databaseResponseTime,
    };

    // データベースが不健全な場合は503を返す
    if (databaseStatus !== "healthy") {
      return res.status(503).json({
        success: false,
        data: healthData,
        message: "Service is degraded",
      });
    }

    return sendSuccess(res, healthData, "Service is healthy", 200);
  } catch (error) {
    console.error("Health check error:", error);
    return res.status(503).json({
      success: false,
      error: {
        code: "HEALTH_CHECK_FAILED",
        message: "Failed to perform health check",
      },
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
