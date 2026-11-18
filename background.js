const START = "https://www.startpage.com/";
const SEARCH_URL = "https://www.startpage.com/do/dsearch?query=";

// Páginas internas con las que Opera GX / Chromium abren una pestaña nueva.
// La que usa Opera GX actualmente es chrome://startpageshared/.
const NEW_TAB_PREFIXES = [
  "chrome://startpageshared",
  "chrome://startpage",
  "chrome://newtab",
  "opera://startpage",
  "opera://newtab",
  "about:newtab",
  "about:home"
];

// Búsquedas de Google en cualquier TLD: se convierten en búsquedas de Startpage
// antes de que la petición llegue a Google.
const GOOGLE_SEARCH_RE =
  /^https?:\/\/([a-z0-9-]+\.)*google\.[a-z.]+\/(search|webhp)\?(.*)$/i;

function isNewTabUrl(url) {
  if (!url) return false;
  const clean = url.split("#")[0].replace(/\/$/, "");
  return NEW_TAB_PREFIXES.some((prefix) => clean.startsWith(prefix));
}

function redirectNewTab(tabId, url, source) {
  if (!isNewTabUrl(url)) return;
  console.log(`[startpage] new tab (${source}) tab=${tabId} url=${url}`);
  chrome.tabs.update(tabId, { url: START }).catch((e) => {
    console.log(`[startpage] update failed tab=${tabId}: ${e && e.message}`);
  });
}

function googleQuery(url) {
  const match = GOOGLE_SEARCH_RE.exec(url);
  if (!match) return null;
  const params = new URLSearchParams(match[3].split("#")[0]);
  return params.get("q");
}

function redirectSearch(details) {
  if (details.frameId !== 0) return;
  const query = googleQuery(details.url);
  if (!query) return;
  console.log(`[startpage] search intercept q=${query}`);
  chrome.tabs
    .update(details.tabId, { url: SEARCH_URL + encodeURIComponent(query) })
    .catch((e) => {
      console.log(`[startpage] search redirect failed: ${e && e.message}`);
    });
}

chrome.tabs.onCreated.addListener((tab) => {
  redirectNewTab(tab.id, tab.pendingUrl || tab.url, "onCreated");
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  redirectNewTab(tabId, changeInfo.url || tab.url, "onUpdated");
});

chrome.webNavigation.onBeforeNavigate.addListener(redirectSearch);
