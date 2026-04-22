# Privacy Policy — MarkN Video Speed

**Last updated: 2026-04-22**

[日本語版は下部にあります / Japanese version below]

---

## English

MarkN Video Speed ("the Extension") is a Chrome extension that adjusts the
playback speed of HTML5 `<video>` and `<audio>` elements.

### Data we collect

**None.** The Extension does not collect, transmit, sell, or share any
personal information, browsing history, or usage analytics.

### Data stored locally on your device

The Extension uses `chrome.storage.local` to persist the following settings
**on your device only**:

- Current playback speed
- Step value for the speed up / slow down actions
- Target speed used by the toggle action
- Keyboard shortcut bindings (keys assigned to slow down / speed up / toggle)
- A user-managed list of excluded domains

This data never leaves your browser. It is not synchronized across devices
(the Extension does not use `chrome.storage.sync`) and is not sent to the
developer or any third party.

### Permissions used

- **`storage`** — to save the settings listed above locally.
- **`activeTab`** — to read the URL of the currently active tab when you open
  the popup, so that the popup can show the current site name and let you
  add or remove it from the exclusion list.
- **Host access (`http://*/*`, `https://*/*`, `file:///*`)** — to run the
  content script that finds `<video>` / `<audio>` elements and adjusts their
  `playbackRate` on the pages you visit. The page content itself is never
  read, stored, or transmitted.

### Third parties

The Extension does not embed, load, or communicate with any third-party
service, analytics SDK, advertising network, or remote server.

### Children's privacy

The Extension does not knowingly collect information from anyone, including
children under 13.

### Changes to this policy

If this policy changes, the updated version will be published at the URL
below and the "Last updated" date above will be revised.

### Contact

Source code and issue tracker: <https://github.com/MarkN2000/MarkNVideoSpeed>

---

## 日本語

MarkN Video Speed（以下「本拡張機能」）は、HTML5 の `<video>` / `<audio>`
要素の再生速度を調整する Chrome 拡張機能です。

### 収集するデータ

**ありません。** 本拡張機能は、個人情報、閲覧履歴、利用状況分析などを
一切収集、送信、販売、共有しません。

### お使いの端末にローカル保存するデータ

本拡張機能は、以下の設定を **お使いの端末内にのみ** `chrome.storage.local`
を用いて保存します。

- 現在の再生速度
- 加速 / 減速アクションのステップ値
- トグルアクションで用いる指定速度
- キーボードショートカットの割当（減速 / 加速 / トグルに割り当てたキー）
- ユーザーが管理する除外ドメイン一覧

これらのデータはブラウザの外に出ることはありません。デバイス間での同期も
行わず（本拡張機能は `chrome.storage.sync` を使用しません）、開発者や
第三者に送信されることもありません。

### 使用している権限

- **`storage`** — 上記の設定をローカルに保存するため
- **`activeTab`** — ポップアップを開いたときに、現在アクティブなタブの
  URL を読み取り、現在のサイト名の表示および除外リストへの追加 / 解除を
  行うため
- **ホストアクセス（`http://*/*`, `https://*/*`, `file:///*`）** — ユーザー
  が訪れたページ上の `<video>` / `<audio>` 要素を検索し、`playbackRate`
  を調整するコンテンツスクリプトを動作させるため。ページ本文の読み取り、
  保存、送信は一切行いません。

### 第三者サービス

本拡張機能は、第三者サービス、アナリティクス SDK、広告ネットワーク、
リモートサーバーのいずれに対しても、埋め込み、読み込み、通信のいずれも
行いません。

### 子どものプライバシー

本拡張機能は、13歳未満を含む誰からも意図的に情報を収集することはありません。

### ポリシーの変更

本ポリシーを変更した場合、以下の URL に更新版を掲載し、冒頭の「Last updated」
日付を改定します。

### 連絡先

ソースコードおよび Issue: <https://github.com/MarkN2000/MarkNVideoSpeed>
