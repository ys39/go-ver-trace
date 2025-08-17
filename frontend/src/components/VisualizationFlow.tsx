import React, { useMemo, useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  Panel,
  NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useVisualizationData } from '../hooks/useApi';
import {
  convertToFlowData,
  filterNodesByChangeType,
  filterEdgesByNodes,
  filterByPackage,
  getUniquePackages,
  getUniqueChangeTypes,
} from '../utils/flowDataConverter';
import { FlowNode } from '../types';
import { LAYOUT_CONFIG } from '../utils/layoutConstants';
import FilterControls from './FilterControls';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';
import PackageDetails from './PackageDetails';
import TimelineAxis from './TimelineAxis';

const VisualizationFlow: React.FC = () => {
  const { data, loading, error, refetch } = useVisualizationData();
  
  // フィルター状態
  const [selectedChangeTypes, setSelectedChangeTypes] = useState<string[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  
  // 選択されたノードの詳細表示状態
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);

  // React Flowのデータを変換
  const { initialNodes, initialEdges, allPackages, allChangeTypes } = useMemo(() => {
    if (!data) {
      return {
        initialNodes: [],
        initialEdges: [],
        allPackages: [],
        allChangeTypes: [],
      };
    }

    const { nodes, edges } = convertToFlowData(data);
    
    return {
      initialNodes: nodes,
      initialEdges: edges,
      allPackages: getUniquePackages(nodes),
      allChangeTypes: getUniqueChangeTypes(nodes),
    };
  }, [data]);

  // フィルター適用
  const { filteredNodes, filteredEdges } = useMemo(() => {
    let nodes = initialNodes;
    
    // 変更種別でフィルター
    if (selectedChangeTypes.length > 0) {
      nodes = filterNodesByChangeType(nodes, selectedChangeTypes);
    }
    
    // パッケージでフィルター
    if (selectedPackages.length > 0) {
      nodes = filterByPackage(nodes, selectedPackages);
    }
    
    // エッジも表示されているノードに合わせてフィルター
    const edges = filterEdgesByNodes(initialEdges, nodes);
    
    return {
      filteredNodes: nodes,
      filteredEdges: edges,
    };
  }, [initialNodes, initialEdges, selectedChangeTypes, selectedPackages]);

  // React Flowの状態
  const [nodes, setNodes, onNodesChange] = useNodesState(filteredNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(filteredEdges);

  // フィルター適用時にノードとエッジを更新
  React.useEffect(() => {
    setNodes(filteredNodes);
    setEdges(filteredEdges);
  }, [filteredNodes, filteredEdges, setNodes, setEdges]);

  // エッジ接続（無効にする）
  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // ノードクリック時の処理
  const onNodeClick: NodeMouseHandler = useCallback((event: React.MouseEvent, node: Node) => {
    event.stopPropagation();
    setSelectedNode(node as FlowNode);
  }, []);
  
  // 背景クリック時の処理（詳細パネルを閉じる）
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // ミニマップのノード色設定
  const nodeColor = (node: Node) => {
    const flowNode = node as FlowNode;
    switch (flowNode.data.changeType) {
      case 'Added':
        return '#16a34a';
      case 'Modified':
        return '#d97706';
      case 'Deprecated':
        return '#e53e3e';
      case 'Removed':
        return '#6b7280';
      default:
        return '#94a3b8';
    }
  };

  if (loading) {
    return <LoadingSpinner message="可視化データを読み込み中..." />;
  }

  if (error) {
    return (
      <ErrorDisplay 
        message={error} 
        onRetry={refetch}
      />
    );
  }

  if (!data || initialNodes.length === 0) {
    return (
      <div className="loading-container">
        <h2>データがありません</h2>
        <p>Go言語の標準ライブラリデータを取得してください。</p>
        <button onClick={refetch} className="retry-button">
          データを再取得
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* タイムライン軸 */}
      {data && data.releases && (
        <TimelineAxis versions={data.releases} />
      )}
      
      <div style={{ 
        width: '100%', 
        height: '100%', 
        paddingTop: `${LAYOUT_CONFIG.timelineHeight}px` 
      }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          connectionMode={ConnectionMode.Loose}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          fitView
          attributionPosition="bottom-left"
          style={{ height: `calc(100% - ${LAYOUT_CONFIG.timelineHeight}px)` }}
        >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap 
          nodeColor={nodeColor}
          maskColor="rgb(240, 240, 240, 0.6)"
          pannable
          zoomable
          position="top-right"
        />
        
        <Panel position="top-left">
          <FilterControls
            packages={allPackages}
            changeTypes={allChangeTypes}
            selectedPackages={selectedPackages}
            selectedChangeTypes={selectedChangeTypes}
            onPackageChange={setSelectedPackages}
            onChangeTypeChange={setSelectedChangeTypes}
            totalNodes={initialNodes.length}
            filteredNodes={filteredNodes.length}
          />
        </Panel>
        
        <Panel position="bottom-right">
          <div style={{ 
            background: 'white', 
            padding: '10px', 
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            <div>表示中: {nodes.length} / {initialNodes.length} ノード</div>
            <div>エッジ: {edges.length} / {initialEdges.length}</div>
          </div>
        </Panel>
        </ReactFlow>
      </div>
      
      {/* パッケージ詳細表示 */}
      <PackageDetails
        selectedNode={selectedNode}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
};

export default VisualizationFlow;