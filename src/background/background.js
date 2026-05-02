chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'DOWNLOAD_FILE') {
    chrome.downloads.download(
      { url: msg.url, filename: msg.filename, saveAs: false },
      (id) => sendResponse({ success: true, downloadId: id })
    );
    return true;
  }
});
