/* Firebase の接続設定（Firebase コンソール →「プロジェクトの設定」→「マイアプリ」のウェブアプリ設定を貼り付ける） */
// null のままだとクラウド同期はオフになり、メモはこの端末だけに保存されます。
// この値は公開されても問題ありません（データはセキュリティルール firestore.rules で本人以外アクセスできないよう守ります）。
const FIREBASE_CONFIG = null;

/* 貼り付け例:
const FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};
*/
