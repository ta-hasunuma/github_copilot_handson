import type { Plan } from "@prisma/client";
import prisma from "../lib/prisma";

export class PlanService {
  /**
   * すべてのプランを取得
   */
  async getAllPlans(): Promise<Plan[]> {
    return await prisma.plan.findMany({
      orderBy: {
        basePrice: "asc",
      },
    });
  }

  /**
   * IDでプランを取得
   */
  async getPlanById(id: number): Promise<Plan | null> {
    return await prisma.plan.findUnique({
      where: { id },
    });
  }

  /**
   * プランが存在するかチェック
   */
  async planExists(id: number): Promise<boolean> {
    const plan = await this.getPlanById(id);
    return plan !== null;
  }
}
