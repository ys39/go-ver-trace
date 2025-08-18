package database

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

type Database struct {
	db *sql.DB
}

type Release struct {
	ID          int       `json:"id"`
	Version     string    `json:"version"`
	ReleaseDate time.Time `json:"release_date"`
	URL         string    `json:"url"`
	CreatedAt   time.Time `json:"created_at"`
}

type PackageChange struct {
	ID          int       `json:"id"`
	ReleaseID   int       `json:"release_id"`
	Package     string    `json:"package"`
	ChangeType  string    `json:"change_type"`
	Description string    `json:"description"`
	SummaryJa   string    `json:"summary_ja"`
	SourceURL   string    `json:"source_url"`
	CreatedAt   time.Time `json:"created_at"`
}

func New(dbPath string) (*Database, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	database := &Database{db: db}
	
	if err := database.createTables(); err != nil {
		return nil, fmt.Errorf("failed to create tables: %w", err)
	}

	return database, nil
}

func (d *Database) Close() error {
	return d.db.Close()
}

func (d *Database) createTables() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS releases (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			version TEXT UNIQUE NOT NULL,
			release_date DATETIME NOT NULL,
			url TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS package_changes (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			release_id INTEGER NOT NULL,
			package TEXT NOT NULL,
			change_type TEXT NOT NULL,
			description TEXT,
			summary_ja TEXT,
			source_url TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (release_id) REFERENCES releases (id) ON DELETE CASCADE
		)`,
		`CREATE INDEX IF NOT EXISTS idx_package_changes_package ON package_changes (package)`,
		`CREATE INDEX IF NOT EXISTS idx_package_changes_change_type ON package_changes (change_type)`,
		`CREATE INDEX IF NOT EXISTS idx_releases_version ON releases (version)`,
	}

	for _, query := range queries {
		if _, err := d.db.Exec(query); err != nil {
			return fmt.Errorf("failed to execute query %s: %w", query, err)
		}
	}

	// 既存テーブルに summary_ja カラムを追加するマイグレーション
	if err := d.addSummaryJaColumn(); err != nil {
		return fmt.Errorf("failed to migrate summary_ja column: %w", err)
	}

	// 既存テーブルに source_url カラムを追加するマイグレーション
	if err := d.addSourceURLColumn(); err != nil {
		return fmt.Errorf("failed to migrate source_url column: %w", err)
	}

	return nil
}

// 既存のテーブルに summary_ja カラムを追加
func (d *Database) addSummaryJaColumn() error {
	// カラムが存在するかチェック
	var count int
	err := d.db.QueryRow(`
		SELECT COUNT(*) FROM pragma_table_info('package_changes') 
		WHERE name = 'summary_ja'
	`).Scan(&count)
	
	if err != nil {
		return err
	}
	
	// カラムが存在しない場合のみ追加
	if count == 0 {
		_, err = d.db.Exec(`ALTER TABLE package_changes ADD COLUMN summary_ja TEXT`)
		return err
	}
	
	return nil
}

// 既存のテーブルに source_url カラムを追加
func (d *Database) addSourceURLColumn() error {
	// カラムが存在するかチェック
	var count int
	err := d.db.QueryRow(`
		SELECT COUNT(*) FROM pragma_table_info('package_changes') 
		WHERE name = 'source_url'
	`).Scan(&count)
	
	if err != nil {
		return err
	}
	
	// カラムが存在しない場合のみ追加
	if count == 0 {
		_, err = d.db.Exec(`ALTER TABLE package_changes ADD COLUMN source_url TEXT`)
		return err
	}
	
	return nil
}

func (d *Database) SaveRelease(version string, releaseDate time.Time, url string) (int, error) {
	query := `INSERT OR REPLACE INTO releases (version, release_date, url) VALUES (?, ?, ?)`
	result, err := d.db.Exec(query, version, releaseDate, url)
	if err != nil {
		return 0, fmt.Errorf("failed to save release: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("failed to get last insert id: %w", err)
	}

	return int(id), nil
}

func (d *Database) SavePackageChange(releaseID int, packageName, changeType, description string) error {
	query := `INSERT INTO package_changes (release_id, package, change_type, description) VALUES (?, ?, ?, ?)`
	_, err := d.db.Exec(query, releaseID, packageName, changeType, description)
	if err != nil {
		return fmt.Errorf("failed to save package change: %w", err)
	}
	return nil
}

func (d *Database) SavePackageChangeWithSummary(releaseID int, packageName, changeType, description, summaryJa string) error {
	query := `INSERT INTO package_changes (release_id, package, change_type, description, summary_ja) VALUES (?, ?, ?, ?, ?)`
	_, err := d.db.Exec(query, releaseID, packageName, changeType, description, summaryJa)
	if err != nil {
		return fmt.Errorf("failed to save package change with summary: %w", err)
	}
	return nil
}

func (d *Database) SavePackageChangeWithSourceURL(releaseID int, packageName, changeType, description, summaryJa, sourceURL string) error {
	query := `INSERT INTO package_changes (release_id, package, change_type, description, summary_ja, source_url) VALUES (?, ?, ?, ?, ?, ?)`
	_, err := d.db.Exec(query, releaseID, packageName, changeType, description, summaryJa, sourceURL)
	if err != nil {
		return fmt.Errorf("failed to save package change with source URL: %w", err)
	}
	return nil
}

func (d *Database) GetAllReleases() ([]Release, error) {
	query := `SELECT id, version, release_date, url, created_at FROM releases ORDER BY release_date`
	rows, err := d.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query releases: %w", err)
	}
	defer rows.Close()

	var releases []Release
	for rows.Next() {
		var r Release
		if err := rows.Scan(&r.ID, &r.Version, &r.ReleaseDate, &r.URL, &r.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan release: %w", err)
		}
		releases = append(releases, r)
	}

	return releases, nil
}

func (d *Database) GetPackageChanges(releaseID int) ([]PackageChange, error) {
	query := `SELECT id, release_id, package, change_type, description, 
			  COALESCE(summary_ja, '') as summary_ja, COALESCE(source_url, '') as source_url, created_at 
			  FROM package_changes WHERE release_id = ? ORDER BY package`
	rows, err := d.db.Query(query, releaseID)
	if err != nil {
		return nil, fmt.Errorf("failed to query package changes: %w", err)
	}
	defer rows.Close()

	var changes []PackageChange
	for rows.Next() {
		var c PackageChange
		if err := rows.Scan(&c.ID, &c.ReleaseID, &c.Package, &c.ChangeType, &c.Description, &c.SummaryJa, &c.SourceURL, &c.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan package change: %w", err)
		}
		changes = append(changes, c)
	}

	return changes, nil
}

func (d *Database) GetAllPackageChanges() ([]PackageChange, error) {
	query := `SELECT pc.id, pc.release_id, pc.package, pc.change_type, pc.description, 
			  COALESCE(pc.summary_ja, '') as summary_ja, COALESCE(pc.source_url, '') as source_url, pc.created_at 
			  FROM package_changes pc
			  JOIN releases r ON pc.release_id = r.id
			  ORDER BY r.release_date, pc.package`
	rows, err := d.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query all package changes: %w", err)
	}
	defer rows.Close()

	var changes []PackageChange
	for rows.Next() {
		var c PackageChange
		if err := rows.Scan(&c.ID, &c.ReleaseID, &c.Package, &c.ChangeType, &c.Description, &c.SummaryJa, &c.SourceURL, &c.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan package change: %w", err)
		}
		changes = append(changes, c)
	}

	return changes, nil
}

func (d *Database) GetPackageEvolution(packageName string) ([]PackageChange, error) {
	query := `SELECT pc.id, pc.release_id, pc.package, pc.change_type, pc.description, 
			  COALESCE(pc.summary_ja, '') as summary_ja, COALESCE(pc.source_url, '') as source_url, pc.created_at 
			  FROM package_changes pc
			  JOIN releases r ON pc.release_id = r.id
			  WHERE pc.package = ?
			  ORDER BY r.release_date`
	rows, err := d.db.Query(query, packageName)
	if err != nil {
		return nil, fmt.Errorf("failed to query package evolution: %w", err)
	}
	defer rows.Close()

	var changes []PackageChange
	for rows.Next() {
		var c PackageChange
		if err := rows.Scan(&c.ID, &c.ReleaseID, &c.Package, &c.ChangeType, &c.Description, &c.SummaryJa, &c.SourceURL, &c.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan package change: %w", err)
		}
		changes = append(changes, c)
	}

	return changes, nil
}

func (d *Database) GetUniquePackages() ([]string, error) {
	query := `SELECT DISTINCT package FROM package_changes ORDER BY package`
	rows, err := d.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query unique packages: %w", err)
	}
	defer rows.Close()

	var packages []string
	for rows.Next() {
		var pkg string
		if err := rows.Scan(&pkg); err != nil {
			return nil, fmt.Errorf("failed to scan package: %w", err)
		}
		packages = append(packages, pkg)
	}

	return packages, nil
}

func (d *Database) GetVisualizationData() (map[string]interface{}, error) {
	releases, err := d.GetAllReleases()
	if err != nil {
		return nil, err
	}

	packages, err := d.GetUniquePackages()
	if err != nil {
		return nil, err
	}

	// パッケージごとの進化データを構築
	packageEvolutions := make(map[string][]map[string]interface{})
	
	for _, pkg := range packages {
		changes, err := d.GetPackageEvolution(pkg)
		if err != nil {
			continue
		}

		var timeline []map[string]interface{}
		for _, change := range changes {
			// リリース情報を取得
			for _, release := range releases {
				if release.ID == change.ReleaseID {
					timeline = append(timeline, map[string]interface{}{
						"version":      release.Version,
						"release_date": release.ReleaseDate,
						"change_type":  change.ChangeType,
						"description":  change.Description,
						"summary_ja":   change.SummaryJa,
						"source_url":   change.SourceURL,
					})
					break
				}
			}
		}
		packageEvolutions[pkg] = timeline
	}

	return map[string]interface{}{
		"releases":          releases,
		"packages":          packages,
		"package_evolution": packageEvolutions,
	}, nil
}

func (d *Database) ClearData() error {
	queries := []string{
		"DELETE FROM package_changes",
		"DELETE FROM releases",
	}

	for _, query := range queries {
		if _, err := d.db.Exec(query); err != nil {
			return fmt.Errorf("failed to clear data: %w", err)
		}
	}

	return nil
}

// GetDB returns the underlying sql.DB for advanced operations
func (d *Database) GetDB() *sql.DB {
	return d.db
}

// GetReleaseID returns the release ID for a given version
func (d *Database) GetReleaseID(version string) (int, error) {
	var releaseID int
	err := d.db.QueryRow("SELECT id FROM releases WHERE version = ?", version).Scan(&releaseID)
	if err != nil {
		return 0, fmt.Errorf("failed to get release ID for version %s: %w", version, err)
	}
	return releaseID, nil
}

// GetPackagesInVersion returns all packages that have changes in a specific version
func (d *Database) GetPackagesInVersion(version string) ([]string, error) {
	query := `
		SELECT DISTINCT pc.package 
		FROM package_changes pc 
		JOIN releases r ON pc.release_id = r.id 
		WHERE r.version = ?
	`
	
	rows, err := d.db.Query(query, version)
	if err != nil {
		return nil, fmt.Errorf("failed to query packages for version %s: %w", version, err)
	}
	defer rows.Close()

	var packages []string
	for rows.Next() {
		var pkg string
		if err := rows.Scan(&pkg); err != nil {
			return nil, fmt.Errorf("failed to scan package: %w", err)
		}
		packages = append(packages, pkg)
	}

	return packages, nil
}