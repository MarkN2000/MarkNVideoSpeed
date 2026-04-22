# MarkN Video Speed

HTML5 `<video>` / `<audio>` の再生速度をキーボードショートカットとポップアップから操作する、シンプルな Chrome 拡張機能。

高機能な [igrigorik/videospeed](https://github.com/igrigorik/videospeed) を参考にしつつ、機能を「速度制御」の一点に絞って最小の UI・最小の権限・最小のコードベースで実装しています。

## 特徴

- **3 つの操作に絞った最小構成**: 速度 Up / 速度 Down / 1x↔指定速度トグル
- **キーボードショートカット**: 入力欄（`<input>` / `<textarea>` / `contenteditable` / `role="textbox"`）フォーカス中は自動で無効化
- **画面中央に現在速度を一瞬表示（HUD）**: キー操作時に大きく表示、300ms でフェードアウト。フルスクリーン対応
- **ブラウザ全体で速度共有**: `chrome.storage.local` でタブ・サイトを跨いで維持（Google アカウント同期はしない）
- **iframe 埋め込み対応**: ブログ等に貼られた YouTube / Vimeo / SoundCloud 埋め込みでも動作
- **サイトのリセットに対抗**: YouTube の広告終了後やシーク後も設定速度を維持
- **動的除外ドメイン**: ポップアップから現在のサイトを一発で除外リストに登録/解除
- **Up/Down は指定速度も同時に更新**: トグル先が固定値ではなく、使いながら追従する
- **最小権限**: `storage` と `activeTab` の 2 つのみ

## インストール

### 方法 A: リリース済み ZIP からインストール（推奨）

1. [Releases ページ](../../releases) から最新の `MarkNVideoSpeed-vX.Y.Z.zip` をダウンロード
2. ZIP を任意のフォルダに展開
3. Chrome で `chrome://extensions/` を開く
4. 右上の **「デベロッパーモード」を ON**
5. **「パッケージ化されていない拡張機能を読み込む」** → 展開したフォルダを選択
6. ツールバーに拡張機能アイコンが現れたら成功

### 方法 B: リポジトリをクローンしてインストール（最新開発版）

1. このリポジトリを `git clone` または ZIP ダウンロード
2. 以降は方法 A の手順 3 以降と同じ（クローンしたディレクトリのルートを選択）

## 使い方

### キーボードショートカット（デフォルト）

| キー | 動作 |
| ---- | ---- |
| `S`  | 速度を下げる（`-` ステップ値） |
| `D`  | 速度を上げる（`+` ステップ値） |
| `G`  | 1.0x ⇄ 指定速度 のトグル |

- ショートカットは**ページに `<video>` または `<audio>` が存在するとき**のみ発火
- 入力欄にフォーカス中は発火しない（文字入力を邪魔しない）
- 修飾キー（Ctrl / Alt / Shift / Meta）を伴う押下は無視

### ポップアップメニュー

ツールバーの拡張機能アイコンをクリックすると開く。

- **現在速度**: リアルタイム表示（別タブでの操作にも追従）
- **3 ボタン**: キーボードが使えない場面用の `-` / トグル / `+`
- **ステップ値**: `+`/`-` の増減幅（`0.01` 〜 `2.0`）
- **指定速度**: トグルの切替先（`0.1` 〜 `16.0`、ただし後述の禁止ゾーン除く）
- **ショートカットキー再割当**: 各キーボタンをクリック → 新しいキーを押下 → 保存
- **現在のサイト**: このドメインを除外リストに追加/解除（変更後は要リロード）

### 画面中央のスピード表示（HUD）

Up / Down / Toggle のいずれかで再生速度が変わると、画面中央に大きく現在の速度（例: `1.50×`）が約 300ms 表示されます。

- Shadow DOM で実装されているため、サイトの CSS の影響を受けません
- `z-index: 2147483647`（最大値）で常に最前面
- フルスクリーン再生中も表示される（`fullscreenchange` で親要素を追従）
- 連続操作時は表示タイマーがリセットされ、最後の押下から 300ms 後に消える

## 指定速度（preset）の仕様

Up / Down を押すと、`current` だけでなく `preset`（指定速度）も **同じ値に上書き** されます。
これにより「使いながら微調整した速度がそのままトグル先になる」挙動になります。

ただし、`preset` が `0.9` 〜 `1.1` の範囲（両端含む）に入る値を保存することはできません（トグルしても体感しにくいため）。
Up / Down で新しい current 値がこの範囲に入るときは、**preset の書き込みをスキップ**して据え置きます。

### 例

| 初期 (current, preset) | 操作 | 新 current | 新 preset |
| ---- | ---- | ---- | ---- |
| (1.0, 2.0) | Up +0.2 | 1.2 | 1.2（上書き） |
| (0.8, 0.8) | Up +0.1 | 0.9 | 0.8（禁止ゾーン内、据え置き）|
| (1.1, 2.0) | Up +0.1 | 1.2 | 1.2（ゾーン抜けて追従） |
| (1.0, 2.0) | Down -0.1 | 0.9 | 2.0（禁止ゾーン内、据え置き）|

### 速度リセット対策

YouTube 等のサイトは広告終了 / 画質変更 / シーク時に `playbackRate` を強制的に `1.0` へ戻すことがあります。
本拡張は各メディアの `play` / `seeked` イベントを購読し、`lastSpeed` と異なっていれば再適用します。

## 除外ドメイン機能

動作させたくないサイトをリスト管理できます。

- **初期値**: `meet.google.com`, `hangouts.google.com`（ビデオ会議との操作衝突を回避）
- **追加/解除**: ポップアップの「現在のサイト」セクションからワンクリック
- **判定方法**: `location.hostname` との **完全一致**（サブドメインは別扱い）
- **反映タイミング**: 変更後、そのページをリロードすると有効化

## 動作範囲と制限

### 対応

- 任意の HTTPS / HTTP ページ、ローカルファイル（`file:///`）
- iframe 内のメディア（`all_frames: true`）

### 非対応（または制限）

- `chrome://` / `about:` / Chrome Web Store 内ページ（仕様によりコンテンツスクリプトが注入できない）
- Google アカウント間での設定同期（`chrome.storage.sync` は未使用）
- `<audio>` 要素を Shadow DOM 内に隠しているようなごく一部のプレイヤー
- 「サイト別のデフォルト速度」などの高度なルール（本拡張の意図としてスコープ外）
- 除外ドメインはホスト名の完全一致のみ（ワイルドカード未対応）

## アーキテクチャ（開発者向け）

```
MarkNVideoSpeed/
├── manifest.json             Manifest V3
├── src/
│   ├── lib/                  依存なしの小粒モジュール（IIFE で window.__MNVS__ に公開）
│   │   ├── storage.js        chrome.storage.local ラッパ、型バリデータ
│   │   ├── actions.js        純粋関数: down / up / toggle / applyAction
│   │   ├── domainFilter.js   純粋関数: isExcluded
│   │   ├── speedApplier.js   playbackRate の一括代入
│   │   ├── mediaRegistry.js  video / audio 収集 + MutationObserver + play/seeked 再適用
│   │   ├── keyHandler.js     keydown capture + 入力中判定
│   │   └── hud.js            画面中央の速度表示（Shadow DOM）
│   ├── content/content.js    起動時に除外判定し、各モジュールを組み立てる
│   └── popup/                ポップアップ UI
│       ├── popup.html
│       ├── popup.css
│       └── popup.js
├── assets/icons/             16 / 32 / 48 / 128 PNG
└── agent/要件定義.md         要件定義書（`.gitignore` 済みのローカル設計ドキュメント）
```

- **ビルドレス**: Node / npm は使わない。素の JS / HTML / CSS のみ。
- **content script のモジュール構成**: MV3 の制約上 content script は ES Modules をエントリポイントにできないため、lib ファイルを `manifest.json` に依存順で列挙し、各ファイルは IIFE で `window.__MNVS__` に公開する方式を採用。
- **popup**: `<script>` タグ直書きで同じ lib を再利用。
- **純粋関数 / 副作用の分離**: `actions.js` / `domainFilter.js` は完全に純粋、`storage.js` / `speedApplier.js` / `mediaRegistry.js` / `hud.js` が副作用の境界。

## リリース手順（メンテナ向け）

新しいバージョンを公開するとき：

1. `manifest.json` の `version` を更新（例: `"0.1.0"` → `"0.2.0"`）
2. 変更をコミット
3. 対応するタグを打って push：
   ```
   git tag v0.2.0
   git push origin v0.2.0
   ```
4. GitHub Actions（`.github/workflows/release.yml`）が自動で zip を作成し、Releases に公開する
5. 必要に応じて Release ページで説明文を編集

タグ名のプレフィックスは `v` 必須（`v0.2.0` など）。これ以外のタグ（`0.2.0` や `release-0.2.0`）ではワークフローが起動しない。

## 今後の拡張候補

- サイト別デフォルト速度のルール
- ピッチ維持（`preservesPitch`）のトグル
- ショートカットに修飾キー（Shift+X 等）を許可
- ポップアップからの速度スライダー

## 謝辞

設計・実装方針の参考として [igrigorik/videospeed](https://github.com/igrigorik/videospeed) を調査しました。特に以下の点は同拡張の知見に基づいています。

- 入力フィールドでの自動無効化の判定ロジック（`INPUT` / `TEXTAREA` / `contenteditable`）
- サイトによる `playbackRate` リセットへの対抗アプローチ（`play` / `seeked` 再適用）
- デフォルトショートカット（S / D / G）の割り当て

## ライセンス

[MIT License](./LICENSE)
