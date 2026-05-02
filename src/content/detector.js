const PLATFORMS = {
  fiverr:     { name:'Fiverr',       favicon:'https://www.fiverr.com/favicon.ico',      color:'#1dbf73', test:()=>location.hostname.includes('fiverr.com'),       selectors:['.message-bubble','.msg-content','[class*="message"]'] },
  upwork:     { name:'Upwork',       favicon:'https://www.upwork.com/favicon.ico',      color:'#6fda44', test:()=>location.hostname.includes('upwork.com'),       selectors:['[class*="message"]','[data-test="message"]'] },
  freelancer: { name:'Freelancer',   favicon:'https://www.freelancer.com/favicon.ico',  color:'#29b2fe', test:()=>location.hostname.includes('freelancer.com'),   selectors:['[class*="MessageBubble"]','[class*="message"]'] },
  whatsapp:   { name:'WhatsApp Web', favicon:'https://web.whatsapp.com/favicon.ico',   color:'#25d366', test:()=>location.hostname.includes('web.whatsapp.com'), selectors:['.message-in','.message-out','[class*="_message_"]'] },
  messenger:  { name:'Messenger',    favicon:'https://www.messenger.com/favicon.ico',   color:'#0866ff', test:()=>location.hostname.includes('messenger.com'),    selectors:['[class*="message"]','[class*="bubble"]'] },
  linkedin:   { name:'LinkedIn',     favicon:'https://www.linkedin.com/favicon.ico',    color:'#0a66c2', test:()=>location.hostname.includes('linkedin.com'),     selectors:['[class*="message"]','[class*="msg"]'] },
  twitter:    { name:'X / Twitter',  favicon:'https://abs.twimg.com/favicons/twitter.3.ico', color:'#fff', test:()=>location.hostname.includes('twitter.com')||location.hostname.includes('x.com'), selectors:['[data-testid="tweetText"]','[class*="message"]'] },
};

function detectPlatform() {
  for (const [key, p] of Object.entries(PLATFORMS)) {
    if (p.test()) return { key, ...p };
  }
  return { key:'generic', name:document.title||'This page', favicon:'', color:'#888', selectors:[] };
}

function extractMessages(platform) {
  const allSels = [...(platform.selectors||[]),'[class*="message"]','[class*="msg"]','[class*="bubble"]','[class*="chat"]','article'];
  const msgs = []; const tried = new Set();
  for (const sel of allSels) {
    try {
      for (const el of document.querySelectorAll(sel)) {
        if (tried.has(el)) continue; tried.add(el);
        const text = el.innerText?.trim();
        if (!text || text.length < 2) continue;
        const rect = el.getBoundingClientRect();
        msgs.push({ text, side: rect.left < window.innerWidth/2 ? 'left':'right', time: el.querySelector('time,[class*="time"],[class*="timestamp"]')?.innerText?.trim()||'' });
      }
    } catch(_) {}
  }
  const seen = new Set();
  return msgs.filter(m => { if(seen.has(m.text)) return false; seen.add(m.text); return true; });
}

window.__threadsave = { detectPlatform, extractMessages };
