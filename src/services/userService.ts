import type { User } from "@prisma/client";
import prisma from "../lib/prisma";

export interface CreateUserData {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
}

export class UserService {
  /**
   * ユーザーを作成
   */
  async createUser(data: CreateUserData): Promise<User> {
    return await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        company: data.company ?? null,
      },
    });
  }

  /**
   * IDでユーザーを取得
   */
  async getUserById(id: number): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * メールアドレスでユーザーを取得
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * ユーザーが存在するかチェック
   */
  async userExists(id: number): Promise<boolean> {
    const user = await this.getUserById(id);
    return user !== null;
  }

  /**
   * メールアドレスが既に使用されているかチェック
   */
  async isEmailUsed(email: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    return user !== null;
  }

  /**
   * すべてのユーザーを取得（デバッグ用）
   */
  async getAllUsers(): Promise<User[]> {
    return await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}
