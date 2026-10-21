/**
 * ============================================================================
 * [구글 앱스 스크립트] 게임 성공 시 데이터 저장 스크립트 (Code.gs)
 * 대상 시트: https://docs.google.com/spreadsheets/d/1Qqc17s8AtZ8g-lLJK1NsbJ2rzFJKHE_NUlTrvFMbAO8/edit
 * ============================================================================
 * 
 * [구글 시트 7개 열 규격]
 * 1. A열 (timestamp) : 시트 기록 날짜 및 시간 (날짜/시간)
 * 2. B열 (datetime)  : 게임 성공/메모 생성 일시 (날짜/시간)
 * 3. C열 (category)  : 범주 (문자: 예 - '게임 성공', '할 일', '아이디어')
 * 4. D열 (content)   : 내용 (문자: 예 - '미니게임 클리어! 보상 획득')
 * 5. E열 (color)     : 색상 (숫자: 1=노랑, 2=분홍, 3=초록, 4=파랑)
 * 6. F열 (state)     : 완료 상태 (문자: '체크' 또는 '완료')
 * 7. G열 (order)     : 순서 (숫자: 1, 2, 3...)
 *
 * ----------------------------------------------------------------------------
 * [설치 및 배포 방법 (3단계)]
 * 1. 구글 스프레드시트 상단 메뉴 [확장 프로그램] -> [Apps Script] 클릭
 * 2. 기존 코드를 모두 지우고 이 스크립트 전체를 복사하여 붙여넣기 후 [저장(Ctrl+S)]
 * 3. 상단 우측 [배포] -> [새 배포] 클릭:
 *    - 유형 선택(톱니바퀴): "웹 앱"
 *    - 설명: 게임 성공 연동 API
 *    - 다음 사용자로 실행: "나 (내 계정)"
 *    - 액세스 권한: "모든 사용자 (Anyone)"  ★필수★
 *    - [배포] 클릭 후 승인 절차 진행 -> 발급된 "웹 앱 URL" 복사!
 * ============================================================================
 */

// 지정하신 스프레드시트 ID
var SPREADSHEET_ID = "1Qqc17s8AtZ8g-lLJK1NsbJ2rzFJKHE_NUlTrvFMbAO8";

/**
 * 스프레드시트 객체 가져오기 (Active 또는 ID 기반)
 */
function getTargetSheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss.getActiveSheet();
  } catch (e) {}
  
  return SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
}

/**
 * 시트 헤더 검증 및 자동 생성
 */
function setupSheetHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    var headers = ['timestamp', 'datetime', 'category', 'content', 'color', 'state', 'order'];
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, 7);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f3f4f6');
  }
}

/**
 * 날짜 포맷 헬퍼 (YYYY.MM.DD (요일) HH:mm)
 */
function formatGameDate(date) {
  var days = ['일', '월', '화', '수', '목', '금', '토'];
  var yyyy = date.getFullYear();
  var mm = String(date.getMonth() + 1);
  if (mm.length < 2) mm = '0' + mm;
  var dd = String(date.getDate());
  if (dd.length < 2) dd = '0' + dd;
  var dayName = days[date.getDay()];
  var hh = String(date.getHours());
  if (hh.length < 2) hh = '0' + hh;
  var min = String(date.getMinutes());
  if (min.length < 2) min = '0' + min;

  return yyyy + '.' + mm + '.' + dd + ' (' + dayName + ') ' + hh + ':' + min;
}

/**
 * ★ [핵심 함수] 게임 성공 시 데이터를 구글 시트에 7개 열 규격으로 저장
 * 
 * @param {Object} data 
 *   - data.category : (선택) 범주 (기본: '게임 성공')
 *   - data.content  : (선택) 성공 내용 (기본: '게임 미션 성공!')
 *   - data.color    : (선택) 포스트잇 색상 번호 1~4 (기본: 1)
 *   - data.state    : (선택) 상태 ('체크' 또는 '완료', 기본: '체크')
 *   - data.datetime : (선택) 성공 시간 문자열
 */
function saveGameSuccess(data) {
  var sheet = getTargetSheet();
  setupSheetHeaders(sheet);

  data = data || {};
  var now = new Date();

  // 1. A열: timestamp (시트 기록 날짜 및 시간 - Date 객체 또는 포맷 문자열)
  var timestamp = Utilities.formatDate(now, "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");

  // 2. B열: datetime (게임 성공 날짜 및 시간)
  var datetime = data.datetime || formatGameDate(now);

  // 3. C열: category (메모 범주)
  var category = data.category || '게임 성공';

  // 4. D열: content (메모 내용 / 성공 기록)
  var content = data.content || '🎉 게임 미션 성공! (클리어 완료)';

  // 5. E열: color (1: 노랑, 2: 분홍, 3: 초록, 4: 파랑)
  var color = Number(data.color) || 1;

  // 6. F열: state (체크 버튼을 눌러 완료가 되면 '체크' 또는 '완료')
  var state = data.state || '체크';

  // 7. G열: order (메모 순서 - 기존 행 개수 기반 자동 부여)
  var lastRow = sheet.getLastRow();
  var order = (lastRow >= 1) ? lastRow : 1; // 헤더 제외 1부터 시작

  // 구글 시트에 새 행 추가
  sheet.appendRow([timestamp, datetime, category, content, color, state, order]);

  return {
    success: true,
    message: "Game success data saved to Google Sheet!",
    rowNumber: sheet.getLastRow(),
    data: {
      timestamp: timestamp,
      datetime: datetime,
      category: category,
      content: content,
      color: color,
      state: state,
      order: order
    }
  };
}

/**
 * 웹 앱 API: 웹 브라우저/게임에서 POST 요청으로 데이터 전송 시 실행
 */
function doPost(e) {
  var result = { success: false, message: 'Invalid request' };

  try {
    var param = {};
    if (e && e.postData && e.postData.contents) {
      param = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      param = e.parameter;
    }

    var action = param.action || 'gameSuccess';

    if (action === 'gameSuccess' || action === 'create') {
      result = saveGameSuccess(param);
    } else {
      result = saveGameSuccess(param);
    }
  } catch (err) {
    result = { success: false, error: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 웹 앱 API: GET 요청 시 시트의 전체 데이터 반환 (조회용)
 */
function doGet(e) {
  var sheet = getTargetSheet();
  setupSheetHeaders(sheet);

  var data = [];
  var lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    var values = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      data.push({
        timestamp: row[0],
        datetime: row[1],
        category: row[2],
        content: row[3],
        color: row[4],
        state: row[5],
        order: row[6]
      });
    }
  }

  var result = {
    status: 'success',
    count: data.length,
    data: data
  };

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ★ [테스트 실행용 함수]
 * Apps Script 화면 상단에서 'testGameSuccess' 선택 후 [실행] 버튼을 누르면
 * 지정하신 스프레드시트에 즉시 성공 데이터 한 행이 기록됩니다.
 */
function testGameSuccess() {
  var testResult = saveGameSuccess({
    category: "게임 성공",
    content: "🎮 미니게임 퍼즐 탈출 성공! (소요시간: 45초, 랭크: S)",
    color: 3, // 초록색 포스트잇
    state: "체크"
  });

  Logger.log("테스트 실행 결과: " + JSON.stringify(testResult));
}
