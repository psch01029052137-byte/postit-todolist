/**
 * ============================================================================
 * [구글 앱스 스크립트 실행 서비스] googleScriptService.js
 * .env.local의 NEXT_PUBLIC_GOOGLE_SCRIPT_URL 키 값을 읽어와 실행합니다.
 * ============================================================================
 */

/**
 * 1. .env.local 또는 클라이언트 환경 변수에서 URL 추출
 */
export function getGoogleScriptUrl() {
  // 1) Next.js 브라우저 환경 (NEXT_PUBLIC_GOOGLE_SCRIPT_URL)
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL) {
    return process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL.trim();
  }
  // 2) Vite 환경 변수 호환
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL) {
    return import.meta.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL.trim();
  }
  // 3) 로컬스토리지 백업
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('postit_sheet_url') || '';
  }
  return '';
}

/**
 * 2. 게임 성공 시 구글 앱스 스크립트 실행
 * @param {Object} options
 *   - options.gameName : 게임 이름
 *   - options.score    : 점수 / 기록
 *   - options.category : 범주 (기본: '게임 성공')
 *   - options.content  : 내용 (지정하지 않을 시 자동 포맷)
 *   - options.color    : 1(노랑), 2(분홍), 3(초록), 4(파랑)
 *   - options.state    : '체크' 또는 '완료'
 */
export async function executeGameSuccessScript(options = {}) {
  const scriptUrl = getGoogleScriptUrl();

  if (!scriptUrl || scriptUrl.includes('PLACEHOLDER')) {
    console.warn('⚠️ [googleScriptService] .env.local 파일에 NEXT_PUBLIC_GOOGLE_SCRIPT_URL 값을 설정해주세요.');
    return {
      success: false,
      error: '.env.local 파일에 NEXT_PUBLIC_GOOGLE_SCRIPT_URL이 설정되지 않았습니다.'
    };
  }

  const {
    gameName = '미니게임',
    score = 100,
    category = '게임 성공',
    content,
    color = 3, // 초록색 포스트잇
    state = '체크'
  } = options;

  const requestBody = {
    action: 'gameSuccess',
    category,
    content: content || `🎮 [${gameName}] 클리어 성공! (점수/기록: ${score})`,
    color,
    state
  };

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ 구글 앱스 스크립트 실행 중 에러 발생:', error);
    return { success: false, error: error.message };
  }
}
