"use client";

import React from "react";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Loading...", 
  className = "text-center py-4" 
}) => {
  return (
    <div className={className}>
      <div className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" role="status" aria-label="loading">
        <span className="sr-only">Loading...</span>
      </div>
      <p className="mt-2 text-sm text-gray-600">{message}</p>
    </div>
  );
};

export default LoadingState;