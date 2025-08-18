import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { refreshToken } from './client';

// axios 인스턴스 생성
const api: AxiosInstance = axios.create({
	baseURL: 'http://localhost:8080',
	withCredentials: true, // 쿠키 자동 전송
	timeout: 10000,
});

// 요청 인터셉터: HttpOnly 쿠키는 자동으로 전송되므로 별도 헤더 설정 불필요
api.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		// HttpOnly 쿠키는 자동으로 전송되므로 별도 설정 불필요
		return config;
	},
	(error: AxiosError) => {
		return Promise.reject(error);
	}
);

// 응답 인터셉터: 401 에러 시 토큰 자동 갱신
let isRefreshing = false;
let failedQueue: Array<{
	resolve: (value?: any) => void;
	reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
	failedQueue.forEach(({ resolve, reject }) => {
		if (error) {
			reject(error);
		} else {
			resolve(token);
		}
	});
	
	failedQueue = [];
};

api.interceptors.response.use(
	(response: AxiosResponse) => {
		return response;
	},
	async (error: AxiosError) => {
		const originalRequest = error.config as any;
		
		if (error.response?.status === 401 && !originalRequest._retry) {
			if (isRefreshing) {
				// 이미 토큰 갱신 중이면 대기열에 추가
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				}).then(() => {
					return api(originalRequest);
				}).catch((err) => {
					return Promise.reject(err);
				});
			}
			
			originalRequest._retry = true;
			isRefreshing = true;
			
			try {
				// refresh token으로 새로운 access token 요청 (HttpOnly 쿠키 사용)
				const { accessToken } = await refreshToken();
				
				// 새로운 access token 저장 (응답 본문에서 받은 경우)
				if (accessToken) {
					localStorage.setItem('accessToken', accessToken);
				}
				
				// 대기열 처리
				processQueue(null, accessToken);
				
				// 원래 요청 재시도 (HttpOnly 쿠키가 자동으로 전송됨)
				return api(originalRequest);
			} catch (refreshError) {
				// refresh token도 만료된 경우
				processQueue(refreshError, null);
				
				// 로그인 상태 초기화
				localStorage.removeItem('accessToken');
				localStorage.removeItem('user');
				
				// 로그인 페이지로 리다이렉트
				window.location.href = '/';
				
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}
		
		return Promise.reject(error);
	}
);

export default api;
