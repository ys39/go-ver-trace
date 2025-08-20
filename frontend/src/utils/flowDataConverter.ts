import {
  VisualizationData,
  FlowNode,
  FlowEdge,
  PackageVersionChange,
} from "../types";
import { MarkerType } from "reactflow";
import { LAYOUT_CONFIG } from "./layoutConstants";

interface Position {
  x: number;
  y: number;
}

export const convertToFlowData = (data: VisualizationData) => {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  // バージョンを時系列順にソート
  const sortedReleases = [...data.releases].sort(
    (a, b) =>
      new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
  );

  // メジャーバージョンとマイナーバージョンを分類
  const { majorVersions, minorVersionGroups } =
    classifyVersions(sortedReleases);

  // パッケージをリリース日順にソート（最初に登場したリリース日を基準）
  const sortedPackages = [...data.packages].sort((a, b) => {
    const aEvolution = data.package_evolution[a];
    const bEvolution = data.package_evolution[b];
    
    if (!aEvolution || aEvolution.length === 0) return 1;
    if (!bEvolution || bEvolution.length === 0) return -1;
    
    // 各パッケージの最初のリリース日を取得
    const aFirstRelease = Math.min(...aEvolution.map(change => new Date(change.release_date).getTime()));
    const bFirstRelease = Math.min(...bEvolution.map(change => new Date(change.release_date).getTime()));
    
    return aFirstRelease - bFirstRelease;
  });

  // 共通レイアウト設定を使用
  const layout = LAYOUT_CONFIG;

  // 各パッケージでマイナーバージョンの数を計算して適切な間隔を決定
  const packageMinorCounts = calculatePackageMinorCounts(
    data,
    sortedPackages,
    minorVersionGroups
  );
  const minorCountValues = sortedPackages.map(
    (pkg) => packageMinorCounts[pkg] || 0
  );
  const maxMinorVersions = Math.max(...minorCountValues);

  // パッケージ間隔を動的に調整（マイナーバージョンの数に応じて）
  const adjustedPackageSpacing = layout.packageSpacing + maxMinorVersions * 30; // マイナーバージョン毎に30px追加

  // 各パッケージのノードとエッジを生成
  sortedPackages.forEach((packageName, packageIndex) => {
    const packageEvolution = data.package_evolution[packageName];
    if (!packageEvolution || packageEvolution.length === 0) return;

    // バージョン順にソート
    const sortedEvolution = [...packageEvolution].sort(
      (a, b) =>
        new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
    );

    // 調整されたレイアウト設定を使用
    const adjustedLayout = {
      ...layout,
      packageSpacing: adjustedPackageSpacing,
    };

    // メジャーバージョンとマイナーバージョンのノードを分けて生成
    const { majorNodes, minorNodesMap } = createVersionNodes(
      packageName,
      packageIndex,
      sortedEvolution,
      sortedReleases,
      majorVersions,
      adjustedLayout
    );

    // ノードを追加
    nodes.push(...majorNodes);
    Object.keys(minorNodesMap).forEach((majorVersion) => {
      const minorNodes = minorNodesMap[majorVersion];
      nodes.push(...minorNodes);
    });

    // エッジを生成
    const packageEdges = createVersionEdges(
      packageName,
      majorNodes,
      minorNodesMap,
      majorVersions,
      minorVersionGroups
    );

    edges.push(...packageEdges);
  });

  return { nodes, edges };
};

export const getNodeStyle = (changeType: string): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    padding: "10px",
    borderRadius: "8px",
    border: "2px solid",
    fontSize: "12px",
    fontWeight: "500",
    textAlign: "center",
    minWidth: `${LAYOUT_CONFIG.nodeMinWidth}px`,
    minHeight: `${LAYOUT_CONFIG.nodeMinHeight}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    transition: "all 0.2s ease",
  };

  switch (changeType) {
    case "Added":
      return {
        ...baseStyle,
        backgroundColor: "#dcfce7",
        borderColor: "#16a34a",
        color: "#166534",
      };
    case "Modified":
      return {
        ...baseStyle,
        backgroundColor: "#fef3c7",
        borderColor: "#d97706",
        color: "#92400e",
      };
    case "Deprecated":
      return {
        ...baseStyle,
        backgroundColor: "#fed7d7",
        borderColor: "#e53e3e",
        color: "#c53030",
      };
    case "Removed":
      return {
        ...baseStyle,
        backgroundColor: "#f3f4f6",
        borderColor: "#6b7280",
        color: "#374151",
        textDecoration: "line-through",
      };
    case "Base":
      return {
        ...baseStyle,
        backgroundColor: "#e0e7ff",
        borderColor: "#3730a3",
        color: "#312e81",
        opacity: 0.8,
      };
    case "Security Fix":
      return {
        ...baseStyle,
        backgroundColor: "#fef2f2",
        borderColor: "#dc2626",
        color: "#991b1b",
      };
    case "Bug Fix":
      return {
        ...baseStyle,
        backgroundColor: "#f0f9ff",
        borderColor: "#0ea5e9",
        color: "#0c4a6e",
      };
    case "Test Fix":
      return {
        ...baseStyle,
        backgroundColor: "#f7fee7",
        borderColor: "#65a30d",
        color: "#365314",
      };
    default:
      return {
        ...baseStyle,
        backgroundColor: "#f8fafc",
        borderColor: "#e2e8f0",
        color: "#475569",
      };
  }
};

export const getEdgeStyle = (changeType: string): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    strokeWidth: 2,
  };

  switch (changeType) {
    case "Added":
      return {
        ...baseStyle,
        stroke: "#16a34a",
      };
    case "Modified":
      return {
        ...baseStyle,
        stroke: "#d97706",
      };
    case "Deprecated":
      return {
        ...baseStyle,
        stroke: "#e53e3e",
        strokeDasharray: "5,5",
      };
    case "Removed":
      return {
        ...baseStyle,
        stroke: "#6b7280",
        strokeDasharray: "10,5",
      };
    case "Base":
      return {
        ...baseStyle,
        stroke: "#3730a3",
        strokeWidth: 1,
      };
    case "Security Fix":
      return {
        ...baseStyle,
        stroke: "#dc2626",
        strokeWidth: 3,
      };
    case "Bug Fix":
      return {
        ...baseStyle,
        stroke: "#0ea5e9",
      };
    case "Test Fix":
      return {
        ...baseStyle,
        stroke: "#65a30d",
      };
    default:
      return {
        ...baseStyle,
        stroke: "#94a3b8",
      };
  }
};

export const getChangeTypeColor = (changeType: string): string => {
  switch (changeType) {
    case "Added":
      return "#16a34a";
    case "Modified":
      return "#d97706";
    case "Deprecated":
      return "#e53e3e";
    case "Removed":
      return "#6b7280";
    case "Base":
      return "#3730a3";
    case "Security Fix":
      return "#dc2626";
    case "Bug Fix":
      return "#0ea5e9";
    case "Test Fix":
      return "#65a30d";
    default:
      return "#94a3b8";
  }
};

export const filterNodesByChangeType = (
  nodes: FlowNode[],
  selectedChangeTypes: string[]
): FlowNode[] => {
  if (selectedChangeTypes.length === 0) return nodes;
  return nodes.filter(
    (node) => selectedChangeTypes.indexOf(node.data.changeType) !== -1
  );
};

export const filterEdgesByNodes = (
  edges: FlowEdge[],
  visibleNodes: FlowNode[]
): FlowEdge[] => {
  const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
  return edges.filter((edge) => {
    const source = edge.source;
    const target = edge.target;
    return visibleNodeIds.has(source) && visibleNodeIds.has(target);
  });
};

export const filterByPackage = (
  nodes: FlowNode[],
  selectedPackages: string[]
): FlowNode[] => {
  if (selectedPackages.length === 0) return nodes;
  return nodes.filter(
    (node) => selectedPackages.indexOf(node.data.package) !== -1
  );
};

export const getUniquePackages = (nodes: FlowNode[]): string[] => {
  const packages = new Set(nodes.map((node) => node.data.package));
  return Array.from(packages).sort();
};

export const getUniqueChangeTypes = (nodes: FlowNode[]): string[] => {
  const changeTypes = new Set(nodes.map((node) => node.data.changeType));
  return Array.from(changeTypes).sort();
};

// パッケージ毎のマイナーバージョン数を計算
function calculatePackageMinorCounts(
  data: VisualizationData,
  sortedPackages: string[],
  minorVersionGroups: { [major: string]: any[] }
): { [packageName: string]: number } {
  const packageMinorCounts: { [packageName: string]: number } = {};

  sortedPackages.forEach((packageName) => {
    const packageEvolution = data.package_evolution[packageName];
    if (!packageEvolution) {
      packageMinorCounts[packageName] = 0;
      return;
    }

    let minorCount = 0;
    packageEvolution.forEach((change) => {
      const versionParts = change.version.split(".");
      if (versionParts.length === 3) {
        // マイナーバージョン
        minorCount++;
      }
    });

    packageMinorCounts[packageName] = minorCount;
  });

  return packageMinorCounts;
}

// バージョンをメジャーとマイナーに分類
function classifyVersions(releases: any[]) {
  const majorVersions: any[] = [];
  const minorVersionGroups: { [major: string]: any[] } = {};

  releases.forEach((release) => {
    const versionParts = release.version.split(".");
    if (versionParts.length === 2) {
      // メジャーバージョン (例: 1.23)
      majorVersions.push(release);
    } else if (versionParts.length === 3) {
      // マイナーバージョン (例: 1.23.1)
      const majorVersion = `${versionParts[0]}.${versionParts[1]}`;
      if (!minorVersionGroups[majorVersion]) {
        minorVersionGroups[majorVersion] = [];
      }
      minorVersionGroups[majorVersion].push(release);
    }
  });

  return { majorVersions, minorVersionGroups };
}

// バージョンノードを作成
function createVersionNodes(
  packageName: string,
  packageIndex: number,
  sortedEvolution: PackageVersionChange[],
  sortedReleases: any[],
  majorVersions: any[],
  layout: any
) {
  const majorNodes: FlowNode[] = [];
  const minorNodesMap: { [major: string]: FlowNode[] } = {};

  // 全リリースを時系列順にソートして、各リリースに順序インデックスを付与
  const releaseToIndex = new Map<string, number>();
  sortedReleases.forEach((release, index) => {
    releaseToIndex.set(release.version, index);
  });

  // マイナーバージョンのレイアウト設定
  const branchOffsetY = 0; // メジャーバージョンからのブランチ開始オフセット

  sortedEvolution.forEach((change: PackageVersionChange) => {
    const versionParts = change.version.split(".");
    const isMajor = versionParts.length === 2;

    // 時系列順序に基づくX座標を取得
    const timelineIndex = releaseToIndex.get(change.version);
    if (timelineIndex === undefined) return;

    const baseX = layout.offsetX + timelineIndex * layout.versionSpacing;

    if (isMajor) {
      // メジャーバージョンノード
      const position: Position = {
        x: baseX,
        y: layout.offsetY + packageIndex * layout.packageSpacing,
      };

      const nodeId = `${packageName}-${change.version}`;
      const node: FlowNode = {
        id: nodeId,
        type: "custom",
        position,
        data: {
          label: `${packageName}\nv${change.version}`,
          package: packageName,
          version: change.version,
          changeType: change.change_type,
          description: change.description,
          summaryJa: change.summary_ja,
          releaseDate: change.release_date,
        },
        style: getNodeStyle(change.change_type),
      };

      majorNodes.push(node);
    } else {
      // マイナーバージョンノード
      const majorVersion = `${versionParts[0]}.${versionParts[1]}`;
      
      if (!minorNodesMap[majorVersion]) {
        minorNodesMap[majorVersion] = [];
      }

      // マイナーバージョンは時系列順に配置（Y軸で分岐）
      const majorVersionIndex = majorVersions.findIndex(
        (r) => r.version === majorVersion
      );
      
      let majorVersionBranchOffset = majorVersionIndex * 60; // メジャーバージョン毎に60px下にオフセット
      // v1.24.xのみ高さを少し上げる
      if (majorVersion === "1.24") {
        majorVersionBranchOffset -= 160; // v1.24.xを160px上に移動
      }

      const position: Position = {
        x: baseX, // 時系列順序に基づくX座標
        y:
          layout.offsetY +
          packageIndex * layout.packageSpacing +
          branchOffsetY +
          majorVersionBranchOffset,
      };

      const nodeId = `${packageName}-${change.version}`;
      const node: FlowNode = {
        id: nodeId,
        type: "custom",
        position,
        data: {
          label: `${packageName}\nv${change.version}`,
          package: packageName,
          version: change.version,
          changeType: change.change_type,
          description: change.description,
          summaryJa: change.summary_ja,
          releaseDate: change.release_date,
        },
        style: getNodeStyle(change.change_type),
      };

      minorNodesMap[majorVersion].push(node);
    }
  });

  return { majorNodes, minorNodesMap };
}

// バージョンエッジを作成
function createVersionEdges(
  _packageName: string,
  majorNodes: FlowNode[],
  minorNodesMap: { [major: string]: FlowNode[] },
  _majorVersions: any[],
  _minorVersionGroups: { [major: string]: any[] }
): FlowEdge[] {
  const edges: FlowEdge[] = [];

  // 1. メジャーバージョン間の直線接続（時系列順）
  const sortedMajorNodes = [...majorNodes].sort((a, b) => {
    const aDate = new Date(a.data.releaseDate).getTime();
    const bDate = new Date(b.data.releaseDate).getTime();
    return aDate - bDate;
  });

  for (let i = 1; i < sortedMajorNodes.length; i++) {
    const sourceNode = sortedMajorNodes[i - 1];
    const targetNode = sortedMajorNodes[i];

    const edge: FlowEdge = {
      id: `major-${sourceNode.id}-to-${targetNode.id}`,
      source: sourceNode.id,
      target: targetNode.id,
      sourceHandle: "right",
      targetHandle: "left",
      type: "straight",
      animated: targetNode.data.changeType === "Added",
      style: getEdgeStyle(targetNode.data.changeType),
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: getChangeTypeColor(targetNode.data.changeType),
      },
    };

    edges.push(edge);
  }

  // 2. マイナーリビジョンの分岐接続
  Object.keys(minorNodesMap).forEach((majorVersion) => {
    const minorNodes = minorNodesMap[majorVersion];
    const majorNode = majorNodes.find(
      (node) => node.data.version === majorVersion
    );

    if (majorNode && minorNodes.length > 0) {
      // マイナーバージョンを時系列順にソート
      const sortedMinorNodes = [...minorNodes].sort((a, b) => {
        const aDate = new Date(a.data.releaseDate).getTime();
        const bDate = new Date(b.data.releaseDate).getTime();
        return aDate - bDate;
      });

      // メジャーバージョンから最初のマイナーバージョンへの分岐エッジ
      const firstMinorNode = sortedMinorNodes[0];
      const branchEdge: FlowEdge = {
        id: `branch-${majorNode.id}-to-${firstMinorNode.id}`,
        source: majorNode.id,
        target: firstMinorNode.id,
        sourceHandle: "bottom",
        targetHandle: "top",
        type: "default",
        animated: false,
        style: {
          ...getEdgeStyle(firstMinorNode.data.changeType),
          strokeDasharray: "5,5",
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: getChangeTypeColor(firstMinorNode.data.changeType),
        },
      };
      edges.push(branchEdge);

      // マイナーバージョン間の直線的なエッジ（時系列順）
      for (let i = 1; i < sortedMinorNodes.length; i++) {
        const sourceNode = sortedMinorNodes[i - 1];
        const targetNode = sortedMinorNodes[i];

        const edge: FlowEdge = {
          id: `minor-${sourceNode.id}-to-${targetNode.id}`,
          source: sourceNode.id,
          target: targetNode.id,
          sourceHandle: "right",
          targetHandle: "left",
          type: "straight",
          animated: targetNode.data.changeType === "Security Fix",
          style: {
            ...getEdgeStyle(targetNode.data.changeType),
            strokeDasharray: "3,3",
            strokeWidth: 1.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: getChangeTypeColor(targetNode.data.changeType),
          },
        };

        edges.push(edge);
      }
    }
  });

  return edges;
}
