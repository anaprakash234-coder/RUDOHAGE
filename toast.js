/* ============================================
   RUDOHAGE — Custom Notification System
   Replace browser alert/confirm with luxury UI
   Usage: window.toast.success / error / info
          window.confirm replaced automatically
   ============================================ */

(function(){

  /* ===== INJECT STYLES ===== */
  const style = document.createElement("style");
  style.textContent = `

    /* TOAST CONTAINER */
    #rudo-toast-container{
      position:fixed;
      top:24px;
      right:24px;
      z-index:999999;
      display:flex;
      flex-direction:column;
      gap:12px;
      pointer-events:none;
    }

    /* SINGLE TOAST */
    .rudo-toast{
      display:flex;
      align-items:center;
      gap:14px;
      padding:16px 20px;
      border-radius:16px;
      background:rgba(20,20,20,.92);
      backdrop-filter:blur(16px);
      -webkit-backdrop-filter:blur(16px);
      color:#f0ece4;
      font-family:'Manrope',sans-serif;
      font-size:13.5px;
      font-weight:500;
      max-width:340px;
      min-width:260px;
      box-shadow:0 20px 50px rgba(0,0,0,.35);
      pointer-events:auto;
      cursor:default;
      border:1px solid rgba(255,255,255,.06);
      opacity:0;
      transform:translateX(30px);
      transition:opacity .35s ease, transform .35s cubic-bezier(.22,1,.36,1);
    }

    .rudo-toast.show{
      opacity:1;
      transform:translateX(0);
    }

    .rudo-toast.hide{
      opacity:0;
      transform:translateX(30px);
    }

    .rudo-toast-icon{
      font-size:18px;
      flex-shrink:0;
    }

    .rudo-toast.success .rudo-toast-icon{ color:#4ade80; }
    .rudo-toast.error   .rudo-toast-icon{ color:#f87171; }
    .rudo-toast.info    .rudo-toast-icon{ color:#a48b74; }
    .rudo-toast.warning .rudo-toast-icon{ color:#facc15; }

    .rudo-toast-msg{
      flex:1;
      line-height:1.5;
    }

    .rudo-toast-close{
      opacity:.4;
      cursor:pointer;
      font-size:16px;
      flex-shrink:0;
      transition:.2s;
      background:none;
      border:none;
      color:#f0ece4;
      padding:0;
    }

    .rudo-toast-close:hover{ opacity:1; }

    /* PROGRESS BAR */
    .rudo-toast-bar{
      position:absolute;
      bottom:0;
      left:0;
      height:2px;
      background:rgba(164,139,116,.6);
      border-radius:0 0 16px 16px;
      transition:width linear;
    }

    .rudo-toast{ position:relative; overflow:hidden; }

    /* MODAL OVERLAY */
    #rudo-modal-overlay{
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.6);
      backdrop-filter:blur(6px);
      -webkit-backdrop-filter:blur(6px);
      z-index:9999998;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:20px;
      opacity:0;
      transition:opacity .3s ease;
    }

    #rudo-modal-overlay.show{ opacity:1; }

    /* MODAL BOX */
    #rudo-modal-box{
      background:#faf8f4;
      border-radius:24px;
      padding:40px 36px;
      max-width:400px;
      width:100%;
      text-align:center;
      box-shadow:0 40px 100px rgba(0,0,0,.25);
      transform:scale(.92) translateY(10px);
      transition:transform .35s cubic-bezier(.22,1,.36,1);
      font-family:'Manrope',sans-serif;
    }

    #rudo-modal-overlay.show #rudo-modal-box{
      transform:scale(1) translateY(0);
    }

    #rudo-modal-brand{
      font-family:'Cormorant Garamond',serif;
      font-size:1.1rem;
      letter-spacing:2px;
      color:#a48b74;
      text-transform:uppercase;
      margin-bottom:18px;
    }

    #rudo-modal-icon{
      font-size:32px;
      margin-bottom:16px;
    }

    #rudo-modal-title{
      font-family:'Cormorant Garamond',serif;
      font-size:1.7rem;
      color:#111;
      margin-bottom:10px;
      line-height:1.2;
    }

    #rudo-modal-msg{
      font-size:14px;
      color:rgba(17,17,17,.65);
      line-height:1.7;
      margin-bottom:28px;
    }

    #rudo-modal-btns{
      display:flex;
      gap:12px;
      justify-content:center;
    }

    .rudo-modal-btn{
      flex:1;
      padding:13px 20px;
      border-radius:50px;
      border:none;
      cursor:pointer;
      font-family:'Manrope',sans-serif;
      font-size:12px;
      letter-spacing:2px;
      text-transform:uppercase;
      font-weight:600;
      transition:.25s;
      max-width:160px;
    }

    .rudo-modal-btn.cancel{
      background:#f0ede8;
      color:#111;
    }

    .rudo-modal-btn.cancel:hover{
      background:#e5e2dd;
    }

    .rudo-modal-btn.confirm{
      background:#111;
      color:#fff;
    }

    .rudo-modal-btn.confirm:hover{
      background:#333;
    }

    .rudo-modal-btn.confirm.danger{
      background:#dc2626;
    }

    .rudo-modal-btn.confirm.danger:hover{
      background:#b91c1c;
    }

    @media(max-width:480px){
      #rudo-toast-container{
        top:auto;
        bottom:20px;
        right:12px;
        left:12px;
      }
      .rudo-toast{
        max-width:100%;
        min-width:auto;
      }
      #rudo-modal-box{
        padding:30px 22px;
      }
    }

  `;
  document.head.appendChild(style);

  /* ===== CREATE TOAST CONTAINER ===== */
  const container = document.createElement("div");
  container.id = "rudo-toast-container";
  document.body.appendChild(container);

  /* ===== TOAST ICONS ===== */
  const icons = {
    success: "✓",
    error:   "✕",
    info:    "ℹ",
    warning: "⚠"
  };

  /* ===== SHOW TOAST ===== */
  function showToast(message, type = "info", duration = 4000){

    const toast = document.createElement("div");
    toast.className = `rudo-toast ${type}`;

    toast.innerHTML = `
      <span class="rudo-toast-icon">${icons[type] || icons.info}</span>
      <span class="rudo-toast-msg">${message}</span>
      <button class="rudo-toast-close">✕</button>
      <div class="rudo-toast-bar" id="bar-${Date.now()}"></div>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add("show"));
    });

    // Progress bar
    const bar = toast.querySelector(".rudo-toast-bar");
    bar.style.width = "100%";
    requestAnimationFrame(() => {
      bar.style.transition = `width ${duration}ms linear`;
      bar.style.width = "0%";
    });

    // Close button
    toast.querySelector(".rudo-toast-close").addEventListener("click", () => {
      removeToast(toast);
    });

    // Auto remove
    const timer = setTimeout(() => removeToast(toast), duration);
    toast._timer = timer;

    return toast;
  }

  function removeToast(toast){
    clearTimeout(toast._timer);
    toast.classList.add("hide");
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }

  /* ===== MODAL ===== */
  function showModal({ title, message, confirmText = "OK", cancelText = null, danger = false, icon = null }){
    return new Promise((resolve) => {

      // Create if not exists
      let overlay = document.getElementById("rudo-modal-overlay");
      if(overlay) overlay.remove();

      overlay = document.createElement("div");
      overlay.id = "rudo-modal-overlay";

      overlay.innerHTML = `
        <div id="rudo-modal-box">
          <div id="rudo-modal-brand">RUDOHAGE</div>
          ${icon ? `<div id="rudo-modal-icon">${icon}</div>` : ""}
          <div id="rudo-modal-title">${title}</div>
          <div id="rudo-modal-msg">${message}</div>
          <div id="rudo-modal-btns">
            ${cancelText ? `<button class="rudo-modal-btn cancel" id="rudo-cancel">${cancelText}</button>` : ""}
            <button class="rudo-modal-btn confirm ${danger ? "danger" : ""}" id="rudo-confirm">${confirmText}</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => overlay.classList.add("show"));
      });

      function closeModal(result){
        overlay.classList.remove("show");
        setTimeout(() => overlay.remove(), 350);
        resolve(result);
      }

      overlay.querySelector("#rudo-confirm").addEventListener("click", () => closeModal(true));

      const cancelBtn = overlay.querySelector("#rudo-cancel");
      if(cancelBtn){
        cancelBtn.addEventListener("click", () => closeModal(false));
      }

      overlay.addEventListener("click", (e) => {
        if(e.target === overlay) closeModal(false);
      });

    });
  }

  /* ===== PUBLIC API ===== */
  window.toast = {
    success: (msg, dur) => showToast(msg, "success", dur),
    error:   (msg, dur) => showToast(msg, "error",   dur),
    info:    (msg, dur) => showToast(msg, "info",    dur),
    warning: (msg, dur) => showToast(msg, "warning", dur),
    modal:   showModal
  };

  /* ===== FIREBASE ERROR TRANSLATOR ===== */
  function translateError(message){
    const msg = String(message);

    const firebaseErrors = {
      "auth/invalid-credential":        "Incorrect email or password. Please try again.",
      "auth/wrong-password":            "Incorrect password. Please try again.",
      "auth/user-not-found":            "No account found with this email.",
      "auth/email-already-in-use":      "This email is already registered. Please login instead.",
      "auth/weak-password":             "Password must be at least 6 characters.",
      "auth/invalid-email":             "Please enter a valid email address.",
      "auth/too-many-requests":         "Too many attempts. Please wait a moment and try again.",
      "auth/network-request-failed":    "Network error. Please check your connection.",
      "auth/popup-closed-by-user":      "Sign-in cancelled. Please try again.",
      "auth/popup-blocked":             "Popup was blocked. Please allow popups and try again.",
      "auth/account-exists-with-different-credential": "An account already exists with this email. Try logging in differently.",
      "auth/requires-recent-login":     "Please log out and log in again to do this.",
      "auth/user-disabled":             "This account has been disabled. Contact support.",
      "auth/expired-action-code":       "This link has expired. Please request a new one.",
      "auth/invalid-action-code":       "This link is invalid. Please request a new one.",
      "permission-denied":              "Access denied. Please log in again.",
      "unavailable":                    "Service temporarily unavailable. Please try again.",
      "not-found":                      "Data not found. Please try again.",
    };

    for(const [code, friendly] of Object.entries(firebaseErrors)){
      if(msg.includes(code)){
        return friendly;
      }
    }

    // Strip "Firebase: " prefix if no match found
    return msg
      .replace(/Firebase:\s*/gi, "")
      .replace(/\(auth\/[^)]+\)\./g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* ===== OVERRIDE window.alert ===== */
  window.alert = function(message){
    const translated = translateError(message);
    const lower = translated.toLowerCase();
    let type = "info";

    if(lower.includes("incorrect") || lower.includes("failed") || lower.includes("error") || lower.includes("wrong") || lower.includes("invalid") || lower.includes("denied") || lower.includes("disabled") || lower.includes("blocked") || lower.includes("cancelled")){
      type = "error";
    } else if(lower.includes("sent") || lower.includes("saved") || lower.includes("copied") || lower.includes("verified") || lower.includes("uploaded") || lower.includes("success")){
      type = "success";
    } else if(lower.includes("wait") || lower.includes("please") || lower.includes("many attempts")){
      type = "warning";
    }

    showToast(translated, type, 5000);
  };

})();
