/**
 * おれんじさん🍊 - LINE LIFF 訪問看護予約システム
 * 設定ファイル
 * 
 * このファイルに以下の情報を設定してください：
 * 1. LIFF ID（LINE Developers で取得）
 * 2. GAS デプロイメント URL
 * 3. Google カレンダー ID
 * 4. Google スプレッドシート ID
 */

// ============================================================================
// LINE LIFF 設定
// ============================================================================

// LINE Developers で取得した LIFF ID
const LIFF_ID = '2009557143-qmrzpjZm';

// GAS デプロイメント URL（デプロイ後に設定）
const GAS_DEPLOYMENT_URL = 'https://script.google.com/macros/d/AKfycbycb69qZg0wwtvB3lEtyRK4Nh5QLsXeok9Er79X60hlMlrhtSQ8s1ouX3qJB0lrOuUg/usercallback';

// ============================================================================
// Google API 設定
// ============================================================================

// Google カレンダー ID
// 訪問看護（おれんじさん）カレンダーのID
const CALENDAR_ID = '64648f1b8e57c434888cc77fc75062f7d35b2e41f74b54beeb03bbe4dd11254c@group.calendar.google.com';

// Google スプレッドシート ID
// 予約管理用スプレッドシート
const SPREADSHEET_ID = '1OiE4g3gWDC0cuSeBmcZCMP70G0-XPOIqAQtFS3rlRI4';

// ============================================================================
// LINE Messaging API 設定
// ============================================================================

// LINE Channel ID（LINE Developers で取得）
const LINE_CHANNEL_ID = '2009557319';

// LINE Channel Secret（LINE Developers で取得）
const LINE_CHANNEL_SECRET = '24f9b274fdbb2f24da0768a2a1bd7544';

// LINE Channel Access Token（LINE Developers で取得）
const LINE_CHANNEL_ACCESS_TOKEN = 'sdCrp/y6qz+12rJoyzKz+qzbt22X3G4SPoTLKCDzRAz0ul5lTu+lG74b4SvjPthv/Gek8AOv3zmJKUXOeMaYHSJ2eK3V2hG+RliaPyQOv3YLSiMEzh2xrpTVDBPD5/EeYJ6/M5RpAcWqZY49WRmAoAdB04t89/l0/w1cDnyilFU=';

// ============================================================================
// アプリケーション設定
// ============================================================================

// 営業時間（時間）
const BUSINESS_HOURS = {
    start: 9,   // 9:00
    end: 18     // 18:00
};

// 時間スロット単位（分）
const TIME_SLOT_MINUTES = 15;

// デフォルト訪問時間（分）
const DEFAULT_VISIT_DURATION = 30;

// ============================================================================
// ブランド設定
// ============================================================================

// アプリケーション名
const APP_NAME = 'おれんじさん🍊';

// ブランドカラー（RGB）
const BRAND_COLORS = {
    primary: '#FF9500',      // オレンジ
    primaryDark: '#E67E00',  // ダークオレンジ
    secondary: '#FFC966',    // ライトオレンジ
    success: '#4CAF50',      // 成功（緑）
    error: '#F44336',        // エラー（赤）
    text: '#333333',         // テキスト（濃いグレー）
    textLight: '#666666',    // ライトテキスト
    background: '#FFFFFF',   // 背景（白）
    backgroundLight: '#F5F5F5' // ライト背景
};

// ============================================================================
// 設定検証関数
// ============================================================================

/**
 * 設定が完全に入力されているか確認
 * @returns {Object} {isValid: boolean, missingFields: string[]}
 */
function validateConfig() {
    const missingFields = [];

    if (LIFF_ID === 'YOUR_LIFF_ID') {
        missingFields.push('LIFF_ID');
    }

    if (GAS_DEPLOYMENT_URL === 'YOUR_GAS_DEPLOYMENT_URL') {
        missingFields.push('GAS_DEPLOYMENT_URL');
    }

    if (LINE_CHANNEL_ID === 'YOUR_CHANNEL_ID') {
        missingFields.push('LINE_CHANNEL_ID');
    }

    if (LINE_CHANNEL_SECRET === 'YOUR_CHANNEL_SECRET') {
        missingFields.push('LINE_CHANNEL_SECRET');
    }

    if (LINE_CHANNEL_ACCESS_TOKEN === 'YOUR_CHANNEL_ACCESS_TOKEN') {
        missingFields.push('LINE_CHANNEL_ACCESS_TOKEN');
    }

    return {
        isValid: missingFields.length === 0,
        missingFields: missingFields
    };
}

/**
 * 設定をコンソールに出力（デバッグ用）
 */
function logConfig() {
    console.log('=== おれんじさん🍊 設定情報 ===');
    console.log('LIFF ID:', LIFF_ID);
    console.log('GAS URL:', GAS_DEPLOYMENT_URL);
    console.log('Calendar ID:', CALENDAR_ID);
    console.log('Spreadsheet ID:', SPREADSHEET_ID);
    console.log('Brand Color:', BRAND_COLORS.primary);
    console.log('Business Hours:', BUSINESS_HOURS.start + ':00 - ' + BUSINESS_HOURS.end + ':00');
}

// ============================================================================
// 初期化チェック
// ============================================================================

// ページロード時に設定を検証
document.addEventListener('DOMContentLoaded', () => {
    const validation = validateConfig();
    
    if (!validation.isValid) {
        console.warn('⚠️ 設定が不完全です。以下のフィールドを設定してください:');
        validation.missingFields.forEach(field => {
            console.warn('  - ' + field);
        });
    }
});
