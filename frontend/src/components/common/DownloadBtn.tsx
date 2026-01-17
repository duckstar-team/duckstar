'use client';

import React from 'react';
import html2canvas from 'html2canvas-pro';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';

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

  // 이미지를 프록시를 통해 로드 (외부 이미지만)
  const convertImagesToProxy = async (element: HTMLElement) => {
    const images = element.querySelectorAll('img');
    const promises = Array.from(images).map(async (img) => {
      const src = img.getAttribute('src');
      if (!src) return;

      // 이미 프록시 URL이거나 data URL이면 스킵
      if (src.startsWith('data:') || src.startsWith('/api/image-proxy')) {
        return;
      }

      // 같은 도메인 이미지(상대 경로, 같은 origin)는 프록시 불필요
      const isSameOrigin =
        src.startsWith('/') ||
        src.startsWith('./') ||
        src.startsWith('../') ||
        src.includes(window.location.hostname);

      if (isSameOrigin) {
        // 같은 도메인이지만 crossOrigin 설정으로 로드 확인
        await new Promise((resolve) => {
          const tempImg = new Image();
          tempImg.crossOrigin = 'anonymous';
          tempImg.onload = () => resolve(undefined);
          tempImg.onerror = () => resolve(undefined); // 실패해도 계속 진행
          tempImg.src = src;
        });
        return;
      }

      // 외부 이미지만 프록시를 통해 로드
      try {
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(src)}`;
        img.src = proxyUrl;
        // 이미지 로드 대기
        await new Promise((resolve, reject) => {
          const tempImg = new Image();
          tempImg.crossOrigin = 'anonymous';
          tempImg.onload = () => resolve(undefined);
          tempImg.onerror = () => reject(new Error('Failed to load image'));
          tempImg.src = proxyUrl;
        });
      } catch (error) {
        console.warn('이미지 프록시 로드 실패:', src, error);
      }
    });
    await Promise.all(promises);
  };

  const handleDownload = async () => {
    // Top 10 리스트가 있는지 확인
    const topTenElement = document.getElementById('top-ten-list-download');

    if (!topTenElement) {
      throw new Error('다운로드할 요소를 찾을 수 없습니다.');
    }

    // Top 10 리스트 다운로드
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 이미지를 프록시를 통해 로드
    await convertImagesToProxy(topTenElement);

    const canvas = await html2canvas(topTenElement);
    const imageUrl = canvas.toDataURL('image/png');
    const filename = `duckstar_top10_${new Date().getTime()}.png`;
    saveImg(imageUrl, filename);
  };

  const handleClick = () => {
    toast.promise(handleDownload(), {
      loading: '이미지 다운로드 중입니다...',
      success: '이미지 다운로드가 완료되었습니다.',
      error: '이미지 다운로드에 실패했습니다.',
    });
  };

  return (
    <button
      onClick={handleClick}
      className="rounded-full p-2 transition hover:bg-gray-200 dark:hover:bg-zinc-800"
      aria-label="이미지 다운로드"
      title="이미지 다운로드"
    >
      <Download size={22} />
    </button>
  );
}
