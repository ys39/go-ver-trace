package importer

import (
	"fmt"
	"log"
	"go-ver-trace/internal/database"
)

// CreateBaseVersions creates base major version entries for packages that only exist in minor versions
func CreateBaseVersions(db *database.Database) error {
	// Get all minor version packages that need base versions
	baseVersionsNeeded := map[string][]string{
		"1.23": {"1.23.1", "1.23.2", "1.23.3", "1.23.4", "1.23.5", "1.23.6", "1.23.7", "1.23.8", "1.23.9", "1.23.10", "1.23.11", "1.23.12"},
		"1.24": {"1.24.1", "1.24.2", "1.24.3", "1.24.4", "1.24.5", "1.24.6"},
	}

	for majorVersion, minorVersions := range baseVersionsNeeded {
		err := createBaseVersionForMajor(db, majorVersion, minorVersions)
		if err != nil {
			log.Printf("Error creating base version for %s: %v", majorVersion, err)
			continue
		}
	}

	return nil
}

func createBaseVersionForMajor(db *database.Database, majorVersion string, minorVersions []string) error {
	// Get packages that exist in minor versions but not in major version
	packagesInMinorVersions := make(map[string]bool)
	
	for _, minorVersion := range minorVersions {
		packages, err := db.GetPackagesInVersion(minorVersion)
		if err != nil {
			log.Printf("Error getting packages for version %s: %v", minorVersion, err)
			continue
		}
		
		for _, pkg := range packages {
			packagesInMinorVersions[pkg] = true
		}
	}

	// Check if major version exists
	majorReleaseID, err := db.GetReleaseID(majorVersion)
	if err != nil {
		log.Printf("Major version %s not found, skipping base version creation", majorVersion)
		return nil
	}

	// Get packages that already exist in major version
	existingPackages, err := db.GetPackagesInVersion(majorVersion)
	if err != nil {
		return fmt.Errorf("failed to get existing packages for %s: %w", majorVersion, err)
	}
	
	existingPackagesMap := make(map[string]bool)
	for _, pkg := range existingPackages {
		existingPackagesMap[pkg] = true
	}

	// Create base entries for packages that don't exist in major version
	for packageName := range packagesInMinorVersions {
		if !existingPackagesMap[packageName] {
			// Create a base entry for this package in the major version
			description := fmt.Sprintf("Base package entry for %s (introduced in minor versions)", packageName)
			err := db.SavePackageChangeWithSourceURL(
				majorReleaseID,
				packageName,
				"Base", // New change type for base entries
				description,
				"ベースパッケージエントリ（マイナーバージョンで導入）",
				"",
			)
			
			if err != nil {
				log.Printf("Failed to create base entry for %s in %s: %v", packageName, majorVersion, err)
				continue
			}
			
			log.Printf("Created base entry for package %s in version %s", packageName, majorVersion)
		}
	}

	return nil
}