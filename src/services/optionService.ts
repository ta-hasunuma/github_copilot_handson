import type { Option } from "@prisma/client";
import prisma from "../lib/prisma";

export class OptionService {
  /**
   * すべてのオプションを取得
   */
  async getAllOptions(): Promise<Option[]> {
    return await prisma.option.findMany({
      orderBy: {
        id: "asc",
      },
    });
  }

  /**
   * IDでオプションを取得
   */
  async getOptionById(id: number): Promise<Option | null> {
    return await prisma.option.findUnique({
      where: { id },
    });
  }

  /**
   * 名前でオプションを取得
   */
  async getOptionByName(name: string): Promise<Option | null> {
    return await prisma.option.findUnique({
      where: { name },
    });
  }

  /**
   * オプションが存在するかチェック
   */
  async optionExists(id: number): Promise<boolean> {
    const option = await this.getOptionById(id);
    return option !== null;
  }
}
