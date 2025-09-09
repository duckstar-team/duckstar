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
    "주간 투표: 매주 새로운 애니메이션 후보에 투표",
    "투표 결과: 일요일 22시에 주간 투표 결과 공개",
    "중복 방지: 한 주차당 한 번만 투표 가능",
    "통계 제공: 성별별 투표 성향 분석",
  ];

  const votingMethods = [
    "일반 투표: 최대 10개 애니메이션 선택 가능",
    "보너스 투표: 추가로 원하는 만큼 선택 가능",
    "성별 정보: 투표 통계 분석을 위해 수집",
  ];

  const versionInfo = [
    "현재 버전: 베타 1.0",
    "최종 업데이트: 2025년 1월",
    "지원 브라우저: Chrome, Firefox, Safari, Edge",
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">덕스타 소개</h1>
          
          <div className="space-y-6 text-gray-700">
            <Section title="서비스 소개">
              <p className="leading-relaxed">
                덕스타는 애니메이션 팬들을 위한 주간 투표 플랫폼입니다. 
                매주 새로운 애니메이션에 투표하고, 다른 팬들과 함께 인기 작품을 선정해보세요.
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
                투표 기능을 중심으로 서비스를 제공하며, 
                향후 더 많은 기능들이 추가될 예정입니다.
              </p>
            </Section>

            <Section title="문의 및 피드백">
              <p className="leading-relaxed">
                문의 및 피드백은 이메일(bae0821@gmail.com)로 보내주세요. <br />
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
