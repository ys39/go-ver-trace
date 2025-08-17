# アプリケーション基本情報

Go 言語のバージョン毎の特徴や変更点を把握して、standard library に関する変更箇所の遷移を視覚的に確認できる Web アプリケーション

# 機能要件

- https://go.dev/doc/devel/release の中の内容と URL を再帰的に参照して、Go 言語の Standard Library に関する変更点を把握して可視化する
- 可視化は、横軸にメジャーバージョンのリリース日、縦軸に Standard Library のパッケージ名を配置し、各パッケージ毎に線を結んで、その進化を可視化する
- 現在の Go 言語の最新メジャーバージョンは 1.25.0。
- 5 世代前から最新までのメジャーバージョンを対象とする。
- メジャーバージョン毎に Standard Library にどのような変更点があったかを確認できるようにする
- バージョン毎に様々な変更があるが、情報整理のために Standard Library のみを対象とする
- 各バージョンの Standard Library の変更点については、1.25.0 ならhttps://go.dev/doc/go1.25#library、1.24.0ならhttps://go.dev/doc/go1.24#libraryを確認してほしい。他のバージョンも同様にして。そこからパッケージ名と何の変更が行われたかを要約してデータとして格納したい
- 同じパッケージ毎に線で結んで、バージョン間の進化を表現する
- マウスでパッケージ名を選択すると、変更点の詳細が表示される
- マウスでパッケージ名をドラッグしても位置を変更できないようにする
- https://go.dev/doc/go1.xx からのデータ取得ルール
  - h2 で Standard library と書かれた html 以降の h3 タグの内容をデータとして格納する
  - h2 で Standard library と書かれた html 以降の h3 タグの内容が minor_library_changes の場合は h3 の内容をパッケージ名として、h4 の内容を変更点としてデータとして格納する
  - ただし 1.22 の場合、h2 で Standard library と書かれた html 以降の h3 タグの内容が minor_library_changes の場合は h4 の内容でなく dt の内容を変更点としてデータとして格納する

# 技術要件

- DB : sqlite3
- 可視化のためのフロントエンド : React
- 可視化 : React Flow
- スクレイピング : Go
- バックエンド : Go

# Claude Code 要件

- やり取りの内容は全て日本語で行う
