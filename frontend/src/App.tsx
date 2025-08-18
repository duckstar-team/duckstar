import { Route, Routes, Link } from 'react-router-dom';
import Home from './pages/Home';
import OauthCallback from './pages/OauthCallback';
import { AuthProvider, useAuth } from './context/AuthContext';

function Header() {
	const { isAuthenticated, user } = useAuth();
	return (
		<header className="w-full border-b">
			<div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
				<Link to="/" className="font-bold">Duckstar</Link>
				<div className="text-sm">
					{isAuthenticated ? (
						<span>
							{user?.nickname || '사용자'}님 환영합니다
						</span>
					) : (
						<span>로그아웃됨</span>
					)}
				</div>
			</div>
		</header>
	);
}

export default function App() {
	return (
		<AuthProvider>
			<div className="min-h-full flex flex-col">
				<Header />
				<main className="flex-1">
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/oauth/callback" element={<OauthCallback />} />
					</Routes>
				</main>
			</div>
		</AuthProvider>
	);
}
