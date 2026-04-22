# MarkN Video Speed

**English** | [日本語](./README.ja.md)

A minimal Chrome extension for controlling HTML5 `<video>` / `<audio>` playback speed via keyboard shortcuts and a popup menu.

## Features

- **Three actions only**: Speed up / Speed down / Toggle between 1x and the target speed
- **Keyboard shortcuts**: Automatically disabled while a text field is focused (`<input>` / `<textarea>` / `contenteditable` / `role="textbox"` / `role="searchbox"`)
- **On-screen speed indicator (HUD)**: Current speed is shown in large text at the center of the screen for about 300ms on each key press, then fades out. Works in fullscreen.
- **Shared speed across the browser**: Persisted via `chrome.storage.local`, kept consistent across tabs and sites (not synced across devices via your Google account)
- **Iframe embeds supported**: Works with YouTube / Vimeo / SoundCloud embeds on blog posts and elsewhere
- **Resists site-side speed resets**: Reapplies the speed even when sites (e.g. YouTube after ads or seeks) reset `playbackRate` to `1.0`
- **Dynamic domain exclusion**: Add or remove the current site from the exclusion list with one click from the popup
- **Up/Down also updates the target speed**: The toggle destination is not fixed — it follows the speed you settle on while adjusting
- **Multi-language UI**: Popup and extension name switch between English (default) and Japanese based on the browser UI language (via `chrome.i18n`)
- **Minimal permissions**: Only `storage` and `activeTab`

## Installation

### Option A: Install from a released ZIP (recommended)

1. Download the latest `MarkNVideoSpeed-vX.Y.Z.zip` from the [Releases page](../../releases)
2. Extract the ZIP to any folder
3. Open `chrome://extensions/` in Chrome
4. Turn on **Developer mode** (top right)
5. Click **Load unpacked** and select the extracted folder
6. The extension icon should appear in your toolbar

### Option B: Clone this repository (latest development version)

1. `git clone` this repository (or download as ZIP)
2. Follow steps 3+ from Option A, selecting the cloned directory's root

## Usage

### Default keyboard shortcuts

| Key | Action |
| --- | ------ |
| `S` | Decrease speed (by the step value) |
| `D` | Increase speed (by the step value) |
| `G` | Toggle between 1.0x and the target speed |

- Shortcuts fire **only when a `<video>` or `<audio>` element exists on the page**
- Shortcuts do not fire while a text input is focused (so you can still type freely)
- Presses with modifier keys (Ctrl / Alt / Shift / Meta) are ignored

### Popup menu

Click the extension icon in the toolbar to open.

- **Current speed**: Shown in real time (also reflects changes made from other tabs)
- **Three buttons**: `-` / Toggle / `+` for when the keyboard isn't handy
- **Step**: Increment/decrement amount for `+` / `-` (`0.01` – `2.0`)
- **Target speed**: The other end of the toggle (`0.1` – `16.0`, excluding the forbidden zone described below)
- **Rebind shortcuts**: Click a key button → press the new key → saved
  - Only **A–Z and 0–9** are accepted. Keys with modifiers (Ctrl / Alt / Shift / Meta) and symbols are rejected
  - A key already assigned to another action is rejected
  - Press `Esc` or move focus away from the button to cancel
- **Reset to defaults**: Restore all three shortcuts at once (`S` / `D` / `G`)
- **Current site**: Add or remove the current domain to/from the exclusion list (reload the page for the change to take effect)

### On-screen speed display (HUD)

When Up / Down / Toggle changes the playback rate, the new speed (e.g. `1.50×`) is shown in large text at the center of the screen for about 300ms.

- Rendered inside a Shadow DOM, so site CSS cannot interfere
- Uses `z-index: 2147483647` (maximum) to stay on top of everything
- Also visible during fullscreen playback (the HUD follows the fullscreen element via `fullscreenchange`)
- Rapid input resets the timer — the HUD disappears 300ms after the last key press

## Target speed behavior

When you press Up / Down, not only `current` but also `target` (the toggle destination) is **overwritten with the same value**. This way, "the speed you dial in while tweaking becomes the toggle target."

However, `target` values in the range `0.9` – `1.1` (inclusive) cannot be stored — a toggle within that range would be imperceptible. When Up / Down produces a new `current` in this range, **the write to `target` is skipped** and the previous value is kept.

### Examples

| Initial (current, target) | Action | New current | New target |
| ---- | ---- | ---- | ---- |
| (1.0, 2.0) | Up +0.2 | 1.2 | 1.2 (overwritten) |
| (0.8, 0.8) | Up +0.1 | 0.9 | 0.8 (forbidden zone, kept) |
| (1.1, 2.0) | Up +0.1 | 1.2 | 1.2 (leaves the zone, follows) |
| (1.0, 2.0) | Down -0.1 | 0.9 | 2.0 (forbidden zone, kept) |

### Resisting speed resets

Sites like YouTube may forcibly reset `playbackRate` to `1.0` after ads, quality changes, or seeks. This extension subscribes to each media's `play` / `seeked` events and reapplies the speed whenever it differs from `lastSpeed`.

## Excluded domains

Sites where the extension should not run can be managed as a list.

- **Defaults**: `meet.google.com`, `hangouts.google.com` (to avoid colliding with video-conferencing controls)
- **Add/remove**: One click from the "Current site" section of the popup
- **Matching**: **Exact match** against `location.hostname` (subdomains are treated separately)
- **Effect**: Reload the page after changing the list for it to take effect

## Scope and limitations

### Supported

- Any HTTPS / HTTP page, and local files (`file:///`)
- Media inside iframes (`all_frames: true`)

### Not supported (or limited)

- `chrome://` / `about:` / Chrome Web Store pages (content scripts cannot be injected by design)
- Sync across Google accounts (`chrome.storage.sync` is not used)
- `<audio>` elements hidden inside a closed Shadow DOM on some niche players
- Advanced rules like per-site default speed (intentionally out of scope)
- Exclusion matches hostname exactly only (no wildcards)

## Architecture (for developers)

```
MarkNVideoSpeed/
├── manifest.json                        Manifest V3 (name / description are i18n'd via __MSG_*__)
├── src/
│   ├── lib/                             Dependency-free modules (exposed on window.__MNVS__ via IIFE)
│   │   ├── storage.js                   chrome.storage.local wrapper with type validators
│   │   ├── actions.js                   Pure functions: down / up / toggle / applyAction
│   │   ├── domainFilter.js              Pure function: isExcluded
│   │   ├── speedApplier.js              Batch-assigns playbackRate
│   │   ├── mediaRegistry.js             Collects video/audio, MutationObserver, reapplies on play/seeked
│   │   ├── keyHandler.js                keydown capture + typing-context detection
│   │   └── hud.js                       Center-of-screen speed display (Shadow DOM)
│   ├── content/content.js               Checks exclusion on startup and wires the modules together
│   └── popup/                           Popup UI (strings injected via chrome.i18n.getMessage)
│       ├── popup.html
│       ├── popup.css
│       └── popup.js
├── _locales/                            UI message catalogs (Chrome i18n)
│   ├── en/messages.json                 Default locale (English)
│   └── ja/messages.json                 Japanese locale
├── assets/icons/                        16 / 32 / 48 / 128 PNG
└── .github/workflows/release.yml        Builds a ZIP and publishes a Release on `v*` tag push
```

- **Buildless**: No Node / npm. Plain JS / HTML / CSS only.
- **Content script module layout**: MV3 does not allow ES Modules as a content-script entry point, so the lib files are listed in `manifest.json` in dependency order and each exposes itself on `window.__MNVS__` via IIFE.
- **Popup**: Reuses the same lib via direct `<script>` tags.
- **Pure / side-effectful separation**: `actions.js` and `domainFilter.js` are fully pure; `storage.js`, `speedApplier.js`, `mediaRegistry.js`, and `hud.js` are the side-effect boundary.
- **i18n**: Uses Chrome's standard i18n (`_locales/{en,ja}/messages.json`). The manifest uses `__MSG_*__` placeholders for `name` / `description`; popup strings are swapped in at runtime from `data-i18n` / `data-i18n-title` attributes via `chrome.i18n.getMessage()`. To add a language, drop in `_locales/<lang>/messages.json`.

## Release procedure (for maintainers)

To publish a new version:

1. Bump `version` in `manifest.json` (e.g. `"0.1.0"` → `"0.2.0"`)
2. Commit the change
3. Tag and push:
   ```
   git tag v0.2.0
   git push origin v0.2.0
   ```
4. GitHub Actions (`.github/workflows/release.yml`) will build the ZIP and publish it to Releases automatically
5. Edit the Release notes on GitHub as needed

The tag name must be prefixed with `v` (e.g. `v0.2.0`). Tags like `0.2.0` or `release-0.2.0` will not trigger the workflow.

## Possible future enhancements

- Per-site default speed rules
- Pitch preservation (`preservesPitch`) toggle
- Allow modifier keys in shortcuts (e.g. Shift+X)
- A speed slider in the popup

## Acknowledgements

[igrigorik/videospeed](https://github.com/igrigorik/videospeed) was referenced while designing this extension's approach.

## License

[MIT License](./LICENSE)
