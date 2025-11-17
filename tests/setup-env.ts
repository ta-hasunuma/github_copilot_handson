import { config } from "dotenv";
import { resolve } from "path";

// テスト用の環境変数を読み込む
config({ path: resolve(__dirname, "../.env.test") });
