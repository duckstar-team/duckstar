'use client';

import { useEffect } from 'react';

interface TermsSectionProps {
  title: string;
  children: React.ReactNode;
}

const TermsSection: React.FC<TermsSectionProps> = ({ title, children }) => (
  <section>
    <h2 className="text-xl font-semibold text-gray-900 mb-3">{title}</h2>
    {children}
  </section>
);

const TermsList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="list-disc list-inside space-y-2 leading-relaxed">
    {items.map((item, index) => (
      <li key={index} className="text-gray-700">{item}</li>
    ))}
  </ul>
);

export default function TermsPage() {
  // 페이지 진입 시 스크롤을 맨 위로 고정
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const votingRules = [
    "한 후보당 한 번만 투표할 수 있습니다.",
    "중복 투표 방지를 위해 쿠키와 IP 주소 해시를 사용합니다.",
    "IP 주소는 개인 식별이 불가능한 해시 형태로 저장됩니다.",
    "월요일 오후 6시부터 새로운 주차의 시작이며, 모든 후보는 방영 이후 36시간 이내에 투표할 수 있습니다.",
    "마지막 후보의 투표가 마감되면, 결과 검증 후 순위가 공개됩니다. (약 1시간)",
    "부정한 방법으로 투표를 시도하는 경우 투표가 무효화될 수 있습니다.",
  ];

  const serviceUsage = [
    "서비스 이용은 무료입니다.",
    "서비스 이용을 통해 타인에게 피해를 주는 행위를 금지합니다.",
  ];

  const serviceChanges = [
    "정기 점검 등으로 인한 일시적 서비스 중단이 있을 수 있습니다.",
  ];

  const otherTerms = [
    "본 약관은 서비스 시작일부터 적용됩니다.",
    "약관 변경 시 사전 공지 후 적용됩니다.",
    "본 약관에 대한 문의사항이 있으시면 연락해 주세요.",
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">이용약관</h1>
          
          <div className="space-y-6 text-gray-700">
            <TermsSection title="1. 서비스 개요">
              <p className="leading-relaxed">
                덕스타는 애니메이션 투표 서비스를 제공합니다. 사용자는 주간 애니메이션 투표에 참여할 수 있습니다.
              </p>
            </TermsSection>

            <TermsSection title="2. 투표 규칙">
              <TermsList items={votingRules} />
            </TermsSection>

            <TermsSection title="3. 서비스 이용">
              <TermsList items={serviceUsage} />
            </TermsSection>

            <TermsSection title="4. 서비스 변경 및 중단">
              <TermsList items={serviceChanges} />
            </TermsSection>

            <TermsSection title="5. 기타">
              <TermsList items={otherTerms} />
            </TermsSection>
          </div>
        </div>
      </div>
    </div>
  );
}
