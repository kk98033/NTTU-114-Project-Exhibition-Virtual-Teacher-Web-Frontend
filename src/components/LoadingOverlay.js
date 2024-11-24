import React from 'react';
import './LoadingOverlay.css';

const LoadingOverlay = ({ show }) => {
  if (!show) return null; // 如果不需要顯示，直接返回 null

  return (
    <div className="loading-overlay">
      <div className="voice-assistant-loader">
        <div className="circle"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
