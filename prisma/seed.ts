import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // プランデータを作成
  const plans = await Promise.all([
    prisma.plan.create({
      data: {
        name: "個人",
        basePrice: 500.0,
        pricePerGb: 50.0,
        description: "個人ユーザー向けの基本プラン",
      },
    }),
    prisma.plan.create({
      data: {
        name: "ビジネス",
        basePrice: 1500.0,
        pricePerGb: 30.0,
        description: "小規模チーム向けプラン",
      },
    }),
    prisma.plan.create({
      data: {
        name: "エンタープライズ",
        basePrice: 5000.0,
        pricePerGb: 20.0,
        description: "大規模組織向けプラン",
      },
    }),
  ]);

  console.log(`✅ Created ${plans.length} plans`);

  // オプションデータを作成
  const options = await Promise.all([
    prisma.option.create({
      data: {
        name: "PC同期クライアント",
        description: "PCとのファイル自動同期",
        priceType: "PER_USER",
        unitPrice: 100.0,
      },
    }),
    prisma.option.create({
      data: {
        name: "セキュリティ",
        description: "SSO・証跡保護",
        priceType: "FIXED",
        unitPrice: 5000.0,
      },
    }),
    prisma.option.create({
      data: {
        name: "バックアップ",
        description: "30日間のファイル履歴保存",
        priceType: "PER_GB",
        unitPrice: 10.0,
      },
    }),
  ]);

  console.log(`✅ Created ${options.length} options`);

  // サンプルユーザーを作成または取得（開発・テスト用）
  const sampleUser = await prisma.user.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      name: "John Doe",
      email: "john@example.com",
      phone: "03-1234-5678",
      company: "Example Corp",
    },
  });

  console.log(`✅ Created sample user: ${sampleUser.name}`);

  // サンプルプラン申し込みを作成
  const sampleSubscription = await prisma.subscription.create({
    data: {
      userId: sampleUser.id,
      planId: plans[1].id, // ビジネスプラン
      storageSize: 100,
      status: "pending",
    },
  });

  console.log(
    `✅ Created sample subscription with ID: ${sampleSubscription.id}`
  );

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
