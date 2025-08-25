export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">덕스타 소개</h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">서비스 소개</h2>
              <p className="leading-relaxed">
                덕스타는 애니메이션 팬들을 위한 주간 투표 플랫폼입니다. 
                매주 새로운 애니메이션에 투표하고, 다른 팬들과 함께 인기 작품을 선정해보세요.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">주요 기능</h2>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li><strong>주간 투표</strong>: 매주 새로운 애니메이션 후보에 투표</li>
                <li><strong>투표 결과</strong>: 일요일 22시에 주간 투표 결과 공개</li>
                <li><strong>중복 방지</strong>: 한 주차당 한 번만 투표 가능</li>
                <li><strong>통계 제공</strong>: 성별별 투표 성향 분석</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">투표 방식</h2>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>일반 투표: 최대 10개 애니메이션 선택 가능</li>
                <li>보너스 투표: 추가로 원하는 만큼 선택 가능</li>
                <li>성별 정보: 투표 통계 분석을 위해 수집 (선택사항)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">베타 서비스</h2>
              <p className="leading-relaxed">
                현재 덕스타는 베타 버전으로 운영되고 있습니다. 
                투표 기능을 중심으로 서비스를 제공하며, 
                향후 더 많은 기능들이 추가될 예정입니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">문의 및 피드백</h2>
              <p className="leading-relaxed">
                서비스 이용 중 궁금한 점이나 개선사항이 있으시면 언제든 연락해 주세요. 
                여러분의 소중한 의견이 덕스타를 더 좋은 서비스로 만들어갑니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">버전 정보</h2>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>현재 버전: 베타 1.0</li>
                <li>최종 업데이트: 2025년 1월</li>
                <li>지원 브라우저: Chrome, Firefox, Safari, Edge</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
