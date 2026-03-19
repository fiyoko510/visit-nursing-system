/**
 * 訪問看護日程調整システム - Google Apps Script メインコード
 * 
 * このスクリプトは以下の機能を提供します：
 * - LINE Messaging APIからのWebhook受信
 * - 訪問希望日時の解析
 * - Googleカレンダーへの予定登録
 * - 管理者への通知
 */

// ============================================================================
// 定数定義
// ============================================================================

const LINE_CHANNEL_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');
const LINE_CHANNEL_SECRET = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_SECRET');
const CALENDAR_ID = PropertiesService.getScriptProperties().getProperty('CALENDAR_ID');
const ADMIN_EMAIL = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL');

// 時間スロット設定（分単位）
const TIME_SLOT_MINUTES = 30;
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
  const visitRequest = parseVisitRequest(messageText);

  if (visitRequest) {
    // カレンダーに登録
    const eventId = addVisitToCalendar(visitRequest, userId);

    if (eventId) {
      // ユーザーに確認メッセージを送信
      sendLineReply(replyToken, {
        type: 'text',
        text: '訪問希望を受け付けました。\n' +
              '日時: ' + formatDateTime(visitRequest.startTime) + '\n' +
              '管理者が確認してご連絡します。'
      });

      // 管理者に通知
      notifyAdmin(userId, visitRequest);
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

      const eventId = addVisitToCalendar(visitRequest, userId);

      if (eventId) {
        sendLineReply(replyToken, {
          type: 'text',
          text: '訪問希望を受け付けました。\n' +
                '日時: ' + formatDateTime(visitRequest.startTime) + '\n' +
                '管理者が確認してご連絡します。'
        });

        notifyAdmin(userId, visitRequest);
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
            label: '時間を選択',
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
 * @returns {Object|null} 訪問希望オブジェクト、または解析失敗時はnull
 */
function parseVisitRequest(text) {
  // 日時パターン: YYYY-MM-DD HH:MM
  const dateTimePattern = /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/;
  const match = text.match(dateTimePattern);

  if (match) {
    const [, year, month, day, hour, minute] = match;
    const dateStr = year + '-' + month + '-' + day;
    const timeStr = hour + ':' + minute;

    // 時間の妥当性チェック
    if (isValidTimeSlot(parseInt(hour), parseInt(minute))) {
      return {
        date: dateStr,
        time: timeStr,
        startTime: new Date(dateStr + 'T' + timeStr + ':00'),
        userId: null
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

  // 30分単位か確認
  if (minute % TIME_SLOT_MINUTES !== 0) {
    return false;
  }

  return true;
}

// ============================================================================
// ユーティリティ関数
// ============================================================================

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
 * @param {string} userId - ユーザーID
 * @param {Object} visitRequest - 訪問希望オブジェクト
 */
function notifyAdmin(userId, visitRequest) {
  const subject = '【訪問看護】新しい希望が登録されました';
  const body = 'ユーザーID: ' + userId + '\n' +
               '希望日時: ' + formatDateTime(visitRequest.startTime) + '\n' +
               '\nGoogleカレンダーで確認してください。';

  GmailApp.sendEmail(ADMIN_EMAIL, subject, body);
}
