import type { Plan, Subscription, User } from "@prisma/client";
import prisma from "../lib/prisma";

export interface CreateSubscriptionData {
  userId: number;
  planId: number;
  storageSize: number;
}

export interface SubscriptionWithDetails extends Subscription {
  user: User;
  plan: Plan;
}

export class SubscriptionService {
  /**
   * プラン申し込みを作成
   */
  async createSubscription(data: CreateSubscriptionData): Promise<Subscription> {
    return await prisma.subscription.create({
      data: {
        userId: data.userId,
        planId: data.planId,
        storageSize: data.storageSize,
        status: "pending",
      },
    });
  }

  /**
   * IDでプラン申し込みを取得（詳細情報付き）
   */
  async getSubscriptionById(id: number): Promise<SubscriptionWithDetails | null> {
    return await prisma.subscription.findUnique({
      where: { id },
      include: {
        user: true,
        plan: true,
      },
    });
  }

  /**
   * プラン申し込みが存在するかチェック
   */
  async subscriptionExists(id: number): Promise<boolean> {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
    });
    return subscription !== null;
  }

  /**
   * ユーザーのプラン申し込み履歴を取得
   */
  async getSubscriptionsByUserId(userId: number): Promise<SubscriptionWithDetails[]> {
    return await prisma.subscription.findMany({
      where: { userId },
      include: {
        user: true,
        plan: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * すべてのプラン申し込みを取得（管理用）
   */
  async getAllSubscriptions(): Promise<SubscriptionWithDetails[]> {
    return await prisma.subscription.findMany({
      include: {
        user: true,
        plan: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}
