// Toast notification system
(function () {
  const style = document.createElement('style');
  style.textContent = `
.toast-container { position: fixed; top: 80px; right: 24px; z-index: 9970; display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
.toast { padding: 14px 20px; border-radius: 10px; font-size: 14px; font-family: 'Space Grotesk', sans-serif; pointer-events: auto; cursor: pointer; animation: toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1); max-width: 340px; border: 1px solid; backdrop-filter: blur(10px); }
.toast.out { animation: toastOut 0.3s ease forwards; }
@keyframes toastIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
@keyframes toastOut { to { opacity: 0; transform: translateX(40px); } }
.toast-points { background: rgba(119,51,255,0.1); border-color: rgba(119,51,255,0.3); color: #bb88ff; }
.toast-order { background: rgba(0,255,136,0.1); border-color: rgba(0,255,136,0.3); color: #66ffbb; }
.toast-referral { background: rgba(68,136,255,0.1); border-color: rgba(68,136,255,0.3); color: #88bbff; }
.toast-error { background: rgba(255,68,170,0.1); border-color: rgba(255,68,170,0.3); color: #ff88cc; }
`;
  document.head.appendChild(style);

  let container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);

  window.thaPillToast = function (message, type = 'order', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    container.appendChild(toast);

    const dismiss = () => {
      toast.classList.add('out');
      setTimeout(() => toast.remove(), 300);
    };
    toast.addEventListener('click', dismiss);
    setTimeout(dismiss, duration);
  };
})();
