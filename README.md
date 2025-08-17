# Go Version Trace

Go言語のバージョン毎の標準ライブラリ変更点をReact Flowで視覚化するWebアプリケーション

## 概要

Go Version Traceは、Go言語の各メジャーバージョン（1.21〜1.25）における標準ライブラリの変更点を収集・解析し、インタラクティブな遷移図として視覚化するWebアプリケーションです。

## 🚀 新機能（React Flow版）

- **インタラクティブな遷移図**: React Flowを使用した美しい可視化
- **フロントエンド・バックエンド分離**: ReactとGoの完全分離
- **リアルタイムフィルタリング**: パッケージと変更種別でのフィルタ
- **ズーム・パン・ミニマップ**: 直感的なナビゲーション
- **レスポンシブデザイン**: モバイル対応

## 技術スタック

- **フロントエンド**: React 19 + TypeScript + React Flow + Vite
- **バックエンド**: Go 1.23+
- **データベース**: SQLite
- **可視化**: React Flow
- **スクレイピング**: goquery

## インストール

### 前提条件

- Go 1.23以上
- Node.js 18以上
- SQLite

### セットアップ

```bash
# リポジトリクローン
git clone <repository-url>
cd go-ver-trace

# バックエンド依存関係
go mod tidy

# フロントエンド依存関係
cd frontend
npm install
cd ..
```

## 使用方法

### 1. データ取得

```bash
# Goサーバービルド
go build -o bin/go-ver-trace ./cmd/server

# リリース情報を取得
./bin/go-ver-trace -data-only
```

### 2. サーバー起動

**バックエンドAPI（ターミナル1）:**
```bash
./bin/go-ver-trace -port 8080
```

**フロントエンド開発サーバー（ターミナル2）:**
```bash
cd frontend
npm run dev
```

### 3. アクセス

- **フロントエンド**: http://localhost:3000
- **API**: http://localhost:8080/api/

## 📊 可視化機能

### React Flow遷移図

- **ノード**: 各パッケージのバージョン別変更
- **エッジ**: バージョン間の進化を線で表現
- **色分け**: 
  - 🟢 緑: Added（新機能）
  - 🟡 黄: Modified（変更）
  - 🔴 赤: Deprecated（非推奨）
  - ⚪ 灰: Removed（削除）

### インタラクティブ機能

- **ズーム・パン**: マウスホイール、ドラッグ
- **フィルタリング**: 変更種別・パッケージ名
- **ミニマップ**: 全体ナビゲーション
- **検索**: パッケージ名での絞り込み

## API エンドポイント

### GET /api/health
```json
{
  "status": "ok",
  "message": "API サーバーは正常に動作しています",
  "release_count": 5,
  "package_count": 78,
  "timestamp": "2025-08-17T00:52:15Z"
}
```

### GET /api/visualization
可視化用データを取得
```json
{
  "releases": [...],
  "packages": [...],
  "package_evolution": {
    "net/http": [
      {
        "version": "1.21",
        "release_date": "2023-08-08T00:00:00Z",
        "change_type": "Added", 
        "description": "ResponseController.EnableFullDuplex..."
      }
    ]
  }
}
```

### その他のAPI
- `GET /api/releases` - 全リリース一覧
- `GET /api/packages` - 全パッケージ一覧
- `GET /api/package/{name}` - 特定パッケージの変更履歴
- `POST /api/refresh` - データ再取得

## プロジェクト構造

```
go-ver-trace/
├── cmd/server/              # メインアプリケーション
├── internal/
│   ├── analyzer/            # データ解析
│   ├── database/            # SQLite操作
│   ├── scraper/             # Webスクレイピング
│   └── server/              # API サーバー
├── frontend/                # React フロントエンド
│   ├── src/
│   │   ├── components/      # Reactコンポーネント
│   │   ├── hooks/           # カスタムHooks
│   │   ├── types/           # TypeScript型定義
│   │   └── utils/           # ユーティリティ
│   ├── dist/                # ビルド成果物
│   └── package.json
├── data.db                  # SQLiteデータベース
└── README.md
```

## 開発

### コマンド

```bash
# バックエンド
go build -o bin/go-ver-trace ./cmd/server
go run ./cmd/server -help

# フロントエンド
cd frontend
npm run dev      # 開発サーバー
npm run build    # プロダクションビルド
npm run preview  # ビルド版プレビュー
```

### データベーススキーマ

```sql
-- リリース情報
CREATE TABLE releases (
    id INTEGER PRIMARY KEY,
    version TEXT UNIQUE NOT NULL,
    release_date DATETIME NOT NULL,
    url TEXT NOT NULL
);

-- パッケージ変更
CREATE TABLE package_changes (
    id INTEGER PRIMARY KEY,
    release_id INTEGER NOT NULL,
    package TEXT NOT NULL,
    change_type TEXT NOT NULL,
    description TEXT,
    FOREIGN KEY (release_id) REFERENCES releases(id)
);
```

## データ統計（現在）

- **追跡バージョン**: Go 1.21, 1.23, 1.24, 1.25
- **パッケージ数**: 78パッケージ
- **総変更数**: 278件
- **変更種別**:
  - Added: 158件
  - Modified: 110件
  - Deprecated: 6件
  - Removed: 4件

## トラブルシューティング

### よくある問題

1. **API接続エラー**
   ```bash
   # Goサーバーが起動しているか確認
   curl http://localhost:8080/api/health
   ```

2. **CORS エラー**
   - サーバーは自動的にCORS対応済み
   - `Access-Control-Allow-Origin: *` を設定

3. **データが表示されない**
   ```bash
   # データを再取得
   ./bin/go-ver-trace -data-only
   ```

### パフォーマンス最適化

- 大量ノード表示時はフィルタリング推奨
- ブラウザのハードウェアアクセラレーション有効化
- React Flow のメモ化機能活用

## ライセンス

MIT License

## 貢献

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

**Note**: 現在のデータは実際のGo公式ドキュメントから取得されています。新しいGoバージョンがリリースされた際は、データ再取得を実行してください。