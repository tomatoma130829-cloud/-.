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

## 起動方法

```bash
npm install
npm start
```

起動後、ブラウザで以下にアクセス:

- `http://localhost:3000`

## ディレクトリ構成

- `server.js` - Express / Socket.io サーバー
- `public/` - HTML/CSS/JavaScript フロントエンド
- `data/users.json` - ユーザー情報（名前、パスワード、ポイント、アイテム、スタンプ、最終ログイン）
- `data/logs.json` - ログ（ログイン成功/失敗、Webアクセス、管理者操作など）
- `data/online.json` - 現在オンラインのユーザー

## GitHub公開向け

この構成はそのまま GitHub に push して公開できます。
`npm install && npm start` で動作します。
