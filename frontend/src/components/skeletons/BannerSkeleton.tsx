import React from 'react';

export default function BannerSkeleton() {
  return (
    <div
      className={`h-24 w-full animate-pulse bg-gradient-to-r from-gray-200 to-gray-300`}
    />
  );
}
