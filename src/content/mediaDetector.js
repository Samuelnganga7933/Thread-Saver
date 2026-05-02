const TOAST_CSS = `
.ts-toast{position:fixed;bottom:20px;right:20px;z-index:2147483646;display:flex;align-items:center;gap:10px;background:#0d0d0d;color:#fff;padding:10px 14px;border-radius:10px;font-family:system-ui,sans-serif;font-size:13px;box-shadow:0 4px 24px rgba(0,0,0,.3);max-width:310px;animation:ts-in .22s ease;border:1px solid rgba(255,255,255,.08)}
.ts-ti{width:30px;height:30px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px}
.ts-tb{flex:1;min-width:0}
.ts-tt{font-weight:600;font-size:12px;color:#fff}
.ts-ts{font-size:11px;color:rgba(255,255,255,.4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ts-save{background:#fff;color:#0d0d0d;border:none;border-radius:5px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;flex-shrink:0;font-family:system-ui,sans-serif}
.ts-save:hover{opacity:.8}
.ts-x{background:none;border:none;color:rgba(255,255,255,.35);font-size:15px;cursor:pointer;padding:0 2px;flex-shrink:0;line-height:1}
.ts-x:hover{color:#fff}
@keyframes ts-in{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}
`;

let styleInjected = false;
function injectStyle() {
  if (styleInjected) return;
  const s = document.createElement('style');
  s.textContent = TOAST_CSS;
  document.head.appendChild(s);
  styleInjected = true;
}

const notified = new Set();
const AUDIO_EXTS = ['mp3','wav','ogg','flac','aac','m4a','opus','weba'];
const VIDEO_EXTS = ['mp4','webm','mkv','mov','m4v','ogv','avi'];
const FILE_EXTS  = ['pdf','json','txt','md','csv','xml','docx','xlsx','zip','rar'];
const ICONS  = { audio:'🎵', video:'▶', pdf:'📄', json:'{}', txt:'Tt', md:'#', csv:'⊞', xml:'‹›', docx:'W', xlsx:'X', zip:'📦' };
const BKGS   = { audio:'#111827', video:'#0f172a', pdf:'#1c0a0a', json:'#0a1a0a', txt:'#111', md:'#0a0a1c', csv:'#0a1a0a', xml:'#1a0a1a', docx:'#0a0a2a', xlsx:'#0a1a0a', zip:'#1a1000' };

function getType(url) {
  try {
    const ext = new URL(url).pathname.split('.').pop().split('?')[0].toLowerCase();
    if (AUDIO_EXTS.includes(ext)) return 'audio';
    if (VIDEO_EXTS.includes(ext)) return 'video';
    if (FILE_EXTS.includes(ext))  return ext;
  } catch(_) {}
  return null;
}

function fname(url, fallback) {
  try { return decodeURIComponent(new URL(url).pathname.split('/').pop())||fallback; } catch { return fallback; }
}

function showToast(url, type, name) {
  injectStyle();
  const d = document.createElement('div');
  d.className = 'ts-toast';
  d.innerHTML = `<div class="ts-ti" style="background:${BKGS[type]||'#111'}">${ICONS[type]||'📎'}</div>
    <div class="ts-tb"><div class="ts-tt">${type.toUpperCase()} detected</div><div class="ts-ts">${name}</div></div>
    <button class="ts-save">Save</button><button class="ts-x">✕</button>`;
  document.body.appendChild(d);
  d.querySelector('.ts-save').onclick = () => {
    chrome.runtime.sendMessage({ type: 'DOWNLOAD_FILE', url, filename: name });
    d.remove();
  };
  d.querySelector('.ts-x').onclick = () => d.remove();
  setTimeout(() => d.remove(), 10000);
}

function check(url, fallback) {
  if (!url || url.startsWith('data:') || notified.has(url)) return;
  const t = getType(url); if (!t) return;
  notified.add(url);
  showToast(url, t, fname(url, fallback));
}

function scan() {
  document.querySelectorAll('audio[src],audio source[src]').forEach(e => check(e.src||e.getAttribute('src'), 'audio.mp3'));
  document.querySelectorAll('video[src],video source[src]').forEach(e => check(e.src||e.getAttribute('src'), 'video.mp4'));
  document.querySelectorAll('video').forEach(e => { if(e.src&&e.src.startsWith('blob:')&&!notified.has(e.src)){notified.add(e.src);showToast(e.src,'video','stream-video.mp4');}});
  document.querySelectorAll('iframe[src],embed[src],object[data]').forEach(e => check(e.src||e.getAttribute('data'),'document'));
  document.querySelectorAll('a[href]').forEach(e => check(e.href, e.textContent?.trim()||'file'));
  document.querySelectorAll('source[src]').forEach(e => check(e.src,'media'));
}

scan();
new MutationObserver(scan).observe(document.body, { childList:true, subtree:true });
