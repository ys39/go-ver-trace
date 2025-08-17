package main

import (
	"fmt"
	"log"

	"go-ver-trace/internal/scraper"
)

func main() {
	rs := scraper.NewReleaseScraper()
	
	// Go 1.19の情報を取得
	release, err := rs.GetReleaseInfo([]string{"1.19"})
	if err != nil {
		log.Fatal(err)
	}
	
	if len(release) > 0 {
		r := release[0]
		fmt.Printf("Version: %s\n", r.Version)
		fmt.Printf("URL: %s\n", r.URL)
		fmt.Printf("Changes count: %d\n", len(r.Changes))
		
		// runtime/metricsに関する変更を探す
		for _, change := range r.Changes {
			if change.Package == "runtime/metrics" {
				fmt.Printf("Found runtime/metrics: %s - %s\n", change.ChangeType, change.Description)
			}
		}
		
		// 全ての変更を表示
		fmt.Println("\nAll changes:")
		for _, change := range r.Changes {
			fmt.Printf("Package: %s, Type: %s, Description: %s\n", change.Package, change.ChangeType, change.Description)
		}
	}
}