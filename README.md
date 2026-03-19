# 訪問看護日程調整システム

LINEとGoogleカレンダーを連携させた、訪問看護の日程調整システムです。患者がLINEからスマートフォンで分単位の時間を選択して訪問希望を送信でき、看護師が確定するとGoogleカレンダーに自動反映されます。

## 🎯 主な機能

- **LINE LIFF画面**：スマートフォンでポチポチ選択できる時間選択UI
- **分単位の時間指定**：16:15、17:20など、30分単位での選択が可能
- **複数枠連続利用**：1時間など、複数の30分枠を連続で予約可能
- **Googleカレンダー連携**：確定した訪問予定が自動的にカレンダーに反映
- **管理者通知**：新しい希望が登録されると、管理者にメール通知

## 📋 システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                     LINE ユーザー                           │
│              (患者・訪問希望者)                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ LINE Messaging API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Google Apps Script (GAS)                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Code.gs                                              │  │
│  │ - Webhook受信                                        │  │
│  │ - メッセージ解析                                    │  │
│  │ - LINE API連携                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ CalendarAPI.gs                                       │  │
│  │ - Googleカレンダー操作                              │  │
│  │ - 予定の追加・更新・削除                            │  │
│  │ - 利用可能スロット検索                              │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────┬──────────────────────────────┬─────────────────┘
             │                              │
             │ Google Calendar API          │ Gmail API
             ▼                              ▼
┌─────────────────────────────┐  ┌──────────────────────────┐
│   Google Calendar           │  │   Gmail                  │
│  (訪問予定の管理)           │  │  (管理者への通知)        │
└─────────────────────────────┘  └──────────────────────────┘
```

## 🚀 クイックスタート

### 前提条件

- Google アカウント
- LINE 公式アカウント（[LINE Developers](https://developers.line.biz/ja/)で作成）
- Google Apps Script の基本知識

### セットアップ手順

1. **LINE Developers の設定**

   [docs/LINE_DEVELOPERS_SETUP.md](docs/LINE_DEVELOPERS_SETUP.md) を参照して、以下の情報を取得してください：
   - Channel Access Token
   - Channel Secret
   - Channel ID
   - LIFF ID

2. **GASプロジェクトの作成**

   ```bash
   # Google Apps Script CLI をインストール（オプション）
   npm install -g @google/clasp
   ```

3. **コードのデプロイ**

   - [Google Apps Script](https://script.google.com) を開く
   - 新しいプロジェクトを作成
   - `gas/Code.gs` と `gas/CalendarAPI.gs` の内容をコピー
   - スクリプトプロパティに以下を設定：
     ```
     LINE_CHANNEL_ACCESS_TOKEN: [取得したトークン]
     LINE_CHANNEL_SECRET: [取得したシークレット]
     CALENDAR_ID: [Googleカレンダーの公開ID]
     ADMIN_EMAIL: [管理者のメールアドレス]
     ```

4. **Webhookの設定**

   - GASをデプロイ（新規デプロイ → Web アプリ）
   - デプロイメントURLをコピー
   - LINE Developers の Webhook URL に設定

5. **動作確認**

   - LINE公式アカウントを友だち追加
   - メッセージを送信して動作確認

## 📁 ディレクトリ構成

```
visit-nursing-system/
├── README.md                          # このファイル
├── docs/
│   ├── LINE_DEVELOPERS_SETUP.md       # LINE Developers設定ガイド
│   ├── GAS_SETUP.md                   # GAS設定ガイド（今後作成）
│   └── ARCHITECTURE.md                # システムアーキテクチャ（今後作成）
├── gas/
│   ├── Code.gs                        # GASメインコード
│   ├── CalendarAPI.gs                 # Googleカレンダー操作ライブラリ
│   ├── LineAPI.gs                     # LINE API連携（今後作成）
│   └── appsscript.json                # GAS設定ファイル
├── line-liff/
│   ├── index.html                     # LIFF画面（今後作成）
│   ├── css/
│   │   └── style.css                  # スタイル（今後作成）
│   ├── js/
│   │   ├── main.js                    # メインロジック（今後作成）
│   │   ├── time-picker.js             # 時間選択UI（今後作成）
│   │   └── calendar-integration.js    # カレンダー連携（今後作成）
│   └── manifest.json                  # マニフェスト（今後作成）
├── config/
│   ├── .env.example                   # 環境変数テンプレート（今後作成）
│   └── constants.js                   # 定数定義（今後作成）
└── .gitignore
```

## 🔧 主要な関数

### Code.gs

| 関数名 | 説明 |
|--------|------|
| `doPost(e)` | LINE Webhookエンドポイント |
| `handleLineMessage(event)` | テキストメッセージの処理 |
| `handleLinePostback(event)` | ポストバックイベントの処理 |
| `verifyLineSignature(body, signature)` | LINE署名検証 |
| `sendLineReply(replyToken, message)` | LINEへのリプライ送信 |
| `parseVisitRequest(text)` | メッセージから訪問希望を抽出 |

### CalendarAPI.gs

| 関数名 | 説明 |
|--------|------|
| `addVisitToCalendar(visitRequest, userId)` | 訪問予定を追加 |
| `updateVisitEvent(eventId, updates)` | 訪問予定を更新 |
| `deleteVisitEvent(eventId)` | 訪問予定を削除 |
| `getVisitsForDate(date)` | 指定日の訪問予定を取得 |
| `getAvailableTimeSlots(date, minHour, maxHour, slotMinutes)` | 利用可能なスロットを取得 |

## 📝 使用例

### テキストメッセージで訪問希望を送信

```
ユーザー: 2026-03-25 14:30
システム: 訪問希望を受け付けました。
         日時: 2026年03月25日 14:30
         管理者が確認してご連絡します。
```

### 利用可能なスロットを確認

```javascript
const date = new Date(2026, 2, 25);
const slots = getAvailableTimeSlots(date, 9, 18, 30);
console.log(slots);
// 出力: [
//   { hour: 9, minute: 0, display: '09:00' },
//   { hour: 9, minute: 30, display: '09:30' },
//   ...
// ]
```

## 🔐 セキュリティ

- **Webhook署名検証**：すべてのWebhookリクエストは署名で検証
- **トークン管理**：アクセストークンはスクリプトプロパティで管理
- **本番環境対応**：環境変数で設定値を外部化

詳細は [docs/LINE_DEVELOPERS_SETUP.md](docs/LINE_DEVELOPERS_SETUP.md) のセキュリティセクションを参照してください。

## 📚 ドキュメント

- [LINE Developers 設定ガイド](docs/LINE_DEVELOPERS_SETUP.md) - LINE側の設定手順
- [GAS セットアップガイド](docs/GAS_SETUP.md) - GASの詳細設定（今後作成）
- [システムアーキテクチャ](docs/ARCHITECTURE.md) - 技術仕様書（今後作成）

## 🐛 トラブルシューティング

### よくある問題

**Q: Webhookが接続できない**
- A: GASのデプロイメントURLが正しいか確認してください

**Q: メッセージが返ってこない**
- A: アクセストークンが有効か確認してください

**Q: カレンダーに予定が追加されない**
- A: CALENDAR_IDとADMIN_EMAILが正しく設定されているか確認してください

詳細は [docs/LINE_DEVELOPERS_SETUP.md](docs/LINE_DEVELOPERS_SETUP.md) のトラブルシューティングセクションを参照してください。

## 📄 ライセンス

MIT License

## 👤 作成者

Manus AI

## 🤝 貢献

バグ報告や機能提案は、GitHubのIssuesで受け付けています。

---

**最終更新**: 2026年3月19日
