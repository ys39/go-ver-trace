import React from 'react';
import { FlowNode } from '../types';

interface PackageDetailsProps {
  selectedNode: FlowNode | null;
  onClose: () => void;
}

const PackageDetails: React.FC<PackageDetailsProps> = ({ selectedNode, onClose }) => {
  if (!selectedNode) return null;

  const { data } = selectedNode;

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      background: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.25)',
      border: '1px solid #e5e7eb',
      minWidth: '300px',
      maxWidth: '400px',
      zIndex: 1000,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '600',
          color: '#1f2937',
        }}>
          パッケージ詳細
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '4px',
            borderRadius: '4px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '500',
          color: '#6b7280',
          marginBottom: '4px',
        }}>
          パッケージ名
        </label>
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#1f2937',
          fontFamily: 'monospace',
          background: '#f9fafb',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #e5e7eb',
        }}>
          {data.package}
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '500',
          color: '#6b7280',
          marginBottom: '4px',
        }}>
          バージョン
        </label>
        <div style={{
          fontSize: '14px',
          color: '#1f2937',
          fontFamily: 'monospace',
          background: '#f9fafb',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #e5e7eb',
        }}>
          {data.version}
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '500',
          color: '#6b7280',
          marginBottom: '4px',
        }}>
          変更種別
        </label>
        <span style={{
          display: 'inline-block',
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500',
          ...getChangeTypeBadgeStyle(data.changeType),
        }}>
          {data.changeType}
        </span>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '500',
          color: '#6b7280',
          marginBottom: '4px',
        }}>
          リリース日
        </label>
        <div style={{
          fontSize: '14px',
          color: '#1f2937',
        }}>
          {new Date(data.releaseDate).toLocaleDateString('ja-JP')}
        </div>
      </div>

      <div>
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '500',
          color: '#6b7280',
          marginBottom: '4px',
        }}>
          変更内容
        </label>
        <div style={{
          fontSize: '14px',
          color: '#1f2937',
          lineHeight: '1.5',
          background: '#f9fafb',
          padding: '12px',
          borderRadius: '6px',
          border: '1px solid #e5e7eb',
          maxHeight: '200px',
          overflowY: 'auto',
        }}>
          {data.description || '詳細な変更内容はありません。'}
        </div>
      </div>
    </div>
  );
};

const getChangeTypeBadgeStyle = (changeType: string): React.CSSProperties => {
  switch (changeType) {
    case 'Added':
      return {
        backgroundColor: '#dcfce7',
        color: '#166534',
        border: '1px solid #bbf7d0',
      };
    case 'Modified':
      return {
        backgroundColor: '#fef3c7',
        color: '#92400e',
        border: '1px solid #fde68a',
      };
    case 'Deprecated':
      return {
        backgroundColor: '#fed7d7',
        color: '#c53030',
        border: '1px solid #fecaca',
      };
    case 'Removed':
      return {
        backgroundColor: '#f3f4f6',
        color: '#374151',
        border: '1px solid #d1d5db',
      };
    default:
      return {
        backgroundColor: '#f8fafc',
        color: '#475569',
        border: '1px solid #e2e8f0',
      };
  }
};

export default PackageDetails;