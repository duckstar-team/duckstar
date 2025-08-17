import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from "./LoginPage";
import KakaoRedirectPage from "./KakaoRedirectPage.js";

const App = () => {
    return (
        <div className='App'>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LoginPage />}></Route>
                    <Route path="/oauth/redirected/kakao" element={<KakaoRedirectPage />}></Route>
                </Routes>
            </BrowserRouter>
        </div>
    );
};

export default App;