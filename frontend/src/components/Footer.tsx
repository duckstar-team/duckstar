import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  const supportLinks = [
    { href: "/help", label: "도움말" },
    { href: "/contact", label: "문의하기" },
    { href: "/terms", label: "이용약관" },
    { href: "/privacy-policy", label: "개인정보처리방침" },
  ];

  const bottomLinks = [
    { href: "/about", label: "덕스타 소개" },
    { href: "/terms", label: "이용약관" },
    { href: "/privacy-policy", label: "개인정보처리방침" },
    { href: "/cookies", label: "쿠키 정책" },
  ];

  return (
    <footer className="w-full bg-gray-900 text-white">
      {/* 메인 푸터 컨텐츠 */}
      <div className="max-w-[1240px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 로고 및 소개 */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="w-32 h-10 bg-rose-800 rounded flex items-center justify-center mr-4">
                <div className="text-white font-bold text-lg">DUCKSTAR</div>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Duckstar는 애니메이션 팬들을 위한 최고의 투표 및 차트 플랫폼입니다. 
              매주 새로운 애니메이션을 발견하고, 투표에 참여하여 인기 애니메이션을 선정해보세요.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                </svg>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                </svg>
              </Link>
            </div>
          </div>

          {/* 서비스 링크 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">서비스</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/vote" className="text-gray-300 hover:text-white transition-colors text-sm">
                  애니메이션 투표
                </Link>
              </li>
              <li>
                <Link href="/chart" className="text-gray-300 hover:text-white transition-colors text-sm">
                  주간 차트
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-gray-300 hover:text-white transition-colors text-sm">
                  애니/캐릭터 찾기
                </Link>
              </li>
              <li>
                <Link href="/mypage" className="text-gray-300 hover:text-white transition-colors text-sm">
                  마이페이지
                </Link>
              </li>
            </ul>
          </div>

          {/* 지원 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">지원</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-gray-300 hover:text-white transition-colors text-sm">
                  도움말
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors text-sm">
                  문의하기
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-white transition-colors text-sm">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors text-sm">
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 하단 구분선 */}
      <div className="border-t border-gray-800">
        <div className="max-w-[1240px] mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 Duckstar. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/about" className="text-gray-400 hover:text-white transition-colors text-sm">
                덕스타 소개
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                이용약관
              </Link>
              <Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors text-sm">
                개인정보처리방침
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors text-sm">
                쿠키 정책
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
