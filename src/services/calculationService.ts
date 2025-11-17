import prisma from "../lib/prisma";

export interface CalculationResult {
  planId: number;
  planName: string;
  storageSize: number;
  basePrice: number;
  storagePrice: number;
  totalPrice: number;
}

export class CalculationService {
  /**
   * プランIDとストレージサイズから料金を計算
   */
  async calculatePrice(planId: number, storageSize: number): Promise<CalculationResult | null> {
    // プランを取得
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return null;
    }

    // 料金計算: 基本料金 + (容量単価 × ストレージサイズ)
    const basePrice = plan.basePrice;
    const storagePrice = plan.pricePerGb * storageSize;
    const totalPrice = basePrice + storagePrice;

    return {
      planId: plan.id,
      planName: plan.name,
      storageSize,
      basePrice,
      storagePrice,
      totalPrice,
    };
  }

  /**
   * プランが存在するかチェック
   */
  async planExists(planId: number): Promise<boolean> {
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });
    return plan !== null;
  }
}
