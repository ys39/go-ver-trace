package main

import (
	"flag"
	"log"
	"os"

	"go-ver-trace/internal/analyzer"
	"go-ver-trace/internal/database"
	"go-ver-trace/internal/scraper"
	"go-ver-trace/internal/server"
)

func main() {
	var (
		port      = flag.Int("port", 8080, "サーバーポート")
		dbPath    = flag.String("db", "data.db", "データベースファイルパス")
		refresh   = flag.Bool("refresh", false, "起動時にデータを再取得する")
		dataOnly  = flag.Bool("data-only", false, "データ取得のみ実行してサーバーは起動しない")
	)
	flag.Parse()

	// データベース初期化
	db, err := database.New(*dbPath)
	if err != nil {
		log.Fatalf("データベースの初期化に失敗しました: %v", err)
	}
	defer db.Close()

	log.Printf("データベース初期化完了: %s", *dbPath)

	// データ取得
	if *refresh || *dataOnly {
		log.Println("Go言語リリース情報を取得中...")
		if err := fetchAndStoreData(db); err != nil {
			log.Printf("データ取得エラー: %v", err)
		} else {
			log.Println("データ取得完了")
		}
	}

	// データのみの場合はここで終了
	if *dataOnly {
		log.Println("データ取得のみ完了。プログラムを終了します。")
		return
	}

	// サーバー起動
	srv := server.New(db, *port)
	log.Printf("Webサーバーを起動します...")
	if err := srv.Start(); err != nil {
		log.Fatalf("サーバー起動に失敗しました: %v", err)
	}
}

func fetchAndStoreData(db *database.Database) error {
	// スクレイパーの初期化
	releaseScraper := scraper.NewReleaseScraper()
	
	// 対象バージョンの取得
	versions := releaseScraper.GetTargetVersions()
	log.Printf("対象バージョン: %v", versions)

	// リリース情報の取得
	releases, err := releaseScraper.GetReleaseInfo(versions)
	if err != nil {
		return err
	}

	log.Printf("取得したリリース数: %d", len(releases))

	// データベースに保存
	for _, release := range releases {
		log.Printf("保存中: Go %s", release.Version)
		
		// リリース情報を保存
		releaseID, err := db.SaveRelease(release.Version, release.ReleaseDate, release.URL)
		if err != nil {
			log.Printf("リリース保存エラー (Go %s): %v", release.Version, err)
			continue
		}

		// パッケージ変更を保存
		for _, change := range release.Changes {
			if change.Package == "" {
				continue
			}
			
			err := db.SavePackageChange(releaseID, change.Package, change.ChangeType, change.Description)
			if err != nil {
				log.Printf("パッケージ変更保存エラー (%s): %v", change.Package, err)
			}
		}
		
		log.Printf("Go %s の保存完了 (変更数: %d)", release.Version, len(release.Changes))
	}

	// 解析結果の表示
	analyzer := analyzer.NewStdLibAnalyzer()
	vizData, err := analyzer.AnalyzeReleases(releases)
	if err != nil {
		log.Printf("解析エラー: %v", err)
		return err
	}

	log.Printf("解析完了:")
	log.Printf("  - 総パッケージ数: %d", len(vizData.Packages))
	log.Printf("  - 総バージョン数: %d", len(vizData.Versions))

	// 統計情報の表示
	stats := analyzer.GetPackageStats()
	log.Printf("統計情報: %+v", stats)

	return nil
}

func init() {
	// ログの設定
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.SetOutput(os.Stdout)
}