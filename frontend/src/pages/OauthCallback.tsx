import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OauthCallback() {
	const navigate = useNavigate();
	const { setAuthenticated } = useAuth();

	useEffect(() => {
		// URL에서 access token 추출
		const urlParams = new URLSearchParams(window.location.search);
		const accessToken = urlParams.get('accessToken');
		
		console.log('OAuth Callback - URL params:', Object.fromEntries(urlParams.entries()));
		console.log('OAuth Callback - Access token:', accessToken);
		
		if (accessToken) {
			console.log('OAuth Callback - Setting authenticated with token');
			// access token을 AuthContext에 저장
			setAuthenticated(true, accessToken);
			
			// 성공 메시지 후 홈으로 이동
			setTimeout(() => navigate('/'), 1500);
		} else {
			// 토큰이 없으면 홈으로 이동
			console.error('Access token not found in URL');
			navigate('/');
		}
	}, [navigate, setAuthenticated]);

	return (
		<div className="max-w-xl mx-auto p-6 text-center space-y-4">
			<h1 className="text-2xl font-bold">로그인 성공</h1>
			<p>잠시 후 홈으로 이동합니다.</p>
			<p>
				<Link className="btn btn-secondary" to="/">바로 홈으로</Link>
			</p>
		</div>
	);
}
