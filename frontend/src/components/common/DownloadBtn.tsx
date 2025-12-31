'use client';

import React from 'react';
import html2canvas from 'html2canvas-pro';
import { Download } from 'lucide-react';

export default function DownloadBtn() {
  // 이미지 저장 함수
  const saveImg = (uri: string, filename: string) => {
    const link = document.createElement('a');
    document.body.appendChild(link);
    link.href = uri;
    link.download = filename;
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = async () => {
    try {
      // 렌더링 대기
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 전체 뷰포트를 캡처하기 위해 body 요소 사용
      const canvas = await html2canvas(
        document.getElementById('capture-area') as HTMLElement,
        {
          useCORS: true,
          allowTaint: true,
          logging: false,
        }
      );

      const imageUrl = canvas.toDataURL('image/png');
      const filename = `award_result_${new Date().getTime()}.png`;
      saveImg(imageUrl, filename);
    } catch (error) {
      console.error('이미지 다운로드 실패:', error);
      alert('이미지 다운로드에 실패했습니다.');
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="rounded-full p-2 transition hover:bg-gray-200"
      aria-label="이미지 다운로드"
      title="이미지 다운로드"
    >
      <Download size={22} />
    </button>
  );
}
