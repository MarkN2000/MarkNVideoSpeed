'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const files = manifest.content_scripts[0].js.filter(file => file !== 'src/lib/hud.js');

async function boot(medias = []) {
  const document = Object.assign(new EventTarget(), { querySelectorAll: () => medias });
  // Node の EventTarget では解除時の boolean 指定が効かないため、capture を明示する。
  document.removeEventListener = (type, listener, capture) =>
    EventTarget.prototype.removeEventListener.call(document, type, listener, { capture });
  const stored = { lastSpeed: 2 };
  const hud = { created: 0, destroyed: 0, shown: [] };
  let storageListener;
  let mutationListener;
  const context = vm.createContext({
    console, document, location: { hostname: 'example.com' },
    // HUD の描画境界だけを置き換え、実際のコンテンツスクリプトを実行する。
    window: { __MNVS__: { hud: { createHUD() {
      hud.created++;
      return {
        show: speed => hud.shown.push(speed),
        destroy: () => hud.destroyed++,
      };
    } } } },
    MutationObserver: class {
      constructor(listener) { mutationListener = listener; }
      observe() {}
      disconnect() {}
    },
    chrome: { storage: {
      local: {
        get: async () => ({ ...stored }),
        set: async patch => { Object.assign(stored, patch); },
      },
      onChanged: { addListener(listener) { storageListener = listener; } },
    } },
  });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  }
  await new Promise(resolve => setImmediate(resolve));
  return {
    hud,
    key(code) { document.dispatchEvent(Object.assign(new Event('keydown'), { code })); },
    change(patch) {
      Object.assign(stored, patch);
      storageListener(Object.fromEntries(Object.entries(patch).map(([key, newValue]) => [key, { newValue }])), 'local');
    },
    add(media) {
      medias.push(media);
      mutationListener([{ addedNodes: [media], removedNodes: [] }]);
    },
  };
}

function video() {
  return Object.assign(new EventTarget(), { nodeType: 1, tagName: 'VIDEO', playbackRate: 1 });
}

(async () => {
  const page = await boot();
  page.key('KeyD');
  assert.equal(page.hud.created, 0, 'メディアのないページでは HUD を作らない');

  page.change({ excludedDomains: ['example.com'] });
  assert.equal(page.hud.destroyed, 0, 'HUD 作成前の除外でも停止できる');
  page.change({ excludedDomains: [] });
  const media = video();
  page.add(media);
  assert.equal(media.playbackRate, 2, '後から追加された動画にも保存速度を適用する');
  page.change({ lastSpeed: 3 });
  assert.equal(media.playbackRate, 3, 'ポップアップや別タブからの速度変更を反映する');
  assert.equal(page.hud.created, 0, 'メディア検出・再開・速度同期では HUD を作らない');

  page.key('KeyD');
  assert.equal(media.playbackRate, 3.25);
  assert.equal(page.hud.created, 1, '速度キーの初回操作で HUD を作る');
  page.key('KeyS');
  assert.equal(page.hud.created, 1, '続く操作では同じ HUD を再利用する');
  assert.deepEqual(page.hud.shown, [3.25, 3]);

  page.change({ excludedDomains: ['example.com'] });
  assert.equal(media.playbackRate, 1, '除外時には再生速度を戻す');
  assert.equal(page.hud.destroyed, 1, '除外時には作成済みの HUD を削除する');
  page.key('KeyD');
  assert.equal(media.playbackRate, 1, '除外中は速度キーを無効にする');
  page.change({ lastSpeed: 4 });
  assert.equal(media.playbackRate, 1, '除外中は速度同期も適用しない');
  page.change({ excludedDomains: [] });
  assert.equal(media.playbackRate, 4);
  assert.equal(page.hud.created, 1, '再開時にも HUD 作成を遅らせる');
  page.key('KeyR');
  assert.equal(page.hud.created, 2, '再開後の速度操作で HUD を作り直す');
  assert.equal(media.playbackRate, 1);

  const initialMedia = video();
  const initialPage = await boot([initialMedia]);
  assert.equal(initialMedia.playbackRate, 2, '起動時にも保存速度を自動適用する');
  assert.equal(initialPage.hud.created, 0, '動画のあるページでも起動時には HUD を作らない');
  initialPage.change({ lastSpeed: 16, toggleTargetSpeed: 16 });
  initialPage.key('KeyD');
  assert.equal(initialPage.hud.created, 0, '速度が変わらない操作では HUD を作らない');

  console.log('HUD の遅延作成・動的メディア・速度同期・除外と再開: 成功');
})().catch(error => { console.error(error); process.exitCode = 1; });
