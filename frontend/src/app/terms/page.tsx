export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">이용약관</h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. 서비스 개요</h2>
              <p className="leading-relaxed">
                덕스타는 애니메이션 투표 서비스를 제공합니다. 사용자는 주간 애니메이션 투표에 참여할 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. 투표 규칙</h2>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>한 주차당 한 번만 투표할 수 있습니다.</li>
                <li>중복 투표 방지를 위해 쿠키를 사용합니다.</li>
                <li>투표 결과는 일요일 22시에 공개됩니다.</li>
                <li>부정한 방법으로 투표를 시도하는 경우 투표가 무효화될 수 있습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. 서비스 이용</h2>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>서비스 이용은 무료입니다.</li>
                <li>서비스 이용 중 발생하는 모든 책임은 사용자에게 있습니다.</li>
                <li>서비스 이용을 통해 타인에게 피해를 주는 행위를 금지합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. 서비스 변경 및 중단</h2>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>서비스 내용은 사전 고지 없이 변경될 수 있습니다.</li>
                <li>서비스 중단이 필요한 경우 사전에 공지합니다.</li>
                <li>정기 점검 등으로 인한 일시적 서비스 중단이 있을 수 있습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. 기타</h2>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>본 약관은 서비스 시작일부터 적용됩니다.</li>
                <li>약관 변경 시 사전 공지 후 적용됩니다.</li>
                <li>본 약관에 대한 문의사항이 있으시면 연락해 주세요.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
