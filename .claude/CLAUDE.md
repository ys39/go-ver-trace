# Go Version Trace - プロジェクト概要

Go 言語のバージョン毎の標準ライブラリ変更点を React Flow で視覚化する Web アプリケーション

## アプリケーション基本情報

- **目的**: Go 言語の標準ライブラリの進化を時系列で視覚的に追跡
- **対象バージョン**: Go 1.18 〜 1.25（26リリース、マイナーバージョン含む）
- **データソース**: 公式 Go リリースノート（https://go.dev/doc/devel/release）
- **可視化方式**: React Flow を使用したインタラクティブなフロー図

## 機能要件

### データ取得・解析
- Go 公式リリースノートから標準ライブラリの変更点を自動取得
- リリース日程を公式ページから動的に取得
- 変更種別の分類: Added, Modified, Deprecated, Removed
- 英語の変更内容を日本語で要約（オプション機能）

### 可視化機能
- React Flow を使用したインタラクティブなフロー図
- パッケージ毎の進化を線（エッジ）で表現
- 変更種別による色分け表示
- ズーム・パン・ミニマップによるナビゲーション
- フィルタリング機能（パッケージ名・変更種別）

### ユーザー操作
- パッケージノードクリックで詳細情報表示
- ノード位置の固定（ドラッグ移動を無効化）
- リアルタイムフィルタリング
- レスポンシブ対応

## データ取得ルール

### 基本ルール
1. `https://go.dev/doc/go1.xx#library` から標準ライブラリセクションを解析
2. h2「Standard library」以降の h3 タグ内容をパッケージ名として取得
3. minor changes セクションは特別処理

### バージョン別特別処理
- **Go 1.22**: dl/dt タグ構造を解析、href からパッケージ名を抽出
- **Go 1.23以降**: h4 タグとテキストパターンで解析
- **共通**: 正規表現によるパッケージ名検証・正規化

## 技術スタック

### バックエンド
- **言語**: Go 1.23.4
- **データベース**: SQLite3
- **スクレイピング**: goquery v1.10.3
- **HTTP サーバー**: 標準ライブラリ

### フロントエンド
- **フレームワーク**: React 19
- **言語**: TypeScript
- **可視化**: React Flow v11
- **ビルドツール**: Vite
- **開発環境**: Node.js 18+

### データベーススキーマ
```sql
-- リリース情報
CREATE TABLE releases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT UNIQUE NOT NULL,
    release_date DATETIME NOT NULL,
    url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

-- インデックス
CREATE INDEX idx_package_changes_package ON package_changes (package);
CREATE INDEX idx_package_changes_change_type ON package_changes (change_type);
CREATE INDEX idx_releases_version ON releases (version);
```

## 開発・運用

### 起動方法
```bash
# データ取得
./bin/go-ver-trace -data-only

# サーバー起動（バックエンド: 8080, フロントエンド: 5173）
./bin/go-ver-trace -port 8080
cd frontend && npm run dev
```

### データ更新
```bash
./bin/go-ver-trace -refresh
```

## 現在の実装状況

### 完了機能
- ✅ 公式リリースノートからの自動データ取得
- ✅ リリース日の動的取得
- ✅ React Flow による可視化
- ✅ パッケージ詳細表示
- ✅ フィルタリング機能
- ✅ 日本語要約生成（バックエンド実装済み）
- ✅ レスポンシブ対応
- ✅ API エンドポイント完備

### 統計データ（2025年8月時点）
- 追跡リリース: 26リリース（Go 1.18〜1.25、マイナーバージョン含む）
- 総変更数: 3,439件
- ユニークパッケージ: 113パッケージ
- 変更種別内訳:
  - Modified: 2,181件 (63.4%)
  - Added: 1,100件 (32.0%)
  - Deprecated: 55件 (1.6%)
  - Removed: 44件 (1.3%)
  - Bug Fix: 27件 (0.8%)
  - Security Fix: 17件 (0.5%)
  - Base: 12件 (0.3%)
  - その他: 3件 (0.1%)

## Claude Code 開発ガイドライン

- **言語**: 全てのやり取りは日本語で行う
- **コード品質**: 既存のコード規約に従う
- **テスト**: 機能追加時は動作確認を実施
- **ドキュメント**: 変更時は README.md と CLAUDE.md を更新
