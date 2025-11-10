// グローバル変数
let staffData = [];
let autoRefreshTimer = null;
let selectedDestination = '';
let currentDept = null;

// DOM要素
const elements = {
    staffList: document.getElementById('staffList'),
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    errorMessage: document.getElementById('errorMessage'),
    updateTime: document.getElementById('updateTime'),
    btnRefresh: document.getElementById('btnRefresh'),
    btnRetry: document.getElementById('btnRetry'),
    btnEdit: document.getElementById('btnEdit'),
    modal: document.getElementById('modal'),
    modalClose: document.getElementById('modalClose'),
    btnCancel: document.getElementById('btnCancel'),
    btnSave: document.getElementById('btnSave'),
    staffName: document.getElementById('staffName'),
    destinationList: document.getElementById('destinationList'),
    customDestinationGroup: document.getElementById('customDestinationGroup'),
    customDestination: document.getElementById('customDestination'),
    returnTime: document.getElementById('returnTime'),
    noReturnTime: document.getElementById('noReturnTime'),
    note: document.getElementById('note')
};

// ========================================
// 初期化
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    // 現在の部署を取得
    currentDept = getCurrentDepartment();
    console.log('Current Department:', currentDept);
    
    // ヘッダーに部署名を表示
    const headerDept = document.querySelector('.header-dept');
    if (headerDept) {
        headerDept.textContent = currentDept.name;
    }
    
    // 職員名の選択肢を更新
    updateStaffOptions();
    
    // イベントリスナー設定
    setupEventListeners();
    
    // データ読み込み
    loadData();
    
    // 自動更新開始
    startAutoRefresh();
}

// ========================================
// 職員名の選択肢を更新
// ========================================
function updateStaffOptions() {
    const staffNameSelect = elements.staffName;
    
    if (!staffNameSelect) {
        console.error('staffName element not found');
        return;
    }
    
    // 既存の選択肢をクリア
    staffNameSelect.innerHTML = '<option value="">選択してください</option>';
    
    // 現在の部署の職員を追加
    if (currentDept && currentDept.staff) {
        currentDept.staff.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            staffNameSelect.appendChild(option);
        });
        console.log('Staff options updated:', currentDept.staff.length);
    } else {
        console.error('currentDept or staff not found');
    }
}

// ========================================
// イベントリスナー
// ========================================
function setupEventListeners() {
    // 更新ボタン
    elements.btnRefresh.addEventListener('click', () => {
        loadData();
    });
    
    // 再試行ボタン
    elements.btnRetry.addEventListener('click', () => {
        loadData();
    });
    
    // 編集ボタン
    elements.btnEdit.addEventListener('click', () => {
        openModal();
    });
    
    // モーダル閉じる
    elements.modalClose.addEventListener('click', () => {
        closeModal();
    });
    
    elements.btnCancel.addEventListener('click', () => {
        closeModal();
    });
    
    // モーダル外クリックで閉じる
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) {
            closeModal();
        }
    });
    
    // 保存ボタン
    elements.btnSave.addEventListener('click', () => {
        saveData();
    });
    
    // 行先選択
    const destinationItems = elements.destinationList.querySelectorAll('.destination-item');
    destinationItems.forEach(item => {
        item.addEventListener('click', () => {
            selectDestination(item);
        });
    });
    
    // 時刻未定チェックボックス
    elements.noReturnTime.addEventListener('change', (e) => {
        elements.returnTime.disabled = e.target.checked;
        if (e.target.checked) {
            elements.returnTime.value = '';
        }
    });
}

// ========================================
// データ読み込み
// ========================================
async function loadData() {
    try {
        // ローディング表示
        showLoading();
        
        // API URL を動的に生成
        const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/${encodeURIComponent(currentDept.sheetName)}?key=${CONFIG.API_KEY}`;
        
        console.log('Loading data from:', currentDept.sheetName);
        console.log('API URL:', apiUrl);
        
        // API呼び出し
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error('データの読み込みに失敗しました');
        }
        
        const data = await response.json();
        console.log('Data loaded:', data.values ? data.values.length : 0, 'rows');
        
        // データ解析
        parseData(data.values);
        
        // 一覧表示
        renderStaffList();
        
        // 更新時刻表示
        updateTimeDisplay();
        
        // エラー非表示
        hideError();
        
    } catch (error) {
        console.error('Error loading data:', error);
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// ========================================
// データ解析
// ========================================
function parseData(values) {
    if (!values || values.length < 2) {
        throw new Error('データが見つかりません');
    }
    
    // ヘッダー行を除く
    const dataRows = values.slice(1);
    
    // データ整形
    staffData = dataRows.map(row => {
        const [name, destination, returnTime, note, updateTime] = row;
        
        // 行先の色を取得
        const destConfig = CONFIG.DESTINATIONS.find(d => d.name === destination);
        const color = destConfig ? destConfig.color : '#BDBDBD';
        const icon = destConfig ? destConfig.icon : '⚫';
        
        return {
            name: name || '',
            destination: destination || '在席',
            returnTime: returnTime || '',
            note: note || '',
            updateTime: updateTime || '',
            color: color,
            icon: icon
        };
    });
}

// ========================================
// 一覧表示
// ========================================
function renderStaffList() {
    elements.staffList.innerHTML = '';
    
    staffData.forEach(staff => {
        const card = createStaffCard(staff);
        elements.staffList.appendChild(card);
    });
}

function createStaffCard(staff) {
    const card = document.createElement('div');
    card.className = 'staff-card';
    card.style.setProperty('--card-color', staff.color);
    
    card.innerHTML = `
        <div class="staff-header">
            <span class="staff-icon">${staff.icon}</span>
            <h3 class="staff-name">${staff.name}</h3>
        </div>
        <div class="staff-destination">${staff.destination}</div>
        <div class="staff-details">
            ${staff.returnTime ? `
                <div class="staff-return">
                    <span class="icon">🕐</span>
                    <span>戻り：${staff.returnTime}</span>
                </div>
            ` : ''}
            ${staff.note ? `
                <div class="staff-note">
                    <span class="icon">📝</span>
                    <span>${staff.note}</span>
                </div>
            ` : ''}
        </div>
    `;
    
    return card;
}

// ========================================
// モーダル操作
// ========================================
function openModal() {
    elements.modal.classList.add('active');
    resetForm();
}

function closeModal() {
    elements.modal.classList.remove('active');
}

function resetForm() {
    elements.staffName.value = '';
    elements.customDestination.value = '';
    elements.returnTime.value = '';
    elements.noReturnTime.checked = false;
    elements.returnTime.disabled = false;
    elements.note.value = '';
    selectedDestination = '';
    
    // 行先選択解除
    const destinationItems = elements.destinationList.querySelectorAll('.destination-item');
    destinationItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // カスタム入力非表示
    elements.customDestinationGroup.style.display = 'none';
}

function selectDestination(item) {
    // 全選択解除
    const destinationItems = elements.destinationList.querySelectorAll('.destination-item');
    destinationItems.forEach(i => {
        i.classList.remove('active');
    });
    
    // 選択
    item.classList.add('active');
    selectedDestination = item.dataset.destination;
    
    // カスタム入力は非表示
    elements.customDestinationGroup.style.display = 'none';
}

// ========================================
// データ保存
// ========================================
async function saveData() {
    try {
        // バリデーション
        const name = elements.staffName.value;
        if (!name) {
            alert('氏名を選択してください');
            return;
        }
        
        if (!selectedDestination && !elements.customDestination.value) {
            alert('行先を選択してください');
            return;
        }
        
        // ローディング表示
        elements.btnSave.disabled = true;
        elements.btnSave.textContent = '保存中...';
        
        // データ準備
        const destination = selectedDestination || elements.customDestination.value;
        const returnTime = elements.noReturnTime.checked ? '' : elements.returnTime.value;
        const note = elements.note.value;
        
        // データを送信
        const requestData = {
            sheetName: currentDept.sheetName,
            name: name,
            destination: destination,
            returnTime: returnTime,
            note: note
        };
        
        console.log('Sending data:', requestData);
        
        // Google Apps Script Web Appにデータを送信
        const response = await fetch(CONFIG.WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData),
            redirect: 'follow'
        });
        
        console.log('Response status:', response.status);
        
        // レスポンスを解析
        let result;
        try {
            const text = await response.text();
            console.log('Response text:', text);
            result = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse response:', e);
            result = { success: true };
        }
        
        console.log('Result:', result);
        
        if (result.success !== false) {
            alert('保存しました');
            closeModal();
            setTimeout(() => {
                loadData();
            }, 1000);
        } else {
            throw new Error(result.message || '保存に失敗しました');
        }
        
    } catch (error) {
        console.error('Error saving data:', error);
        alert('保存に失敗しました: ' + error.message);
    } finally {
        elements.btnSave.disabled = false;
        elements.btnSave.innerHTML = '<span class="icon">💾</span> 保存';
    }
}

// ========================================
// 自動更新
// ========================================
function startAutoRefresh() {
    autoRefreshTimer = setInterval(() => {
        loadData();
    }, CONFIG.AUTO_REFRESH_INTERVAL);
}

function stopAutoRefresh() {
    if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
        autoRefreshTimer = null;
    }
}

// ========================================
// UI表示制御
// ========================================
function showLoading() {
    elements.loading.style.display = 'flex';
    elements.staffList.style.display = 'none';
    elements.error.style.display = 'none';
}

function hideLoading() {
    elements.loading.style.display = 'none';
    elements.staffList.style.display = 'grid';
}

function showError(message) {
    elements.error.style.display = 'block';
    elements.errorMessage.textContent = message;
    elements.staffList.style.display = 'none';
}

function hideError() {
    elements.error.style.display = 'none';
}

function updateTimeDisplay() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
    });
    elements.updateTime.textContent = `${timeString} 更新`;
}

// ========================================
// ページ離脱時
// ========================================
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
});