# Stash API

AIエージェント研修用のサンプルプロジェクト。  
クラウドストレージサービス「Stash」の申し込みAPIをTypeScriptで実装。

## 起動方法

Node.js v24 で動作します（それ以外のバージョンでも問題なく動作するかもしれません）

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動（DB初期化も自動実行）
npm run dev
```

サーバーが起動したら → http://localhost:3000/api/v1

## 開発コマンド

```bash
npm run dev         # 開発サーバー起動（DB初期化込み）
npm test            # テスト実行
npm run check       # コード品質チェック
npm run db:studio   # DB確認用GUI起動
```

**Happy Coding with AI Agents! 🤖✨**
