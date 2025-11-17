import type { Option, SubscriptionOption } from "@prisma/client";
import prisma from "../lib/prisma";

export interface AddOptionData {
  subscriptionId: number;
  optionId: number;
  quantity: number;
}

export interface SubscriptionOptionWithDetails extends SubscriptionOption {
  option: Option;
}

export class SubscriptionOptionService {
  /**
   * サブスクリプションにオプションを追加
   */
  async addOptionToSubscription(data: AddOptionData): Promise<SubscriptionOption> {
    // オプションを取得して料金を計算
    const option = await prisma.option.findUnique({
      where: { id: data.optionId },
    });

    if (!option) {
      throw new Error("Option not found");
    }

    // 料金計算
    const price = await this.calculateOptionPrice(data.optionId, data.quantity);

    // サブスクリプションオプションを作成
    return await prisma.subscriptionOption.create({
      data: {
        subscriptionId: data.subscriptionId,
        optionId: data.optionId,
        quantity: data.quantity,
        price,
      },
    });
  }

  /**
   * オプションの数量を更新
   */
  async updateOptionQuantity(id: number, quantity: number): Promise<SubscriptionOption> {
    // 既存のサブスクリプションオプションを取得
    const existingOption = await prisma.subscriptionOption.findUnique({
      where: { id },
      include: {
        option: true,
      },
    });

    if (!existingOption) {
      throw new Error("Subscription option not found");
    }

    // 新しい料金を計算（既に取得したオプション情報を使用）
    const option = existingOption.option;
    let price: number;

    switch (option.priceType) {
      case "FIXED":
        price = option.unitPrice;
        break;
      case "PER_USER":
      case "PER_GB":
        price = option.unitPrice * quantity;
        break;
      default:
        throw new Error(`Unknown price type: ${option.priceType}`);
    }

    // 更新
    return await prisma.subscriptionOption.update({
      where: { id },
      data: {
        quantity,
        price,
      },
    });
  }

  /**
   * サブスクリプションからオプションを削除
   */
  async removeOptionFromSubscription(id: number): Promise<void> {
    await prisma.subscriptionOption.delete({
      where: { id },
    });
  }

  /**
   * サブスクリプションに紐づくオプション一覧を取得
   */
  async getSubscriptionOptions(subscriptionId: number): Promise<SubscriptionOptionWithDetails[]> {
    return await prisma.subscriptionOption.findMany({
      where: { subscriptionId },
      include: {
        option: true,
      },
    });
  }

  /**
   * オプション料金を計算
   * - FIXED: 固定料金（数量に関わらず一定）
   * - PER_USER: 単価 × ユーザー数
   * - PER_GB: 単価 × GB数
   */
  async calculateOptionPrice(optionId: number, quantity: number): Promise<number> {
    const option = await prisma.option.findUnique({
      where: { id: optionId },
    });

    if (!option) {
      throw new Error("Option not found");
    }

    // 料金タイプに応じて計算
    switch (option.priceType) {
      case "FIXED":
        // 固定料金: 数量に関わらず単価そのまま
        return option.unitPrice;
      case "PER_USER":
      case "PER_GB":
        // 従量課金: 単価 × 数量
        return option.unitPrice * quantity;
      default:
        throw new Error(`Unknown price type: ${option.priceType}`);
    }
  }
}
