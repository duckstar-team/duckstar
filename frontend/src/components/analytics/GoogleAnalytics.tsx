'use client';

import Script from 'next/script';
import { GA_MEASUREMENT_ID, isDevelopment } from '@/utils/gtag';

/**
 * Google Analytics 스크립트 컴포넌트
 * 개발 환경에서는 로드하지 않음
 */
export default function GoogleAnalytics() {
  // 개발 환경에서는 GA 스크립트를 로드하지 않음
  if (isDevelopment()) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}

