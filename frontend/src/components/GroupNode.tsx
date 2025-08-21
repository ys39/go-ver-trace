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
  // メジャーバージョンに基づいて色を決定
  const getVersionColor = (majorVersion: string) => {
    const versionNum = parseFloat(majorVersion);
    const colors = {
      1.18: { bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.3)', text: '#dc2626', label: 'rgba(239, 68, 68, 0.15)' }, // 赤系
      1.19: { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.3)', text: '#d97706', label: 'rgba(245, 158, 11, 0.15)' }, // オレンジ系
      1.20: { bg: 'rgba(34, 197, 94, 0.08)', border: 'rgba(34, 197, 94, 0.3)', text: '#16a34a', label: 'rgba(34, 197, 94, 0.15)' }, // 緑系
      1.21: { bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.3)', text: '#2563eb', label: 'rgba(59, 130, 246, 0.15)' }, // 青系
      1.22: { bg: 'rgba(139, 92, 246, 0.08)', border: 'rgba(139, 92, 246, 0.3)', text: '#7c3aed', label: 'rgba(139, 92, 246, 0.15)' }, // 紫系
      1.23: { bg: 'rgba(236, 72, 153, 0.08)', border: 'rgba(236, 72, 153, 0.3)', text: '#db2777', label: 'rgba(236, 72, 153, 0.15)' }, // ピンク系
      1.24: { bg: 'rgba(14, 165, 233, 0.08)', border: 'rgba(14, 165, 233, 0.3)', text: '#0284c7', label: 'rgba(14, 165, 233, 0.15)' }, // 水色系
      1.25: { bg: 'rgba(168, 85, 247, 0.08)', border: 'rgba(168, 85, 247, 0.3)', text: '#9333ea', label: 'rgba(168, 85, 247, 0.15)' }, // 濃い紫系
    };
    
    return colors[versionNum as keyof typeof colors] || colors[1.18];
  };

  const colorScheme = getVersionColor(data.majorVersion);

  const defaultStyle: React.CSSProperties = {
    background: colorScheme.bg,
    border: `2px dashed ${colorScheme.border}`,
    borderRadius: '12px',
    padding: '16px',
    fontSize: '14px',
    fontWeight: '600',
    color: colorScheme.text,
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
        background: colorScheme.label,
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