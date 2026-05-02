chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_PAGE_DATA') {
    const platform = window.__threadsave?.detectPlatform?.() || { key:'generic', name:document.title, favicon:'', color:'#888' };
    const messages = window.__threadsave?.extractMessages?.(platform) || [];
    sendResponse({ platform, messages, url: location.href, title: document.title });
    return true;
  }
  if (msg.type === 'MANUAL_SELECT') {
    document.body.style.cursor = 'crosshair';
    const tip = document.createElement('div');
    tip.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);background:#0d0d0d;color:#fff;padding:8px 16px;border-radius:8px;font-family:system-ui;font-size:13px;z-index:2147483647;pointer-events:none';
    tip.textContent = 'Click any conversation container';
    document.body.appendChild(tip);
    const handler = e => {
      e.preventDefault(); e.stopPropagation();
      document.body.style.cursor = '';
      tip.remove();
      document.removeEventListener('click', handler, true);
      const el = e.target.closest('[class*="message"],[class*="msg"],[class*="bubble"],[class*="chat"],article,section,ul,ol')||e.target;
      const seen = new Set();
      const messages = [...el.querySelectorAll('*'), el]
        .filter(n => { const t = n.innerText?.trim(); return t && t.length > 2; })
        .map(n => ({ text: n.innerText.trim(), side: 'left', time: '' }))
        .filter(m => { if(seen.has(m.text)) return false; seen.add(m.text); return true; });
      sendResponse({ messages });
    };
    document.addEventListener('click', handler, true);
    return true;
  }
});
