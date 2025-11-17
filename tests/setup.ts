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

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "options" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "priceType" TEXT NOT NULL,
      "unit_price" REAL NOT NULL,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "options_name_key" ON "options"("name")
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "subscription_options" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "subscription_id" INTEGER NOT NULL,
      "option_id" INTEGER NOT NULL,
      "quantity" INTEGER NOT NULL DEFAULT 1,
      "price" REAL NOT NULL,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "subscription_options_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "subscription_options_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "options" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "subscription_options_subscription_id_option_id_key" ON "subscription_options"("subscription_id", "option_id")
  `);
});

beforeEach(async () => {
  // 各テスト前にデータベースをクリーンアップ
  await prisma.subscriptionOption.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.option.deleteMany();

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

  // テスト用オプションデータを作成
  await prisma.option.createMany({
    data: [
      {
        name: "PC同期クライアント",
        description: "PCとのファイル自動同期",
        priceType: "PER_USER",
        unitPrice: 100.0,
      },
      {
        name: "セキュリティ",
        description: "SSO・証跡保護",
        priceType: "FIXED",
        unitPrice: 5000.0,
      },
      {
        name: "バックアップ",
        description: "30日間のファイル履歴保存",
        priceType: "PER_GB",
        unitPrice: 10.0,
      },
    ],
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
