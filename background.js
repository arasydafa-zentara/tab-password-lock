
async function injectIntoAllTabs() {
  const tabs = await chrome.tabs.query({ url: "*://*/*" });
  for (const tab of tabs) {
    try {
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["content.css"]
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });
    } catch (_) {}
  }
}

chrome.runtime.onInstalled.addListener(() => {
  injectIntoAllTabs();
});

chrome.runtime.onStartup.addListener(() => {
  injectIntoAllTabs();
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.whitelist) {
    injectIntoAllTabs();
  }
});
