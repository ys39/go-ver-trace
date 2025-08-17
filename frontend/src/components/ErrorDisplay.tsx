import React from 'react';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <div className="error-container">
      <h2>エラーが発生しました</h2>
      <p>{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginTop: '16px',
          }}
        >
          再試行
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;