/**
 * Post-it Todo List Application
 * Features:
 * - Centered Post-it input with category selection (할 일, 아이디어, 기타)
 * - Category filter dropdown (전체, 할 일, 아이디어, 기타)
 * - Random color selection (Yellow, Pink, Green, Blue)
 * - "Stick snap" physical bounce animation
 * - Left-bottom muted timestamp with Day of week (YYYY.MM.DD (요일) HH:mm)
 * - Light / Dark mode toggle (Default: Light)
 * - Drag and drop reordering via SortableJS (Desktop & Mobile touch)
 * - Responsive breakpoints (Mobile 1 col, Tablet 2 cols, PC 3~4 cols)
 * - Check/Complete, Edit modal, and Delete actions
 * - Google Sheets 7-column CRUD synchronization
 */

// ==========================================
// 1. Constants & State Management
// ==========================================
const STORAGE_KEYS = {
  MEMOS: 'postit_todo_memos_v4',
  THEME: 'postit_todo_theme',
  SHEET_URL: 'postit_sheet_url'
};

// 4가지 무작위 색상 정의: 1-노랑, 2-분홍, 3-초록, 4-파랑
const POSTIT_COLORS = [
  { id: 1, name: 'yellow', label: '노란색' },
  { id: 2, name: 'pink', label: '분홍색' },
  { id: 3, name: 'green', label: '초록색' },
  { id: 4, name: 'blue', label: '파랑색' }
];

const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

let memos = [];
let currentFilter = '전체';
let sortableInstance = null;
let googleSheetUrl = localStorage.getItem(STORAGE_KEYS.SHEET_URL) || '';

// ==========================================
// 2. DOM Elements
// ==========================================
const memoForm = document.getElementById('memo-form');
const memoCategorySelect = document.getElementById('memo-category-select');
const memoContentInput = document.getElementById('memo-content-input');
const memoGrid = document.getElementById('memo-grid');
const emptyState = document.getElementById('empty-state');
const categoryFilter = document.getElementById('category-filter');
const memoCountBadge = document.getElementById('memo-count-badge');
const themeToggleBtn = document.getElementById('btn-theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeText = document.getElementById('theme-text');

// Edit Modal
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editMemoId = document.getElementById('edit-memo-id');
const editCategory = document.getElementById('edit-category');
const editContent = document.getElementById('edit-content');
const btnCloseEdit = document.getElementById('btn-close-edit');
const btnCancelEdit = document.getElementById('btn-cancel-edit');

// Google Sheet Modal & Sync
const btnSheetSettings = document.getElementById('btn-sheet-settings');
const sheetModal = document.getElementById('sheet-modal');
const btnCloseSheet = document.getElementById('btn-close-sheet');
const sheetWebAppUrlInput = document.getElementById('sheet-web-app-url');
const btnSaveSheetUrl = document.getElementById('btn-save-sheet-url');
const btnTestSheet = document.getElementById('btn-test-sheet');
const sheetStatusMsg = document.getElementById('sheet-status-message');
const sheetStatusDot = document.getElementById('sheet-status-dot');
const btnSyncSheet = document.getElementById('btn-sync-sheet');
const syncIcon = document.getElementById('sync-icon');

// ==========================================
// 3. Date & Utility Helpers
// ==========================================
function formatDisplayDate(dateObj) {
  const d = new Date(dateObj);
  if (isNaN(d.getTime())) return dateObj;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  const dayName = DAYS_KO[d.getDay()];
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${year}.${month}.${date} (${dayName}) ${hours}:${minutes}`;
}

function getRandomColor() {
  const randomIndex = Math.floor(Math.random() * POSTIT_COLORS.length);
  return POSTIT_COLORS[randomIndex];
}

function getRandomRotation() {
  const deg = (Math.random() * 4.5 - 2).toFixed(1);
  return `${deg}deg`;
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  let iconClass = 'fa-circle-info';
  if (type === 'success') iconClass = 'fa-circle-check';
  if (type === 'error') iconClass = 'fa-triangle-exclamation';

  toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================
// 4. Persistence & Local Storage
// ==========================================
function loadLocalMemos() {
  try {
    const defaultMemos = [
      {
        id: 'memo_1',
        timestamp: new Date().toISOString(),
        datetime: formatDisplayDate(new Date()),
        category: '아이디어',
        content: '인천대학생인데 인천타임스페이스 술집이 진짜 많은데, 네이버지도 키면 광고 우선이여가지고 뭔가 테마별로 해서 맛집이 안나오는것같은데 그런거 술집이나 밥집 추천해 주는 앱 만드는거 그런거 만들면 괜찮을 것 같은데',
        color: 1, // 노랑
        state: '미완료',
        order: 1,
        rotation: '-1.5deg'
      },
      {
        id: 'memo_2',
        timestamp: new Date().toISOString(),
        datetime: formatDisplayDate(new Date(Date.now() + 60000)),
        category: '아이디어',
        content: '핵심 컨셉: "광고 없는 타임스페이스 테마 큐레이션"\n1. 정보 비대칭 & 역선택(Adverse Selection) 제거\n\n문제: 마케팅 비용을 많이 태운 가게(광고)가 상단에 노출되면서, 퀄리티 대비 과대평가된 레몬(Lemon) 매장에 낚이는 역선택 발생.\n\n해결: 리뷰 이벤트나 광고 가중치를 완전히 배제하고, 순수 목적/상황 기반 태그로만 정렬.',
        color: 2, // 분홍
        state: '미완료',
        order: 2,
        rotation: '1.2deg'
      },
      {
        id: 'memo_3',
        timestamp: new Date().toISOString(),
        datetime: formatDisplayDate(new Date(Date.now() + 120000)),
        category: '아이디어',
        content: '뭔가 다른사람이 추천하는 꿀술집이라해야하나? 그런것도 있으면 이제 넣으면 좋을 것 같아\n술집뿐만 아니고 음식점에 대해서도 한식 중식 일식 양식 나눠서 할 수 있으면 좋을것같긴함',
        color: 3, // 초록
        state: '미완료',
        order: 3,
        rotation: '-0.8deg'
      }
    ];

    const raw = localStorage.getItem(STORAGE_KEYS.MEMOS);
    if (raw) {
      memos = JSON.parse(raw);
    } else {
      // 이전 키들에서 사용자가 직접 추가했던 메모가 있는지 탐색
      let recovered = [];
      const olderKeys = ['postit_todo_memos_v3', 'postit_todo_memos_v2', 'postit_todo_memos'];
      for (const k of olderKeys) {
        const olderRaw = localStorage.getItem(k);
        if (olderRaw) {
          try {
            const parsed = JSON.parse(olderRaw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              // 기본 3개 이외의 사용자 작성 메모 찾기
              const userOnly = parsed.filter(m => !m.id.startsWith('memo_') && !m.id.startsWith('tas_'));
              if (userOnly.length > 0) {
                recovered = userOnly;
                break;
              }
            }
          } catch (e) {}
        }
      }

      memos = [...defaultMemos, ...recovered];
      memos.forEach((m, idx) => { m.order = idx + 1; });
      saveLocalMemos();
    }
  } catch (e) {
    console.error('Error loading memos:', e);
    memos = [];
  }
}

function saveLocalMemos() {
  localStorage.setItem(STORAGE_KEYS.MEMOS, JSON.stringify(memos));
}

// ==========================================
// 5. Google Sheets API Integration
// ==========================================
function updateSheetConnectionIndicator() {
  if (googleSheetUrl && googleSheetUrl.trim().startsWith('https://script.google.com/')) {
    sheetStatusDot.className = 'sheet-status-dot connected';
    sheetStatusDot.title = '구글 시트 연결됨';
  } else {
    sheetStatusDot.className = 'sheet-status-dot';
    sheetStatusDot.title = '구글 시트 미연동 (로컬 모드)';
  }
}

async function callSheetApi(action, payload = {}) {
  if (!googleSheetUrl || !googleSheetUrl.trim()) {
    return { success: false, offline: true, message: 'Google Sheets URL not configured' };
  }

  try {
    const bodyData = {
      action: action,
      ...payload
    };

    const response = await fetch(googleSheetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(bodyData)
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn(`Sheet API error [${action}]:`, error);
    return { success: false, error: error.message };
  }
}

async function syncFromGoogleSheet(silent = false) {
  if (!googleSheetUrl) {
    if (!silent) showToast('구글 시트 연동 URL을 먼저 등록해주세요.', 'info');
    return;
  }

  syncIcon.classList.add('fa-spin');
  try {
    const url = new URL(googleSheetUrl);
    url.searchParams.set('action', 'read');
    url.searchParams.set('t', Date.now());

    const res = await fetch(url.toString(), { method: 'GET' });
    const result = await res.json();

    if (result && (result.status === 'success' || result.success) && Array.isArray(result.data)) {
      const fetchedMemos = result.data.map((row, idx) => {
        const colorVal = parseInt(row.color, 10) || 1;
        return {
          id: row.datetime || ('sheet_' + idx + '_' + Date.now()),
          timestamp: row.timestamp || new Date().toISOString(),
          datetime: row.datetime || formatDisplayDate(new Date()),
          category: row.category || '기타',
          content: row.content || '',
          color: colorVal,
          state: row.state === '체크' || row.state === '완료' ? '체크' : '미완료',
          order: parseInt(row.order, 10) || (idx + 1),
          rotation: getRandomRotation()
        };
      });

      fetchedMemos.sort((a, b) => a.order - b.order);
      memos = fetchedMemos;
      saveLocalMemos();
      renderMemos();
      updateSheetConnectionIndicator();
      if (!silent) showToast('구글 시트와 동기화되었습니다!', 'success');
    } else {
      throw new Error(result.message || '데이터 형식 오류');
    }
  } catch (err) {
    console.error('Sync failed:', err);
    if (!silent) showToast('구글 시트 동기화 실패: ' + err.message, 'error');
  } finally {
    syncIcon.classList.remove('fa-spin');
  }
}

// ==========================================
// 6. Memo Rendering & DOM Operations
// ==========================================
function getFilteredMemos() {
  if (currentFilter === '전체') {
    return memos;
  }
  return memos.filter(m => m.category === currentFilter);
}

function getColorClassName(colorId) {
  const match = POSTIT_COLORS.find(c => c.id === colorId);
  return match ? `color-${match.name}` : 'color-yellow';
}

function renderMemos(newMemoId = null) {
  memoGrid.innerHTML = '';
  const filtered = getFilteredMemos();

  filtered.sort((a, b) => a.order - b.order);

  memoCountBadge.textContent = `총 ${filtered.length}개 메모`;

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
  }

  filtered.forEach(memo => {
    const card = createMemoCardElement(memo, memo.id === newMemoId);
    memoGrid.appendChild(card);
  });
}

function createMemoCardElement(memo, isNew = false) {
  const card = document.createElement('div');
  const colorClass = getColorClassName(memo.color);
  const isCompleted = memo.state === '체크' || memo.state === '완료';

  card.className = `memo-card ${colorClass} ${isCompleted ? 'completed' : ''} ${isNew ? 'snap-stick' : ''}`;
  card.dataset.id = memo.id;
  card.style.setProperty('--random-rot', memo.rotation || getRandomRotation());

  const safeContent = escapeHtml(memo.content);
  const safeCategory = escapeHtml(memo.category);
  const safeDatetime = escapeHtml(memo.datetime);

  card.innerHTML = `
    <div class="card-top">
      <span class="badge-category">${safeCategory}</span>
      <div class="card-actions">
        <!-- 완료 체크 버튼 -->
        <button type="button" class="btn-card-action btn-check ${isCompleted ? 'checked' : ''}" title="${isCompleted ? '완료 취소' : '완료 체크'}" aria-label="완료 체크">
          <i class="fa-solid fa-check"></i>
        </button>
        <!-- 편집 버튼 -->
        <button type="button" class="btn-card-action btn-edit" title="메모 수정" aria-label="메모 수정">
          <i class="fa-solid fa-pencil"></i>
        </button>
        <!-- 삭제 버튼 -->
        <button type="button" class="btn-card-action btn-delete" title="메모 삭제" aria-label="메모 삭제">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>

    <div class="card-body">
      <p class="memo-text">${safeContent}</p>
    </div>

    <div class="card-bottom">
      <!-- 왼쪽 하단: 연월일 시간 요일 흐릿하게 표시 -->
      <span class="memo-datetime">${safeDatetime}</span>
    </div>
  `;

  // Attach Event Listeners
  const checkBtn = card.querySelector('.btn-check');
  const editBtn = card.querySelector('.btn-edit');
  const deleteBtn = card.querySelector('.btn-delete');

  checkBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMemoComplete(memo.id);
  });

  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openEditModal(memo.id);
  });

  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteMemo(memo.id);
  });

  return card;
}

// ==========================================
// 7. Memo CRUD Actions
// ==========================================
async function addMemo(category, content) {
  const randomColorObj = getRandomColor();
  const now = new Date();
  const formattedDate = formatDisplayDate(now);
  const newId = 'memo_' + Date.now();

  const newOrder = memos.length > 0 ? Math.max(...memos.map(m => m.order || 0)) + 1 : 1;

  const newMemo = {
    id: newId,
    timestamp: now.toISOString(),
    datetime: formattedDate,
    category: category,
    content: content,
    color: randomColorObj.id,
    state: '미완료',
    order: newOrder,
    rotation: getRandomRotation()
  };

  memos.push(newMemo);
  saveLocalMemos();
  renderMemos(newMemo.id);
  showToast(`'${category}' 메모가 부착되었습니다!`, 'success');

  callSheetApi('create', {
    timestamp: newMemo.timestamp,
    datetime: newMemo.datetime,
    category: newMemo.category,
    content: newMemo.content,
    color: newMemo.color,
    state: newMemo.state,
    order: newMemo.order
  }).then(res => {
    if (res && res.success) {
      updateSheetConnectionIndicator();
    }
  });
}

async function updateMemo(id, newCategory, newContent) {
  const targetIndex = memos.findIndex(m => m.id === id);
  if (targetIndex === -1) return;

  memos[targetIndex].category = newCategory;
  memos[targetIndex].content = newContent;
  memos[targetIndex].timestamp = new Date().toISOString();

  saveLocalMemos();
  renderMemos();
  showToast('메모가 성공적으로 수정되었습니다.', 'info');

  const updated = memos[targetIndex];
  callSheetApi('update', {
    datetime: updated.datetime,
    category: updated.category,
    content: updated.content,
    state: updated.state,
    order: updated.order,
    timestamp: updated.timestamp
  });
}

async function toggleMemoComplete(id) {
  const target = memos.find(m => m.id === id);
  if (!target) return;

  const isCompleted = target.state === '체크' || target.state === '완료';
  target.state = isCompleted ? '미완료' : '체크';
  target.timestamp = new Date().toISOString();

  saveLocalMemos();
  renderMemos();

  const msg = target.state === '체크' ? '완료 처리되었습니다.' : '미완료로 변경되었습니다.';
  showToast(msg, 'info');

  callSheetApi('updateState', {
    datetime: target.datetime,
    state: target.state,
    timestamp: target.timestamp
  });
}

async function deleteMemo(id) {
  const target = memos.find(m => m.id === id);
  if (!target) return;

  memos = memos.filter(m => m.id !== id);
  memos.forEach((m, idx) => {
    m.order = idx + 1;
  });

  saveLocalMemos();
  renderMemos();
  showToast('메모가 삭제되었습니다.', 'info');

  callSheetApi('delete', {
    datetime: target.datetime
  });
}

async function handleReorder() {
  const cards = Array.from(memoGrid.querySelectorAll('.memo-card'));
  const idOrderMap = new Map();

  cards.forEach((card, index) => {
    idOrderMap.set(card.dataset.id, index + 1);
  });

  memos.forEach(memo => {
    if (idOrderMap.has(memo.id)) {
      memo.order = idOrderMap.get(memo.id);
    }
  });

  memos.sort((a, b) => a.order - b.order);
  saveLocalMemos();

  const orderList = memos.map(m => ({ datetime: m.datetime, order: m.order }));
  callSheetApi('reorder', {
    orders: orderList
  });
}

// ==========================================
// 8. Edit Modal Handling
// ==========================================
function openEditModal(id) {
  const memo = memos.find(m => m.id === id);
  if (!memo) return;

  editMemoId.value = memo.id;
  editCategory.value = memo.category;
  editContent.value = memo.content;

  editModal.classList.remove('hidden');
  editContent.focus();
}

function closeEditModal() {
  editModal.classList.add('hidden');
}

editForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = editMemoId.value;
  const newCat = editCategory.value;
  const newCont = editContent.value.trim();

  if (!newCont) {
    showToast('메모 내용을 입력하세요.', 'error');
    return;
  }

  updateMemo(id, newCat, newCont);
  closeEditModal();
});

btnCloseEdit.addEventListener('click', closeEditModal);
btnCancelEdit.addEventListener('click', closeEditModal);
editModal.addEventListener('click', (e) => {
  if (e.target === editModal) closeEditModal();
});

// ==========================================
// 9. Google Sheet Settings Modal Handling
// ==========================================
btnSheetSettings.addEventListener('click', () => {
  sheetWebAppUrlInput.value = googleSheetUrl;
  sheetStatusMsg.className = 'sheet-status-msg';
  sheetStatusMsg.style.display = 'none';
  sheetModal.classList.remove('hidden');
});

btnCloseSheet.addEventListener('click', () => {
  sheetModal.classList.add('hidden');
});

sheetModal.addEventListener('click', (e) => {
  if (e.target === sheetModal) sheetModal.classList.add('hidden');
});

btnSaveSheetUrl.addEventListener('click', () => {
  const url = sheetWebAppUrlInput.value.trim();
  googleSheetUrl = url;
  localStorage.setItem(STORAGE_KEYS.SHEET_URL, url);
  updateSheetConnectionIndicator();
  sheetStatusMsg.className = 'sheet-status-msg success';
  sheetStatusMsg.textContent = '구글 시트 URL이 성공적으로 저장되었습니다.';
  sheetStatusMsg.style.display = 'block';
  showToast('설정이 저장되었습니다.', 'success');
});

btnTestSheet.addEventListener('click', async () => {
  const url = sheetWebAppUrlInput.value.trim();
  if (!url) {
    sheetStatusMsg.className = 'sheet-status-msg error';
    sheetStatusMsg.textContent = '구글 시트 웹 앱 URL을 먼저 입력해주세요.';
    sheetStatusMsg.style.display = 'block';
    return;
  }

  googleSheetUrl = url;
  localStorage.setItem(STORAGE_KEYS.SHEET_URL, url);
  updateSheetConnectionIndicator();

  sheetStatusMsg.className = 'sheet-status-msg';
  sheetStatusMsg.textContent = '연결 확인 및 데이터 요청 중...';
  sheetStatusMsg.style.display = 'block';

  try {
    await syncFromGoogleSheet(false);
    sheetStatusMsg.className = 'sheet-status-msg success';
    sheetStatusMsg.textContent = '연결 성공! 구글 시트와 정상적으로 연동되었습니다.';
  } catch (e) {
    sheetStatusMsg.className = 'sheet-status-msg error';
    sheetStatusMsg.textContent = '연결 실패: ' + e.message;
  }
});

btnSyncSheet.addEventListener('click', () => {
  syncFromGoogleSheet(false);
});

// ==========================================
// 10. Theme Management (Light / Dark)
// ==========================================
function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeIcon.className = 'fa-solid fa-sun';
    themeText.textContent = '라이트 모드';
  } else {
    document.body.classList.remove('dark-mode');
    themeIcon.className = 'fa-solid fa-moon';
    themeText.textContent = '다크 모드';
  }
}

themeToggleBtn.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark-mode');
  if (isDark) {
    localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    themeIcon.className = 'fa-solid fa-sun';
    themeText.textContent = '라이트 모드';
    showToast('다크 모드로 전환되었습니다.', 'info');
  } else {
    localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    themeIcon.className = 'fa-solid fa-moon';
    themeText.textContent = '다크 모드';
    showToast('라이트 모드로 전환되었습니다.', 'info');
  }
});

// ==========================================
// 11. Drag and Drop with SortableJS
// ==========================================
function initSortable() {
  if (sortableInstance) {
    sortableInstance.destroy();
  }

  if (typeof Sortable !== 'undefined') {
    sortableInstance = new Sortable(memoGrid, {
      animation: 200,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      filter: '.btn-card-action',
      preventOnFilter: false,
      delay: 50,
      delayOnTouchOnly: true,
      onEnd: function () {
        handleReorder();
      }
    });
  }
}

// ==========================================
// 12. Main Init & Event Listeners
// ==========================================
memoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const category = memoCategorySelect.value;
  const content = memoContentInput.value.trim();

  if (!category) {
    showToast('범주를 선택해주세요!', 'error');
    memoCategorySelect.focus();
    return;
  }

  if (!content) {
    showToast('메모 내용을 입력해주세요!', 'error');
    memoContentInput.focus();
    return;
  }

  addMemo(category, content);

  // 폼 초기화
  memoContentInput.value = '';
  memoCategorySelect.selectedIndex = 0;
  memoContentInput.focus();
});

// Category Filter Change
categoryFilter.addEventListener('change', (e) => {
  currentFilter = e.target.value;
  renderMemos();
});

// Game Success Trigger Button (.env.local NEXT_PUBLIC_GOOGLE_SCRIPT_URL 실행 기능)
const btnGameSuccess = document.getElementById('btn-game-success');
if (btnGameSuccess) {
  btnGameSuccess.addEventListener('click', async () => {
    const gameContent = '🎮 [미니게임] 퍼즐 탈출 클리어 성공! (기록: 45초, 랭크: S)';
    
    // 포스트잇 목록에 '게임 성공' 카드 추가
    addMemo('할 일', gameContent);
    showToast('🎮 게임 성공 기록이 시트로 전송되었습니다!', 'success');
  });
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadLocalMemos();
  renderMemos();
  initSortable();
  updateSheetConnectionIndicator();

  if (googleSheetUrl) {
    syncFromGoogleSheet(true);
  }
});
