interface PrivacySectionProps {
  title: string;
  children: React.ReactNode;
}

const PrivacySection: React.FC<PrivacySectionProps> = ({ title, children }) => (
  <section>
    <h2 className="mb-3 text-xl font-semibold">{title}</h2>
    {children}
  </section>
);

const PrivacyList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="list-inside list-disc space-y-2 leading-relaxed">
    {items.map((item, index) => (
      <li key={index} className="text-gray-700 dark:text-zinc-400">
        {item}
      </li>
    ))}
  </ul>
);

export default function PrivacyPage() {
  const collectedInfo = [
    '쿠키 ID: 투표 중복 방지를 위한 식별자',
    'IP 주소 해시: 중복 투표 방지를 위한 암호화된 식별자',
    '개인 투표 데이터: 성별 정보',
  ];

  const collectionPurposes = [
    '투표 중복 방지 및 투표 무결성 보장',
    '투표 결과 통계 및 분석',
    '서비스 개선 및 사용자 경험 향상',
  ];

  const retentionPeriods = [
    'IP 주소 해시: 투표 주차 종료 후 1년간 보관 후 자동 삭제',
    '개인 투표 데이터: 투표 주차 종료 후 1년간 보관 후 자동 삭제',
  ];

  const protectionMeasures = [
    '개인정보는 암호화하여 안전하게 저장됩니다.',
    'IP 주소는 해시화하여 개인 식별이 불가능한 형태로 저장됩니다.',
  ];

  const userRights = [
    '쿠키 사용을 거부할 권리가 있습니다. (단, 투표 기능 사용이 제한됩니다)',
    '개인정보 삭제를 요청할 수 있습니다.',
    '개인정보 처리에 대한 문의사항이 있으시면 연락해 주세요.',
  ];

  const policyChanges = [
    '본 방침은 서비스 시작일부터 적용됩니다.',
    '방침 변경 시 사전 공지 후 적용됩니다.',
    '중요한 변경사항이 있는 경우 별도로 안내드립니다.',
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="rounded-lg bg-white p-8 shadow-sm dark:bg-zinc-800">
          <h1 className="mb-8 text-3xl font-bold">개인정보처리방침</h1>

          <div className="space-y-6">
            <PrivacySection title="1. 수집하는 개인정보">
              <p className="mb-3 leading-relaxed">
                덕스타는 서비스 제공을 위해 다음과 같은 정보를 수집합니다:
              </p>
              <PrivacyList items={collectedInfo} />
            </PrivacySection>

            <PrivacySection title="2. 개인정보 수집 목적">
              <PrivacyList items={collectionPurposes} />
            </PrivacySection>

            <PrivacySection title="3. 개인정보 보관 기간">
              <PrivacyList items={retentionPeriods} />
            </PrivacySection>

            <PrivacySection title="4. 개인정보 공유">
              <p className="leading-relaxed">
                수집된 개인정보는 서비스 제공 목적으로만 사용되며, 제3자와
                공유하지 않습니다. 단, 법령에 따라 요구되는 경우에는 예외적으로
                제공될 수 있습니다.
              </p>
            </PrivacySection>

            <PrivacySection title="5. 개인정보 보호">
              <PrivacyList items={protectionMeasures} />
            </PrivacySection>

            <PrivacySection title="6. 사용자 권리">
              <PrivacyList items={userRights} />
            </PrivacySection>

            <PrivacySection title="7. 개인정보처리방침 변경">
              <PrivacyList items={policyChanges} />
            </PrivacySection>
          </div>
        </div>
      </div>
    </div>
  );
}
