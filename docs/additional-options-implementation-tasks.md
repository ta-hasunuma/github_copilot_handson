# 追加オプション機能実装タスク

## 概要

ストレージサービスに以下の 3 つの追加オプション機能を実装する。

| オプション          | 月額料金         | 内容                                                    |
| ------------------- | ---------------- | ------------------------------------------------------- |
| PC 同期クライアント | ¥100/ユーザー/月 | PC とのファイル自動同期・機能を使用するユーザー数で課金 |
| セキュリティ        | ¥5000/月         | SSO・証跡保護                                           |
| バックアップ        | ¥10/GB/月        | 30 日間のファイル履歴保存                               |

## 実装方針

- TDD（テスト駆動開発）アプローチを採用
- 各タスクは「テスト作成 → 実装 → リファクタリング」のサイクルで進める
- 既存のコード構造とパターンに従う

---

## タスク一覧

### Phase 1: データモデルの設計と実装

#### Task 1-1: オプション機能のデータモデル設計

**目的**: 追加オプションを管理するためのデータモデルを設計する

**成果物**:

- Prisma Schema ファイルの更新
  - `Option` モデル（オプションマスタ）
  - `SubscriptionOption` モデル（契約とオプションの中間テーブル）

**Prisma Schema 設計**:

```prisma
model Option {
  id                  Int                  @id @default(autoincrement())
  name                String               @unique
  description         String?
  priceType           String               // 'FIXED', 'PER_USER', 'PER_GB'
  unitPrice           Float                @map("unit_price")
  createdAt           DateTime             @default(now()) @map("created_at")
  subscriptionOptions SubscriptionOption[]

  @@map("options")
}

model SubscriptionOption {
  id             Int          @id @default(autoincrement())
  subscriptionId Int          @map("subscription_id")
  optionId       Int          @map("option_id")
  quantity       Int          @default(1) // ユーザー数またはGB数
  price          Float        // 計算された料金
  createdAt      DateTime     @default(now()) @map("created_at")
  updatedAt      DateTime     @updatedAt @map("updated_at")

  subscription Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  option       Option       @relation(fields: [optionId], references: [id], onDelete: Cascade)

  @@unique([subscriptionId, optionId])
  @@map("subscription_options")
}
```

**更新対象**:

- Subscription モデルにリレーション追加

**実施内容**:

1. `prisma/schema.prisma`にモデル追加
2. マイグレーションファイル作成: `npx prisma migrate dev --name add_options`
3. Prisma Client の再生成確認

**完了条件**:

- [ ] Prisma Schema が正しく定義されている
- [ ] マイグレーションが正常に実行できる
- [ ] 型定義が正しく生成される

---

#### Task 1-2: オプションマスタのシードデータ作成

**目的**: 初期オプションデータを登録する

**成果物**:

- `prisma/seed.ts`の更新

**実施内容**:

1. PC 同期クライアント: `priceType: 'PER_USER'`, `unitPrice: 100`
2. セキュリティ: `priceType: 'FIXED'`, `unitPrice: 5000`
3. バックアップ: `priceType: 'PER_GB'`, `unitPrice: 10`

**完了条件**:

- [ ] `npx prisma db seed`でオプションデータが登録される
- [ ] データベースに 3 つのオプションが存在する

---

### Phase 2: オプション管理サービスの実装

#### Task 2-1: OptionService のテスト作成

**目的**: オプション管理機能のユニットテストを先に作成する（TDD）

**成果物**:

- `tests/unit/optionService.test.ts`

**テストケース**:

- `getAllOptions()`: 全オプション取得
- `getOptionById(id)`: ID 指定でオプション取得
- `getOptionByName(name)`: 名前指定でオプション取得
- `optionExists(id)`: オプション存在確認
- エラーハンドリング（存在しない ID など）

**完了条件**:

- [ ] テストファイルが作成されている
- [ ] 全テストが失敗する（実装前のため）

---

#### Task 2-2: OptionService の実装

**目的**: オプション管理の基本機能を実装する

**成果物**:

- `src/services/optionService.ts`

**実装内容**:

```typescript
export class OptionService {
  async getAllOptions(): Promise<Option[]>;
  async getOptionById(id: number): Promise<Option | null>;
  async getOptionByName(name: string): Promise<Option | null>;
  async optionExists(id: number): Promise<boolean>;
}
```

**完了条件**:

- [ ] 全ユニットテストがパスする
- [ ] 既存のサービスクラスと同じパターンで実装されている

---

#### Task 2-3: SubscriptionOptionService のテスト作成

**目的**: 契約オプション管理機能のユニットテストを作成する

**成果物**:

- `tests/unit/subscriptionOptionService.test.ts`

**テストケース**:

- `addOptionToSubscription()`: オプション追加
- `updateOptionQuantity()`: 数量更新（ユーザー数や GB 数）
- `removeOptionFromSubscription()`: オプション削除
- `getSubscriptionOptions()`: 契約に紐づくオプション一覧取得
- `calculateOptionPrice()`: オプション料金計算
  - FIXED: 固定料金
  - PER_USER: 単価 × ユーザー数
  - PER_GB: 単価 × GB 数
- エッジケース（重複追加、存在しないオプションなど）

**完了条件**:

- [ ] テストファイルが作成されている
- [ ] 全テストが失敗する（実装前のため）

---

#### Task 2-4: SubscriptionOptionService の実装

**目的**: 契約オプション管理機能を実装する

**成果物**:

- `src/services/subscriptionOptionService.ts`

**実装内容**:

```typescript
export interface AddOptionData {
  subscriptionId: number;
  optionId: number;
  quantity: number;
}

export interface SubscriptionOptionWithDetails extends SubscriptionOption {
  option: Option;
}

export class SubscriptionOptionService {
  async addOptionToSubscription(
    data: AddOptionData
  ): Promise<SubscriptionOption>;
  async updateOptionQuantity(
    id: number,
    quantity: number
  ): Promise<SubscriptionOption>;
  async removeOptionFromSubscription(id: number): Promise<void>;
  async getSubscriptionOptions(
    subscriptionId: number
  ): Promise<SubscriptionOptionWithDetails[]>;
  async calculateOptionPrice(
    optionId: number,
    quantity: number
  ): Promise<number>;
}
```

**完了条件**:

- [ ] 全ユニットテストがパスする
- [ ] 料金計算ロジックが正しく動作する
- [ ] トランザクション処理が適切に実装されている

---

### Phase 3: 料金計算サービスの拡張

#### Task 3-1: CalculationService のテスト拡張

**目的**: オプション込みの料金計算テストを追加する

**成果物**:

- `tests/unit/calculationService.test.ts`の更新

**追加テストケース**:

- `calculateTotalPrice()`: 基本料金 + ストレージ + オプション の合計
  - オプションなしの場合
  - PC 同期クライアント追加（5 ユーザー）
  - セキュリティオプション追加
  - バックアップオプション追加（50GB）
  - 複数オプション組み合わせ
- `calculatePriceBreakdown()`: 内訳詳細を返す

**完了条件**:

- [ ] 新しいテストケースが追加されている
- [ ] テストが失敗する（実装前のため）

---

#### Task 3-2: CalculationService の拡張実装

**目的**: オプション料金を含めた総額計算機能を実装する

**成果物**:

- `src/services/calculationService.ts`の更新

**実装内容**:

```typescript
export interface PriceBreakdown {
  planId: number;
  planName: string;
  storageSize: number;
  basePrice: number; // 基本料金
  storagePrice: number; // ストレージ料金
  options: OptionBreakdown[]; // オプション内訳
  totalPrice: number; // 合計
}

export interface OptionBreakdown {
  optionId: number;
  optionName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export class CalculationService {
  // 既存メソッド
  async calculatePrice(
    planId: number,
    storageSize: number
  ): Promise<CalculationResult | null>;

  // 新規メソッド
  async calculateTotalPrice(subscriptionId: number): Promise<number>;
  async calculatePriceBreakdown(
    subscriptionId: number
  ): Promise<PriceBreakdown | null>;
}
```

**完了条件**:

- [ ] 全ユニットテストがパスする
- [ ] 既存の`calculatePrice`メソッドに影響がない
- [ ] オプション料金が正しく計算される

---

### Phase 4: API エンドポイントの実装

#### Task 4-1: オプション一覧取得 API のテスト作成

**目的**: オプション取得エンドポイントの E2E テストを作成する

**成果物**:

- `tests/e2e/api.test.ts`の更新

**テストケース**:

- `GET /api/v1/options`: 全オプション取得
  - 成功: 200 OK
  - オプション一覧が返却される

**完了条件**:

- [ ] E2E テストが追加されている
- [ ] テストが失敗する（実装前のため）

---

#### Task 4-2: オプション一覧取得 API の実装

**目的**: オプション一覧取得エンドポイントを実装する

**成果物**:

- `src/routes/options.ts`

**実装内容**:

```typescript
GET /api/v1/options
Response: {
  success: true,
  data: [
    {
      id: 1,
      name: "PC同期クライアント",
      description: "PCとのファイル自動同期",
      priceType: "PER_USER",
      unitPrice: 100
    },
    ...
  ]
}
```

**完了条件**:

- [ ] E2E テストがパスする
- [ ] `app.ts`にルートが登録されている

---

#### Task 4-3: 契約オプション管理 API のテスト作成

**目的**: 契約へのオプション追加/削除の E2E テストを作成する

**成果物**:

- `tests/e2e/api.test.ts`の更新

**テストケース**:

- `POST /api/v1/subscriptions/:id/options`: オプション追加
  - 成功: 201 Created
  - バリデーションエラー: 400 Bad Request
  - 存在しない契約: 404 Not Found
- `GET /api/v1/subscriptions/:id/options`: オプション一覧取得
- `PUT /api/v1/subscriptions/:id/options/:optionId`: 数量更新
- `DELETE /api/v1/subscriptions/:id/options/:optionId`: オプション削除

**完了条件**:

- [ ] E2E テストが追加されている
- [ ] テストが失敗する（実装前のため）

---

#### Task 4-4: 契約オプション管理 API の実装

**目的**: 契約へのオプション追加/削除機能を実装する

**成果物**:

- `src/routes/subscriptionOptions.ts`

**実装内容**:

```typescript
POST /api/v1/subscriptions/:id/options
Body: {
  optionId: number,
  quantity: number
}

GET /api/v1/subscriptions/:id/options
Response: {
  success: true,
  data: [...]
}

PUT /api/v1/subscriptions/:id/options/:optionId
Body: {
  quantity: number
}

DELETE /api/v1/subscriptions/:id/options/:optionId
```

**バリデーション**:

- optionId: 正の整数、存在するオプション
- quantity: 正の整数
  - PER_USER: 1-1000
  - PER_GB: 1-10000
  - FIXED: 常に 1

**完了条件**:

- [ ] 全 E2E テストがパスする
- [ ] バリデーションが適切に実装されている
- [ ] エラーハンドリングが実装されている

---

#### Task 4-5: 料金計算 API の拡張テスト作成

**目的**: オプション込み料金計算の E2E テストを作成する

**成果物**:

- `tests/e2e/api.test.ts`の更新

**テストケース**:

- `GET /api/v1/calculate/subscription/:id`: 契約の総額計算
  - 成功: 200 OK
  - 内訳詳細が含まれる
  - 存在しない契約: 404 Not Found

**完了条件**:

- [ ] E2E テストが追加されている
- [ ] テストが失敗する（実装前のため）

---

#### Task 4-6: 料金計算 API の拡張実装

**目的**: オプション込みの総額計算エンドポイントを実装する

**成果物**:

- `src/routes/calculate.ts`の更新

**実装内容**:

```typescript
GET /api/v1/calculate/subscription/:id
Response: {
  success: true,
  data: {
    planId: 1,
    planName: "個人",
    storageSize: 50,
    basePrice: 500,
    storagePrice: 2500,
    options: [
      {
        optionId: 1,
        optionName: "PC同期クライアント",
        quantity: 3,
        unitPrice: 100,
        totalPrice: 300
      }
    ],
    totalPrice: 3300
  }
}
```

**完了条件**:

- [ ] E2E テストがパスする
- [ ] 既存の`/api/v1/calculate`エンドポイントに影響がない

---

### Phase 5: ドキュメントとテストの整備

#### Task 5-1: API ドキュメントの更新

**目的**: 新しいエンドポイントを API 仕様書に追加する

**成果物**:

- `docs/api-spec.yaml`の更新

**実施内容**:

1. `/api/v1/options`のスキーマ追加
2. `/api/v1/subscriptions/:id/options`関連のスキーマ追加
3. `/api/v1/calculate/subscription/:id`のスキーマ追加
4. リクエスト/レスポンスの例を記載

**完了条件**:

- [ ] OpenAPI 仕様として正しい
- [ ] 全エンドポイントが文書化されている

---

#### Task 5-2: HTTP テストファイルの更新

**目的**: 手動テスト用の HTTP リクエストを追加する

**成果物**:

- `docs/api-test.http`の更新

**実施内容**:

1. オプション一覧取得のリクエスト
2. オプション追加のリクエスト（各オプションタイプ）
3. オプション更新のリクエスト
4. オプション削除のリクエスト
5. オプション込み料金計算のリクエスト

**完了条件**:

- [ ] 全エンドポイントの実行例が追加されている
- [ ] 実際に実行して動作確認できる

---

#### Task 5-3: 統合テストの実行と確認

**目的**: 全機能が正しく動作することを確認する

**実施内容**:

1. 全ユニットテストの実行: `npm test`
2. E2E テストの実行
3. カバレッジレポートの確認
4. エッジケースの追加テスト

**完了条件**:

- [ ] 全テストがパスする
- [ ] テストカバレッジが 80%以上
- [ ] エラーハンドリングが完全

---

#### Task 5-4: README の更新

**目的**: 追加機能についてドキュメントを更新する

**成果物**:

- `README.md`の更新

**実施内容**:

1. 追加オプション機能の説明追加
2. 新しい API エンドポイントのリスト
3. 料金計算の仕様説明更新

**完了条件**:

- [ ] 機能説明が追加されている
- [ ] API エンドポイント一覧が最新

---

## 実装順序まとめ

```
Phase 1: データ基盤
├─ Task 1-1: Prisma Schema設計・マイグレーション
└─ Task 1-2: シードデータ作成

Phase 2: サービス層（TDD）
├─ Task 2-1: OptionService テスト作成（RED）
├─ Task 2-2: OptionService 実装（GREEN）
├─ Task 2-3: SubscriptionOptionService テスト作成（RED）
└─ Task 2-4: SubscriptionOptionService 実装（GREEN）

Phase 3: 料金計算拡張（TDD）
├─ Task 3-1: CalculationService テスト拡張（RED）
└─ Task 3-2: CalculationService 実装拡張（GREEN）

Phase 4: API層（TDD）
├─ Task 4-1: オプション一覧API テスト作成（RED）
├─ Task 4-2: オプション一覧API 実装（GREEN）
├─ Task 4-3: 契約オプション管理API テスト作成（RED）
├─ Task 4-4: 契約オプション管理API 実装（GREEN）
├─ Task 4-5: 料金計算API拡張 テスト作成（RED）
└─ Task 4-6: 料金計算API拡張 実装（GREEN）

Phase 5: ドキュメント・最終確認
├─ Task 5-1: API仕様書更新
├─ Task 5-2: HTTPテストファイル更新
├─ Task 5-3: 統合テスト実行・確認
└─ Task 5-4: README更新
```

## 注意事項

- 各タスクは順番に実施すること（依存関係あり）
- TDD サイクルを遵守：テスト作成 → 実装 → リファクタリング
- テストが失敗（RED）してから実装を開始すること
- 実装後はテストがパス（GREEN）することを確認すること
- 既存機能に影響を与えないようリグレッションテストを実施すること

## 推定工数

- Phase 1: 2 時間
- Phase 2: 6 時間
- Phase 3: 4 時間
- Phase 4: 8 時間
- Phase 5: 2 時間
- **合計: 約 22 時間**
