// thaPill live chat widget — REST polling (works on serverless)
(function () {
  const STYLE = document.createElement('style');
  STYLE.textContent = `
.chat-trigger-btn { position: fixed; bottom: 24px; right: 24px; z-index: 9980; width: 56px; height: 56px; border-radius: 50%; background: var(--electric, #00ff88); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(0,255,136,0.3); transition: transform 0.2s, box-shadow 0.2s; animation: chatIdle 5s ease-in-out infinite; }
.chat-trigger-btn:hover { transform: scale(1.1); box-shadow: 0 0 30px rgba(0,255,136,0.5); }
@keyframes chatIdle { 0%,90%,100% { transform: scale(1); } 95% { transform: scale(1.05); } }
.chat-trigger-btn svg { width: 24px; height: 24px; fill: #030306; }
.chat-unread { position: absolute; top: -2px; right: -2px; min-width: 18px; height: 18px; border-radius: 9px; background: #ff44aa; color: white; font-size: 10px; font-family: 'JetBrains Mono', monospace; display: flex; align-items: center; justify-content: center; }
.chat-unread:empty { display: none; }
.chat-window { position: fixed; bottom: 92px; right: 24px; width: 380px; height: 520px; z-index: 9981; background: var(--surface, #08080f); border: 1px solid var(--border, #151525); border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; transform: translateY(20px) scale(0.95); opacity: 0; pointer-events: none; transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s; box-shadow: 0 16px 60px rgba(0,0,0,0.5); }
.chat-window.open { transform: translateY(0) scale(1); opacity: 1; pointer-events: auto; }
.chat-win-header { display: flex; align-items: center; gap: 10px; padding: 16px 18px; border-bottom: 1px solid var(--border, #151525); background: var(--card, #0c0c18); }
.chat-win-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
.chat-win-info { flex: 1; }
.chat-win-name { font-size: 14px; font-weight: 600; color: var(--text, #e8e8f0); }
.chat-win-status { font-size: 11px; color: var(--electric, #00ff88); display: flex; align-items: center; gap: 4px; }
.chat-win-status::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--electric, #00ff88); }
.chat-win-close { background: none; border: none; color: var(--text-dim, #55556a); font-size: 22px; cursor: pointer; transition: transform 0.3s; padding: 4px; line-height: 1; }
.chat-win-close:hover { color: var(--text, #e8e8f0); }
.chat-win-close.rotated { transform: rotate(90deg); }
.chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.chat-messages::-webkit-scrollbar { width: 4px; }
.chat-messages::-webkit-scrollbar-thumb { background: var(--border, #151525); border-radius: 2px; }
.chat-msg { max-width: 80%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.4; animation: chatMsgIn 0.3s ease-out; }
@keyframes chatMsgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.chat-msg.user { align-self: flex-end; background: var(--electric, #00ff88); color: #030306; border-bottom-right-radius: 4px; }
.chat-msg.bot, .chat-msg.agent { align-self: flex-start; background: var(--card, #0c0c18); color: var(--text, #e8e8f0); border: 1px solid var(--border, #151525); border-bottom-left-radius: 4px; }
.chat-typing { align-self: flex-start; padding: 10px 14px; background: var(--card, #0c0c18); border: 1px solid var(--border, #151525); border-radius: 12px; display: none; }
.chat-typing.visible { display: flex; gap: 4px; }
.chat-typing-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-dim, #55556a); animation: typingBounce 1.2s ease-in-out infinite; }
.chat-typing-dot:nth-child(2) { animation-delay: 0.2s; }
.chat-typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes typingBounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
.chat-input-wrap { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--border, #151525); background: var(--card, #0c0c18); }
.chat-input { flex: 1; padding: 10px 14px; background: var(--surface, #08080f); border: 1px solid var(--border, #151525); border-radius: 8px; color: var(--text, #e8e8f0); font-family: 'Space Grotesk', sans-serif; font-size: 14px; outline: none; resize: none; }
.chat-input:focus { border-color: var(--electric, #00ff88); box-shadow: 0 0 0 2px rgba(0,255,136,0.1); }
.chat-send { width: 40px; height: 40px; border-radius: 8px; background: var(--electric, #00ff88); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
.chat-send:hover { transform: scale(1.05); }
.chat-send svg { width: 18px; height: 18px; fill: #030306; }
@media (max-width: 480px) { .chat-window { bottom: 0; right: 0; width: 100vw; height: 100vh; border-radius: 0; } .chat-trigger-btn { bottom: 16px; right: 16px; } }
`;
  document.head.appendChild(STYLE);

  const HTML = `
<button class="chat-trigger-btn" id="chatTrigger">
  <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
  <span class="chat-unread" id="chatUnread"></span>
</button>
<div class="chat-window" id="chatWindow">
  <div class="chat-win-header">
    <img src="/thapill-assets/icon.png" alt="thaPill" class="chat-win-avatar">
    <div class="chat-win-info">
      <div class="chat-win-name">thaPill Support</div>
      <div class="chat-win-status">Online</div>
    </div>
    <button class="chat-win-close" id="chatWinClose">&times;</button>
  </div>
  <div class="chat-messages" id="chatMessages">
    <div class="chat-msg bot">Hey! How can we help you today?</div>
    <div class="chat-typing" id="chatTyping"><div class="chat-typing-dot"></div><div class="chat-typing-dot"></div><div class="chat-typing-dot"></div></div>
  </div>
  <div class="chat-input-wrap">
    <input class="chat-input" id="chatInput" placeholder="Type a message..." maxlength="500">
    <button class="chat-send" id="chatSend"><svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg></button>
  </div>
</div>`;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = HTML;
  document.body.appendChild(wrapper);

  const trigger = document.getElementById('chatTrigger');
  const chatWindow = document.getElementById('chatWindow');
  const closeBtn = document.getElementById('chatWinClose');
  const messages = document.getElementById('chatMessages');
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSend');
  const typingEl = document.getElementById('chatTyping');
  let isOpen = false;
  let lastMsgId = 0;
  let pollInterval = null;

  function toggle() {
    isOpen = !isOpen;
    chatWindow.classList.toggle('open', isOpen);
    closeBtn.classList.toggle('rotated', isOpen);
    if (isOpen) {
      loadHistory();
      startPolling();
      input.focus();
    } else {
      stopPolling();
    }
  }

  trigger.addEventListener('click', toggle);
  closeBtn.addEventListener('click', toggle);

  function addMessage(sender, text, id) {
    if (id && id <= lastMsgId) return;
    if (id) lastMsgId = Math.max(lastMsgId, id);
    const div = document.createElement('div');
    div.className = 'chat-msg ' + sender;
    div.textContent = text;
    messages.insertBefore(div, typingEl);
    scrollBottom();
  }

  function scrollBottom() { setTimeout(() => { messages.scrollTop = messages.scrollHeight; }, 50); }

  async function loadHistory() {
    try {
      const res = await fetch('/api/chat/history');
      const data = await res.json();
      for (const m of data.messages) addMessage(m.sender, m.message, m.id);
    } catch {}
  }

  async function poll() {
    try {
      const res = await fetch('/api/chat/history?since=' + lastMsgId);
      const data = await res.json();
      for (const m of data.messages) addMessage(m.sender, m.message, m.id);
    } catch {}
  }

  function startPolling() { if (!pollInterval) pollInterval = setInterval(poll, 3000); }
  function stopPolling()  { if (pollInterval)  { clearInterval(pollInterval); pollInterval = null; } }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    addMessage('user', text);
    typingEl.classList.add('visible');
    scrollBottom();

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setTimeout(() => {
        typingEl.classList.remove('visible');
        for (const m of data.messages) {
          if (m.sender !== 'user') addMessage(m.sender, m.message, m.id);
        }
      }, 600);
    } catch {
      typingEl.classList.remove('visible');
      addMessage('bot', 'Connection error — please try again.');
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
})();
