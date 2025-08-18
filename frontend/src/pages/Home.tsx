import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { startKakaoLogin, logout, withdraw, getUserInfo } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Home() {
	const navigate = useNavigate();
	const { isAuthenticated, user, accessToken, logout: authLogout, updateUser } = useAuth();

	// 로그인된 상태에서 사용자 정보가 없으면 가져오기
	useEffect(() => {
		if (isAuthenticated && accessToken && !user) {
			getUserInfo()
				.then(userData => {
					updateUser(userData);
				})
				.catch(error => {
					console.error('Failed to get user info:', error);
					// 사용자 정보 가져오기 실패 시에도 로그인 상태 유지
					// (토큰이 있으므로 로그인된 상태로 간주)
					console.log('Keeping user logged in despite user info fetch failure');
				});
		}
	}, [isAuthenticated, accessToken, user, updateUser]);

	const handleLogout = async () => {
		try {
			await logout();
			authLogout();
			alert('로그아웃 완료');
		} catch (e) {
			alert('로그아웃 실패');
		}
	};

	const handleWithdraw = async () => {
		if (!confirm('정말로 회원탈퇴 하시겠습니까?')) return;
		try {
			await withdraw();
			// 회원탈퇴 성공 후 즉시 로그아웃 처리
			authLogout();
			alert('회원탈퇴 완료');
			// 홈으로 리다이렉트 (로그인 페이지로 이동)
			navigate('/', { replace: true });
		} catch (e) {
			alert('회원탈퇴 실패');
		}
	};

	return (
		<div className="max-w-2xl mx-auto p-6 space-y-6">
			<h1 className="text-2xl font-bold">홈</h1>

			{!isAuthenticated ? (
				<div className="space-y-4">
					<button className="btn btn-primary" onClick={() => startKakaoLogin()}>
						카카오로 로그인
					</button>
					<p className="text-sm text-gray-600">로그인이 필요합니다.</p>
				</div>
			) : (
				<div className="space-y-4">
					<div className="bg-gray-50 p-4 rounded-lg">
						<h2 className="font-semibold mb-2">사용자 정보</h2>
						{user ? (
							<div className="text-sm space-y-1">
								<p>ID: {user.id}</p>
								{user.nickname && <p>닉네임: {user.nickname}</p>}
								{user.email && <p>이메일: {user.email}</p>}
								{user.profileImageUrl && (
									<img 
										src={user.profileImageUrl} 
										alt="프로필" 
										className="w-16 h-16 rounded-full mt-2"
									/>
								)}
							</div>
						) : (
							<p className="text-sm text-gray-500">사용자 정보를 불러오는 중...</p>
						)}
					</div>
					
					<div className="space-x-2">
						<button className="btn btn-secondary" onClick={handleLogout}>
							로그아웃
						</button>
						<button className="btn btn-danger" onClick={handleWithdraw}>
							회원탈퇴
						</button>
					</div>
				</div>
			)}

			<div className="text-sm text-gray-600">
				현재 상태: {isAuthenticated ? '로그인됨' : '로그아웃됨'}
			</div>
		</div>
	);
}
