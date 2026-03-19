/**
 * おれんじさん🍊 - LINE LIFF 設定ファイル
 * 
 * このファイルをコピーして config.js を作成し、
 * 以下の値を自分の環境に合わせて設定してください。
 */

const LIFF_CONFIG = {
    // LINE LIFF ID
    // LINE Developers コンソールから取得
    liffId: 'YOUR_LIFF_ID_HERE',

    // Google Apps Script デプロイメントURL
    // GAS の「新しいデプロイ」から「ウェブアプリ」として取得
    gasDeploymentUrl: 'YOUR_GAS_DEPLOYMENT_URL_HERE',

    // スプレッドシート ID
    // 予約データを記録するスプレッドシートのID
    spreadsheetId: 'YOUR_SPREADSHEET_ID_HERE',

    // Googleカレンダー ID
    // 予約を登録するカレンダーのID
    calendarId: 'YOUR_CALENDAR_ID_HERE',

    // 営業時間設定
    businessHours: {
        minHour: 9,      // 営業開始時間（9時）
        maxHour: 18,     // 営業終了時間（18時）
        slotMinutes: 30  // スロット間隔（30分）
    },

    // ブランド情報
    brand: {
        name: 'おれんじさん',
        emoji: '🍊',
        primaryColor: '#FF9500',
        darkColor: '#E67E22'
    },

    // API エンドポイント
    api: {
        // LINE Messaging API
        lineMessagingApi: 'https://api.line.biz/v2/bot/message',
        
        // Google API
        googleSheetsApi: 'https://sheets.googleapis.com/v4/spreadsheets',
        googleCalendarApi: 'https://www.googleapis.com/calendar/v3/calendars'
    }
};

// 設定の検証
function validateConfig() {
    const required = ['liffId', 'gasDeploymentUrl', 'spreadsheetId', 'calendarId'];
    const missing = required.filter(key => !LIFF_CONFIG[key] || LIFF_CONFIG[key].includes('YOUR_'));
    
    if (missing.length > 0) {
        console.warn('[Config] 以下の設定が必要です:', missing);
        return false;
    }
    
    console.log('[Config] 設定が正常に読み込まれました');
    return true;
}

// エクスポート（モジュール化時用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LIFF_CONFIG;
}
