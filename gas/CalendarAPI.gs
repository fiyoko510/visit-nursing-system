/**
 * Googleカレンダー操作ライブラリ
 * 
 * このモジュールは以下の機能を提供します：
 * - 訪問予定の登録
 * - 訪問予定の更新
 * - 訪問予定の削除
 * - 訪問予定の検索
 */

// ============================================================================
// 定数定義
// ============================================================================

const CALENDAR_ID_PROP = PropertiesService.getScriptProperties().getProperty('CALENDAR_ID');
const VISIT_EVENT_PREFIX = '[訪問看護]';
const DEFAULT_DURATION_MINUTES = 30;

// ============================================================================
// カレンダー操作関数
// ============================================================================

/**
 * 訪問予定をGoogleカレンダーに追加
 * @param {Object} visitRequest - 訪問希望オブジェクト
 *   - startTime: Date オブジェクト（開始時刻）
 *   - userId: string ユーザーID
 *   - notes: string（オプション）備考
 * @param {string} userId - ユーザーID
 * @returns {string} 作成されたイベントID、失敗時はnull
 */
function addVisitToCalendar(visitRequest, userId) {
  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID_PROP);
    
    if (!calendar) {
      Logger.log('Calendar not found: ' + CALENDAR_ID_PROP);
      return null;
    }

    // イベント作成
    const startTime = visitRequest.startTime;
    const endTime = new Date(startTime.getTime() + DEFAULT_DURATION_MINUTES * 60 * 1000);

    const eventTitle = VISIT_EVENT_PREFIX + ' ' + userId;
    const eventDescription = '訪問看護の予定\n' +
                             'ユーザーID: ' + userId + '\n' +
                             '登録日時: ' + new Date().toLocaleString('ja-JP');

    const event = calendar.createEvent(eventTitle, startTime, endTime, {
      description: eventDescription,
      location: '訪問先',
      guests: ADMIN_EMAIL
    });

    const eventId = event.getId();
    Logger.log('Event created: ' + eventId);

    return eventId;
  } catch (error) {
    Logger.log('Error in addVisitToCalendar: ' + error.toString());
    return null;
  }
}

/**
 * 訪問予定を更新
 * @param {string} eventId - イベントID
 * @param {Object} updates - 更新内容
 *   - startTime: Date（オプション）
 *   - endTime: Date（オプション）
 *   - title: string（オプション）
 *   - description: string（オプション）
 *   - status: string（オプション）'confirmed' | 'tentative' | 'cancelled'
 * @returns {boolean} 成功時true、失敗時false
 */
function updateVisitEvent(eventId, updates) {
  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID_PROP);
    const event = calendar.getEventById(eventId);

    if (!event) {
      Logger.log('Event not found: ' + eventId);
      return false;
    }

    // 開始時刻の更新
    if (updates.startTime) {
      event.setTime(updates.startTime, updates.endTime || new Date(updates.startTime.getTime() + DEFAULT_DURATION_MINUTES * 60 * 1000));
    }

    // タイトルの更新
    if (updates.title) {
      event.setTitle(updates.title);
    }

    // 説明の更新
    if (updates.description) {
      event.setDescription(updates.description);
    }

    Logger.log('Event updated: ' + eventId);
    return true;
  } catch (error) {
    Logger.log('Error in updateVisitEvent: ' + error.toString());
    return false;
  }
}

/**
 * 訪問予定を削除
 * @param {string} eventId - イベントID
 * @returns {boolean} 成功時true、失敗時false
 */
function deleteVisitEvent(eventId) {
  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID_PROP);
    const event = calendar.getEventById(eventId);

    if (!event) {
      Logger.log('Event not found: ' + eventId);
      return false;
    }

    event.deleteEvent();
    Logger.log('Event deleted: ' + eventId);
    return true;
  } catch (error) {
    Logger.log('Error in deleteVisitEvent: ' + error.toString());
    return false;
  }
}

/**
 * 指定日付の訪問予定を取得
 * @param {Date} date - 検索対象日付
 * @returns {Array} イベント配列
 */
function getVisitsForDate(date) {
  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID_PROP);
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

    const events = calendar.getEvents(startOfDay, endOfDay);
    const visits = events.filter(event => event.getTitle().includes(VISIT_EVENT_PREFIX));

    return visits;
  } catch (error) {
    Logger.log('Error in getVisitsForDate: ' + error.toString());
    return [];
  }
}

/**
 * 指定期間の訪問予定を取得
 * @param {Date} startDate - 開始日付
 * @param {Date} endDate - 終了日付
 * @returns {Array} イベント配列
 */
function getVisitsBetweenDates(startDate, endDate) {
  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID_PROP);
    const events = calendar.getEvents(startDate, endDate);
    const visits = events.filter(event => event.getTitle().includes(VISIT_EVENT_PREFIX));

    return visits;
  } catch (error) {
    Logger.log('Error in getVisitsBetweenDates: ' + error.toString());
    return [];
  }
}

/**
 * 訪問予定の詳細情報を取得
 * @param {string} eventId - イベントID
 * @returns {Object} イベント情報、見つからない場合はnull
 */
function getVisitEventDetails(eventId) {
  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID_PROP);
    const event = calendar.getEventById(eventId);

    if (!event) {
      return null;
    }

    return {
      id: eventId,
      title: event.getTitle(),
      description: event.getDescription(),
      startTime: event.getStartTime(),
      endTime: event.getEndTime(),
      location: event.getLocation(),
      guests: event.getGuestList(),
      color: event.getColor()
    };
  } catch (error) {
    Logger.log('Error in getVisitEventDetails: ' + error.toString());
    return null;
  }
}

/**
 * 訪問予定の確定状態を更新
 * @param {string} eventId - イベントID
 * @param {string} status - ステータス ('confirmed' | 'tentative' | 'cancelled')
 * @returns {boolean} 成功時true、失敗時false
 */
function updateVisitStatus(eventId, status) {
  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID_PROP);
    const event = calendar.getEventById(eventId);

    if (!event) {
      Logger.log('Event not found: ' + eventId);
      return false;
    }

    // ステータスに応じてイベントの色を変更
    let color;
    switch (status) {
      case 'confirmed':
        color = CalendarApp.EventColor.GREEN;
        event.setTitle('[確定] ' + event.getTitle().replace(/^\[.*?\]\s*/, ''));
        break;
      case 'tentative':
        color = CalendarApp.EventColor.YELLOW;
        event.setTitle('[調整中] ' + event.getTitle().replace(/^\[.*?\]\s*/, ''));
        break;
      case 'cancelled':
        color = CalendarApp.EventColor.RED;
        event.setTitle('[キャンセル] ' + event.getTitle().replace(/^\[.*?\]\s*/, ''));
        break;
      default:
        return false;
    }

    event.setColor(color);
    Logger.log('Event status updated: ' + eventId + ' -> ' + status);
    return true;
  } catch (error) {
    Logger.log('Error in updateVisitStatus: ' + error.toString());
    return false;
  }
}

/**
 * 利用可能な時間スロットを取得
 * @param {Date} date - 対象日付
 * @param {number} minHour - 営業開始時間（0-23）
 * @param {number} maxHour - 営業終了時間（0-23）
 * @param {number} slotMinutes - スロット間隔（分）
 * @returns {Array} 利用可能な時間スロット配列
 */
function getAvailableTimeSlots(date, minHour, maxHour, slotMinutes) {
  try {
    const visits = getVisitsForDate(date);
    const occupiedSlots = new Set();

    // 予約済みスロットを記録
    for (const visit of visits) {
      const startTime = visit.getStartTime();
      const endTime = visit.getEndTime();
      const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
      const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

      for (let m = startMinutes; m < endMinutes; m += slotMinutes) {
        occupiedSlots.add(m);
      }
    }

    // 利用可能なスロットを生成
    const availableSlots = [];
    for (let hour = minHour; hour < maxHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotMinutes) {
        const slotMinutes_val = hour * 60 + minute;
        if (!occupiedSlots.has(slotMinutes_val)) {
          availableSlots.push({
            hour: hour,
            minute: minute,
            display: String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0')
          });
        }
      }
    }

    return availableSlots;
  } catch (error) {
    Logger.log('Error in getAvailableTimeSlots: ' + error.toString());
    return [];
  }
}

// ============================================================================
// テスト関数
// ============================================================================

/**
 * カレンダー操作のテスト関数
 */
function testCalendarOperations() {
  Logger.log('=== Calendar Operations Test ===');

  // テスト用の訪問希望を作成
  const testVisit = {
    startTime: new Date(2026, 2, 25, 14, 30),
    userId: 'test-user-001',
    notes: 'テスト訪問'
  };

  // イベント追加
  const eventId = addVisitToCalendar(testVisit, testVisit.userId);
  Logger.log('Created event: ' + eventId);

  if (eventId) {
    // イベント詳細取得
    const details = getVisitEventDetails(eventId);
    Logger.log('Event details: ' + JSON.stringify(details));

    // ステータス更新
    updateVisitStatus(eventId, 'confirmed');
    Logger.log('Status updated to confirmed');

    // 利用可能なスロット取得
    const slots = getAvailableTimeSlots(new Date(2026, 2, 25), 9, 18, 30);
    Logger.log('Available slots: ' + JSON.stringify(slots));
  }
}
