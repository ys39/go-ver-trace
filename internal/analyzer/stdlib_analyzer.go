package analyzer

import (
	"fmt"
	"sort"
	"strings"
	"time"
	
	"go-ver-trace/internal/scraper"
)

type PackageEvolution struct {
	PackageName string                    `json:"package_name"`
	Timeline    []PackageVersionChange    `json:"timeline"`
}

type PackageVersionChange struct {
	Version     string    `json:"version"`
	ReleaseDate time.Time `json:"release_date"`
	ChangeType  string    `json:"change_type"`
	Description string    `json:"description"`
	SummaryJa   string    `json:"summary_ja"`
}

type VisualizationData struct {
	Packages []PackageEvolution `json:"packages"`
	Versions []VersionInfo      `json:"versions"`
}

type VersionInfo struct {
	Version     string    `json:"version"`
	ReleaseDate time.Time `json:"release_date"`
}


type StdLibAnalyzer struct {
	packageMap map[string][]PackageVersionChange
}

func NewStdLibAnalyzer() *StdLibAnalyzer {
	return &StdLibAnalyzer{
		packageMap: make(map[string][]PackageVersionChange),
	}
}

func (sa *StdLibAnalyzer) AnalyzeReleases(releases []scraper.ReleaseInfo) (*VisualizationData, error) {
	// バージョン情報を収集
	var versions []VersionInfo
	for _, release := range releases {
		versions = append(versions, VersionInfo{
			Version:     release.Version,
			ReleaseDate: release.ReleaseDate,
		})
	}

	// バージョンを日付順にソート
	sort.Slice(versions, func(i, j int) bool {
		return versions[i].ReleaseDate.Before(versions[j].ReleaseDate)
	})

	// パッケージごとの変更履歴を構築
	sa.buildPackageTimeline(releases)

	// 可視化データを生成
	vizData := &VisualizationData{
		Packages: sa.generatePackageEvolutions(),
		Versions: versions,
	}

	return vizData, nil
}

func (sa *StdLibAnalyzer) buildPackageTimeline(releases []scraper.ReleaseInfo) {
	for _, release := range releases {
		for _, change := range release.Changes {
			if change.Package == "" {
				continue
			}

			// パッケージ名を正規化
			packageName := sa.normalizePackageName(change.Package)
			
			versionChange := PackageVersionChange{
				Version:     release.Version,
				ReleaseDate: release.ReleaseDate,
				ChangeType:  change.ChangeType,
				Description: change.Description,
				SummaryJa:   change.SummaryJa,
			}

			sa.packageMap[packageName] = append(sa.packageMap[packageName], versionChange)
		}
	}

	// 各パッケージの変更履歴を日付順にソート
	for packageName := range sa.packageMap {
		sort.Slice(sa.packageMap[packageName], func(i, j int) bool {
			return sa.packageMap[packageName][i].ReleaseDate.Before(sa.packageMap[packageName][j].ReleaseDate)
		})
	}
}

func (sa *StdLibAnalyzer) normalizePackageName(packageName string) string {
	// パッケージ名を正規化
	packageName = strings.TrimSpace(packageName)
	packageName = strings.ToLower(packageName)
	
	// "package " プレフィックスを削除
	packageName = strings.TrimPrefix(packageName, "package ")

	return packageName
}

func (sa *StdLibAnalyzer) generatePackageEvolutions() []PackageEvolution {
	var evolutions []PackageEvolution

	// パッケージ名でソート
	var packageNames []string
	for packageName := range sa.packageMap {
		packageNames = append(packageNames, packageName)
	}
	sort.Strings(packageNames)

	for _, packageName := range packageNames {
		timeline := sa.packageMap[packageName]
		
		evolution := PackageEvolution{
			PackageName: packageName,
			Timeline:    timeline,
		}
		
		evolutions = append(evolutions, evolution)
	}

	return evolutions
}

func (sa *StdLibAnalyzer) GetPackageStats() map[string]any {
	stats := make(map[string]any)
	
	stats["total_packages"] = len(sa.packageMap)
	
	changeTypeCounts := make(map[string]int)
	totalChanges := 0
	
	for _, timeline := range sa.packageMap {
		for _, change := range timeline {
			changeTypeCounts[change.ChangeType]++
			totalChanges++
		}
	}
	
	stats["total_changes"] = totalChanges
	stats["change_types"] = changeTypeCounts
	
	return stats
}

func (sa *StdLibAnalyzer) GetPackagesByChangeType(changeType string) []string {
	var packages []string
	
	for packageName, timeline := range sa.packageMap {
		for _, change := range timeline {
			if change.ChangeType == changeType {
				packages = append(packages, packageName)
				break
			}
		}
	}
	
	sort.Strings(packages)
	return packages
}

func (sa *StdLibAnalyzer) SearchPackages(query string) []PackageEvolution {
	query = strings.ToLower(strings.TrimSpace(query))
	var results []PackageEvolution
	
	for _, evolution := range sa.generatePackageEvolutions() {
		if strings.Contains(strings.ToLower(evolution.PackageName), query) {
			results = append(results, evolution)
		}
	}
	
	return results
}

func (sa *StdLibAnalyzer) GenerateReportSummary() string {
	stats := sa.GetPackageStats()
	
	var summary strings.Builder
	summary.WriteString("Standard Library Analysis Report\n")
	summary.WriteString("================================\n\n")
	summary.WriteString(fmt.Sprintf("Total Packages Analyzed: %d\n", stats["total_packages"]))
	summary.WriteString(fmt.Sprintf("Total Changes: %d\n\n", stats["total_changes"]))
	
	changeTypes, ok := stats["change_types"].(map[string]int)
	if ok {
		summary.WriteString("Change Type Breakdown:\n")
		for changeType, count := range changeTypes {
			summary.WriteString(fmt.Sprintf("  %s: %d\n", changeType, count))
		}
	}
	
	return summary.String()
}