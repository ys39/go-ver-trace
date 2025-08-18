package importer

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strings"
	"time"
)

// MinorVersionChange represents a minor version change from JSON
type MinorVersionChange struct {
	Version string   `json:"version"`
	Package string   `json:"package"`
	Change  string   `json:"change"`
	Links   []string `json:"links"`
}

// ImportMinorVersions imports minor version changes from JSON file to database
func ImportMinorVersions(db *sql.DB, jsonFilePath string) error {
	// Read JSON file
	file, err := os.Open(jsonFilePath)
	if err != nil {
		return fmt.Errorf("failed to open JSON file: %w", err)
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		return fmt.Errorf("failed to read JSON file: %w", err)
	}

	var changes []MinorVersionChange
	if err := json.Unmarshal(data, &changes); err != nil {
		return fmt.Errorf("failed to unmarshal JSON: %w", err)
	}

	// Begin transaction
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Track processed versions to avoid duplicates
	processedVersions := make(map[string]bool)
	
	for _, change := range changes {
		// Extract version number (remove "go" prefix)
		version := strings.TrimPrefix(change.Version, "go")
		
		// Skip if we've already processed this version
		if !processedVersions[version] {
			// Insert release if not exists
			err := insertReleaseIfNotExists(tx, version)
			if err != nil {
				return fmt.Errorf("failed to insert release %s: %w", version, err)
			}
			processedVersions[version] = true
		}

		// Get release ID
		var releaseID int
		err := tx.QueryRow("SELECT id FROM releases WHERE version = ?", version).Scan(&releaseID)
		if err != nil {
			return fmt.Errorf("failed to get release ID for version %s: %w", version, err)
		}

		// Skip if package is "(none)" or empty
		if change.Package == "(none)" || change.Package == "" {
			continue
		}

		// Determine change type based on description
		changeType := determineChangeType(change.Change)

		// Insert package change
		sourceURL := ""
		if len(change.Links) > 0 {
			sourceURL = change.Links[0]
		}

		_, err = tx.Exec(`
			INSERT INTO package_changes (release_id, package, change_type, description, source_url)
			VALUES (?, ?, ?, ?, ?)
		`, releaseID, change.Package, changeType, change.Change, sourceURL)
		
		if err != nil {
			return fmt.Errorf("failed to insert package change for %s: %w", change.Package, err)
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	fmt.Printf("Successfully imported %d minor version changes\n", len(changes))
	return nil
}

// insertReleaseIfNotExists inserts a release record if it doesn't exist
func insertReleaseIfNotExists(tx *sql.Tx, version string) error {
	// Check if release exists
	var count int
	err := tx.QueryRow("SELECT COUNT(*) FROM releases WHERE version = ?", version).Scan(&count)
	if err != nil {
		return err
	}

	if count > 0 {
		return nil // Already exists
	}

	// Estimate release date based on version
	releaseDate := estimateReleaseDate(version)
	releaseURL := fmt.Sprintf("https://go.dev/doc/devel/release#go%s", version)

	_, err = tx.Exec(`
		INSERT INTO releases (version, release_date, url)
		VALUES (?, ?, ?)
	`, version, releaseDate, releaseURL)

	return err
}

// determineChangeType determines the change type from description
func determineChangeType(description string) string {
	desc := strings.ToLower(description)
	
	if strings.Contains(desc, "security fix") || strings.Contains(desc, "cve-") {
		return "Security Fix"
	}
	if strings.Contains(desc, "bug fix") || strings.Contains(desc, "bug fixes") {
		return "Bug Fix"
	}
	if strings.Contains(desc, "test fix") {
		return "Test Fix"
	}
	if strings.Contains(desc, "deprecated") || strings.Contains(desc, "deprecat") {
		return "Deprecated"
	}
	if strings.Contains(desc, "removed") || strings.Contains(desc, "remove") {
		return "Removed"
	}
	if strings.Contains(desc, "added") || strings.Contains(desc, "add") || strings.Contains(desc, "new") {
		return "Added"
	}
	
	// Default to Modified for other changes
	return "Modified"
}

// estimateReleaseDate estimates release date for minor versions
func estimateReleaseDate(version string) string {
	// Parse version to get base and minor numbers
	parts := strings.Split(version, ".")
	if len(parts) < 3 {
		return time.Now().Format("2006-01-02T15:04:05Z")
	}

	// Base Go 1.23 was released on 2024-08-13
	baseDate := time.Date(2024, 8, 13, 0, 0, 0, 0, time.UTC)
	
	// Estimate minor versions as roughly monthly releases
	if parts[0] == "1" && parts[1] == "23" {
		minorVersion := 0
		fmt.Sscanf(parts[2], "%d", &minorVersion)
		
		// Add approximately 1 month per minor version
		estimatedDate := baseDate.AddDate(0, minorVersion, 0)
		return estimatedDate.Format("2006-01-02T15:04:05Z")
	}

	return time.Now().Format("2006-01-02T15:04:05Z")
}