# kimuchi-game

`kimuchi-game` は **HTML / CSS / JavaScript のみ**で構成された、ブラウザで動作する静的ゲームプラットフォームです。  
サーバー不要で、GitHub Pages にそのまま公開できます。

## 実装機能

- ログイン画面（一般ユーザー / 管理者）
  - 管理者ID: `kimuti`
  - 管理者パスワード: `tomatoma`
- 一般ユーザー登録・ログイン（`localStorage` 保存）
- ホーム画面（プロフィール・ポイント・所持品数）
- ゲーム選択画面
  - バトルゲーム（CPU対戦）
  - 鬼ごっこ対戦（CPU対戦）
  - シューティング対戦（CPU対戦）
  - ミニゲーム追加枠（数当て）
- 通貨 / アイテム / スタンプ
  - ポイントを `localStorage` に保存
  - ガチャでアイテム・スタンプ獲得
  - 所持スタンプをチャット送信に使用
- チャット画面（ローカルチャット）
  - メッセージ送信
  - スタンプ送信
  - 履歴を `localStorage` 保存
- 管理者機能
  - ユーザー状態確認（`localStorage` 参照）
  - ポイント・アイテム付与（`localStorage` 更新）

## フォルダ構成

```text
kimuchi-game/
├─ public/
│  ├─ index.html      # 画面構成（ログイン/ホーム/ゲーム/チャット/管理者）
│  ├─ styles.css      # UIスタイル
│  └─ app.js          # ロジック（認証、ゲーム、ガチャ、チャット、管理者機能）
├─ README.md
└─ （既存の補助ファイル）
```

## 起動方法（ローカル確認）

静的ファイルなので、`public/index.html` をブラウザで開くだけで動作します。

## GitHub Pages 公開手順

1. GitHub にリポジトリを push。
2. GitHub リポジトリの **Settings** → **Pages** を開く。
3. **Build and deployment** の **Source** を `Deploy from a branch` にする。
4. Branch を `main`（または利用ブランチ）にし、フォルダを `/public` に設定。
5. 保存後、表示された URL で公開サイトへアクセス。

## データ永続化仕様

- 保存先: `localStorage`
- キー: `kimuchiGameData`
- 保存される内容:
  - ユーザー情報（パスワード、ポイント、アイテム、スタンプ、最終ログイン、状態）
  - チャット履歴
  - 現在ログイン中セッション

同じブラウザであれば、再読み込み後もデータが残ります。
