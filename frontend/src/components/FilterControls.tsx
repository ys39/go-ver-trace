import React, { useState } from 'react';

interface FilterControlsProps {
  packages: string[];
  changeTypes: string[];
  selectedPackages: string[];
  selectedChangeTypes: string[];
  onPackageChange: (packages: string[]) => void;
  onChangeTypeChange: (changeTypes: string[]) => void;
  totalNodes: number;
  filteredNodes: number;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  packages,
  changeTypes,
  selectedPackages,
  selectedChangeTypes,
  onPackageChange,
  onChangeTypeChange,
  totalNodes,
  filteredNodes,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [packageSearch, setPackageSearch] = useState('');

  // 変更種別の日本語ラベル
  const changeTypeLabels: Record<string, string> = {
    'Added': '追加',
    'Modified': '変更',
    'Deprecated': '非推奨',
    'Removed': '削除',
  };

  // パッケージ検索フィルター
  const filteredPackages = packages.filter(pkg =>
    pkg.toLowerCase().includes(packageSearch.toLowerCase())
  );

  const handleChangeTypeToggle = (changeType: string) => {
    if (selectedChangeTypes.includes(changeType)) {
      onChangeTypeChange(selectedChangeTypes.filter(ct => ct !== changeType));
    } else {
      onChangeTypeChange([...selectedChangeTypes, changeType]);
    }
  };

  const handlePackageToggle = (packageName: string) => {
    if (selectedPackages.includes(packageName)) {
      onPackageChange(selectedPackages.filter(pkg => pkg !== packageName));
    } else {
      onPackageChange([...selectedPackages, packageName]);
    }
  };

  const handleSelectAllChangeTypes = () => {
    if (selectedChangeTypes.length === changeTypes.length) {
      onChangeTypeChange([]);
    } else {
      onChangeTypeChange(changeTypes);
    }
  };

  const handleSelectAllPackages = () => {
    if (selectedPackages.length === filteredPackages.length) {
      onPackageChange([]);
    } else {
      onPackageChange(filteredPackages);
    }
  };

  const clearAllFilters = () => {
    onChangeTypeChange([]);
    onPackageChange([]);
    setPackageSearch('');
  };

  return (
    <div className="filter-controls">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
          フィルター
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={clearAllFilters}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            クリア
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {isCollapsed ? '展開' : '折りたたみ'}
          </button>
        </div>
      </div>

      <div style={{
        fontSize: '12px',
        color: '#6b7280',
        marginBottom: '12px',
        padding: '8px',
        background: '#f8fafc',
        borderRadius: '4px',
      }}>
        表示中: {filteredNodes} / {totalNodes} パッケージ
      </div>

      {!isCollapsed && (
        <>
          {/* 変更種別フィルター */}
          <div className="filter-group">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <label className="filter-label">変更種別</label>
              <button
                onClick={handleSelectAllChangeTypes}
                style={{
                  padding: '2px 6px',
                  fontSize: '11px',
                  background: selectedChangeTypes.length === changeTypes.length ? '#dc2626' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                {selectedChangeTypes.length === changeTypes.length ? '全解除' : '全選択'}
              </button>
            </div>
            <div className="filter-checkboxes">
              {changeTypes.map(changeType => (
                <div key={changeType} className="filter-checkbox">
                  <input
                    type="checkbox"
                    id={`changetype-${changeType}`}
                    checked={selectedChangeTypes.includes(changeType)}
                    onChange={() => handleChangeTypeToggle(changeType)}
                  />
                  <label htmlFor={`changetype-${changeType}`}>
                    {changeTypeLabels[changeType] || changeType}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* パッケージフィルター */}
          <div className="filter-group">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <label className="filter-label">パッケージ</label>
              <button
                onClick={handleSelectAllPackages}
                style={{
                  padding: '2px 6px',
                  fontSize: '11px',
                  background: selectedPackages.length === filteredPackages.length ? '#dc2626' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                {selectedPackages.length === filteredPackages.length ? '全解除' : '全選択'}
              </button>
            </div>
            
            <input
              type="text"
              placeholder="パッケージ名で検索..."
              value={packageSearch}
              onChange={(e) => setPackageSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                marginBottom: '8px',
              }}
            />
            
            <div 
              className="filter-checkboxes" 
              style={{ 
                maxHeight: '200px', 
                overflowY: 'auto',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                padding: '4px',
              }}
            >
              {filteredPackages.length === 0 ? (
                <div style={{ 
                  padding: '8px', 
                  color: '#6b7280', 
                  fontSize: '11px',
                  textAlign: 'center'
                }}>
                  該当するパッケージがありません
                </div>
              ) : (
                filteredPackages.map(packageName => (
                  <div key={packageName} className="filter-checkbox">
                    <input
                      type="checkbox"
                      id={`package-${packageName}`}
                      checked={selectedPackages.includes(packageName)}
                      onChange={() => handlePackageToggle(packageName)}
                    />
                    <label 
                      htmlFor={`package-${packageName}`}
                      style={{ fontSize: '11px' }}
                    >
                      {packageName}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FilterControls;