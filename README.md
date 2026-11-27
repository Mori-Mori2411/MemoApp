# 反省ノート (MemoApp)

ゲームや仕事の反省・対策をまとめるためのメモアプリです。ビルド不要で、`index.html` を開くだけで動きます。

## 主な機能

- 左サイドバーに「新規メモ」・検索・タグ絞り込み・メモ一覧
- メモにタグ（ゲーム、仕事、SF6 など）を複数付けられる
- 本文は「項目（トグル）」ごとに開閉・編集・並べ替えができる
- 1つのメモの中をタブ（キャラ別など）で分けられる。タブの追加・名前変更・並べ替え・削除ができる
- タイトル・タグ・項目名・本文をまとめて検索（ヒットした項目は自動で開く）
- Google でログインすると Firestore（Firebase）にメモを保存し、端末どうしでリアルタイムに同期
- ログインしていないときはブラウザ内（localStorage）に保存。「バックアップ」から JSON で書き出し・復元

## 使い方

`index.html` をブラウザで開くだけで使えます。
GitHub Pages を有効にすると URL から開けます（Settings → Pages → Branch: `main` / `root`）。

## Firebase の設定（クラウド同期）

1. [Firebase コンソール](https://console.firebase.google.com/) でプロジェクトを作成
2. 「Authentication」→「Sign-in method」で **Google** を有効にする
3. 「Authentication」→「設定」→「承認済みドメイン」に `mori-mori2411.github.io` を追加
4. 「Firestore Database」でデータベースを作成（ロケーションは `asia-northeast1`（東京）など）
5. Firestore の「ルール」タブに `firestore.rules` の中身を貼り付けて公開
6. 「プロジェクトの設定」→「マイアプリ」でウェブアプリを登録し、表示された `firebaseConfig` を `js/firebase-config.js` の `FIREBASE_CONFIG` に貼り付ける

`FIREBASE_CONFIG` が `null` のままなら、同期なしでブラウザ内だけに保存されます。

### データの置き場所

```
users/{uid}                 { tags: [...] }        タグ一覧
users/{uid}/notes/{メモID}   { title, tags, blocks, tabs?, pinned, createdAt, updatedAt }
                            tabs: [{ id, name, blocks }]（タブありのメモだけ）
```

## ファイル構成

```
index.html          画面の骨組み
firestore.rules     Firestore のセキュリティルール（本人だけ読み書き可）
css/
  base.css          色の変数・リセット・共通パーツ（ボタン、チップ）
  layout.css        サイドバーとメイン領域の配置・開閉
  sidebar.css       新規ボタン・検索・タグ絞り込み・メモ一覧
  editor.css        タイトル・タグ表示・トグル項目・初期画面
  note-tabs.css     メモ内タブのタブバー
  tags.css          タグ選択ポップアップ・タグ管理
  modal.css         ダイアログ・入力欄・トースト通知
  account.css       ログイン・同期状態の表示
js/
  util.js           共通の道具（要素作成・アイコン・日付表示など）
  firebase-config.js Firebase の接続設定
  store.js          データの保存・読み込み・サンプルデータ
  search.js         検索の判定とハイライト
  sidebar.js        タグ絞り込みとメモ一覧の描画
  note-tabs.js      メモ内タブ（追加・切り替え・名前変更・削除）
  editor.js         メモ本文・トグル項目の描画と編集
  tags.js           タグの作成・付け外し・タグ管理
  modal.js          汎用ダイアログ・確認・通知
  note-create.js    新規メモ作成ダイアログ
  backup.js         バックアップの書き出し・復元
  sync.js           Google ログインと Firestore 同期
  main.js           起動処理（ボタン登録・初期表示）
```

## ショートカット

- `Ctrl` / `⌘` + `K` : 検索欄へ移動
- 項目名で `Enter` : 中身の入力へ移動
- `Esc` : ダイアログを閉じる
