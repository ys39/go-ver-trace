import React from 'react';
import { FlowNode } from '../types';

interface PackageDetailsProps {
  selectedNode: FlowNode | null;
  onClose: () => void;
}

const PackageDetails: React.FC<PackageDetailsProps> = ({ selectedNode, onClose }) => {
  if (!selectedNode) return null;

  const { data } = selectedNode;

  // リリースノートのURLを生成
  const getReleaseNotesUrl = (version: string): string => {
    return `https://go.dev/doc/go${version}`;
  };

  // マイナーリビジョンかどうかを判定
  const isMinorRevision = (version: string): boolean => {
    return version.split('.').length > 2;
  };

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
          {getChangeTypeDisplayName(data.changeType)}
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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{
            fontSize: '14px',
            color: '#1f2937',
          }}>
            {new Date(data.releaseDate).toLocaleDateString('ja-JP')}
          </div>
          <div style={{
            display: 'flex',
            gap: '8px',
          }}>
            {/* マイナーリビジョンの場合はソースURLを表示 */}
            {isMinorRevision(data.version) && data.sourceUrl && (
              <a
                href={data.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#b91c1c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }}
              >
                <span>Issue</span>
                <span style={{ fontSize: '10px' }}>↗</span>
              </a>
            )}
            <a
              href={getReleaseNotesUrl(data.version)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }}
            >
              <span>リリースノート</span>
              <span style={{ fontSize: '10px' }}>↗</span>
            </a>
          </div>
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

const getChangeTypeDisplayName = (changeType: string): string => {
  switch (changeType) {
    case 'Added':
      return '追加';
    case 'Modified':
      return '変更';
    case 'Deprecated':
      return '非推奨';
    case 'Removed':
      return '削除';
    case 'Bug Fix':
      return 'バグ修正';
    case 'Security Fix':
      return 'セキュリティ修正';
    case 'Test Fix':
      return 'テスト修正';
    case 'Compatibility':
      return '互換性改善';
    case 'Security Enhancement':
      return 'セキュリティ強化';
    default:
      return changeType;
  }
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
    case 'Bug Fix':
      return {
        backgroundColor: '#ddd6fe',
        color: '#5b21b6',
        border: '1px solid #c4b5fd',
      };
    case 'Security Fix':
      return {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        border: '1px solid #fecaca',
      };
    case 'Test Fix':
      return {
        backgroundColor: '#f0f9ff',
        color: '#0c4a6e',
        border: '1px solid #bae6fd',
      };
    case 'Compatibility':
      return {
        backgroundColor: '#f0fdf4',
        color: '#14532d',
        border: '1px solid #bbf7d0',
      };
    case 'Security Enhancement':
      return {
        backgroundColor: '#fef7ff',
        color: '#86198f',
        border: '1px solid #f5d0fe',
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
