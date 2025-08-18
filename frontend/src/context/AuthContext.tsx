import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface User {
	id: number;
	email?: string;
	nickname?: string;
	profileImageUrl?: string;
}

interface AuthContextValue {
	isAuthenticated: boolean;
	user: User | null;
	accessToken: string | null;
	setAuthenticated: (value: boolean, token?: string, userData?: User) => void;
	logout: () => void;
	updateAccessToken: (token: string) => void;
	updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
	const [accessToken, setAccessToken] = useState<string | null>(null);
	const [user, setUser] = useState<User | null>(null);

	const setAuthenticated = useCallback((value: boolean, token?: string, userData?: User) => {
		console.log('AuthContext - setAuthenticated called:', { value, hasToken: !!token, hasUserData: !!userData });
		
		setIsAuthenticated(value);
		if (token) {
			setAccessToken(token);
			localStorage.setItem('accessToken', token);
			console.log('AuthContext - Token saved to localStorage');
		}
		if (userData) {
			setUser(userData);
			localStorage.setItem('user', JSON.stringify(userData));
			console.log('AuthContext - User data saved to localStorage');
		}
		if (!value) {
			setAccessToken(null);
			setUser(null);
			localStorage.removeItem('accessToken');
			localStorage.removeItem('user');
			console.log('AuthContext - Logged out, cleared localStorage');
		}
	}, []);

	const updateAccessToken = useCallback((token: string) => {
		setAccessToken(token);
		localStorage.setItem('accessToken', token);
	}, []);

	const updateUser = useCallback((userData: User) => {
		setUser(userData);
		localStorage.setItem('user', JSON.stringify(userData));
	}, []);

	const logout = useCallback(() => {
		setAuthenticated(false);
	}, [setAuthenticated]);

	// 초기 로드 시 저장된 토큰과 사용자 정보 복원
	useEffect(() => {
		const savedToken = localStorage.getItem('accessToken');
		const savedUser = localStorage.getItem('user');
		
		console.log('AuthContext - Initial load - savedToken:', savedToken ? 'exists' : 'null');
		console.log('AuthContext - Initial load - savedUser:', savedUser ? 'exists' : 'null');
		
		if (savedToken) {
			console.log('AuthContext - Restoring authentication state');
			// access token이 있으면 로그인 상태로 복원
			setIsAuthenticated(true);
			setAccessToken(savedToken);
			
			// 사용자 정보가 있으면 함께 복원
			if (savedUser) {
				try {
					const userData = JSON.parse(savedUser);
					setUser(userData);
					console.log('AuthContext - User data restored:', userData);
				} catch (error) {
					console.error('Failed to parse saved user data:', error);
					localStorage.removeItem('user');
				}
			}
		} else {
			console.log('AuthContext - No saved token found, staying logged out');
		}
	}, []);

	return (
		<AuthContext.Provider value={{ 
			isAuthenticated, 
			user, 
			accessToken, 
			setAuthenticated, 
			logout,
			updateAccessToken,
			updateUser
		}}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
}
