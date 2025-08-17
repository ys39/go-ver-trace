package server

import (
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"time"

	"go-ver-trace/internal/database"
)

type Server struct {
	db       *database.Database
	templates *template.Template
	port     int
}

type PageData struct {
	Title       string
	Releases    []database.Release
	Packages    []string
	CurrentPage string
}

func New(db *database.Database, port int) *Server {
	s := &Server{
		db:   db,
		port: port,
	}
	s.loadTemplates()
	return s
}

func (s *Server) loadTemplates() {
	// テンプレートが存在しない場合は後で作成する
	s.templates = template.New("")
}

func (s *Server) Start() error {
	mux := http.NewServeMux()
	
	// APIルート（CORSで保護）
	mux.HandleFunc("/api/releases", s.apiReleasesHandler)
	mux.HandleFunc("/api/packages", s.apiPackagesHandler)
	mux.HandleFunc("/api/package/", s.apiPackageHandler)
	mux.HandleFunc("/api/visualization", s.apiVisualizationHandler)
	mux.HandleFunc("/api/refresh", s.apiRefreshHandler)
	mux.HandleFunc("/api/health", s.healthHandler)
	
	// 静的ファイル（開発時のフォールバック）
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("web/static/"))))
	
	addr := fmt.Sprintf(":%d", s.port)
	log.Printf("APIサーバーをポート %d で開始します", s.port)
	log.Printf("API Endpoint: http://localhost%s/api/", addr)
	
	return http.ListenAndServe(addr, s.corsMiddleware(mux))
}

func (s *Server) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		w.Header().Set("Access-Control-Max-Age", "86400")
		
		// JSON response header
		if len(r.URL.Path) >= 4 && r.URL.Path[:4] == "/api" {
			w.Header().Set("Content-Type", "application/json")
		}
		
		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		// Log API requests
		if len(r.URL.Path) >= 4 && r.URL.Path[:4] == "/api" {
			log.Printf("API Request: %s %s", r.Method, r.URL.Path)
		}
		
		next.ServeHTTP(w, r)
	})
}

func (s *Server) indexHandler(w http.ResponseWriter, r *http.Request) {
	releases, err := s.db.GetAllReleases()
	if err != nil {
		log.Printf("Error getting releases: %v", err)
		releases = []database.Release{}
	}
	
	packages, err := s.db.GetUniquePackages()
	if err != nil {
		log.Printf("Error getting packages: %v", err)
		packages = []string{}
	}
	
	data := PageData{
		Title:       "Go Version Trace - ホーム",
		Releases:    releases,
		Packages:    packages,
		CurrentPage: "home",
	}
	
	s.renderTemplate(w, "index.html", data)
}

func (s *Server) visualizationHandler(w http.ResponseWriter, r *http.Request) {
	releases, err := s.db.GetAllReleases()
	if err != nil {
		log.Printf("Error getting releases: %v", err)
		releases = []database.Release{}
	}
	
	packages, err := s.db.GetUniquePackages()
	if err != nil {
		log.Printf("Error getting packages: %v", err)
		packages = []string{}
	}
	
	data := PageData{
		Title:       "Go Version Trace - 可視化",
		Releases:    releases,
		Packages:    packages,
		CurrentPage: "visualization",
	}
	
	s.renderTemplate(w, "visualization.html", data)
}

func (s *Server) apiDocsHandler(w http.ResponseWriter, r *http.Request) {
	data := PageData{
		Title:       "Go Version Trace - API ドキュメント",
		CurrentPage: "api",
	}
	
	s.renderTemplate(w, "api.html", data)
}

func (s *Server) renderTemplate(w http.ResponseWriter, tmplName string, data interface{}) {
	// テンプレートが読み込まれていない場合は、シンプルなHTMLを返す
	if s.templates == nil {
		s.renderSimpleHTML(w, tmplName, data)
		return
	}
	
	err := s.templates.ExecuteTemplate(w, tmplName, data)
	if err != nil {
		log.Printf("Template error: %v", err)
		s.renderSimpleHTML(w, tmplName, data)
	}
}

func (s *Server) renderSimpleHTML(w http.ResponseWriter, tmplName string, data interface{}) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	
	switch tmplName {
	case "index.html":
		fmt.Fprintf(w, `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>Go Version Trace</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .nav { margin-bottom: 20px; }
        .nav a { margin-right: 10px; text-decoration: none; padding: 5px 10px; background: #007d9c; color: white; border-radius: 3px; }
        .nav a:hover { background: #005a6f; }
        .stats { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>Go Version Trace</h1>
    <div class="nav">
        <a href="/">ホーム</a>
        <a href="/visualization">可視化</a>
        <a href="/api-docs">API</a>
    </div>
    <div class="stats">
        <h2>統計情報</h2>
        <p>追跡中のリリース数: %d</p>
        <p>標準ライブラリパッケージ数: %d</p>
    </div>
    <div>
        <h2>最新のリリース</h2>
        <ul>
        %s
        </ul>
    </div>
    <div>
        <h2>API エンドポイント</h2>
        <ul>
            <li><a href="/api/releases">GET /api/releases</a> - 全リリース一覧</li>
            <li><a href="/api/packages">GET /api/packages</a> - 全パッケージ一覧</li>
            <li><a href="/api/visualization">GET /api/visualization</a> - 可視化データ</li>
        </ul>
    </div>
</body>
</html>`, s.getReleasesCount(), s.getPackagesCount(), s.getReleasesHTML())
	
	case "visualization.html":
		fmt.Fprintf(w, `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>Go Version Trace - 可視化</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .nav { margin-bottom: 20px; }
        .nav a { margin-right: 10px; text-decoration: none; padding: 5px 10px; background: #007d9c; color: white; border-radius: 3px; }
        .nav a:hover { background: #005a6f; }
        #visualization { width: 100%%; height: 600px; border: 1px solid #ddd; }
        .loading { text-align: center; padding: 50px; }
    </style>
</head>
<body>
    <h1>Go Version Trace - 可視化</h1>
    <div class="nav">
        <a href="/">ホーム</a>
        <a href="/visualization">可視化</a>
        <a href="/api-docs">API</a>
    </div>
    <div id="visualization">
        <div class="loading">可視化データを読み込み中...</div>
    </div>
    <script>
        fetch('/api/visualization')
            .then(response => response.json())
            .then(data => {
                createVisualization(data);
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('visualization').innerHTML = '<p>データの読み込みに失敗しました。</p>';
            });
        
        function createVisualization(data) {
            // シンプルなテーブル表示
            const container = document.getElementById('visualization');
            container.innerHTML = '<h2>パッケージ変更履歴</h2>';
            
            if (data.packages && data.packages.length > 0) {
                let html = '<table border="1" style="width:100%%; border-collapse: collapse;"><tr><th>パッケージ</th><th>変更数</th></tr>';
                data.packages.forEach(pkg => {
                    const changeCount = data.package_evolution[pkg] ? data.package_evolution[pkg].length : 0;
                    html += '<tr><td>' + pkg + '</td><td>' + changeCount + '</td></tr>';
                });
                html += '</table>';
                container.innerHTML += html;
            } else {
                container.innerHTML += '<p>データがありません。先にデータを取得してください。</p>';
            }
        }
    </script>
</body>
</html>`)
	
	case "api.html":
		fmt.Fprintf(w, `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>Go Version Trace - API</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .nav { margin-bottom: 20px; }
        .nav a { margin-right: 10px; text-decoration: none; padding: 5px 10px; background: #007d9c; color: white; border-radius: 3px; }
        .nav a:hover { background: #005a6f; }
        .endpoint { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
        .method { display: inline-block; padding: 2px 8px; border-radius: 3px; color: white; font-weight: bold; }
        .get { background: #28a745; }
        .post { background: #007bff; }
    </style>
</head>
<body>
    <h1>Go Version Trace - API ドキュメント</h1>
    <div class="nav">
        <a href="/">ホーム</a>
        <a href="/visualization">可視化</a>
        <a href="/api-docs">API</a>
    </div>
    
    <div class="endpoint">
        <h3><span class="method get">GET</span> /api/releases</h3>
        <p>全リリース情報を取得します。</p>
        <a href="/api/releases" target="_blank">テスト</a>
    </div>
    
    <div class="endpoint">
        <h3><span class="method get">GET</span> /api/packages</h3>
        <p>全パッケージ一覧を取得します。</p>
        <a href="/api/packages" target="_blank">テスト</a>
    </div>
    
    <div class="endpoint">
        <h3><span class="method get">GET</span> /api/visualization</h3>
        <p>可視化用のデータを取得します。</p>
        <a href="/api/visualization" target="_blank">テスト</a>
    </div>
    
    <div class="endpoint">
        <h3><span class="method post">POST</span> /api/refresh</h3>
        <p>データを再取得します。</p>
        <button onclick="refreshData()">データ更新</button>
    </div>
    
    <script>
        function refreshData() {
            fetch('/api/refresh', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    alert('データ更新完了: ' + JSON.stringify(data));
                })
                .catch(error => {
                    alert('エラー: ' + error);
                });
        }
    </script>
</body>
</html>`)
	}
}

func (s *Server) getReleasesCount() int {
	releases, _ := s.db.GetAllReleases()
	return len(releases)
}

func (s *Server) getPackagesCount() int {
	packages, _ := s.db.GetUniquePackages()
	return len(packages)
}

func (s *Server) getReleasesHTML() string {
	releases, err := s.db.GetAllReleases()
	if err != nil {
		return "<li>リリース情報の取得に失敗しました</li>"
	}
	
	if len(releases) == 0 {
		return "<li>リリース情報がありません。データを取得してください。</li>"
	}
	
	html := ""
	for _, release := range releases {
		html += fmt.Sprintf("<li>Go %s (%s)</li>", release.Version, release.ReleaseDate.Format("2006-01-02"))
	}
	return html
}

// API Handlers
func (s *Server) apiReleasesHandler(w http.ResponseWriter, r *http.Request) {
	releases, err := s.db.GetAllReleases()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(releases)
}

func (s *Server) apiPackagesHandler(w http.ResponseWriter, r *http.Request) {
	packages, err := s.db.GetUniquePackages()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(packages)
}

func (s *Server) apiPackageHandler(w http.ResponseWriter, r *http.Request) {
	packageName := r.URL.Path[len("/api/package/"):]
	if packageName == "" {
		http.Error(w, "Package name required", http.StatusBadRequest)
		return
	}
	
	changes, err := s.db.GetPackageEvolution(packageName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(changes)
}

func (s *Server) apiVisualizationHandler(w http.ResponseWriter, r *http.Request) {
	data, err := s.db.GetVisualizationData()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func (s *Server) apiRefreshHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	// データ更新処理は後で実装
	response := map[string]interface{}{
		"status":  "success",
		"message": "データ更新機能は準備中です",
	}
	
	json.NewEncoder(w).Encode(response)
}

func (s *Server) healthHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	// データベース接続確認
	releases, err := s.db.GetAllReleases()
	if err != nil {
		response := map[string]interface{}{
			"status":  "error",
			"message": "データベース接続エラー",
			"error":   err.Error(),
		}
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response)
		return
	}
	
	packages, err := s.db.GetUniquePackages()
	if err != nil {
		response := map[string]interface{}{
			"status":  "error", 
			"message": "パッケージデータ取得エラー",
			"error":   err.Error(),
		}
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response)
		return
	}
	
	response := map[string]interface{}{
		"status":         "ok",
		"message":        "API サーバーは正常に動作しています",
		"release_count":  len(releases),
		"package_count":  len(packages),
		"timestamp":      time.Now().UTC().Format(time.RFC3339),
	}
	
	json.NewEncoder(w).Encode(response)
}