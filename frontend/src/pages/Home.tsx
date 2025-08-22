import { startKakaoLogin } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Home() {
	const { isAuthenticated, user, logout, withdraw } = useAuth();

	const handleLogout = async () => {
		try {
			await logout();
			alert('로그아웃 완료');
		} catch (e) {
			alert('로그아웃 실패');
		}
	};

	const handleWithdraw = async () => {
		if (!confirm('정말로 회원탈퇴 하시겠습니까?')) return;
		try {
			await withdraw();
			alert('회원탈퇴 완료');
		} catch (e) {
			alert('회원탈퇴 실패');
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
			<div className="max-w-4xl mx-auto p-6">
				{/* 헤더 */}
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold text-gray-800 mb-4">덕스타</h1>
					<p className="text-lg text-gray-600">애니메이션 커뮤니티에 오신 것을 환영합니다</p>
				</div>

				{/* 메인 컨텐츠 */}
				<div className="bg-white rounded-2xl shadow-xl p-8">
					{!isAuthenticated ? (
						<div className="text-center space-y-6">
							<div className="mb-8">
								<div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
									<svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
									</svg>
								</div>
								<h2 className="text-2xl font-semibold text-gray-800 mb-2">로그인이 필요합니다</h2>
								<p className="text-gray-600">덕스타의 모든 기능을 이용하려면 로그인해주세요</p>
							</div>
							
							<button 
								onClick={startKakaoLogin}
								className="w-full max-w-md bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
							>
								<div className="flex items-center justify-center space-x-3">
									<svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
										<path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3zm5.907 7.908c-.325 0-.59.265-.59.59 0 .325.265.59.59.59.325 0 .59-.265.59-.59 0-.325-.265-.59-.59-.59zm-11.814 0c-.325 0-.59.265-.59.59 0 .325.265.59.59.59.325 0 .59-.265.59-.59 0-.325-.265-.59-.59-.59z"/>
									</svg>
									<span>카카오로 로그인</span>
								</div>
							</button>
						</div>
					) : (
						<div className="space-y-6">
							{/* 사용자 정보 카드 */}
							<div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
								<div className="flex items-center space-x-4">
									{user?.profileImageUrl ? (
										<img 
											src={user.profileImageUrl} 
											alt="프로필" 
											className="w-16 h-16 rounded-full border-2 border-white"
										/>
									) : (
										<div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
											<svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
											</svg>
										</div>
									)}
									<div>
										<h2 className="text-xl font-semibold">{user?.nickname || '사용자'}</h2>
										<p className="text-blue-100">ID: {user?.id}</p>
										<p className="text-blue-100">권한: {user?.role}</p>
									</div>
								</div>
							</div>

							{/* 액션 버튼들 */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<button 
									onClick={handleLogout}
									className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
								>
									로그아웃
								</button>
								<button 
									onClick={handleWithdraw}
									className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
								>
									회원탈퇴
								</button>
							</div>

							{/* 상태 표시 */}
							<div className="bg-green-50 border border-green-200 rounded-xl p-4">
								<div className="flex items-center space-x-2">
									<div className="w-3 h-3 bg-green-500 rounded-full"></div>
									<span className="text-green-800 font-medium">로그인됨</span>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* 푸터 */}
				<div className="text-center mt-8 text-gray-500">
					<p>&copy; 2024 덕스타. All rights reserved.</p>
				</div>
			</div>
		</div>
	);
}
