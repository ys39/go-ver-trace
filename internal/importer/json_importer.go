package importer

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"strings"
	"time"

	"go-ver-trace/internal/database"
)

type MinorRevisionData struct {
	Version string         `json:"version"`
	Changes []ChangeData   `json:"changes"`
}

type ChangeData struct {
	Package string   `json:"package"`
	Change  string   `json:"change"`
	Links   []string `json:"links"`
}

type JSONImporter struct {
	db *database.Database
}

func NewJSONImporter(db *database.Database) *JSONImporter {
	return &JSONImporter{db: db}
}

func (ji *JSONImporter) ImportMinorRevisions(filePath string) error {
	// JSONファイルを読み込み
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read JSON file: %w", err)
	}

	var revisions []MinorRevisionData
	if err := json.Unmarshal(data, &revisions); err != nil {
		return fmt.Errorf("failed to parse JSON: %w", err)
	}

	for _, revision := range revisions {
		if err := ji.importRevision(revision); err != nil {
			log.Printf("Error importing revision %s: %v", revision.Version, err)
			continue
		}
	}

	return nil
}

func (ji *JSONImporter) importRevision(revision MinorRevisionData) error {
	// バージョンから "go" プレフィックスを除去
	version := strings.TrimPrefix(revision.Version, "go")
	
	// リリース日を設定（マイナーリビジョンの日付マッピング）
	releaseDate := ji.getMinorReleaseDate(version)
	
	// リリースノートのURL
	releaseURL := "https://go.dev/doc/devel/release#go" + strings.Replace(version, ".", "", 1) + ".minor"
	
	// リリースをデータベースに保存
	releaseID, err := ji.db.SaveRelease(version, releaseDate, releaseURL)
	if err != nil {
		return fmt.Errorf("failed to save release %s: %w", version, err)
	}

	log.Printf("Saved release %s with ID %d", version, releaseID)

	// 変更をデータベースに保存
	for _, change := range revision.Changes {
		if err := ji.importChange(releaseID, change, version); err != nil {
			log.Printf("Error importing change for %s package %s: %v", version, change.Package, err)
			continue
		}
	}

	return nil
}

func (ji *JSONImporter) importChange(releaseID int, change ChangeData, version string) error {
	// 変更種別を決定
	changeType := ji.determineChangeType(change.Change)
	
	// 日本語要約を生成
	summaryJa := ji.generateJapaneseSummary(change.Change, changeType)
	
	// ソースURLを選択（最初のリンクを使用）
	sourceURL := ""
	if len(change.Links) > 0 {
		sourceURL = change.Links[0]
	}

	// データベースに保存
	err := ji.db.SavePackageChangeWithSourceURL(
		releaseID,
		change.Package,
		changeType,
		change.Change,
		summaryJa,
		sourceURL,
	)
	
	if err != nil {
		return fmt.Errorf("failed to save package change: %w", err)
	}

	log.Printf("Saved change for package %s: %s", change.Package, changeType)
	return nil
}

func (ji *JSONImporter) determineChangeType(description string) string {
	description = strings.ToLower(description)
	
	if strings.Contains(description, "security fix") || strings.Contains(description, "cve-") {
		return "Security Fix"
	}
	if strings.Contains(description, "fix:") || strings.Contains(description, "bug fix") {
		return "Bug Fix"
	}
	if strings.Contains(description, "test fixes") || strings.Contains(description, "stability improvements") {
		return "Test Fix"
	}
	if strings.Contains(description, "compatibility:") {
		return "Compatibility"
	}
	if strings.Contains(description, "hardening:") {
		return "Security Enhancement"
	}
	
	return "Modified"
}

func (ji *JSONImporter) generateJapaneseSummary(description, changeType string) string {
	switch changeType {
	case "Security Fix":
		return "セキュリティ修正が行われました"
	case "Bug Fix":
		return "バグが修正されました"
	case "Test Fix":
		return "テストの修正・安定化が行われました"
	case "Compatibility":
		return "互換性の改善が行われました"
	case "Security Enhancement":
		return "セキュリティ強化が行われました"
	default:
		return "機能が改善されました"
	}
}

func (ji *JSONImporter) getMinorReleaseDate(version string) time.Time {
	// マイナーリビジョンの正確なリリース日（go.dev公式より）
	releaseDates := map[string]string{
		"1.24.1": "2025-03-04",
		"1.24.2": "2025-04-01",
		"1.24.3": "2025-05-06",
		"1.24.4": "2025-06-05",
		"1.24.5": "2025-07-08",
		"1.24.6": "2025-08-06",
	}

	if dateStr, exists := releaseDates[version]; exists {
		if date, err := time.Parse("2006-01-02", dateStr); err == nil {
			return date
		}
	}

	// フォールバック: 現在時刻
	return time.Now()
}