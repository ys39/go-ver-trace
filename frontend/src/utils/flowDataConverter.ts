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

  // パッケージをアルファベット順にソート
  const sortedPackages = [...data.packages].sort();

  // 共通レイアウト設定を使用
  const layout = LAYOUT_CONFIG;

  // 各パッケージのノードとエッジを生成
  sortedPackages.forEach((packageName, packageIndex) => {
    const packageEvolution = data.package_evolution[packageName];
    if (!packageEvolution || packageEvolution.length === 0) return;

    // バージョン順にソート
    const sortedEvolution = [...packageEvolution].sort(
      (a, b) =>
        new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
    );

    // パッケージごとに独立してpreviousNodeIdを管理
    let previousNodeId: string | null = null;

    sortedEvolution.forEach((change: PackageVersionChange, evolutionIndex) => {
      const versionIndex = sortedReleases.findIndex(
        (r) => r.version === change.version
      );
      if (versionIndex === -1) return;

      const position: Position = {
        x: layout.offsetX + versionIndex * layout.versionSpacing,
        y: layout.offsetY + packageIndex * layout.packageSpacing,
      };

      const nodeId = `${packageName}-${change.version}`;

      // ノードを作成
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

      nodes.push(node);

      // 前のバージョンからのエッジを作成（同じパッケージ内でのみ）
      if (previousNodeId && evolutionIndex > 0) {
        // previousNodeIdが確実に同じパッケージのものであることを確認
        const previousChange = sortedEvolution[evolutionIndex - 1];
        const expectedPreviousNodeId = `${packageName}-${previousChange.version}`;

        if (
          previousNodeId === expectedPreviousNodeId &&
          previousChange.version !== change.version
        ) {
          const edge: FlowEdge = {
            id: `${previousNodeId}-to-${nodeId}`,
            source: previousNodeId,
            target: nodeId,
            sourceHandle: "right",
            targetHandle: "left",
            type: "smoothstep",
            animated: change.change_type === "Added",
            style: getEdgeStyle(change.change_type),
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: getChangeTypeColor(change.change_type),
            },
          };

          edges.push(edge);
        }
      }

      previousNodeId = nodeId;
    });
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
