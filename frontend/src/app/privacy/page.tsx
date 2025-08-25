export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">개인정보처리방침</h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. 수집하는 개인정보</h2>
              <p className="leading-relaxed mb-3">
                덕스타는 서비스 제공을 위해 다음과 같은 정보를 수집합니다:
              </p>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li><strong>쿠키 ID</strong>: 투표 중복 방지를 위한 식별자</li>
                <li><strong>투표 데이터</strong>: 성별 정보</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. 개인정보 수집 목적</h2>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>투표 중복 방지 및 투표 무결성 보장</li>
                <li>투표 결과 통계 및 분석</li>
                <li>서비스 개선 및 사용자 경험 향상</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. 개인정보 보관 기간</h2>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li><strong>쿠키</strong>: 브라우저 세션 종료 시까지 (또는 사용자가 직접 삭제할 때까지)</li>
                <li><strong>투표 데이터</strong>: 투표 주차 종료 후 1년간 보관 후 자동 삭제</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. 개인정보 공유</h2>
              <p className="leading-relaxed">
                수집된 개인정보는 서비스 제공 목적으로만 사용되며, 제3자와 공유하지 않습니다. 
                단, 법령에 따라 요구되는 경우에는 예외적으로 제공될 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. 개인정보 보호</h2>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>개인정보는 암호화하여 안전하게 저장됩니다.</li>
                <li>접근 권한이 있는 직원만 개인정보에 접근할 수 있습니다.</li>
                <li>정기적인 보안 점검을 통해 개인정보 보호를 강화합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. 사용자 권리</h2>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>쿠키 사용을 거부할 권리가 있습니다. (단, 투표 기능 사용이 제한됩니다)</li>
                <li>개인정보 삭제를 요청할 수 있습니다.</li>
                <li>개인정보 처리에 대한 문의사항이 있으시면 연락해 주세요.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. 개인정보처리방침 변경</h2>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>본 방침은 서비스 시작일부터 적용됩니다.</li>
                <li>방침 변경 시 사전 공지 후 적용됩니다.</li>
                <li>중요한 변경사항이 있는 경우 별도로 안내드립니다.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
