'use client';

import React from 'react';

interface NavigationLoadingIndicatorProps {
  isNavigating: boolean;
  className?: string;
}

export default function NavigationLoadingIndicator({ 
  isNavigating, 
  className = '' 
}: NavigationLoadingIndicatorProps) {
  if (!isNavigating) return null;

  return (
    <div className={`fixed top-0 left-0 w-full h-1 bg-gray-200 z-50 ${className}`}>
      <div className="h-full bg-blue-500 animate-pulse" />
      <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" 
           style={{
             width: '100%',
             animation: 'loading-bar 1.5s ease-in-out infinite'
           }} />
      
      <style jsx>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
