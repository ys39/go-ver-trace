import React from 'react';
import VisualizationFlow from './components/VisualizationFlow';
import { useHealthCheck } from './hooks/useApi';

const App: React.FC = () => {
  const { status, details } = useHealthCheck();

  // API接続確認
  if (status === 'checking') {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <h2>API接続を確認中...</h2>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="error-container">
        <h2>API サーバーに接続できません</h2>
        <p>Goバックエンドサーバーが起動しているか確認してください。</p>
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          background: '#fee2e2', 
          borderRadius: '8px',
          fontSize: '14px',
          color: '#dc2626'
        }}>
          <strong>エラー詳細:</strong><br />
          {details?.error || 'API接続に失敗しました'}
        </div>
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          background: '#f0f9ff', 
          borderRadius: '8px',
          fontSize: '14px',
          color: '#0369a1'
        }}>
          <strong>解決方法:</strong><br />
          1. Goサーバーを起動: <code>./bin/go-ver-trace -port 8080</code><br />
          2. ページを再読み込みしてください
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <VisualizationFlow />
    </div>
  );
};

export default App;