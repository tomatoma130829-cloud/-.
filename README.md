# kimuchi-game

ブラウザで動作する Node.js + Express + Socket.io ベースのゲームプラットフォームです。

## 機能

- ユーザー登録 / ログイン（管理者・一般ユーザー）
- JSON永続化（`data/users.json`, `data/logs.json`, `data/online.json`）
- 管理者通知（ログイン成功/失敗, Webアクセス, 管理者操作）
- オンライン状態表示（🟢/⚪）
- 全体チャット + スタンプ送信
- ポイント通貨システム
- ガチャ（アイテム/スタンプ/レア度）
- 管理者画面（ユーザー一覧、付与、ログ確認、通知、オンライン確認、強制ログアウト）
- ゲームメニュー（バトル、鬼ごっこ、シューティング、自由追加枠）
- スマホ対応の近未来UI

## 管理者ログイン

- ID: `kimuti`
- Password: `tomatoma`

## ローカル起動

```bash
npm install
npm start
```

起動後、ブラウザでアクセス:

- `http://localhost:3000`

---

## 他の方法でURL共有するには？

できます。**Render 以外**でも、例えば次の2パターンが使えます。

### 1) Railwayで公開（推奨・簡単）

1. GitHub にこのリポジトリを push
2. Railway で `New Project` → `Deploy from GitHub repo`
3. `Start Command` を `npm start` に設定
4. デプロイ完了後、`https://<project>.up.railway.app` のURLが発行される

### 2) Docker対応で公開（VPS / Fly.io / Render など）

このリポジトリには `Dockerfile` を追加済みなので、Docker対応環境でそのまま起動できます。

```bash
docker build -t kimuchi-game .
docker run -p 3000:3000 kimuchi-game
```

`render.yaml` も追加してあるため、Renderでは Blueprint デプロイも可能です。

---

## URLをこちらから直接発行できるか

この実行環境では、あなたのクラウドアカウント（Railway/Render/Fly.io 等）へ直接ログインしてデプロイできないため、
**最終的な本番URLの発行はアカウント連携後に1回だけ操作**が必要です。

必要なら次のメッセージで、使いたいサービス（Railway / Render / Fly.io）を指定してください。
最短手順で「コピペだけ」で公開URLまで案内します。

## セキュリティ改善（反映済み）

- 管理者APIにトークン認証を追加
- ユーザーAPIに本人アクセス制御を追加
- Socket接続時もセッション照合を追加

## ディレクトリ構成

- `server.js` - Express / Socket.io サーバー
- `public/` - HTML/CSS/JavaScript フロントエンド
- `data/users.json` - ユーザー情報（名前、パスワード、ポイント、アイテム、スタンプ、最終ログイン）
- `data/logs.json` - ログ（ログイン成功/失敗、Webアクセス、管理者操作など）
- `data/online.json` - 現在オンラインのユーザー
- `Dockerfile` - コンテナデプロイ用
- `render.yaml` - Render Blueprint 設定
