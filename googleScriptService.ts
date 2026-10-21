/**
 * ============================================================================
 * [구글 앱스 스크립트 실행 서비스] googleScriptService.ts
 * .env.local의 NEXT_PUBLIC_GOOGLE_SCRIPT_URL 환경 변수를 이용하여 실행합니다.
 * ============================================================================
 */

export interface GameSuccessPayload {
  gameName?: string;
  score?: number | string;
  category?: string;
  content?: string;
  color?: 1 | 2 | 3 | 4; // 1: 노랑, 2: 분홍, 3: 초록, 4: 파랑
  state?: '체크' | '완료' | '미완료';
}

export interface GoogleScriptResponse {
  success: boolean;
  message?: string;
  savedRow?: {
    timestamp: string;
    datetime: string;
    category: string;
    content: string;
    color: number;
    state: string;
    order: number;
  };
  error?: string;
}

/**
 * 1. .env.local에서 NEXT_PUBLIC_GOOGLE_SCRIPT_URL 가져오기
 */
export function getGoogleScriptUrl(): string {
  // Next.js 환경 변수 (NEXT_PUBLIC_ 접두사 필수)
  const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;

  if (!scriptUrl || scriptUrl.includes('PLACEHOLDER')) {
    console.warn(
      '⚠️ [GoogleScriptService] .env.local 파일에 유효한 NEXT_PUBLIC_GOOGLE_SCRIPT_URL 값이 설정되지 않았습니다.'
    );
    return '';
  }

  return scriptUrl.trim();
}

/**
 * 2. 게임 성공 시 구글 앱스 스크립트 실행 함수
 * 
 * 구글 시트 7개 열 매핑:
 * - A: timestamp (시트 기록 일시)
 * - B: datetime  (게임 성공 일시)
 * - C: category  (범주: 기본 '게임 성공')
 * - D: content   (내용: 게임 이름 및 점수 기록)
 * - E: color     (포스트잇 색상: 기본 3=초록)
 * - F: state     (상태: 기본 '체크')
 * - G: order     (순서 번호)
 */
export async function executeGameSuccessScript(
  payload: GameSuccessPayload = {}
): Promise<GoogleScriptResponse> {
  const scriptUrl = getGoogleScriptUrl();

  if (!scriptUrl) {
    return {
      success: false,
      error: '.env.local 파일의 NEXT_PUBLIC_GOOGLE_SCRIPT_URL이 설정되지 않았습니다.'
    };
  }

  const {
    gameName = '미니게임',
    score = 100,
    category = '게임 성공',
    content,
    color = 3, // 초록색 포스트잇
    state = '체크'
  } = payload;

  const requestBody = {
    action: 'gameSuccess',
    category,
    content: content || `🎮 [${gameName}] 클리어 성공! (점수/기록: ${score})`,
    color,
    state
  };

  try {
    // 구글 앱스 스크립트는 text/plain 으로 POST 전송 시 브라우저 CORS Preflight를 우회하여 안정적으로 통신됩니다.
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('❌ [GoogleScriptService] 구글 앱스 스크립트 실행 실패:', error);
    return {
      success: false,
      error: error.message || '네트워크 요청 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 3. 구글 시트 데이터 목록 조회 (GET 요청)
 */
export async function fetchGoogleSheetData(): Promise<any> {
  const scriptUrl = getGoogleScriptUrl();
  if (!scriptUrl) return { success: false, data: [] };

  try {
    const url = new URL(scriptUrl);
    url.searchParams.set('t', Date.now().toString());

    const response = await fetch(url.toString(), {
      method: 'GET'
    });

    return await response.json();
  } catch (error: any) {
    console.error('❌ [GoogleScriptService] 데이터 조회 실패:', error);
    return { success: false, error: error.message };
  }
}
