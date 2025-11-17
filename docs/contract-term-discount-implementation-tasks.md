# 契約期間割引機能 実装タスク

## 概要

契約期間に応じた割引機能を実装します。年契約の場合、年額料金（月額 ×12）から 1 ヶ月分の料金を割引します。

## 前提条件

- 月契約: 月額払い、割引なし
- 年契約: 年額払い（月額 ×12 - 1 ヶ月分）

## 実装タスク（TDD 方式）

### Phase 1: データモデルの拡張

#### Task 1.1: Prisma スキーマの更新

- [ ] `Subscription`モデルに`contractTerm`フィールドを追加
  - 型: `String`
  - 値: `'monthly'` または `'yearly'`
  - デフォルト: `'monthly'`
- [ ] マイグレーションファイルを生成
- [ ] マイグレーションを実行

**影響範囲:**

- `prisma/schema.prisma`
- `prisma/migrations/`

---

### Phase 2: 計算ロジックの実装（TDD）

#### Task 2.1: 計算サービスのテスト作成

- [ ] `tests/unit/calculationService.test.ts`に年契約のテストケースを追加
  - 年契約の基本料金計算（月額 ×12 - 1 ヶ月分）
  - 年契約のストレージ料金計算（月額 ×12 - 1 ヶ月分）
  - 年契約のオプション料金計算（月額 ×12 - 1 ヶ月分）
  - 年契約の合計料金計算
  - 月契約の既存テストが影響を受けないことを確認

**テストケース例:**

```typescript
describe("年契約の料金計算", () => {
  test("基本料金: 月額×12 - 1ヶ月分", () => {
    // basePrice = 1000の場合
    // 年額 = 1000 × 12 - 1000 = 11000
  });

  test("ストレージ料金: (月額×12 - 1ヶ月分)", () => {
    // pricePerGb = 100, storageSize = 50の場合
    // 月額 = 100 × 50 = 5000
    // 年額 = 5000 × 12 - 5000 = 55000
  });

  test("オプション料金: (月額×12 - 1ヶ月分)", () => {
    // FIXED: unitPrice = 500
    // 年額 = 500 × 12 - 500 = 5500
  });
});
```

#### Task 2.2: 計算サービスの実装

- [ ] `src/services/calculationService.ts`を修正
  - `calculateSubscriptionPrice`関数に`contractTerm`パラメータを追加
  - 年契約の場合の計算ロジックを実装
    - 基本料金: `basePrice × 12 - basePrice`
    - ストレージ料金: `(pricePerGb × storageSize) × 12 - (pricePerGb × storageSize)`
    - オプション料金: 各オプションに対して同様の計算
  - 月契約の既存ロジックを維持

**実装ポイント:**

```typescript
// 割引係数の計算
const termMultiplier = contractTerm === "yearly" ? 11 : 1; // 12ヶ月 - 1ヶ月割引 = 11

// 基本料金
const baseAmount = plan.basePrice * termMultiplier;

// ストレージ料金
const storageAmount = plan.pricePerGb * storageSize * termMultiplier;
```

---

### Phase 3: API エンドポイントの更新（TDD）

#### Task 3.1: 計算エンドポイントのテスト更新

- [ ] `tests/e2e/api.test.ts`に年契約のテストケースを追加
  - `/api/v1/calculate`エンドポイントに`contractTerm=yearly`パラメータを含むリクエスト
  - レスポンスの料金が正しく計算されていることを確認
  - `contractTerm`パラメータが省略された場合、月契約として扱われることを確認
  - 不正な`contractTerm`値の場合のバリデーションエラー

#### Task 3.2: 計算エンドポイントの実装

- [ ] `src/routes/calculate.ts`を修正
  - クエリパラメータに`contractTerm`を追加（オプショナル、デフォルト: 'monthly'）
  - バリデーションロジックを追加（'monthly' または 'yearly' のみ許可）
  - `calculationService.calculateSubscriptionPrice`の呼び出しに`contractTerm`を渡す

#### Task 3.3: サブスクリプション作成エンドポイントのテスト更新

- [ ] `tests/e2e/api.test.ts`にサブスクリプション作成のテストケースを追加
  - `/api/v1/subscriptions`エンドポイントのリクエストボディに`contractTerm`を含む
  - 年契約のサブスクリプションが正しく作成されることを確認
  - 作成されたサブスクリプションの料金が正しいことを確認

#### Task 3.4: サブスクリプション作成エンドポイントの実装

- [ ] `src/routes/subscriptions.ts`を修正
  - リクエストボディに`contractTerm`フィールドを追加（オプショナル、デフォルト: 'monthly'）
  - バリデーションを追加
  - サブスクリプション作成時に`contractTerm`を保存

---

### Phase 4: サービス層の更新（TDD）

#### Task 4.1: サブスクリプションサービスのテスト更新

- [ ] `tests/unit/subscriptionService.test.ts`を更新
  - `createSubscription`関数に`contractTerm`パラメータを含むテストケースを追加
  - 年契約のサブスクリプションが正しく作成されることを確認
  - 料金計算が正しく実行されることを確認

#### Task 4.2: サブスクリプションサービスの実装

- [ ] `src/services/subscriptionService.ts`を修正
  - `createSubscription`関数のパラメータに`contractTerm`を追加
  - Prisma でのサブスクリプション作成時に`contractTerm`を含める
  - `calculationService`の呼び出しに`contractTerm`を渡す

---

### Phase 5: 型定義とバリデーション

#### Task 5.1: 型定義の追加

- [ ] 必要に応じて型定義ファイルを作成または更新
  - `ContractTerm`型を定義（'monthly' | 'yearly'）
  - サブスクリプション関連の型に`contractTerm`を追加

#### Task 5.2: バリデーションミドルウェアの更新

- [ ] `src/middleware/validation.ts`を確認・更新
  - `contractTerm`のバリデーションロジックを追加（必要に応じて）

---

### Phase 6: API ドキュメントの更新

#### Task 6.1: OpenAPI 仕様の更新

- [ ] `docs/api-spec.yaml`を更新
  - `/api/v1/calculate`エンドポイントに`contractTerm`パラメータを追加
  - `/api/v1/subscriptions`エンドポイントのスキーマに`contractTerm`フィールドを追加
  - スキーマ定義に`ContractTerm` enum を追加
  - レスポンス例を更新

---

### Phase 7: データベースシードの更新

#### Task 7.1: シードデータの更新

- [ ] `prisma/seed.ts`を更新
  - 既存のサブスクリプションデータに`contractTerm`を追加
  - 月契約と年契約の両方のサンプルデータを作成

---

### Phase 8: 統合テストと動作確認

#### Task 8.1: 統合テスト

- [ ] すべてのユニットテストが通過することを確認
- [ ] すべての E2E テストが通過することを確認
- [ ] 既存機能への影響がないことを確認

#### Task 8.2: 手動テスト

- [ ] `npm run dev`でサーバーを起動
- [ ] `docs/api-test.http`に年契約のテストケースを追加
- [ ] 以下のシナリオを手動でテスト:
  - 月契約の料金計算
  - 年契約の料金計算
  - 年契約のサブスクリプション作成
  - オプション付き年契約の料金計算

---

## 実装順序

1. **Task 1.1** → データベーススキーマの変更
2. **Task 2.1** → 計算ロジックのテスト作成（TDD: Red）
3. **Task 2.2** → 計算ロジックの実装（TDD: Green & Refactor）
4. **Task 3.1** → API エンドポイントのテスト作成（TDD: Red）
5. **Task 3.2, 3.3, 3.4** → API エンドポイントの実装（TDD: Green & Refactor）
6. **Task 4.1** → サービス層のテスト作成（TDD: Red）
7. **Task 4.2** → サービス層の実装（TDD: Green & Refactor）
8. **Task 5.1, 5.2** → 型定義とバリデーション
9. **Task 6.1** → API ドキュメント更新
10. **Task 7.1** → シードデータ更新
11. **Task 8.1, 8.2** → 統合テストと動作確認

## 注意事項

- 各 Phase は前の Phase が完了してから開始する
- TDD のサイクル（Red → Green → Refactor）を守る
- 既存のテストが壊れていないことを各ステップで確認
- マイグレーションは慎重に実行し、必要に応じてロールバックできるようにする
