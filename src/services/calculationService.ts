import prisma from "../lib/prisma";

export interface CalculationResult {
  planId: number;
  planName: string;
  storageSize: number;
  basePrice: number;
  storagePrice: number;
  totalPrice: number;
}

export interface OptionBreakdown {
  optionId: number;
  optionName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PriceBreakdown {
  planId: number;
  planName: string;
  storageSize: number;
  basePrice: number;
  storagePrice: number;
  options: OptionBreakdown[];
  totalPrice: number;
}

export class CalculationService {
  /**
   * プランIDとストレージサイズから料金を計算
   */
  async calculatePrice(
    planId: number,
    storageSize: number
  ): Promise<CalculationResult | null> {
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

  /**
   * 契約の総額を計算（基本料金 + ストレージ + オプション）
   */
  async calculateTotalPrice(subscriptionId: number): Promise<number | null> {
    const breakdown = await this.calculatePriceBreakdown(subscriptionId);
    return breakdown ? breakdown.totalPrice : null;
  }

  /**
   * 契約の料金内訳を計算
   */
  async calculatePriceBreakdown(
    subscriptionId: number
  ): Promise<PriceBreakdown | null> {
    // 契約情報を取得
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
        subscriptionOptions: {
          include: {
            option: true,
          },
        },
      },
    });

    if (!subscription) {
      return null;
    }

    // 基本料金とストレージ料金を計算
    const basePrice = subscription.plan.basePrice;
    const storagePrice =
      subscription.plan.pricePerGb * subscription.storageSize;

    // オプション料金を計算
    const options: OptionBreakdown[] = (
      subscription.subscriptionOptions || []
    ).map((so) => ({
      optionId: so.option.id,
      optionName: so.option.name,
      quantity: so.quantity,
      unitPrice: so.option.unitPrice,
      totalPrice: so.price,
    }));

    // 総額を計算
    const optionsTotalPrice = options.reduce(
      (sum, opt) => sum + opt.totalPrice,
      0
    );
    const totalPrice = basePrice + storagePrice + optionsTotalPrice;

    return {
      planId: subscription.plan.id,
      planName: subscription.plan.name,
      storageSize: subscription.storageSize,
      basePrice,
      storagePrice,
      options,
      totalPrice,
    };
  }
}
