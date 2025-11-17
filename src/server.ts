import dotenv from "dotenv";
import app from "./app";

// 環境変数の読み込み
dotenv.config();

const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || "v1";

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 Stash API server is running on port ${PORT}`);
  console.log(`📚 API Endpoint: http://localhost:${PORT}/api/${API_VERSION}`);
});
