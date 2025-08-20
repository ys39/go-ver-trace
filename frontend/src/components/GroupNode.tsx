import React from 'react';

interface GroupNodeData {
  label: string;
  majorVersion: string;
}

interface GroupNodeProps {
  data: GroupNodeData;
  style?: React.CSSProperties;
}

const GroupNode: React.FC<GroupNodeProps> = ({ data, style }) => {
  const defaultStyle: React.CSSProperties = {
    background: 'rgba(99, 102, 241, 0.05)', // 薄い青色の背景
    border: '2px dashed rgba(99, 102, 241, 0.3)', // 破線の境界
    borderRadius: '12px',
    padding: '16px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#4f46e5',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    zIndex: -1, // 他のノードの後ろに表示
    pointerEvents: 'none', // クリック無効
    ...style,
  };

  return (
    <div style={defaultStyle}>
      <div style={{ 
        position: 'absolute', 
        top: '8px', 
        left: '12px',
        background: 'rgba(99, 102, 241, 0.1)',
        padding: '4px 8px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '700'
      }}>
        {data.label}
      </div>
    </div>
  );
};

export default GroupNode;