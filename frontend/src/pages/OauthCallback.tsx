import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserInfo } from '../api/client';

export default function OauthCallback() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { login } = useAuth();

	useEffect(() => {
		const accessToken = searchParams.get('accessToken');
		
		if (accessToken) {
			// 토큰이 있으면 사용자 정보를 가져와서 로그인 처리
			getUserInfo()
				.then((userData) => {
					login(userData);
					// 홈으로 리다이렉트
					navigate('/', { replace: true });
				})
				.catch((error) => {
					console.error('Failed to get user info:', error);
					// 에러 시에도 홈으로 리다이렉트
					navigate('/', { replace: true });
				});
		} else {
			// 토큰이 없으면 홈으로 리다이렉트
			navigate('/', { replace: true });
		}
	}, [searchParams, login, navigate]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
			<div className="bg-white rounded-2xl shadow-xl p-8 text-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
				<h2 className="text-xl font-semibold text-gray-800 mb-2">로그인 처리 중...</h2>
				<p className="text-gray-600">잠시만 기다려주세요</p>
			</div>
		</div>
	);
}
