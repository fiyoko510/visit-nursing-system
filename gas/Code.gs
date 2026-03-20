/**
 * 訪問看護日程調整システム - Google Apps Script メインコード
 * 
 * このスクリプトは以下の機能を提供します：
 * - LINE Messaging APIからのWebhook受信
 * - LIFF からの予約データ受信
 * - 訪問希望日時の解析
 * - Googleカレンダーへの予定登録
 * - スプレッドシートへの自動記録
 * - 管理者への通知
 */

// ============================================================================
// 定数定義
// ============================================================================

const LINE_CHANNEL_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');
const LINE_CHANNEL_SECRET = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_SECRET');
const ADMIN_EMAIL = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL');

// 時間スロット設定（分単位）
const TIME_SLOT_MINUTES = 15; // 15分単位
const MIN_HOUR = 9;
const MAX_HOUR = 18;

// ============================================================================
// Webhook受信エンドポイント
// ============================================================================

/**
 * LINE Messaging APIからのWebhookを受信
 * POST /api/webhook でこの関数が呼び出されます
 */
function doPost(e) {
  try {
    const signature = e.parameter['X-Line-Signature'] || '';
    const body = e.postData.contents;

    // 署名検証
    if (!verifyLineSignature(body, signature)) {
      return ContentService.createTextOutput('Unauthorized').setMimeType(ContentService.MimeType.TEXT);
    }

    const events = JSON.parse(body).events || [];

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        handleLineMessage(event);
      } else if (event.type === 'postback') {
        handleLinePostback(event);
      }
    }

    return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService.createTextOutput('Error').setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * LIFF からのPOSTリクエストを受信
 * POST /api/liff-booking でこの関数が呼び出されます
 */
function doPost_LIFF(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    
    Logger.log('LIFF Booking Request: ' + JSON.stringify(body));
    
    // リクエストデータを検証
    if (!body.userId || !body.date || !body.startTime || !body.endTime || !body.durationMinutes) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: '必須項目が不足しています'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // LINE ユーザー情報を取得
    const userProfile = getLineUserProfile(body.userId);
    const userName = userProfile ? userProfile.displayName : body.userId;

    // 訪問予定を作成
    const startDateTime = new Date(body.date + 'T' + body.startTime + ':00');
    const endDateTime = new Date(body.date + 'T' + body.endTime + ':00');

    const visitRequest = {
      startTime: startDateTime,
      endTime: endDateTime,
      userName: userName,
      durationMinutes: body.durationMinutes,
      memo: body.memo || ''
    };

    // カレンダーに登録
    const eventId = addVisitToCalendar(visitRequest);

    if (eventId) {
      // 管理者に通知
      notifyAdmin(userName, visitRequest);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: '予約が確定しました',
        eventId: eventId,
        bookingDetails: {
          date: body.date,
          startTime: body.startTime,
          endTime: body.endTime,
          duration: body.durationMinutes + '分'
        }
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'カレンダー登録に失敗しました'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    Logger.log('Error in doPost_LIFF: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'エラーが発生しました: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// LINE メッセージハンドラー
// ============================================================================

/**
 * LINEテキストメッセージを処理
 * @param {Object} event - LINEイベントオブジェクト
 */
function handleLineMessage(event) {
  const userId = event.source.userId;
  const messageText = event.message.text;
  const replyToken = event.replyToken;

  Logger.log('Received message from ' + userId + ': ' + messageText);

  // メッセージを解析して訪問希望を抽出
  const visitRequest = parseVisitRequest(messageText, userId);

  if (visitRequest) {
    // カレンダーに登録
    const eventId = addVisitToCalendar(visitRequest);

    if (eventId) {
      // ユーザーに確認メッセージを送信
      sendLineReply(replyToken, {
        type: 'text',
        text: '訪問希望を受け付けました。\n' +
              '日時: ' + formatDateTime(visitRequest.startTime) + '\n' +
              '滞在時間: ' + visitRequest.durationMinutes + '分\n' +
              '管理者が確認してご連絡します。'
      });

      // 管理者に通知
      notifyAdmin(visitRequest.userName, visitRequest);
    } else {
      sendLineReply(replyToken, {
        type: 'text',
        text: 'カレンダー登録に失敗しました。もう一度お試しください。'
      });
    }
  } else {
    // 時間選択UIを提示
    sendTimeSelectionUI(replyToken, userId);
  }
}

/**
 * LINEポストバックイベントを処理（ボタン押下など）
 * @param {Object} event - LINEイベントオブジェクト
 */
function handleLinePostback(event) {
  const userId = event.source.userId;
  const data = event.postback.data;
  const replyToken = event.replyToken;

  Logger.log('Postback data: ' + data);

  // ポストバックデータを解析
  const params = new URLSearchParams(data);
  const action = params.get('action');

  if (action === 'select_time') {
    const date = params.get('date');
    const time = params.get('time');

    if (date && time) {
      const visitRequest = {
        date: date,
        time: time,
        startTime: new Date(date + 'T' + time + ':00'),
        userId: userId
      };

      const eventId = addVisitToCalendar(visitRequest);

      if (eventId) {
        sendLineReply(replyToken, {
          type: 'text',
          text: '訪問希望を受け付けました。\n' +
                '日時: ' + formatDateTime(visitRequest.startTime) + '\n' +
                '管理者が確認してご連絡します。'
        });

        notifyAdmin(visitRequest.userName || userId, visitRequest);
      }
    }
  }
}

// ============================================================================
// LINE API ユーティリティ
// ============================================================================

/**
 * LINE署名を検証
 * @param {string} body - リクエストボディ
 * @param {string} signature - X-Line-Signature ヘッダー値
 * @returns {boolean} 署名が有効な場合true
 */
function verifyLineSignature(body, signature) {
  const crypto = Utilities.computeHmacSha256Signature(body, LINE_CHANNEL_SECRET);
  const encoded = Utilities.base64Encode(crypto);
  return encoded === signature;
}

/**
 * LINEにリプライメッセージを送信
 * @param {string} replyToken - リプライトークン
 * @param {Object} message - メッセージオブジェクト
 */
function sendLineReply(replyToken, message) {
  const url = 'https://api.line.biz/v2/bot/message/reply';
  const payload = {
    replyToken: replyToken,
    messages: [message]
  };

  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  Logger.log('LINE Reply Response: ' + response.getContentText());
}

/**
 * LINE ユーザープロフィールを取得
 * @param {string} userId - ユーザーID
 * @returns {Object} ユーザープロフィール、失敗時はnull
 */
function getLineUserProfile(userId) {
  try {
    const url = 'https://api.line.biz/v2/bot/profile/' + userId;
    const options = {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (response.getResponseCode() === 200) {
      return result;
    }

    return null;
  } catch (error) {
    Logger.log('Error in getLineUserProfile: ' + error.toString());
    return null;
  }
}

/**
 * 時間選択UIをLINEで提示
 * @param {string} replyToken - リプライトークン
 * @param {string} userId - ユーザーID
 */
function sendTimeSelectionUI(replyToken, userId) {
  const message = {
    type: 'text',
    text: '訪問希望日時をお選びください。\n\n' +
          '以下の形式でメッセージを送信してください：\n' +
          '例）2026-03-25 14:30\n\n' +
          'または、LIFFで選択してください：',
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'uri',
            label: '📅 時間を選択',
            uri: 'https://liff.line.me/YOUR_LIFF_ID'
          }
        }
      ]
    }
  };

  sendLineReply(replyToken, message);
}

// ============================================================================
// メッセージ解析
// ============================================================================

/**
 * テキストメッセージから訪問希望を抽出
 * @param {string} text - メッセージテキスト
 * @param {string} userId - ユーザーID
 * @returns {Object|null} 訪問希望オブジェクト、または解析失敗時はnull
 */
function parseVisitRequest(text, userId) {
  // 日時パターン: YYYY-MM-DD HH:MM
  const dateTimePattern = /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/;
  const match = text.match(dateTimePattern);

  if (match) {
    const [, year, month, day, hour, minute] = match;
    const dateStr = year + '-' + month + '-' + day;
    const timeStr = hour + ':' + minute;

    // 時間の妥当性チェック
    if (isValidTimeSlot(parseInt(hour), parseInt(minute))) {
      const startTime = new Date(dateStr + 'T' + timeStr + ':00');
      const endTime = new Date(startTime.getTime() + DEFAULT_DURATION_MINUTES * 60 * 1000);

      // ユーザー情報を取得
      const userProfile = getLineUserProfile(userId);
      const userName = userProfile ? userProfile.displayName : userId;

      return {
        date: dateStr,
        time: timeStr,
        startTime: startTime,
        endTime: endTime,
        userName: userName,
        durationMinutes: DEFAULT_DURATION_MINUTES,
        userId: userId
      };
    }
  }

  return null;
}

/**
 * 時間スロットが有効か確認
 * @param {number} hour - 時間（0-23）
 * @param {number} minute - 分（0-59）
 * @returns {boolean} 有効な場合true
 */
function isValidTimeSlot(hour, minute) {
  // 営業時間内か確認
  if (hour < MIN_HOUR || hour >= MAX_HOUR) {
    return false;
  }

  // 15分単位か確認
  if (minute % TIME_SLOT_MINUTES !== 0) {
    return false;
  }

  return true;
}

// ============================================================================
// ユーティリティ関数
// ============================================================================

const DEFAULT_DURATION_MINUTES = 30;

/**
 * 日時をフォーマット
 * @param {Date} date - 日時オブジェクト
 * @returns {string} フォーマット済み日時文字列
 */
function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return year + '年' + month + '月' + day + '日 ' + hour + ':' + minute;
}

/**
 * 管理者に通知
 * @param {string} userName - ユーザー名
 * @param {Object} visitRequest - 訪問希望オブジェクト
 */
function notifyAdmin(userName, visitRequest) {
  try {
    const subject = '【訪問看護（おれんじさん）】新しい予約が登録されました';
    const body = 'ユーザー名: ' + userName + '\n' +
                 '希望日時: ' + formatDateTime(visitRequest.startTime) + '\n' +
                 '滞在時間: ' + visitRequest.durationMinutes + '分\n' +
                 '備考: ' + (visitRequest.memo || 'なし') + '\n' +
                 '\nGoogleカレンダーで確認してください。';

    if (ADMIN_EMAIL) {
      GmailApp.sendEmail(ADMIN_EMAIL, subject, body);
    }

    Logger.log('Admin notification sent for: ' + userName);
  } catch (error) {
    Logger.log('Error in notifyAdmin: ' + error.toString());
  }
}

// ============================================================================
// テスト関数
// ============================================================================

/**
 * GAS 全体のテスト関数
 */
function testAllFunctions() {
  Logger.log('=== GAS All Functions Test ===');

  // スプレッドシートの初期化
  initializeSpreadsheet();

  // テスト用の訪問希望を作成
  const testVisit = {
    startTime: new Date(2026, 2, 25, 14, 30),
    endTime: new Date(2026, 2, 25, 15, 30),
    userName: 'テスト利用者',
    durationMinutes: 60,
    memo: 'テスト訪問'
  };

  // イベント追加
  const eventId = addVisitToCalendar(testVisit);
  Logger.log('Created event: ' + eventId);

  // スプレッドシートから訪問記録を取得
  const records = getVisitRecords();
  Logger.log('Visit records: ' + JSON.stringify(records));
}
