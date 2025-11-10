// Google Sheets API設定
const CONFIG = {
    // APIキー
    API_KEY: 'AIzaSyCrJrrk9nRMdc3RJ7i9bmGo740SfmbBvKQ',
    
    // スプレッドシートID
    SPREADSHEET_ID: '1UaeXlrjj0o1Eja4uNc22uuqzV0SDM0hdjLcXS5k4h4E',
    
    // シート名
    SHEET_NAME: 'DigitalPromotion',
    
    // Google Apps Script Web App URL（追加）
    WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbwjWSnzuGdsdamvomDUYN-9DwYpOYqBxPNlJvjtcqmvjTlUqfHeeI3tvtVgvuGAuUc/exec',  // ← ここを追加
    
    // 自動更新間隔（ミリ秒）
    AUTO_REFRESH_INTERVAL: 30000, // 30秒
    
    // 行先プリセット
    DESTINATIONS: [
        { name: '在席', color: '#4CAF50', icon: '🟢' },
        { name: '外出中', color: '#FFA726', icon: '🟡' },
        { name: '市役所本庁', color: '#42A5F5', icon: '🔵' },
        { name: '出張', color: '#42A5F5', icon: '🔵' },
        { name: '会議中', color: '#9C27B0', icon: '🟣' },
        { name: '休暇', color: '#BDBDBD', icon: '⚪' }
    ]
};