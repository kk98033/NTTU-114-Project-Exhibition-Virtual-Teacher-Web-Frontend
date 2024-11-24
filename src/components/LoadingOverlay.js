// src/components/LoadingOverlay.js
import React from "react";
import "./LoadingOverlay.css"; // 自定義樣式檔案

const LoadingOverlay = ({ show }) => {
  return (
    show && (
      <div className="loading-overlay">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="loading-text">Processing...</p>
      </div>
    )
  );
};

export default LoadingOverlay;
