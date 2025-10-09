'use client';

import React from 'react';
import StarRatingDisplay from '@/components/StarRatingDisplay';

export default function StarMaskTestPage() {
  const testRatings = [
    { rating: 4.96, label: "4.96점 (5번째 별 96% 채워짐)" },
    { rating: 4.95, label: "4.95점 (5번째 별 95% 채워짐)" },
    { rating: 4.90, label: "4.90점 (5번째 별 90% 채워짐)" },
    { rating: 4.85, label: "4.85점 (5번째 별 85% 채워짐)" },
    { rating: 4.80, label: "4.80점 (5번째 별 80% 채워짐)" },
    { rating: 4.50, label: "4.50점 (5번째 별 50% 채워짐)" },
    { rating: 4.00, label: "4.00점 (5번째 별 0% 채워짐)" },
    { rating: 3.75, label: "3.75점 (4번째 별 75% 채워짐)" },
    { rating: 3.50, label: "3.50점 (4번째 별 50% 채워짐)" },
    { rating: 3.00, label: "3.00점 (4번째 별 0% 채워짐)" },
    { rating: 2.25, label: "2.25점 (3번째 별 25% 채워짐)" },
    { rating: 1.50, label: "1.50점 (2번째 별 50% 채워짐)" },
    { rating: 0.75, label: "0.75점 (1번째 별 75% 채워짐)" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">별점 마스킹 테스트</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testRatings.map((item, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">{item.label}</h3>
                
                <div className="flex justify-center items-center gap-4 mb-4">
                  <div className="text-sm text-gray-600">Small:</div>
                  <StarRatingDisplay 
                    rating={item.rating} 
                    size="sm" 
                    maxStars={5}
                  />
                </div>
                
                <div className="flex justify-center items-center gap-4 mb-4">
                  <div className="text-sm text-gray-600">Medium:</div>
                  <StarRatingDisplay 
                    rating={item.rating} 
                    size="md" 
                    maxStars={5}
                  />
                </div>
                
                <div className="flex justify-center items-center gap-4">
                  <div className="text-sm text-gray-600">Large:</div>
                  <StarRatingDisplay 
                    rating={item.rating} 
                    size="lg" 
                    maxStars={5}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-4">테스트 설명</h2>
          <ul className="space-y-2 text-sm">
            <li>• <strong>마스킹 방식</strong>: SVG mask를 사용한 정확한 별점 표시</li>
            <li>• <strong>소수점 처리</strong>: 각 별의 채워진 정도를 정확히 계산</li>
            <li>• <strong>예시</strong>: 4.96점 → 5번째 별이 96% 채워짐</li>
            <li>• <strong>크기</strong>: Small, Medium, Large 3가지 크기로 테스트</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
