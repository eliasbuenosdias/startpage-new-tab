<div align="center">

<img src="icons/icon512.png" width="140" alt="Startpage New Tab logo" />

# 🔒 Startpage New Tab

**Every new tab. Private search. Zero noise.**
A tiny Manifest V3 extension that sends every new tab to [startpage.com](https://www.startpage.com) — built for **Opera GX**, where the standard `chrome_url_overrides` trick simply doesn't work.

![Manifest V3](https://img.shields.io/badge/Manifest-V3-0f766e?style=flat-square&logo=googlechrome&logoColor=white)
![Opera GX](https://img.shields.io/badge/Opera%20GX-supported-ff1b2d?style=flat-square&logo=opera&logoColor=white)
![Chromium](https://img.shields.io/badge/Chromium-compatible-4285F4?style=flat-square&logo=googlechrome&logoColor=white)
![Permissions](https://img.shields.io/badge/permissions-tabs%20only-34d399?style=flat-square)
![Size](https://img.shields.io/badge/size-%3C%201%20MB-4b5563?style=flat-square)

</div>

---

## 🤔 Why does this exist?

Opera GX is Chromium-based, so you'd expect this to work:

```json
{ "chrome_url_overrides": { "newtab": "newtab.html" } }
```

It doesn't. Opera overrides the new tab page with its own Speed Dial and **ignores extension overrides entirely**. No setting, flag, or extension from the Chrome Web Store can change that.

This project routes around the limitation:

| Browser behaviour | This extension |
| --- | --- |
| `Cmd/Ctrl+T` opens `chrome://startpageshared/` | A service worker spots it instantly and navigates to Startpage |
| Startup page can be set natively | Left alone — your session restore keeps working ✅ |

> 🧠 The internal URL `chrome://startpageshared/` was found by tracing `chrome.tabs` events — that's the piece most "new tab redirect" extensions miss for Opera.

---

## ✨ Features

- 🔐 **Startpage on every new tab** — no Speed Dial leftovers, no tracking
- 🔎 **Address-bar searches go to Startpage** — Opera's default engine is Google, so search navigations are rewritten to Startpage before the page loads
- ⚡ **Instant redirect** via a background service worker (`chrome.tabs` + `webNavigation`)
- 🕵️ **Minimal permissions** — `tabs` + `webNavigation`, and host access only for Google search domains so the rewrite can read the query
- 🧩 **No content scripts, no remote code, no analytics**
- 🔎 **Default search engine declaration** — honoured by Chrome, Edge, Brave and Vivaldi (Opera GX blocks it)
- 🖥️ **Works on any Chromium browser** — Chrome, Edge, Brave, Vivaldi — as a bonus
- 🪶 **Under 1 MB**, three small source files

---

## 🚀 Install

### 1. Get the code

```bash
git clone https://github.com/eliasbuenosdias/startpage-new-tab.git
cd startpage-new-tab
```

### 2. Load it in Opera GX

1. Go to `opera://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `startpage-new-tab` **folder** (not a file inside it)
5. Make sure the **Startpage New Tab** card is switched on 🟢

That's it. Press `Cmd+T` / `Ctrl+T` and you'll land on Startpage.

> 🍎 Tip: in the file picker, press `Cmd+Shift+G` and paste the folder path to jump straight there.

### 3. Recommended browser settings

- **On startup** → `opera://settings` → *Continue where you left off* — so your previous tabs come back instead of being replaced.
- **Search engine** → Opera GX won't let a custom engine become the default (see below), so add Startpage and use its keyword: name `Startpage`, keyword `sp`, URL `https://www.startpage.com/do/dsearch?query=%s`. Then type `sp` + your query in the address bar.

---

## 🔎 Default search engine

This extension ships a `chrome_settings_overrides.search_provider` block with `is_default: true`. It works on **Chrome, Edge, Brave and Vivaldi**.

Opera GX ignores it, on purpose:

- ❌ `chrome_url_overrides` → the manifest is rejected: *"'chrome_url_overrides' is not allowed for specified extension ID."*
- ❌ `chrome_settings_overrides.search_provider` → the engine is never registered in `chrome://settings/searchEngines`
- ❌ Custom engines → the *Make default* action is rendered `disabled` in Opera's own settings UI
- ❌ Editing `default_search_provider.guid` in the profile → Opera resets it to Google on launch

So on Opera GX the default engine stays Google. This extension doesn't change that setting — it simply rewrites the search navigations, which gives you the same end result:

| Where you type | What happens |
| --- | --- |
| Address bar → `your query` | ➡️ Startpage results (URL bar briefly shows Google) |
| Address bar → `sp your query` | ➡️ Startpage results (native keyword shortcut) |
| New tab → search box | ➡️ Startpage results |

> 💡 If Opera ever lifts the restriction, the manifest already carries the right declaration and the override takes over — nothing else to change.

---

## 🛠️ How it works

```text
Cmd+T
  └─> Opera opens chrome://startpageshared/
        └─> tabs.onCreated fires with pendingUrl = chrome://startpageshared/
              └─> tabs.update(tabId, { url: "https://www.startpage.com/" })
                    └─> 🔒 Startpage
```

Address-bar searches take a second path:

```text
"how to delete cookies" + Enter
  └─> Opera navigates to google.com/search?q=how+to+delete+cookies
        └─> webNavigation.onBeforeNavigate fires (before Google answers)
              └─> tabs.update → startpage.com/do/dsearch?query=how%20to%20delete%20cookies
                    └─> 🔒 Startpage results
```

`background.js` keeps a list of the internal new-tab URLs used across Chromium forks:

```js
const NEW_TAB_PREFIXES = [
  "chrome://startpageshared", // Opera GX — the real one
  "chrome://startpage",
  "chrome://newtab",
  "opera://startpage",
  "opera://newtab",
  "about:newtab",
  "about:home"
];
```

A fallback `chrome_url_overrides` entry (`newtab.html`) is still shipped for browsers that do honour it.

---

## 🔐 Permissions

| Permission | Why |
| --- | --- |
| `tabs` | Detect the new tab and navigate it to Startpage |
| `webNavigation` | Catch the search navigation before it loads and rewrite it |
| Host access to Google search domains | Read the `q=` parameter so the query can be forwarded to Startpage |

No content scripts, no analytics, no remote code, and the query never reaches Google: the navigation is replaced client-side.

---

## 📁 Project structure

```text
startpage-new-tab/
├── manifest.json      # Manifest V3, tabs permission, icons
├── background.js      # Service worker: detects new tabs and redirects them
├── newtab.html        # Fallback override page (non-Opera browsers)
├── logo.svg           # Logo source (vector)
└── icons/
    ├── icon16.png
    ├── icon48.png
    ├── icon128.png
    └── icon512.png
```

---

## 🩺 Troubleshooting

| Symptom | Fix |
| --- | --- |
| New tab still shows Speed Dial | Make sure the extension is **enabled**, then hit **⟳ reload** on its card after editing files |
| Address-bar searches still hit Google | Check the Google domain you're on is covered by `host_permissions` in `manifest.json` |
| Extension is off after restarting Opera | Enable **Developer mode** again — Opera treats unpacked extensions as developer builds |
| Redirect loop or blank page | Check `opera://extensions` → *service worker* → Inspect and read the console |
| Works in normal windows, not incognito | Enable **Allow in private windows**; Chromium still limits extension behaviour in private mode |
| Changed the target URL | Edit `background.js` (const `START`), then reload the extension |

---

## ⚠️ Limitations

- 👀 A brief flash of the Speed Dial may appear before the redirect — Chromium's tab lifecycle makes it unavoidable.
- 🕶️ Private/incognito behaviour is restricted by the browser itself.
- 🧪 Internal URLs can change between Opera releases. If a future version breaks this, run the service worker console and look for the new `pendingUrl`.

---

## 🤝 Contributing

Issues and PRs are welcome! If Opera changes its internal new-tab URL, open an issue with the `pendingUrl` from the service worker console — one line fix. 🙌

---

<div align="center">

Built with 🧉 and a healthy distrust of default browsers.

**Search privately. Start here.** → [startpage.com](https://www.startpage.com)

</div>
