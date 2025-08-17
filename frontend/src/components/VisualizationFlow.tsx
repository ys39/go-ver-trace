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
import { FlowNode, FlowEdge } from '../types';
import FilterControls from './FilterControls';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';

const VisualizationFlow: React.FC = () => {
  const { data, loading, error, refetch } = useVisualizationData();
  
  // フィルター状態
  const [selectedChangeTypes, setSelectedChangeTypes] = useState<string[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);

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
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node);
    // ここでノードの詳細情報を表示する処理を追加可能
  }, []);

  // ミニマップのノード色設定
  const nodeColor = (node: FlowNode) => {
    switch (node.data.changeType) {
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
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        connectionMode={ConnectionMode.Loose}
        fitView
        attributionPosition="bottom-left"
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
  );
};

export default VisualizationFlow;