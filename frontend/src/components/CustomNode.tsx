import React from 'react';
import { Handle, Position } from 'reactflow';

interface CustomNodeData {
  label: string;
  package: string;
  version: string;
  changeType: string;
  description: string;
  summaryJa: string;
  releaseDate: string;
}

interface CustomNodeProps {
  data: CustomNodeData;
  style?: React.CSSProperties;
}

const CustomNode: React.FC<CustomNodeProps> = ({ data, style }) => {
  return (
    <div style={style}>
      {/* 上側のハンドル（入力） */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{
          background: '#555',
          width: '8px',
          height: '8px',
          border: '2px solid #fff'
        }}
      />

      {/* 左側のハンドル（入力） */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          background: '#555',
          width: '8px',
          height: '8px',
          border: '2px solid #fff'
        }}
      />

      {/* ノードの内容 */}
      <div>
        {data.label}
      </div>

      {/* 右側のハンドル（出力） */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          background: '#555',
          width: '8px',
          height: '8px',
          border: '2px solid #fff'
        }}
      />

      {/* 下側のハンドル（出力） */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          background: '#555',
          width: '8px',
          height: '8px',
          border: '2px solid #fff'
        }}
      />
    </div>
  );
};

export default CustomNode;
