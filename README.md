# Go Version Trace

Go 言語のバージョン毎の標準ライブラリ変更点を React Flow で視覚化する Web アプリケーション

## 概要

Go Version Trace は、Go 言語の各バージョン（1.18〜1.25、マイナーバージョン含む26リリース）における標準ライブラリの変更点を収集・解析し、インタラクティブなフロー図として視覚化する Web アプリケーションです。公式の Go リリースノートから自動的にデータを取得し、パッケージの進化を時系列で追跡できます。

## ✨ 主要機能

- **インタラクティブなフロー図**: React Flow を使用した美しい可視化
- **リアルタイムデータ取得**: 公式リリースノートから最新情報を自動取得
- **日本語対応**: 変更内容の日本語要約表示（オプション）
- **高度なフィルタリング**: パッケージ名・変更種別での絞り込み
- **ズーム・パン・ミニマップ**: 直感的なナビゲーション
- **レスポンシブデザイン**: デスクトップ・モバイル対応
- **詳細情報表示**: パッケージクリックで変更詳細を表示

## 技術スタック

- **フロントエンド**: React 19 + TypeScript + React Flow + Vite
- **バックエンド**: Go 1.23.4
- **データベース**: SQLite3
- **可視化**: React Flow v11
- **スクレイピング**: goquery v1.10.3
- **HTTP クライアント**: 標準ライブラリ

## インストール

### 前提条件

- Go 1.23 以上
- Node.js 18 以上
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

**バックエンド API（ターミナル 1）:**

```bash
./bin/go-ver-trace -port 8080
```

**フロントエンド開発サーバー（ターミナル 2）:**

```bash
cd frontend
npm run dev
```

### 3. アクセス

- **フロントエンド**: http://localhost:5173
- **API**: http://localhost:8080/api/

**注意**: デフォルトでは API は 8080 ポート、フロントエンドは 5173 ポートで起動します。ポート競合がある場合は `-port` オプションで変更できます。

## 📊 可視化機能

### React Flow 遷移図

- **ノード**: 各パッケージのバージョン別変更
- **エッジ**: バージョン間の進化を線で表現
- **色分け**:
  - 🟢 緑: Added（新機能）
  - 🟡 黄: Modified（変更）
  - 🔴 赤: Deprecated（非推奨）
  - ⚪ 灰: Removed（削除）

### インタラクティブ機能

- **ズーム・パン**: マウスホイール、ドラッグ操作
- **フィルタリング**: 変更種別・パッケージ名による絞り込み
- **ミニマップ**: 全体ナビゲーション・現在位置表示
- **ノード詳細**: パッケージクリックで変更詳細を表示
- **エッジ表示**: パッケージ間の進化を線で可視化

## API エンドポイント

### GET /api/health

```json
{
  "status": "ok",
  "message": "API サーバーは正常に動作しています",
  "release_count": 26,
  "package_count": 113,
  "total_changes": 3746,
  "timestamp": "2025-08-21T00:00:00Z"
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

### その他の API

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
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    release_id INTEGER NOT NULL,
    package TEXT NOT NULL,
    change_type TEXT NOT NULL,
    description TEXT,
    summary_ja TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_url TEXT,
    FOREIGN KEY (release_id) REFERENCES releases (id) ON DELETE CASCADE
);
```

## データ統計（現在）

- **追跡バージョン**: Go 1.18〜1.25（26リリース、マイナーバージョン含む）
- **総変更数**: 3,746件
- **ユニークパッケージ**: 113パッケージ
- **変更種別**:
  - Modified: 2,369件（63.3%）- 既存機能の改善
  - Added: 1,210件（32.3%）- 新機能・新API
  - Deprecated: 60件（1.6%）- 非推奨化
  - Removed: 48件（1.3%）- 削除された機能
  - Bug Fix: 27件（0.7%）- バグ修正
  - Security Fix: 17件（0.5%）- セキュリティ修正
  - Base: 12件（0.3%）- ベースバージョン
  - その他: 3件（0.1%）

### リリース日程

#### メジャーリリース
- **Go 1.18**: 2022年3月15日
- **Go 1.19**: 2022年8月2日
- **Go 1.20**: 2023年2月1日
- **Go 1.21**: 2023年8月8日
- **Go 1.22**: 2024年2月6日
- **Go 1.23**: 2024年8月13日
- **Go 1.24**: 2025年2月11日
- **Go 1.25**: 2025年8月12日

#### マイナーリリース（Go 1.23.x）
- 1.23.1: 2024年9月5日
- 1.23.2: 2024年10月1日
- 1.23.3: 2024年11月6日
- 1.23.4: 2024年12月3日
- 1.23.5: 2025年1月7日
- 1.23.6: 2025年2月4日
- 1.23.7: 2025年3月4日
- 1.23.8: 2025年4月1日
- 1.23.9: 2025年5月6日
- 1.23.10: 2025年6月3日
- 1.23.11: 2025年7月1日
- 1.23.12: 2025年8月5日

#### マイナーリリース（Go 1.24.x）
- 1.24.1: 2025年3月4日
- 1.24.2: 2025年4月1日
- 1.24.3: 2025年5月6日
- 1.24.4: 2025年6月5日
- 1.24.5: 2025年7月8日
- 1.24.6: 2025年8月6日

## 🔄 データ更新

新しい Go バージョンがリリースされた際は、以下のコマンドでデータを更新できます：

```bash
./bin/go-ver-trace -refresh
```

---

**Note**: データは公式の Go リリースノート（https://go.dev/doc/devel/release）から自動取得されます。実際のリリース日は公式情報に基づいて動的に更新されます。
