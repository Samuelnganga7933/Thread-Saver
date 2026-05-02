
let pageData = null;
let selectedFmt = 'pdf';
let selectedMode = 'clean';

const PLATFORM_ICONS = {
  fiverr:     'https://www.fiverr.com/favicon.ico',
  upwork:     'https://www.upwork.com/favicon.ico',
  freelancer: 'https://www.freelancer.com/favicon.ico',
  whatsapp:   'https://web.whatsapp.com/favicon.ico',
  messenger:  'https://www.messenger.com/favicon.ico',
  linkedin:   'https://www.linkedin.com/favicon.ico',
  twitter:    'https://abs.twimg.com/favicons/twitter.3.ico',
};

const MEDIA_ICONS = { audio:'🎵', video:'▶', pdf:'📄', json:'{ }', txt:'Tt', md:'#', csv:'⊞', xml:'< >' };
const MEDIA_COLORS = { audio:'#111827', video:'#0f172a', pdf:'#1c0a0a', json:'#0a1a0a', txt:'#111', md:'#0a0a1c', csv:'#0a1a0a', xml:'#1a0a1a' };

// tabs
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('on'));
  document.querySelectorAll('.pane').forEach(x => x.classList.remove('on'));
  t.classList.add('on');
  document.getElementById('pane-' + t.dataset.tab).classList.add('on');
}));

// format
document.querySelectorAll('.fmt-btn').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.fmt-btn').forEach(x => x.classList.remove('on'));
  b.classList.add('on'); selectedFmt = b.dataset.fmt;
}));

// mode
document.querySelectorAll('.mbtn').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.mbtn').forEach(x => x.classList.remove('on'));
  b.classList.add('on'); selectedMode = b.dataset.mode;
}));

function setCount(n) {
  document.getElementById('msgCount').textContent = n;
  const btn = document.getElementById('exportBtn');
  btn.disabled = n === 0;
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// load platform on open
(async () => {
  const tab = await getCurrentTab();
  chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_DATA' }, (resp) => {
    if (chrome.runtime.lastError || !resp) return;
    pageData = resp;
    const p = resp.platform;
    const nameEl = document.getElementById('pname');
    const iconEl = document.getElementById('picon');
    nameEl.textContent = p.name || 'Generic';
    const iconUrl = PLATFORM_ICONS[p.key];
    if (iconUrl) { iconEl.src = iconUrl; iconEl.style.display = 'block'; }
    setCount(resp.messages?.length || 0);
  });
})();

// auto scan
document.getElementById('autoScan').addEventListener('click', async () => {
  const tab = await getCurrentTab();
  chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_DATA' }, (resp) => {
    if (!resp) return;
    pageData = resp;
    setCount(resp.messages?.length || 0);
    document.getElementById('convStatus').textContent = 'Scan complete';
    document.getElementById('convStatus').className = 'status ok';
    setTimeout(() => document.getElementById('convStatus').textContent = '', 2000);
  });
});

// manual select
document.getElementById('manualScan').addEventListener('click', async () => {
  const tab = await getCurrentTab();
  document.getElementById('convStatus').textContent = 'Click any element on the page...';
  document.getElementById('convStatus').className = 'status';
  window.close();
  chrome.tabs.sendMessage(tab.id, { type: 'MANUAL_SELECT' }, (resp) => {
    if (resp?.messages) setCount(resp.messages.length);
  });
});

// export
document.getElementById('exportBtn').addEventListener('click', async () => {
  if (!pageData?.messages?.length) return;
  const msgs = pageData.messages;
  const platform = pageData.platform?.name || 'Conversation';
  const ts = new Date().toISOString().slice(0, 10);
  const name = (platform + '_' + ts).replace(/\s+/g, '_');
  const statusEl = document.getElementById('convStatus');

  try {
    if (selectedFmt === 'csv')  exportCSV(msgs, name);
    if (selectedFmt === 'html') exportHTML(msgs, name, platform);
    if (selectedFmt === 'txt')  exportTXT(msgs, name);
    if (selectedFmt === 'json') exportJSON(msgs, name, platform);
    if (selectedFmt === 'md')   exportMD(msgs, name, platform);
    if (selectedFmt === 'pdf')  exportPDF(msgs, name, platform);
    if (selectedFmt === 'xlsx') exportCSV(msgs, name); // fallback to CSV
    statusEl.textContent = 'Saved to Downloads';
    statusEl.className = 'status ok';
  } catch(e) {
    statusEl.textContent = 'Error: ' + e.message;
    statusEl.className = 'status err';
  }
  setTimeout(() => { statusEl.textContent = ''; statusEl.className = 'status'; }, 3000);
});

function dl(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function exportCSV(msgs, name) {
  const rows = [['#','Side','Message','Time'], ...msgs.map((m,i) => [i+1, m.side, '"'+m.text.replace(/"/g,'""')+'"', m.time])];
  dl(rows.map(r=>r.join(',')).join('\n'), name+'.csv', 'text/csv');
}

function exportTXT(msgs, name) {
  const lines = msgs.map(m => `[${m.side.toUpperCase()}]${m.time?' ('+m.time+')':''}\n${m.text}`).join('\n\n');
  dl(lines, name+'.txt', 'text/plain');
}

function exportJSON(msgs, name, platform) {
  const obj = { platform, exported: new Date().toISOString(), count: msgs.length, messages: msgs };
  dl(JSON.stringify(obj, null, 2), name+'.json', 'application/json');
}

function exportMD(msgs, name, platform) {
  const lines = [`# ${platform} Conversation\n\n*Exported ${new Date().toLocaleDateString()} by ThreadSave*\n`, '---', ...msgs.map(m => `**${m.side === 'right' ? 'You' : 'Them'}**${m.time ? ' ' + m.time : ''}\n\n${m.text}`)];
  dl(lines.join('\n\n'), name+'.md', 'text/markdown');
}

function exportHTML(msgs, name, platform) {
  const rows = msgs.map(m => `<div class="msg ${m.side}"><div class="bub">${esc(m.text)}</div>${m.time?`<div class="t">${m.time}</div>`:''}</div>`).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${platform}</title>
<style>body{font-family:system-ui;max-width:640px;margin:40px auto;background:#f5f5f5;padding:20px}h1{font-size:17px;margin-bottom:20px}.msg{display:flex;flex-direction:column;margin:8px 0}.msg.right{align-items:flex-end}.bub{max-width:78%;padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.5}.msg.left .bub{background:#fff;color:#111;border-radius:4px 12px 12px 12px}.msg.right .bub{background:#0d0d0d;color:#fff;border-radius:12px 4px 12px 12px}.t{font-size:11px;color:#999;margin-top:3px}</style>
</head><body><h1>${platform}</h1>${rows}</body></html>`;
  dl(html, name+'.html', 'text/html');
}

function exportPDF(msgs, name, platform) {
  const win = window.open('', '_blank');
  if (!win) { exportTXT(msgs, name); return; }
  const rows = msgs.map(m => `<tr><td style="color:#999;width:50px;vertical-align:top;padding:6px 8px;font-size:11px">${m.side}</td><td style="padding:6px 8px;font-size:13px;line-height:1.5">${esc(m.text)}</td><td style="color:#bbb;width:70px;vertical-align:top;padding:6px 8px;font-size:11px">${m.time}</td></tr>`).join('');
  win.document.write(`<!DOCTYPE html><html><head><title>${platform}</title><style>body{font-family:system-ui;margin:40px;color:#111}h1{font-size:16px;margin-bottom:16px}table{width:100%;border-collapse:collapse}tr{border-bottom:1px solid #eee}button{margin-bottom:16px;padding:8px 16px;cursor:pointer}@media print{button{display:none}}</style></head><body><h1>${platform}</h1><button onclick="window.print()">Save as PDF</button><table>${rows}</table></body></html>`);
  win.document.close();
}

// media scan
document.getElementById('mediaScanBtn').addEventListener('click', async () => {
  const tab = await getCurrentTab();
  const btn = document.getElementById('mediaScanBtn');
  btn.textContent = 'Scanning...'; btn.disabled = true;

  chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => {
    const results = []; const seen = new Set();
    const AUDIO_EXT = ['mp3','wav','ogg','flac','aac','m4a','opus','weba'];
    const VIDEO_EXT = ['mp4','webm','mkv','mov','m4v','ogv','avi'];
    const FILE_EXT  = ['pdf','json','txt','md','csv','xml','docx','xlsx','zip'];

    function getType(url) {
      try {
        const ext = new URL(url).pathname.split('.').pop().split('?')[0].toLowerCase();
        if (AUDIO_EXT.includes(ext)) return 'audio';
        if (VIDEO_EXT.includes(ext)) return 'video';
        if (FILE_EXT.includes(ext))  return ext;
        if (url.includes('audio'))   return 'audio';
        if (url.includes('video'))   return 'video';
      } catch(_) {}
      return null;
    }
    function fname(url, fb) { try { return decodeURIComponent(new URL(url).pathname.split('/').pop())||fb; } catch{return fb;} }
    function add(url, fallback) {
      if (!url || url.startsWith('data:') || seen.has(url)) return;
      const t = getType(url); if (!t) return;
      seen.add(url); results.push({ url, type: t, name: fname(url, fallback) });
    }

    document.querySelectorAll('audio[src],audio source[src]').forEach(e => add(e.src||e.getAttribute('src'), 'audio.mp3'));
    document.querySelectorAll('video[src],video source[src]').forEach(e => add(e.src||e.getAttribute('src'), 'video.mp4'));
    document.querySelectorAll('video').forEach(e => { if(e.src && e.src.startsWith('blob:') && !seen.has(e.src)) { seen.add(e.src); results.push({url:e.src,type:'video',name:'stream.mp4',blob:true}); }});
    document.querySelectorAll('iframe[src],embed[src],object[data]').forEach(e => add(e.src||e.getAttribute('data'), 'document'));
    document.querySelectorAll('a[href]').forEach(e => add(e.href, e.textContent?.trim()||'file'));
    document.querySelectorAll('source[src]').forEach(e => add(e.src, 'media'));
    return results;
  }}, (res) => {
    btn.textContent = 'Scan page for media and files'; btn.disabled = false;
    const items = res?.[0]?.result || [];
    const list = document.getElementById('mediaList');
    if (!items.length) { list.innerHTML = '<div class="empty">No downloadable files found on this page.</div>'; return; }
    const ICONS = { audio:'🎵', video:'▶', pdf:'📄', json:'{ }', txt:'Tt', md:'#', csv:'⊞', xml:'‹›', docx:'W', xlsx:'X', zip:'📦' };
    const COLORS = { audio:'#111827', video:'#0f172a', pdf:'#1c0a0a', json:'#0a1a0a', txt:'#111', md:'#0a0a1c', csv:'#0a1a0a', xml:'#1a0a1a', docx:'#0a0a2a', xlsx:'#0a1a0a', zip:'#1a1000' };
    list.innerHTML = items.map((item,i) => `
      <div class="media-item">
        <div class="micon" style="background:${COLORS[item.type]||'#111'}">${ICONS[item.type]||'📎'}</div>
        <div class="minfo">
          <div class="mname">${item.name}</div>
          <div class="mtype">${item.type}${item.blob?' (stream)':''}</div>
        </div>
        <button class="mdl" data-url="${item.url.replace(/"/g,'')}" data-name="${item.name.replace(/"/g,'')}">
          <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
      </div>`).join('');

    list.querySelectorAll('.mdl').forEach(btn => {
      btn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'DOWNLOAD_FILE', url: btn.dataset.url, filename: btn.dataset.name });
        btn.innerHTML = '<span style="color:#22c55e;font-size:14px">✓</span>';
        btn.style.background = 'rgba(34,197,94,.1)';
      });
    });
  });
});
