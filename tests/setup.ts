import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./test.db",
    },
  },
});

beforeAll(async () => {
  // テスト用データベースのマイグレーション
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON");

  // テーブルを作成
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "company" TEXT,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email")
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "plans" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "base_price" REAL NOT NULL,
      "price_per_gb" REAL NOT NULL,
      "description" TEXT,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "subscriptions" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "user_id" INTEGER NOT NULL,
      "plan_id" INTEGER NOT NULL,
      "storage_size" INTEGER NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
});

beforeEach(async () => {
  // 各テスト前にデータベースをクリーンアップ
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.plan.deleteMany();

  // テスト用プランデータを作成
  await prisma.plan.createMany({
    data: [
      {
        name: "個人",
        basePrice: 500.0,
        pricePerGb: 50.0,
        description: "個人ユーザー向けの基本プラン",
      },
      {
        name: "ビジネス",
        basePrice: 1500.0,
        pricePerGb: 30.0,
        description: "小規模チーム向けプラン",
      },
      {
        name: "エンタープライズ",
        basePrice: 5000.0,
        pricePerGb: 20.0,
        description: "大規模組織向けプラン",
      },
    ],
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
