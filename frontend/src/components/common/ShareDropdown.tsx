'use client';

import { Link } from 'lucide-react';
import { SiKakaotalk } from 'react-icons/si';
import React, { useEffect } from 'react';
import { FaLine } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { showToast } from './Toast';

declare global {
  interface Window {
    Kakao: any;
  }
}

export default function ShareDropdown({
  thumbnailUrl,
}: {
  thumbnailUrl: string | null;
}) {
  const shareUrl = window.location.href;
  const shareTitle =
    typeof document !== 'undefined' ? document.title : '덕스타';
  const kakaoAppKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.7/kakao.min.js';
    script.async = true;
    script.onload = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(kakaoAppKey!);
      }
    };
    document.head.appendChild(script);
  }, [kakaoAppKey]);

  // 링크 복사 핸들러
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast.custom('링크가 클립보드에 복사되었습니다.');
    } catch (err) {
      console.error('URL 복사 실패:', err);
      showToast.error('링크 복사에 실패했습니다.');
    }
  };

  // 카카오톡 공유 핸들러
  const handleKakaoShare = async () => {
    if (!window.Kakao) {
      return;
    }

    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(kakaoAppKey!);
    }

    const response = await fetch(
      `/api/v1/images/og?url=${thumbnailUrl}&format=jpg`
    );
    const ogImageUrl = response.url;

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: shareTitle,
        description:
          '덕스타 어워드에서 최고의 애니메이션에 투표하고, 어워드 결과를 확인하세요.',
        imageUrl: ogImageUrl,
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
      buttons: [
        {
          title: '덕스타 바로가기',
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
      ],
    });
  };

  // 트위터 공유 핸들러
  const handleTwitterShare = () => {
    const text = encodeURIComponent(`${shareTitle} - 덕스타`);
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${text}`;
    const width = 600;
    const height = 400;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    window.open(
      twitterUrl,
      '_blank',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  // 라인 공유 핸들러
  const handleLineShare = () => {
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`;
    const width = 600;
    const height = 400;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    window.open(
      lineUrl,
      '_blank',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  return (
    <div className="flex min-w-44 flex-col gap-4 overflow-hidden rounded-lg bg-white p-4 text-sm shadow-lg dark:bg-zinc-800">
      <button
        onClick={handleCopyLink}
        aria-label="링크 복사"
        className="flex items-center gap-2 hover:text-black dark:hover:text-zinc-200"
      >
        <Link size={16} />
        링크 복사
      </button>
      <button
        onClick={handleKakaoShare}
        aria-label="카카오톡 공유"
        className="flex items-center gap-2 hover:text-black dark:hover:text-zinc-200"
      >
        <SiKakaotalk size={16} />
        카카오톡 공유
      </button>
      <button
        onClick={handleTwitterShare}
        aria-label="트위터 공유"
        className="flex items-center gap-2 hover:text-black dark:hover:text-zinc-200"
      >
        <FaXTwitter size={16} />
        트위터 공유
      </button>
      <button
        onClick={handleLineShare}
        aria-label="라인 공유"
        className="flex items-center gap-2 hover:text-black dark:hover:text-zinc-200"
      >
        <FaLine size={16} />
        라인 공유
      </button>
    </div>
  );
}
