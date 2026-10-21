'use client';

import React, { useState } from 'react';

// 타입 정의
interface PostItMemo {
  id: string;
  category: '할 일' | '아이디어' | '기타';
  content: string;
  color: 1 | 2 | 3 | 4; // 1: 노랑, 2: 분홍, 3: 초록, 4: 파랑
  state: '체크' | '미완료';
  datetime: string;
  rotation?: string;
}

const CATEGORIES = ['전체', '할 일', '아이디어', '기타'] as const;

export default function PostItTodoList() {
  // 과제 복원 요구사항 3가지 Mock Data
  const [memos, setMemos] = useState<PostItMemo[]>([
    {
      id: 'memo-1',
      category: '아이디어',
      content:
        '인천대학생인데 인천타임스페이스 술집이 진짜 많은데, 네이버지도 키면 광고 우선이여가지고 뭔가 테마별로 해서 맛집이 안나오는것같은데 그런거 술집이나 밥집 추천해 주는 앱 만드는거 그런거 만들면 괜찮을 것 같은데',
      color: 1, // 노랑
      state: '미완료',
      datetime: '2026.10.21 (수) 16:30',
      rotation: '-1.5deg'
    },
    {
      id: 'memo-2',
      category: '아이디어',
      content:
        '핵심 컨셉: "광고 없는 타임스페이스 테마 큐레이션"\n1. 정보 비대칭 & 역선택(Adverse Selection) 제거\n\n문제: 마케팅 비용을 많이 태운 가게(광고)가 상단에 노출되면서, 퀄리티 대비 과대평가된 레몬(Lemon) 매장에 낚이는 역선택 발생.\n\n해결: 리뷰 이벤트나 광고 가중치를 완전히 배제하고, 순수 목적/상황 기반 태그로만 정렬.',
      color: 2, // 분홍
      state: '미완료',
      datetime: '2026.10.21 (수) 16:31',
      rotation: '1.2deg'
    },
    {
      id: 'memo-3',
      category: '아이디어',
      content:
        '뭔가 다른사람이 추천하는 꿀술집이라해야하나? 그런것도 있으면 이제 넣으면 좋을 것 같아\n술집뿐만 아니고 음식점에 대해서도 한식 중식 일식 양식 나눠서 할 수 있으면 좋을것같긴함',
      color: 3, // 초록
      state: '미완료',
      datetime: '2026.10.21 (수) 16:32',
      rotation: '-0.8deg'
    }
  ]);

  const [currentFilter, setCurrentFilter] = useState<string>('전체');
  const [category, setCategory] = useState<PostItMemo['category']>('할 일');
  const [content, setContent] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 1. 메모 추가
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const randomColor = (Math.floor(Math.random() * 4) + 1) as 1 | 2 | 3 | 4;
    const now = new Date();
    const formatted = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} (${['일','월','화','수','목','금','토'][now.getDay()]}) ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newMemo: PostItMemo = {
      id: `memo-${Date.now()}`,
      category,
      content: content.trim(),
      color: randomColor,
      state: '미완료',
      datetime: formatted,
      rotation: `${(Math.random() * 4 - 2).toFixed(1)}deg`
    };

    setMemos([newMemo, ...memos]);
    setContent('');
  };

  // 2. 완료 체크 토글
  const toggleCheck = (id: string) => {
    setMemos(memos.map(m => m.id === id ? { ...m, state: m.state === '체크' ? '미완료' : '체크' } : m));
  };

  // 3. 메모 삭제
  const deleteMemo = (id: string) => {
    setMemos(memos.filter(m => m.id !== id));
  };

  // 4. NEXT_PUBLIC_GOOGLE_SCRIPT_URL 환경변수를 이용한 게임 성공 시 구글 앱스 스크립트 실행 함수
  const handleGameSuccess = async (gameName = '미니게임', score = 100) => {
    const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;

    if (!scriptUrl || scriptUrl.includes('PLACEHOLDER')) {
      alert('⚠️ .env.local 파일에 NEXT_PUBLIC_GOOGLE_SCRIPT_URL을 먼저 설정해주세요.');
      return;
    }

    const payload = {
      action: 'gameSuccess',
      category: '게임 성공',
      content: `🎮 [${gameName}] 클리어 성공! (점수: ${score}점)`,
      color: 3, // 초록색 포스트잇
      state: '체크'
    };

    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.success) {
        alert('🎉 게임 성공 기록이 구글 시트에 안전하게 저장되었습니다!');
        // 화면에도 포스트잇 즉시 추가
        const now = new Date();
        const formatted = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} (${['일','월','화','수','목','금','토'][now.getDay()]}) ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setMemos(prev => [
          {
            id: `game-${Date.now()}`,
            category: '할 일',
            content: payload.content,
            color: 3,
            state: '체크',
            datetime: formatted,
            rotation: '1.0deg'
          },
          ...prev
        ]);
      } else {
        alert('저장 실패: ' + (result.error || result.message));
      }
    } catch (err: any) {
      console.error('구글 앱스 스크립트 실행 실패:', err);
      alert('구글 앱스 스크립트 실행 중 에러가 발생했습니다: ' + err.message);
    }
  };

  // 필터링된 메모 목록
  const filteredMemos = currentFilter === '전체'
    ? memos
    : memos.filter(m => m.category === currentFilter);

  // 4가지 색상 클래스
  const getColorClasses = (color: number) => {
    switch (color) {
      case 1: return 'bg-[#fff785] text-[#3d3500] shadow-amber-200/50';
      case 2: return 'bg-[#ffb8b8] text-[#451010] shadow-rose-200/50';
      case 3: return 'bg-[#bbf2c4] text-[#0e3b16] shadow-emerald-200/50';
      case 4: return 'bg-[#b3e5fc] text-[#0d324d] shadow-sky-200/50';
      default: return 'bg-[#fff785] text-[#3d3500]';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-[#18191a] text-slate-100' : 'bg-[#f5f6fa] text-[#2f3640]'}`}>
      {/* 1. Header (원본 규격) */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-b border-slate-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📌</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 via-amber-400 to-sky-400 bg-clip-text text-transparent">
              Post-it Todo List
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* 게임 성공 시 구글 시트 저장 실행 버튼 */}
            <button
              onClick={() => handleGameSuccess('퍼즐 탈출 게임', 100)}
              className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
              title="게임 성공 시 구글 앱스 스크립트 실행"
            >
              <span>🎮</span>
              <span>게임 성공 기록</span>
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="min-h-[38px] px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium hover:border-sky-500 transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>{isDarkMode ? '☀️' : '🌙'}</span>
              <span>{isDarkMode ? '라이트 모드' : '다크 모드'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* 3. 중앙 입력 폼 (모바일 w-full, PC max-w-lg) */}
        <section className="flex justify-center mb-8 w-full">
          <div className="w-full max-w-lg p-6 bg-[#fffbe6] dark:bg-zinc-800 rounded-md shadow-lg border border-black/5 dark:border-zinc-700 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl drop-shadow">📌</div>
            <form onSubmit={handleSubmit} className="space-y-3 pt-2">
              <select
                value={category}
                onChange={e => setCategory(e.target.value as PostItMemo['category'])}
                className="w-full p-2.5 text-sm rounded border border-slate-300 dark:border-zinc-700 dark:bg-zinc-900 outline-none font-medium cursor-pointer"
                required
              >
                <option value="할 일">📝 할 일</option>
                <option value="아이디어">💡 아이디어</option>
                <option value="기타">📌 기타</option>
              </select>

              <textarea
                rows={3}
                placeholder="메모할 내용을 입력하세요..."
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full p-3 text-base rounded border border-slate-300 dark:border-zinc-700 dark:bg-zinc-900 outline-none focus:border-sky-500 font-sans"
                required
              />

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-slate-500">무작위 색상 착 붙기</span>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2f3640] dark:bg-sky-600 hover:bg-[#1e272e] text-white rounded-full text-sm font-semibold shadow hover:scale-105 active:scale-95 transition-all"
                >
                  + 메모 붙이기
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* 2. 카테고리 필터 드롭다운 툴바 */}
        <section className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-3 border-b border-dashed border-slate-300 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <label htmlFor="filter" className="text-sm font-semibold">카테고리 필터:</label>
            <select
              id="filter"
              value={currentFilter}
              onChange={e => setCurrentFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium outline-none"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat === '전체' ? '전체 보기' : cat}
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300">
            총 {filteredMemos.length}개 메모
          </div>
        </section>

        {/* 5. 모바일 반응형 포스트잇 그리드: grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
          {filteredMemos.map(memo => (
            <div
              key={memo.id}
              style={{ transform: `rotate(${memo.rotation || '0deg'})` }}
              className={`relative min-h-[220px] p-5 rounded-sm shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between ${getColorClasses(memo.color)} ${
                memo.state === '체크' ? 'opacity-65 line-through' : ''
              }`}
            >
              {/* 상단 반투명 테이프 느낌 */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-4 bg-white/60 rounded-sm shadow-sm pointer-events-none" />

              {/* Card Top */}
              <div className="flex justify-between items-start gap-2 mb-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-black/10">
                  {memo.category}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleCheck(memo.id)}
                    aria-label="완료 체크"
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-sm transition-transform active:scale-90 ${
                      memo.state === '체크' ? 'bg-emerald-600 text-white' : 'bg-white/70 hover:bg-white'
                    }`}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => deleteMemo(memo.id)}
                    aria-label="메모 삭제"
                    className="w-8 h-8 rounded-full bg-white/70 hover:bg-red-100 hover:text-red-600 flex items-center justify-center text-xs shadow-sm transition-transform active:scale-90"
                  >
                    🗑
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="my-2 flex-1">
                <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-sans">
                  {memo.content}
                </p>
              </div>

              {/* Card Bottom: 왼쪽 하단 연월일 시간 요일 흐릿하게 표시 */}
              <div className="text-[11px] opacity-55 font-medium">
                {memo.datetime}
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-zinc-800 mt-auto">
        Copyright INU Post-it Todo List by OOO
      </footer>
    </div>
  );
}
