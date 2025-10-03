'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { createAnime } from '@/api/client';

interface OttData {
  ottType: 'LAFTEL' | 'NETFLIX' | 'WAVVE' | 'TVING' | 'WATCHA' | 'PRIME';
  watchUrl: string;
}

interface AnimeData {
  titleKor: string;
  titleOrigin?: string;
  titleEng?: string;
  medium: 'TVA' | 'MOVIE';
  airTime?: string;
  premiereDate?: string;
  premiereTime?: string;
  dayOfWeek?: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  totalEpisodes?: number;
  corp?: string;
  director?: string;
  genre?: string;
  author?: string;
  minAge?: number;
  officialSite?: {
    OTHERS?: string;
    X?: string;
    YOUTUBE?: string;
    INSTAGRAM?: string;
    TIKTOK?: string;
  };
  synopsis?: string;
  mainImage?: File;
  ottDtos?: OttData[];
}

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [animeData, setAnimeData] = useState<AnimeData>({
    titleKor: '',
    titleOrigin: '',
    titleEng: '',
    medium: 'TVA',
    airTime: '',
    premiereDate: '',
    premiereTime: '',
    dayOfWeek: undefined,
    totalEpisodes: undefined,
    corp: '',
    director: '',
    genre: '',
    author: '',
    minAge: undefined,
    officialSite: {
      OTHERS: '',
      X: '',
      YOUTUBE: '',
      INSTAGRAM: '',
      TIKTOK: ''
    },
    synopsis: '',
    mainImage: undefined,
    ottDtos: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 권한 확인
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  const addOttData = () => {
    setAnimeData(prev => ({
      ...prev,
      ottDtos: [...(prev.ottDtos || []), { ottType: 'NETFLIX', watchUrl: '' }]
    }));
  };

  const removeOttData = (index: number) => {
    setAnimeData(prev => ({
      ...prev,
      ottDtos: prev.ottDtos?.filter((_, i) => i !== index) || []
    }));
  };

  const updateOttData = (index: number, field: keyof OttData, value: string) => {
    setAnimeData(prev => ({
      ...prev,
      ottDtos: prev.ottDtos?.map((ott, i) => 
        i === index ? { ...ott, [field]: value } : ott
      ) || []
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'file') {
      const fileInput = e.target as HTMLInputElement;
      const file = fileInput.files?.[0];
      setAnimeData(prev => ({
        ...prev,
        [name]: file
      }));
    } else if (type === 'number') {
      setAnimeData(prev => ({
        ...prev,
        [name]: value ? parseInt(value) : undefined
      }));
    } else if (name.startsWith('officialSite.')) {
      // officialSite 필드 처리
      const siteType = name.split('.')[1] as keyof typeof animeData.officialSite;
      setAnimeData(prev => ({
        ...prev,
        officialSite: {
          ...prev.officialSite,
          [siteType]: value
        }
      }));
    } else if (name === 'premiereDate' || name === 'premiereTime') {
      // premiereDate 또는 premiereTime 입력 시 자동으로 dayOfWeek 계산 및 airTime 업데이트 (극장판이 아닌 경우에만)
      setAnimeData(prev => {
        const newData = { ...prev, [name]: value };
        
        // 극장판이 아닌 경우에만 방영 시간과 요일 처리
        if (prev.medium !== 'MOVIE') {
          // premiereDate와 premiereTime이 모두 있으면 처리
          const date = name === 'premiereDate' ? value : prev.premiereDate;
          const time = name === 'premiereTime' ? value : prev.premiereTime;
          
          if (date && time) {
            const fullDateTime = new Date(`${date}T${time}`);
            const dayOfWeek = fullDateTime.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
            
            // airTime을 premiereTime으로 업데이트
            return {
              ...newData,
              dayOfWeek: dayOfWeek as 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN',
              airTime: time
            };
          }
        }
        
        return newData;
      });
    } else {
      setAnimeData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      // 필수 필드 검증
      if (!animeData.titleKor || !animeData.titleKor.trim()) {
        setMessage('한국어 제목은 필수입니다.');
        setIsLoading(false);
        return;
      }
      
      if (!animeData.medium) {
        setMessage('매체는 필수입니다.');
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      
      // 필수 필드 - 디버깅을 위한 로그 추가
      console.log('필수 필드 확인:', {
        titleKor: animeData.titleKor,
        titleKorTrimmed: animeData.titleKor?.trim(),
        medium: animeData.medium
      });
      
      // 필수 필드만 먼저 테스트
      formData.append('titleKor', animeData.titleKor.trim());
      formData.append('medium', animeData.medium);
      
      // 다른 필드들은 일시적으로 주석 처리하여 테스트
      // formData.append('titleOrigin', animeData.titleOrigin || '');
      // formData.append('titleEng', animeData.titleEng || '');
      
      // 디버깅을 위한 로그
      console.log('전송할 데이터:', {
        titleKor: animeData.titleKor,
        medium: animeData.medium,
        airTime: animeData.airTime,
        premiereDate: animeData.premiereDate,
        premiereTime: animeData.premiereTime,
        dayOfWeek: animeData.dayOfWeek,
        totalEpisodes: animeData.totalEpisodes,
        ottDtos: animeData.ottDtos
      });
      
      // 선택적 필드들
      if (animeData.titleOrigin) formData.append('titleOrigin', animeData.titleOrigin);
      if (animeData.titleEng) formData.append('titleEng', animeData.titleEng);
      if (animeData.airTime) formData.append('airTime', animeData.airTime);
      if (animeData.premiereDate && animeData.premiereTime) {
        // premiereDate와 premiereTime을 결합하여 LocalDateTime 형식으로 변환
        const fullDateTime = new Date(`${animeData.premiereDate}T${animeData.premiereTime}`);
        // ISO 형식 대신 LocalDateTime이 인식할 수 있는 형식으로 변환
        const localDateTimeString = fullDateTime.toISOString().replace('Z', '');
        formData.append('premiereDateTime', localDateTimeString);
      } else if (animeData.premiereDate) {
        // 날짜만 있는 경우 시간을 00:00으로 설정
        const fullDateTime = new Date(`${animeData.premiereDate}T00:00`);
        const localDateTimeString = fullDateTime.toISOString().replace('Z', '');
        formData.append('premiereDateTime', localDateTimeString);
      }
      if (animeData.dayOfWeek) formData.append('dayOfWeek', animeData.dayOfWeek);
      if (animeData.totalEpisodes) formData.append('totalEpisodes', animeData.totalEpisodes.toString());
      if (animeData.corp) formData.append('corp', animeData.corp);
      if (animeData.director) formData.append('director', animeData.director);
      if (animeData.genre) formData.append('genre', animeData.genre);
      if (animeData.author) formData.append('author', animeData.author);
      if (animeData.minAge) formData.append('minAge', animeData.minAge.toString());
      if (animeData.synopsis) formData.append('synopsis', animeData.synopsis);
      if (animeData.mainImage) formData.append('mainImage', animeData.mainImage);
      
      // ottDtos 전송 - Spring @ModelAttribute에서는 개별 필드로 전송
      if (animeData.ottDtos && animeData.ottDtos.length > 0) {
        animeData.ottDtos.forEach((ott, index) => {
          formData.append(`ottDtos[${index}].ottType`, ott.ottType);
          formData.append(`ottDtos[${index}].watchUrl`, ott.watchUrl);
        });
      }
      
      // officialSite 필드들 추가 - officialSiteString으로 전송
      if (animeData.officialSite) {
        const officialSiteMap: Record<string, string> = {};
        Object.entries(animeData.officialSite).forEach(([siteType, url]) => {
          if (url && url.trim()) {
            officialSiteMap[siteType] = url;
          }
        });
        if (Object.keys(officialSiteMap).length > 0) {
          formData.append('officialSiteString', JSON.stringify(officialSiteMap));
        }
      }

      // FormData 내용 확인
      console.log('FormData 내용:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      
      // 필수 필드가 FormData에 제대로 들어갔는지 확인
      console.log('FormData에서 필수 필드 확인:');
      console.log('titleKor in FormData:', formData.get('titleKor'));
      console.log('medium in FormData:', formData.get('medium'));

      const response = await fetch('/api/admin/animes', {
        method: 'POST',
        credentials: 'include',
        // Content-Type을 명시적으로 설정하지 않음 (브라우저가 자동으로 multipart/form-data로 설정)
        body: formData,
      });

      if (response.ok) {
        try {
          const result = await response.json();
          setMessage(`애니메이션이 성공적으로 추가되었습니다. (ID: ${result.result})`);
        } catch (jsonError) {
          // JSON 파싱 실패 시에도 성공으로 처리
          setMessage('애니메이션이 성공적으로 추가되었습니다.');
        }
        
        // 폼 초기화
        setAnimeData({
          titleKor: '',
          titleOrigin: '',
          titleEng: '',
          medium: 'TVA',
          airTime: '',
          premiereDate: '',
          premiereTime: '',
          dayOfWeek: undefined,
          totalEpisodes: undefined,
          corp: '',
          director: '',
          genre: '',
          author: '',
          minAge: undefined,
          officialSite: {
            OTHERS: '',
            X: '',
            YOUTUBE: '',
            INSTAGRAM: '',
            TIKTOK: ''
          },
          synopsis: '',
          mainImage: undefined,
          ottDtos: []
        });
      } else {
        try {
          const errorData = await response.json();
          setMessage(`오류: ${errorData.message || '애니메이션 추가에 실패했습니다.'}`);
        } catch (jsonError) {
          // JSON 파싱 실패 시 기본 에러 메시지
          setMessage(`오류: 애니메이션 추가에 실패했습니다. (상태 코드: ${response.status})`);
        }
      }
    } catch (error) {
      console.error('API 호출 오류:', error);
      setMessage('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 권한이 없는 경우 로딩 표시
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">권한을 확인하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">관리자 페이지</h1>
          <p className="mt-2 text-gray-600">애니메이션 데이터를 관리할 수 있습니다.</p>
        </div>

        {/* 애니메이션 추가 폼 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">새 애니메이션 등록</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="titleKor" className="block text-sm font-medium text-gray-700 mb-2">
                  한국어 제목 *
                </label>
                <input
                  type="text"
                  id="titleKor"
                  name="titleKor"
                  value={animeData.titleKor}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="한국어 제목을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="titleOrigin" className="block text-sm font-medium text-gray-700 mb-2">
                  원제
                </label>
                <input
                  type="text"
                  id="titleOrigin"
                  name="titleOrigin"
                  value={animeData.titleOrigin}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="원제를 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="titleEng" className="block text-sm font-medium text-gray-700 mb-2">
                  영어 제목
                </label>
                <input
                  type="text"
                  id="titleEng"
                  name="titleEng"
                  value={animeData.titleEng}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="영어 제목을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="medium" className="block text-sm font-medium text-gray-700 mb-2">
                  매체 *
                </label>
                <select
                  id="medium"
                  name="medium"
                  value={animeData.medium}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="TVA">TV 애니메이션</option>
                  <option value="MOVIE">영화</option>
                </select>
              </div>
            </div>

            {/* 방영 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="premiereDateTime" className="block text-sm font-medium text-gray-700 mb-2">
                  첫 방영일시
                </label>
                <input
                  type="datetime-local"
                  id="premiereDateTime"
                  name="premiereDateTime"
                  value={animeData.premiereDate && animeData.premiereTime ? `${animeData.premiereDate}T${animeData.premiereTime}` : ''}
                  onChange={(e) => {
                    const [date, time] = e.target.value.split('T');
                    setAnimeData(prev => {
                      const newData = { ...prev, premiereDate: date || '', premiereTime: time || '' };
                      
                      // 극장판이 아닌 경우에만 방영 시간과 요일 처리
                      if (prev.medium !== 'MOVIE' && date && time) {
                        const fullDateTime = new Date(`${date}T${time}`);
                        const dayOfWeek = fullDateTime.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                        
                        return {
                          ...newData,
                          dayOfWeek: dayOfWeek as 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN',
                          airTime: time
                        };
                      }
                      
                      return newData;
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {animeData.medium === 'MOVIE' ? '극장판은 방영 시간과 요일이 자동 설정되지 않습니다' : '입력 시 방영 요일과 방영 시간이 자동으로 설정됩니다'}
                </p>
              </div>

              <div>
                <label htmlFor="airTime" className="block text-sm font-medium text-gray-700 mb-2">
                  방영 시간 {animeData.medium === 'MOVIE' && <span className="text-gray-500">(극장판은 해당 없음)</span>}
                </label>
                <input
                  type="text"
                  id="airTime"
                  name="airTime"
                  value={animeData.airTime}
                  onChange={handleInputChange}
                  disabled={animeData.medium === 'MOVIE'}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    animeData.medium === 'MOVIE' ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder={animeData.medium === 'MOVIE' ? '극장판은 해당 없음' : '예: 23:00'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {animeData.medium === 'MOVIE' ? '극장판은 방영 시간이 해당 없습니다' : '시간 형식: HH:MM (예: 23:00), 미정이면 비워놓기'}
                </p>
              </div>

              <div>
                <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700 mb-2">
                  방영 요일 {animeData.medium === 'MOVIE' && <span className="text-gray-500">(극장판은 해당 없음)</span>}
                </label>
                <select
                  id="dayOfWeek"
                  name="dayOfWeek"
                  value={animeData.dayOfWeek || ''}
                  onChange={handleInputChange}
                  disabled={animeData.medium === 'MOVIE'}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    animeData.medium === 'MOVIE' ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">{animeData.medium === 'MOVIE' ? '극장판은 해당 없음' : '선택하세요'}</option>
                  <option value="MON">월요일</option>
                  <option value="TUE">화요일</option>
                  <option value="WED">수요일</option>
                  <option value="THU">목요일</option>
                  <option value="FRI">금요일</option>
                  <option value="SAT">토요일</option>
                  <option value="SUN">일요일</option>
                </select>
              </div>

              <div>
                <label htmlFor="totalEpisodes" className="block text-sm font-medium text-gray-700 mb-2">
                  총 화수 {animeData.medium === 'MOVIE' && <span className="text-gray-500">(극장판은 해당 없음)</span>}
                </label>
                <input
                  type="number"
                  id="totalEpisodes"
                  name="totalEpisodes"
                  value={animeData.totalEpisodes || ''}
                  onChange={handleInputChange}
                  disabled={animeData.medium === 'MOVIE'}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    animeData.medium === 'MOVIE' ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder={animeData.medium === 'MOVIE' ? '극장판은 해당 없음' : '예: 12'}
                />
              </div>
            </div>

            {/* 제작 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="corp" className="block text-sm font-medium text-gray-700 mb-2">
                  제작사
                </label>
                <input
                  type="text"
                  id="corp"
                  name="corp"
                  value={animeData.corp}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="제작사를 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="director" className="block text-sm font-medium text-gray-700 mb-2">
                  감독
                </label>
                <input
                  type="text"
                  id="director"
                  name="director"
                  value={animeData.director}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="감독을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-2">
                  장르
                </label>
                <input
                  type="text"
                  id="genre"
                  name="genre"
                  value={animeData.genre}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="장르를 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
                  원작
                </label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={animeData.author}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="원작을 입력하세요"
                />
              </div>
            </div>

            {/* 공식 사이트 정보 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">공식 사이트</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="officialSite.X" className="block text-sm font-medium text-gray-700 mb-2">
                    X (트위터)
                  </label>
                  <input
                    type="url"
                    id="officialSite.X"
                    name="officialSite.X"
                    value={animeData.officialSite?.X || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://x.com/..."
                  />
                </div>

                <div>
                  <label htmlFor="officialSite.YOUTUBE" className="block text-sm font-medium text-gray-700 mb-2">
                    YouTube
                  </label>
                  <input
                    type="url"
                    id="officialSite.YOUTUBE"
                    name="officialSite.YOUTUBE"
                    value={animeData.officialSite?.YOUTUBE || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div>
                  <label htmlFor="officialSite.INSTAGRAM" className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram
                  </label>
                  <input
                    type="url"
                    id="officialSite.INSTAGRAM"
                    name="officialSite.INSTAGRAM"
                    value={animeData.officialSite?.INSTAGRAM || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://instagram.com/..."
                  />
                </div>

                <div>
                  <label htmlFor="officialSite.TIKTOK" className="block text-sm font-medium text-gray-700 mb-2">
                    TikTok
                  </label>
                  <input
                    type="url"
                    id="officialSite.TIKTOK"
                    name="officialSite.TIKTOK"
                    value={animeData.officialSite?.TIKTOK || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://tiktok.com/..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="officialSite.OTHERS" className="block text-sm font-medium text-gray-700 mb-2">
                    기타 사이트
                  </label>
                  <input
                    type="url"
                    id="officialSite.OTHERS"
                    name="officialSite.OTHERS"
                    value={animeData.officialSite?.OTHERS || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/..."
                  />
                </div>
              </div>
            </div>

            {/* 기타 정보 */}
            <div>
              <label htmlFor="synopsis" className="block text-sm font-medium text-gray-700 mb-2">
                시놉시스
              </label>
              <textarea
                id="synopsis"
                name="synopsis"
                value={animeData.synopsis}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="시놉시스를 입력하세요"
              />
            </div>

            {/* OTT 정보 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">OTT 서비스</h3>
                <button
                  type="button"
                  onClick={addOttData}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  OTT 추가
                </button>
              </div>
              
              {animeData.ottDtos && animeData.ottDtos.length > 0 ? (
                <div className="space-y-4">
                  {animeData.ottDtos.map((ott, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          OTT 서비스
                        </label>
                        <select
                          value={ott.ottType}
                          onChange={(e) => updateOttData(index, 'ottType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="LAFTEL">라프텔</option>
                          <option value="NETFLIX">넷플릭스</option>
                          <option value="WAVVE">웨이브</option>
                          <option value="TVING">티빙</option>
                          <option value="WATCHA">왓챠</option>
                          <option value="PRIME">프라임 비디오</option>
                        </select>
                      </div>
                      
                      <div className="flex-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          시청 URL
                        </label>
                        <input
                          type="url"
                          value={ott.watchUrl}
                          onChange={(e) => updateOttData(index, 'watchUrl', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://example.com/watch/..."
                        />
                      </div>
                      
                      <div className="flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => removeOttData(index)}
                          className="px-3 py-2 text-sm text-red-600 hover:text-red-800 focus:outline-none"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">OTT 서비스 정보가 없습니다. "OTT 추가" 버튼을 클릭하여 추가하세요.</p>
              )}
            </div>

            {/* 이미지 업로드 */}
            <div>
              <label htmlFor="mainImage" className="block text-sm font-medium text-gray-700 mb-2">
                메인 이미지
              </label>
              <input
                type="file"
                id="mainImage"
                name="mainImage"
                accept="image/*"
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {message && (
              <div className={`p-4 rounded-md ${
                message.includes('성공') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '등록 중...' : '애니메이션 등록'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
