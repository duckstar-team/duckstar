export const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export function startKakaoLogin() {
	// 전체 페이지 리디렉트로 OAuth 플로우 시작 (백엔드 스프링 시큐리티 기본 엔드포인트)
	window.location.href = `${BASE_URL}/oauth2/authorization/kakao`;
}

export async function refreshToken(): Promise<{ accessToken: string }> {
	const res = await fetch(`${BASE_URL}/api/v1/auth/token/refresh`, {
		method: 'POST',
		credentials: 'include',
	});
	if (!res.ok) throw new Error('토큰 재발급 실패');
	
	const data = await res.json();
	return { accessToken: data.accessToken };
}

export async function logout(): Promise<void> {
	const res = await fetch(`${BASE_URL}/api/v1/auth/logout`, {
		method: 'POST',
		credentials: 'include',
	});
	if (!res.ok) throw new Error('로그아웃 실패');
}

export async function withdraw(): Promise<void> {
	const res = await fetch(`${BASE_URL}/api/v1/auth/withdraw/kakao`, {
		method: 'POST',
		credentials: 'include',
	});
	if (!res.ok) throw new Error('회원탈퇴 실패');
}

// 사용자 정보 조회 (HttpOnly 쿠키로 토큰 전송)
export async function getUserInfo(): Promise<Record<string, unknown>> {
	console.log('getUserInfo - Request details:');
	console.log('- URL:', `${BASE_URL}/api/v1/auth/me`);
	console.log('- Method: GET');
	console.log('- Credentials: include');
	console.log('- Cookies:', document.cookie);
	
	const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
		method: 'GET',
		credentials: 'include',
	});
	
	console.log('getUserInfo - Response status:', res.status);
	console.log('getUserInfo - Response headers:', Object.fromEntries(res.headers.entries()));
	
	if (!res.ok) {
		console.error('getUserInfo - Error response:', res.status, res.statusText);
		throw new Error('사용자 정보 조회 실패');
	}
	
	const data = await res.json();
	console.log('getUserInfo - Success response:', data);
	return data;
}
