'use client';

import { useEffect } from 'react';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <section>
    <h2 className="text-xl font-semibold text-gray-900 mb-3">{title}</h2>
    {children}
  </section>
);

const FeatureList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="list-disc list-inside space-y-2 leading-relaxed">
    {items.map((item, index) => (
      <li key={index} className="text-gray-700">{item}</li>
    ))}
  </ul>
);

export default function AboutPage() {
  // 페이지 진입 시 스크롤을 맨 위로 고정
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const mainFeatures = [
    "주간 투표: 주차별 애니메이션 후보에 투표",
    "투표 결과: 월요일 저녁에 주간 투표 결과 공개",
    "차트 시스템: 주차별 애니메이션/캐릭터 순위 차트 제공",
    "애니메이션 홈: 애니메이션별 상세 정보, 분기별 성적, 등장인물",
    "커뮤니티: 애니메이션 댓글/답글, 좋아요 시스템",
    "검색 기능: 애니메이션 검색, 분기 별 편성 정보",
    "중복 방지: IP 해시 및 쿠키 기반 중복 투표 방지",
  ];

  const votingMethods = [
    "일반 투표: 최대 10개 애니메이션 선택 가능",
    "보너스 투표: 추가로 원하는 만큼 선택 가능",
    "성별 정보: 투표 통계 분석을 위해 수집",
    "재투표: 로그인 사용자는 언제든 재투표 가능",
    "비로그인 투표: 쿠키 기반으로 비로그인 사용자도 투표 가능",
  ];

  const versionInfo = [
    "현재 버전: 베타 1.0",
    "최종 업데이트: 2025년 10월",
    "지원 브라우저: Chrome, Firefox, Safari, Edge",
    "모바일 지원: 예정",
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">덕스타 소개</h1>
          
          <div className="space-y-6 text-gray-700">
            <Section title="서비스 소개">
              <p className="leading-relaxed">
                덕스타는 분기 신작 애니메이션 팬들을 위한 종합 플랫폼입니다. 
                주차별 투표, 차트 시스템, 애니메이션 정보, 커뮤니티 기능을 통해 
                애니메이션 팬들이 함께 소통하고 인기 작품을 선정할 수 있는 공간을 제공합니다.
              </p>
            </Section>

            <Section title="주요 기능">
              <FeatureList items={mainFeatures} />
            </Section>

            <Section title="투표 방식">
              <FeatureList items={votingMethods} />
            </Section>

            <Section title="베타 서비스">
              <p className="leading-relaxed">
                현재 덕스타는 베타 버전으로 운영되고 있습니다. 
                모든 핵심 기능이 구현되어 있으며, 
                사용자 피드백을 바탕으로 지속적으로 개선하고 있습니다.
              </p>
            </Section>

            <Section title="문의 및 피드백">
              <p className="leading-relaxed">
                문의 및 피드백은 이메일(bright_aid@naver.com)로 보내주세요. <br />
                서비스 이용 중 궁금한 점이나 개선사항이 있으시면 언제든 연락해 주세요.
                여러분의 소중한 의견이 덕스타를 더 좋은 서비스로 만들어갑니다.
              </p>
            </Section>

            <Section title="버전 정보">
              <FeatureList items={versionInfo} />
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
