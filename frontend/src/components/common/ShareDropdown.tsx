'use client';

import { Link } from 'lucide-react';
import { SiKakaotalk } from 'react-icons/si';
import React, { useEffect } from 'react';
import { FaFacebook, FaInstagram, FaLine } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { showToast } from './Toast';

declare global {
  interface Window {
    Kakao: any;
  }
}

export default function ShareDropdown() {
  useEffect(() => {
    // 카카오 SDK 초기화 (스크립트가 로드된 경우)
    if (
      typeof window !== 'undefined' &&
      window.Kakao &&
      !window.Kakao.isInitialized()
    ) {
      const kakaoAppKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
      if (kakaoAppKey) {
        window.Kakao.init(kakaoAppKey);
      }
    }
  }, []);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle =
    typeof document !== 'undefined' ? document.title : '덕스타';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast.success('링크가 클립보드에 복사되었습니다.');
    } catch (err) {
      console.error('URL 복사 실패:', err);
      alert('링크 복사에 실패했습니다.');
    }
  };

  const handleKakaoShare = () => {
    if (
      typeof window !== 'undefined' &&
      window.Kakao &&
      window.Kakao.isInitialized()
    ) {
      // Kakao SDK를 사용한 공유
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: shareTitle,
          description: '덕스타에서 확인해보세요!',
          imageUrl:
            typeof window !== 'undefined'
              ? `${window.location.origin}/og-logo.jpg`
              : '',
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
      });
    } else {
      // Kakao SDK가 없는 경우 URL 스킴 시도 (모바일)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = `kakaotalk://sharing?url=${encodeURIComponent(shareUrl)}`;
      } else {
        // 데스크톱에서는 카카오톡 공유 링크로 안내
        alert(
          '카카오톡 공유는 모바일에서만 가능합니다. 링크를 복사하여 공유해주세요.'
        );
        handleCopyLink();
      }
    }
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    const width = 600;
    const height = 400;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    window.open(
      facebookUrl,
      '_blank',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  const handleInstagramShare = () => {
    // 인스타그램은 직접 공유가 불가능하므로 링크 복사 안내
    alert(
      '인스타그램은 직접 공유가 불가능합니다. 링크를 복사하여 인스타그램에 붙여넣어주세요.'
    );
    handleCopyLink();
  };

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
    <div className="flex min-w-44 flex-col gap-4 overflow-hidden rounded-lg bg-white p-4 text-sm shadow-lg">
      <button
        onClick={handleCopyLink}
        aria-label="링크 복사"
        className="flex items-center gap-2 hover:text-black"
      >
        <Link size={16} />
        링크 복사
      </button>
      <button
        onClick={handleKakaoShare}
        aria-label="카카오톡 공유"
        className="flex items-center gap-2 hover:text-black"
      >
        <SiKakaotalk size={16} />
        카카오톡 공유
      </button>
      <button
        onClick={handleFacebookShare}
        aria-label="페이스북 공유"
        className="flex items-center gap-2 hover:text-black"
      >
        <FaFacebook size={16} />
        페이스북 공유
      </button>
      <button
        onClick={handleInstagramShare}
        aria-label="인스타그램 공유"
        className="flex items-center gap-2 hover:text-black"
      >
        <FaInstagram size={16} />
        인스타그램 공유
      </button>
      <button
        onClick={handleTwitterShare}
        aria-label="트위터 공유"
        className="flex items-center gap-2 hover:text-black"
      >
        <FaXTwitter size={16} />
        트위터 공유
      </button>
      <button
        onClick={handleLineShare}
        aria-label="라인 공유"
        className="flex items-center gap-2 hover:text-black"
      >
        <FaLine size={16} />
        라인 공유
      </button>
    </div>
  );
}
