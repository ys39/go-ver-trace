// フロー図とタイムライン軸の共通レイアウト設定
export const LAYOUT_CONFIG = {
  versionSpacing: 180, // バージョン間の横の間隔（ノード幅120px + 60pxのマージン）
  packageSpacing: 230, // パッケージ間の縦の間隔（マイナーバージョンブランチ用に拡大）
  offsetX: 150, // 左端からのオフセット
  offsetY: 100, // 上端からのオフセット
  nodeMinWidth: 120, // ノードの最小幅
  nodeMinHeight: 60, // ノードの最小高さ
  timelineHeight: 60, // タイムライン軸の高さ
};
