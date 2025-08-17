import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "読み込み中..." 
}) => {
  return (
    <div className="loading-container">
      <div className="loading-spinner" />
      <h2>{message}</h2>
    </div>
  );
};

export default LoadingSpinner;