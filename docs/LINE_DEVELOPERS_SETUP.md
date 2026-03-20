# おれんじさん🍊 - LINE Developers セットアップガイド

このガイドでは、LINE Developers での設定手順を説明します。ユーザーがパソコンなしで設定できるよう、**コピペで使える値**を用意しています。

---

## 📋 必要な情報

セットアップ完了後、以下の情報が必要になります：

| 項目 | 説明 | 取得元 |
|------|------|--------|
| **Channel ID** | LINE チャネルの識別子 | LINE Developers |
| **Channel Secret** | チャネルの秘密鍵 | LINE Developers |
| **Channel Access Token** | API 認証用トークン | LINE Developers |
| **LIFF ID** | LIFF アプリケーションの ID | LINE Developers |
| **GAS Deployment URL** | Google Apps Script のデプロイメント URL | Google Cloud |

---

## 🚀 セットアップ手順

### ステップ 1: LINE Developers コンソールにアクセス

1. [LINE Developers](https://developers.line.biz/) にアクセス
2. LINE ビジネスアカウントでログイン（なければ作成）
3. 「Create」ボタンをクリックして新しいプロバイダーを作成

### ステップ 2: プロバイダーを作成

1. **Provider Name**: `おれんじさん🍊` と入力
2. 「Create」をクリック

### ステップ 3: チャネルを作成

1. 作成したプロバイダーを選択
2. 「Create Channel」をクリック
3. **Channel Type**: 「Messaging API」を選択
4. 以下の情報を入力：

```
Display Name: おれんじさん🍊
Description: 訪問看護予約システム
Category: Utilities
Subcategory: Productivity
```

5. 「Create」をクリック

### ステップ 4: Channel Credentials を取得

1. 作成したチャネルを開く
2. 左メニューから「Basic settings」をクリック
3. 以下の情報をコピーして保存：

**Channel ID:**
```
[ここに Channel ID をコピー]
```

**Channel Secret:**
```
[ここに Channel Secret をコピー]
```

### ステップ 5: Channel Access Token を生成

1. 同じ「Basic settings」ページをスクロール
2. 「Messaging API」セクションを探す
3. 「Channel access token」の「Generate」をクリック
4. 生成されたトークンをコピー：

**Channel Access Token:**
```
[ここに Channel Access Token をコピー]
```

### ステップ 6: LIFF を作成

1. 左メニューから「LIFF」をクリック
2. 「Create」をクリック
3. 以下の情報を入力：

```
LIFF app name: おれんじさん🍊 予約システム
Redirect URL: https://[あなたのドメイン]/line-liff/index.html
Endpoint URL: https://[あなたのドメイン]/line-liff/index.html
```

4. **LIFF Type**: 「Full」を選択
5. 「Create」をクリック
6. 生成された **LIFF ID** をコピー：

**LIFF ID:**
```
[ここに LIFF ID をコピー]
```

---

## 🔐 Google Apps Script (GAS) のデプロイ

### ステップ 1: Google Apps Script を開く

1. [Google Drive](https://drive.google.com) にアクセス
2. 「新規」→「その他」→「Google Apps Script」をクリック
3. 新しいプロジェクトが開きます

### ステップ 2: コードをコピー

1. GitHub リポジトリから以下のファイルをコピー：
   - `gas/Code.gs`
   - `gas/CalendarAPI.gs`

2. Google Apps Script エディタに貼り付け

### ステップ 3: スクリプト プロパティを設定

1. 左メニューから「プロジェクト設定」をクリック
2. 下にスクロールして「スクリプト プロパティ」を開く
3. 「プロパティを追加」をクリック
4. 以下の情報を入力：

| プロパティ | 値 |
|-----------|-----|
| `LINE_CHANNEL_ACCESS_TOKEN` | [ステップ 5 でコピーしたトークン] |
| `LINE_CHANNEL_SECRET` | [ステップ 4 でコピーした Secret] |
| `ADMIN_EMAIL` | [管理者のメールアドレス] |

### ステップ 4: デプロイ

1. 上部の「デプロイ」をクリック
2. 「新しいデプロイ」をクリック
3. **タイプ**: 「ウェブアプリ」を選択
4. **実行者**: 「自分」を選択
5. **アクセス**: 「全員」を選択
6. 「デプロイ」をクリック
7. **Deployment URL** をコピー：

**GAS Deployment URL:**
```
[ここに Deployment URL をコピー]
```

---

## 📝 設定ファイルの更新

### config.js を更新

`line-liff/config.js` ファイルを開いて、以下の値を置き換えます：

```javascript
// LINE LIFF 設定
const LIFF_ID = 'YOUR_LIFF_ID';  // ← LIFF ID に置き換え
const GAS_DEPLOYMENT_URL = 'YOUR_GAS_DEPLOYMENT_URL';  // ← GAS URL に置き換え

// LINE Messaging API 設定
const LINE_CHANNEL_ID = 'YOUR_CHANNEL_ID';  // ← Channel ID に置き換え
const LINE_CHANNEL_SECRET = 'YOUR_CHANNEL_SECRET';  // ← Channel Secret に置き換え
const LINE_CHANNEL_ACCESS_TOKEN = 'YOUR_CHANNEL_ACCESS_TOKEN';  // ← Access Token に置き換え
```

### 例：

```javascript
const LIFF_ID = 'C1234567890abcdef1234567890abcdef';
const GAS_DEPLOYMENT_URL = 'https://script.google.com/macros/d/1234567890abcdef/usercallback';
const LINE_CHANNEL_ID = '1234567890';
const LINE_CHANNEL_SECRET = 'abcdef1234567890abcdef1234567890';
const LINE_CHANNEL_ACCESS_TOKEN = 'Channel access token here...';
```

---

## 🔗 Webhook URL の設定

### LINE Developers での設定

1. LINE Developers コンソールで、作成したチャネルを開く
2. 左メニューから「Messaging API」をクリック
3. 「Webhook settings」セクションを探す
4. **Webhook URL** に以下を入力：

```
https://script.google.com/macros/d/[Deployment ID]/usercallback
```

5. 「Verify」をクリックして接続確認
6. 「Use webhook」を有効化

---

## ✅ テスト

### 1. LINE での動作確認

1. LINE で作成したアカウントを友達追加
2. メッセージを送信して応答確認

### 2. LIFF での動作確認

1. LIFF リンクを LINE で開く
2. 日付と時間を選択
3. 予約を送信
4. Google カレンダーに予定が追加されたか確認

### 3. スプレッドシートの確認

1. 作成したスプレッドシートを開く
2. 予約データが記録されているか確認

---

## 🆘 トラブルシューティング

### 問題: Webhook が接続できない

**原因**: GAS Deployment URL が正しくない

**解決策**:
1. GAS のデプロイメント URL を確認
2. LINE Developers の Webhook URL を更新
3. 「Verify」で再度接続確認

### 問題: LIFF が開かない

**原因**: LIFF ID が正しくない

**解決策**:
1. LINE Developers で LIFF ID を確認
2. `config.js` の `LIFF_ID` を更新
3. ブラウザキャッシュをクリア

### 問題: 予約がカレンダーに表示されない

**原因**: カレンダー ID が正しくない、または権限がない

**解決策**:
1. Google カレンダーの設定を確認
2. 「訪問看護（おれんじさん）」カレンダーが存在するか確認
3. GAS に適切な権限があるか確認

---

## 📚 参考資料

- [LINE Developers ドキュメント](https://developers.line.biz/ja/docs/)
- [LIFF リファレンス](https://developers.line.biz/ja/docs/liff/)
- [Google Apps Script ドキュメント](https://developers.google.com/apps-script)

---

## 💡 よくある質問

**Q: パソコンがない場合、どうやって設定するのか？**

A: スマートフォンのブラウザで LINE Developers にアクセスして、同じ手順で設定できます。ただし、Google Apps Script のデプロイは PC での操作が推奨されます。

**Q: 複数の訪問看護事業所で使用できるか？**

A: はい。新しいプロバイダーとチャネルを作成することで、複数の事業所で独立した予約システムを運用できます。

**Q: 予約データはどこに保存されるのか？**

A: Google カレンダーと Google スプレッドシートに自動保存されます。データは Google Drive に安全に保管されます。

---

**最終更新**: 2026年3月21日  
**バージョン**: 1.0
