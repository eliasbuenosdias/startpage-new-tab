const START = "https://www.startpage.com/";

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

function isNewTabUrl(url) {
  if (!url) return false;
  const clean = url.split("#")[0].replace(/\/$/, "");
  return NEW_TAB_PREFIXES.some((prefix) => clean.startsWith(prefix));
}

function redirect(tabId, url, source) {
  if (!isNewTabUrl(url)) return;
  console.log(`[startpage] redirect (${source}) tab=${tabId} url=${url}`);
  chrome.tabs.update(tabId, { url: START }).catch((e) => {
    console.log(`[startpage] update failed tab=${tabId}: ${e && e.message}`);
  });
}

chrome.tabs.onCreated.addListener((tab) => {
  redirect(tab.id, tab.pendingUrl || tab.url, "onCreated");
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  redirect(tabId, changeInfo.url || tab.url, "onUpdated");
});
