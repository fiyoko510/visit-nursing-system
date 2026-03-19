# おれんじさん🍊 LINE LIFF - 訪問看護予約システム

スマートフォンで簡単に訪問看護の予約ができるLINE LIFF（LINE Front-end Framework）アプリケーションです。

## 🎨 特徴

- **温かみのあるデザイン**: オレンジ色をメインカラーにした、親しみやすいUI
- **シンプルな操作**: 「ポチポチ」と選ぶだけで直感的に予約できます
- **柔軟な時間選択**: 30分単位で複数の枠を選んで、1時間や1時間30分など自由に予約可能
- **リアルタイム連携**: 予約がGoogleカレンダーとスプレッドシートに自動記録

## 📋 機能

### 1. 日付選択
- カレンダーから訪問希望日を選択
- 最小日付は本日から設定

### 2. 時間選択
- **時間ボタン**: 09:00～17:00の1時間単位
- **分ボタン**: 00, 15, 30, 45分単位
- 選んだ時間帯が自動的に表示される
- 複数の30分枠を選んで連続した時間を予約可能

### 3. 確認・送信
- 選択内容を確認
- 「予約を確定する」で送信
- 成功時にLINEに戻る

## 🚀 セットアップ手順

### 前提条件
- LINE 公式アカウント（ビジネスプラン以上）
- Google Apps Script（GAS）環境
- Google スプレッドシート
- Google カレンダー

### ステップ1: LINE LIFF の作成

1. [LINE Developers](https://developers.line.biz/ja/) にログイン
2. チャネルを作成または選択
3. 「LIFF」セクションで「新規作成」をクリック
4. 以下の情報を入力：
   - **名前**: おれんじさん予約
   - **説明**: 訪問看護予約システム
   - **LIFF URL**: `https://your-domain.com/line-liff/index.html`
   - **エンドポイント URL**: 同上
   - **スコープ**: `profile`, `openid`
5. 作成後、**LIFF ID** をコピー

### ステップ2: 設定ファイルの作成

```bash
cd line-liff
cp config.example.js config.js
```

`config.js` を編集して、以下の値を設定：

```javascript
const LIFF_CONFIG = {
    liffId: 'YOUR_LIFF_ID_HERE',  // ステップ1で取得したLIFF ID
    gasDeploymentUrl: 'YOUR_GAS_DEPLOYMENT_URL_HERE',  // GASのデプロイメントURL
    spreadsheetId: 'YOUR_SPREADSHEET_ID_HERE',  // スプレッドシートID
    calendarId: 'YOUR_CALENDAR_ID_HERE'  // カレンダーID
};
```

### ステップ3: GAS側の修正

`gas/Code.gs` の以下の行を更新：

```javascript
// LIFFのURLを設定
const LIFF_URL = 'https://your-domain.com/line-liff/index.html';
```

### ステップ4: スプレッドシートの準備

新しいスプレッドシートを作成し、以下のカラムを設定：

| A | B | C | D | E |
|---|---|---|---|---|
| 利用者名 | 訪問日時 | 滞在時間（分） | 登録日時 | メモ |

スプレッドシートのIDをコピーして、`config.js` に設定。

### ステップ5: Googleカレンダーの準備

1. Google カレンダーで新しいカレンダーを作成（例：「訪問看護予約」）
2. カレンダーのID（メールアドレス形式）をコピー
3. `config.js` に設定

### ステップ6: ホスティング

このフォルダ（`line-liff/`）をWebサーバーにアップロード：

```bash
# 例：GitHub Pages を使う場合
git add line-liff/
git commit -m "Add LINE LIFF implementation"
git push origin main
```

または、Netlify、Vercel などのホスティングサービスを使用。

## 📱 使い方

### ユーザー側

1. LINE 公式アカウントのリッチメニューから「予約する」をタップ
2. LIFF画面が開く
3. 訪問希望日を選択
4. 時間を「ポチポチ」選択
5. 内容を確認して「予約を確定する」

### 管理者側

- **Google カレンダー**: 予約がリアルタイムで表示される
- **Google スプレッドシート**: 予約履歴が自動記録される

## 🔧 技術仕様

### フロントエンド
- **HTML5**: セマンティックマークアップ
- **CSS3**: レスポンシブデザイン、ダークモード対応
- **JavaScript (Vanilla)**: フレームワーク不要のシンプル実装
- **LINE SDK**: LIFF 連携

### バックエンド
- **Google Apps Script**: Webhook受信、カレンダー/スプレッドシート連携
- **LINE Messaging API**: メッセージ送受信
- **Google Calendar API**: 予定管理
- **Google Sheets API**: データ記録

## 📊 データフロー

```
ユーザー
  ↓
LINE LIFF画面（このフォルダ）
  ↓ (JSON送信)
Google Apps Script
  ├→ Google カレンダー（予定登録）
  ├→ Google スプレッドシート（履歴記録）
  └→ LINE（確認メッセージ送信）
```

## 🎨 カスタマイズ

### ブランドカラーの変更

`styles.css` の `:root` セクションを編集：

```css
:root {
    --primary-orange: #FF9500;      /* メインカラー */
    --primary-orange-dark: #E67E22; /* ダークカラー */
    --primary-orange-light: #FFB84D; /* ライトカラー */
    /* ... */
}
```

### 営業時間の変更

`config.js` を編集：

```javascript
businessHours: {
    minHour: 8,      // 営業開始時間を8時に変更
    maxHour: 19,     // 営業終了時間を19時に変更
    slotMinutes: 30  // スロット間隔（変更不可推奨）
}
```

### テキストの変更

`index.html` の各セクションを編集。

## 🐛 トラブルシューティング

### LIFF が起動しない
- LIFF ID が正しく設定されているか確認
- LINE Developers で LIFF URL が正しく登録されているか確認
- ブラウザのコンソール（F12）でエラーメッセージを確認

### 予約が記録されない
- GAS のデプロイメント URL が正しいか確認
- スプレッドシートの共有設定を確認
- GAS のログを確認（Apps Script ダッシュボード → ログ）

### 時間選択がうまくいかない
- ブラウザのキャッシュをクリア
- 別のブラウザで試す
- コンソールでエラーを確認

## 📞 サポート

問題が発生した場合は、以下を確認してください：

1. **コンソールログ**: ブラウザの F12 キーでコンソールを開き、エラーメッセージを確認
2. **GAS ログ**: Google Apps Script ダッシュボールで実行ログを確認
3. **LINE Developers**: チャネルの設定を再確認

## 📝 ライセンス

このプロジェクトはプライベートプロジェクトです。

## 🙏 謝辞

おれんじさん🍊 訪問看護予約システムの実装にご協力いただきありがとうございます。

---

**最終更新**: 2026年2月20日
