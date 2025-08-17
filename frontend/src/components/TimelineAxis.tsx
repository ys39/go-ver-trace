import React from 'react';
import { LAYOUT_CONFIG } from '../utils/layoutConstants';

interface TimelineAxisProps {
  versions: Array<{
    version: string;
    release_date: string;
  }>;
}

const TimelineAxis: React.FC<TimelineAxisProps> = ({ versions }) => {
  // バージョンを日付順にソート
  const sortedVersions = [...versions].sort((a, b) => 
    new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
  );

  // 共通レイアウト設定を使用
  const layout = LAYOUT_CONFIG;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: `${LAYOUT_CONFIG.timelineHeight}px`,
      background: 'rgba(255, 255, 255, 0.95)',
      borderBottom: '2px solid #e5e7eb',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
      }}>
        {sortedVersions.map((version, index) => {
          // ノードと同じx座標計算
          const xPosition = layout.offsetX + index * layout.versionSpacing;
          
          return (
            <div
              key={version.version}
              style={{
                position: 'absolute',
                left: `${xPosition}px`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: `${LAYOUT_CONFIG.nodeMinWidth}px`,
                transform: 'translateX(-50%)', // 中央揃え
              }}
            >
              {/* バージョン番号 */}
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '4px',
                fontFamily: 'monospace',
              }}>
                Go {version.version}
              </div>
              
              {/* リリース日 */}
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                fontWeight: '500',
              }}>
                {new Date(version.release_date).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
              
              {/* バージョンドット */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#3b82f6',
                border: '3px solid white',
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                zIndex: 10,
              }} />
            </div>
          );
        })}
        
        {/* 接続線（全体） */}
        {sortedVersions.length > 1 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: `${layout.offsetX}px`,
            width: `${(sortedVersions.length - 1) * layout.versionSpacing}px`,
            height: '2px',
            background: 'linear-gradient(to right, #3b82f6, #60a5fa)',
            transform: 'translateY(-50%)',
            zIndex: 0,
          }} />
        )}
      </div>
    </div>
  );
};

export default TimelineAxis;