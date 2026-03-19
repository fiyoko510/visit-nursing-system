/**
 * おれんじさん🍊 - LINE LIFF 訪問看護予約システム
 * フロントエンドスクリプト
 */

// ============================================================================
// グローバル変数
// ============================================================================

let liffId = 'YOUR_LIFF_ID'; // 後で設定ファイルから読み込み
let userId = null;
let selectedDate = null;
let selectedSlots = []; // 選択した時間帯のリスト [{hour: 9, minute: 0}, ...]
let currentHour = null;
let currentMinute = null;

// ============================================================================
// 初期化
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // LINE SDK の初期化
        await initLiff();
        
        // イベントリスナーの設定
        setupEventListeners();
        
        // 最小日付を今日に設定
        setMinDate();
        
        Logger.log('LIFF initialized successfully');
    } catch (error) {
        Logger.error('Initialization error:', error);
        showErrorModal('初期化に失敗しました。もう一度お試しください。');
    }
});

/**
 * LIFF の初期化
 */
async function initLiff() {
    return new Promise((resolve, reject) => {
        liff.init({ liffId: liffId })
            .then(() => {
                if (!liff.isLoggedIn()) {
                    liff.login();
                } else {
                    userId = liff.getContext().userId;
                    resolve();
                }
            })
            .catch(error => {
                reject(error);
            });
    });
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
    // 時間ボタンのクリックイベント
    document.querySelectorAll('.hour-btn').forEach(btn => {
        btn.addEventListener('click', () => selectHour(btn));
    });

    document.querySelectorAll('.minute-btn').forEach(btn => {
        btn.addEventListener('click', () => selectMinute(btn));
    });
}

/**
 * 最小日付を今日に設定
 */
function setMinDate() {
    const today = new Date();
    const dateString = formatDateForInput(today);
    document.getElementById('datePicker').min = dateString;
    document.getElementById('datePicker').value = dateString;
}

/**
 * 日付をinput[type="date"]形式にフォーマット
 */
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ============================================================================
// ステップ遷移
// ============================================================================

/**
 * 日付選択 → 時間選択へ
 */
function goToTimeSelection() {
    const dateInput = document.getElementById('datePicker').value;
    
    if (!dateInput) {
        showErrorModal('日付を選んでください。');
        return;
    }

    selectedDate = new Date(dateInput + 'T00:00:00');
    
    // ステップインジケーターの更新
    updateStepIndicator(2);
    
    // コンテンツの切り替え
    switchStep(1, 2);
}

/**
 * 時間選択 → 確認へ
 */
function goToConfirmation() {
    if (selectedSlots.length === 0) {
        showErrorModal('時間を選んでください。');
        return;
    }

    // 確認画面に情報を表示
    displayConfirmation();
    
    // ステップインジケーターの更新
    updateStepIndicator(3);
    
    // コンテンツの切り替え
    switchStep(2, 3);
}

/**
 * 時間選択 → 日付選択へ戻る
 */
function backToDateSelection() {
    updateStepIndicator(1);
    switchStep(2, 1);
}

/**
 * 確認 → 時間選択へ戻る
 */
function backToTimeSelection() {
    updateStepIndicator(2);
    switchStep(3, 2);
}

/**
 * ステップコンテンツの切り替え
 */
function switchStep(fromStep, toStep) {
    document.getElementById(`step-content-${fromStep}`).classList.remove('active');
    document.getElementById(`step-content-${toStep}`).classList.add('active');
}

/**
 * ステップインジケーターの更新
 */
function updateStepIndicator(currentStep) {
    document.querySelectorAll('.step').forEach((step, index) => {
        if (index + 1 <= currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

// ============================================================================
// 時間選択ロジック
// ============================================================================

/**
 * 時間（時）を選択
 */
function selectHour(button) {
    // 前の選択を解除
    document.querySelectorAll('.hour-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // 新しい選択を適用
    button.classList.add('selected');
    currentHour = parseInt(button.dataset.hour);
}

/**
 * 分を選択
 */
function selectMinute(button) {
    // 前の選択を解除
    document.querySelectorAll('.minute-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // 新しい選択を適用
    button.classList.add('selected');
    currentMinute = parseInt(button.dataset.minute);
}

/**
 * 選択した時間帯を追加
 */
function addTimeSlot() {
    if (currentHour === null || currentMinute === null) {
        showErrorModal('時間と分を両方選んでください。');
        return;
    }

    // 既に同じ時間が選択されていないか確認
    const isDuplicate = selectedSlots.some(slot => 
        slot.hour === currentHour && slot.minute === currentMinute
    );

    if (isDuplicate) {
        showErrorModal('この時間帯は既に選択されています。');
        return;
    }

    // スロットを追加
    selectedSlots.push({
        hour: currentHour,
        minute: currentMinute
    });

    // 時間順でソート
    selectedSlots.sort((a, b) => {
        const timeA = a.hour * 60 + a.minute;
        const timeB = b.hour * 60 + b.minute;
        return timeA - timeB;
    });

    // UIを更新
    updateSelectedSlotsDisplay();
    updateTotalTime();
    updateConfirmButton();

    // 選択をリセット
    currentHour = null;
    currentMinute = null;
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
}

/**
 * 選択した時間帯の表示を更新
 */
function updateSelectedSlotsDisplay() {
    const container = document.getElementById('selectedSlots');
    
    if (selectedSlots.length === 0) {
        container.innerHTML = '<p class="empty-message">時間を選んでください</p>';
        return;
    }

    container.innerHTML = selectedSlots.map((slot, index) => {
        const startTime = formatTime(slot.hour, slot.minute);
        const endHour = slot.minute === 30 ? slot.hour + 1 : slot.hour;
        const endMinute = slot.minute === 30 ? 0 : 30;
        const endTime = formatTime(endHour, endMinute);

        return `
            <span class="slot-badge">
                ${startTime}～${endTime}
                <button class="remove-btn" onclick="removeTimeSlot(${index})" title="削除">×</button>
            </span>
        `;
    }).join('');
}

/**
 * 時間帯を削除
 */
function removeTimeSlot(index) {
    selectedSlots.splice(index, 1);
    updateSelectedSlotsDisplay();
    updateTotalTime();
    updateConfirmButton();
}

/**
 * 合計時間を更新
 */
function updateTotalTime() {
    const totalMinutes = selectedSlots.length * 30;
    document.getElementById('totalMinutes').textContent = totalMinutes;
}

/**
 * 確認ボタンの有効化/無効化を更新
 */
function updateConfirmButton() {
    const confirmBtn = document.getElementById('confirmBtn');
    confirmBtn.disabled = selectedSlots.length === 0;
}

/**
 * 時刻をフォーマット
 */
function formatTime(hour, minute) {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// ============================================================================
// 確認画面
// ============================================================================

/**
 * 確認画面に情報を表示
 */
function displayConfirmation() {
    // 日付の表示
    const dateStr = formatDateForDisplay(selectedDate);
    document.getElementById('confirmDate').textContent = dateStr;

    // 時間帯の表示
    const startSlot = selectedSlots[0];
    const endSlot = selectedSlots[selectedSlots.length - 1];
    const startTime = formatTime(startSlot.hour, startSlot.minute);
    const endHour = endSlot.minute === 30 ? endSlot.hour + 1 : endSlot.hour;
    const endMinute = endSlot.minute === 30 ? 0 : 30;
    const endTime = formatTime(endHour, endMinute);
    
    document.getElementById('confirmTime').textContent = `${startTime}～${endTime}`;

    // 合計時間の表示
    const totalMinutes = selectedSlots.length * 30;
    document.getElementById('confirmDuration').textContent = `${totalMinutes}分`;
}

/**
 * 日付をフォーマット（表示用）
 */
function formatDateForDisplay(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    
    return `${year}年${month}月${day}日（${dayOfWeek}）`;
}

// ============================================================================
// 予約送信
// ============================================================================

/**
 * 予約を確定して送信
 */
async function submitReservation() {
    try {
        // ローディング表示
        showLoading();

        // 予約データを作成
        const reservationData = {
            userId: userId,
            date: formatDateForAPI(selectedDate),
            startTime: formatTimeForAPI(selectedSlots[0]),
            endTime: formatTimeForAPI(
                selectedSlots[selectedSlots.length - 1],
                true // endTime フラグ
            ),
            durationMinutes: selectedSlots.length * 30,
            slots: selectedSlots
        };

        // GAS に送信
        const response = await sendToGAS(reservationData);

        if (response.success) {
            hideLoading();
            showSuccessModal();
        } else {
            hideLoading();
            showErrorModal(response.message || '予約の送信に失敗しました。');
        }
    } catch (error) {
        hideLoading();
        Logger.error('Submission error:', error);
        showErrorModal('エラーが発生しました。もう一度お試しください。');
    }
}

/**
 * GAS に予約データを送信
 */
async function sendToGAS(data) {
    const gasUrl = 'YOUR_GAS_DEPLOYMENT_URL'; // 後で設定ファイルから読み込み

    try {
        const response = await fetch(gasUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'submitReservation',
                data: data
            })
        });

        return await response.json();
    } catch (error) {
        Logger.error('GAS communication error:', error);
        throw error;
    }
}

/**
 * 日付を API 形式にフォーマット
 */
function formatDateForAPI(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 時刻を API 形式にフォーマット
 */
function formatTimeForAPI(slot, isEndTime = false) {
    let hour = slot.hour;
    let minute = slot.minute;

    if (isEndTime) {
        // 終了時刻は次の30分
        if (minute === 30) {
            hour += 1;
            minute = 0;
        } else {
            minute = 30;
        }
    }

    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// ============================================================================
// UI ユーティリティ
// ============================================================================

/**
 * ローディング表示
 */
function showLoading() {
    document.getElementById('loading').classList.add('active');
}

/**
 * ローディング非表示
 */
function hideLoading() {
    document.getElementById('loading').classList.remove('active');
}

/**
 * 成功モーダルを表示
 */
function showSuccessModal() {
    document.getElementById('successModal').classList.add('active');
}

/**
 * エラーモーダルを表示
 */
function showErrorModal(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorModal').classList.add('active');
}

/**
 * エラーモーダルを閉じる
 */
function closeErrorModal() {
    document.getElementById('errorModal').classList.remove('active');
}

/**
 * アプリを閉じる
 */
function closeApp() {
    liff.closeWindow();
}

// ============================================================================
// ロギング（デバッグ用）
// ============================================================================

const Logger = {
    log: (message, data = null) => {
        console.log(`[LIFF] ${message}`, data || '');
    },
    error: (message, error = null) => {
        console.error(`[LIFF ERROR] ${message}`, error || '');
    },
    warn: (message, data = null) => {
        console.warn(`[LIFF WARN] ${message}`, data || '');
    }
};
