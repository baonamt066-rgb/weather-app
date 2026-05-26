import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { GoogleAuthProvider, GithubAuthProvider, FacebookAuthProvider, getAuth, signInWithPopup, signInWithRedirect, getRedirectResult } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

// ==========================================
// DETECT WEBVIEW (Zalo, Facebook app, v.v.)
// ==========================================
function isWebView() {
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|Instagram|Zalo|Line|Twitter|MicroMessenger|WebView|(iPhone|iPod|iPad)(?!.*Safari)/.test(ua)
    || (!!window.Android)
    || (!window.chrome && /CriOS/.test(ua));
}

// Helper chuyển trang an toàn
function navigateToApp() {
  const base = window.location.href.replace(/\/[^/]*$/, '/');
  window.location.href = base + 'spck.html';
}

// ==========================================
// 1. CẤU HÌNH & KHỞI TẠO FIREBASE
// ==========================================
const firebaseConfig = { 
  apiKey : "AIzaSyAgT_0JfVbiLwp6J5csmFiHmUlC4EZdboY" , 
  authDomain : "jsi47-login-gg-370f0.firebaseapp.com" , 
  projectId : "jsi47-login-gg-370f0" , 
  storageBucket : "jsi47-login-gg-370f0.firebasestorage.app" , 
  messagingSenderId : "992617082148" , 
  appId : "1:992617082148:web:b67e9adfcd5a7884ea17b1" 
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = 'vi';
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// ==========================================
// XỬ LÝ KẾT QUẢ REDIRECT (sau khi quay lại từ trang Google)
// ==========================================
getRedirectResult(auth).then((result) => {
  if (!result) return; // không phải sau redirect, bỏ qua
  const user = result.user;
  const userData = {
    fullname: user.displayName || user.email?.split('@')[0],
    email: user.email,
    photoURL: user.photoURL,
    uid: user.uid
  };
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('currentUser', JSON.stringify(userData));
  showToast(`Chào mừng ${userData.fullname}! ☀️`, 'success');
  setTimeout(() => navigateToApp(), 1800);
}).catch((error) => {
  if (error.code && error.code !== 'auth/popup-closed-by-user') {
    console.error('Redirect error:', error);
  }
});

// ==========================================
// 2. KHỞI TẠO HIỆU ỨNG ĐỒ HOẠ (STARS & RAIN)
// ==========================================
const starsEl = document.getElementById('stars');
for (let i = 0; i < 80; i++) {
  const s = document.createElement('span');
  s.style.cssText = `
    width: ${Math.random() * 2.5 + 1}px;
    height: ${Math.random() * 2.5 + 1}px;
    top: ${Math.random() * 70}%;
    left: ${Math.random() * 100}%;
    animation-delay: ${Math.random() * 3}s;
    animation-duration: ${Math.random() * 2 + 1.5}s;
  `;
  starsEl.appendChild(s);
}

const rainEl = document.getElementById('rain');
for (let i = 0; i < 60; i++) {
  const d = document.createElement('div');
  d.className = 'drop';
  d.style.cssText = `
    left: ${Math.random() * 100}%;
    animation-duration: ${Math.random() * 0.6 + 0.5}s;
    animation-delay: ${Math.random() * 2}s;
  `;
  rainEl.appendChild(d);
}

// ==========================================
// 3. LOGIC CHUYỂN ĐỔI FORM (GIAO DIỆN)
// ==========================================
const loginPanel = document.getElementById('login-panel');
const registerPanel = document.getElementById('register-panel');
const toggleBtn = document.getElementById('toggle-btn');
const toggleTitle = document.getElementById('toggle-title');
const toggleDesc = document.getElementById('toggle-desc');
const toggleIcon = document.getElementById('toggle-icon');
let isRegister = false;

function switchToRegister() {
  isRegister = true;
  loginPanel.classList.remove('active'); loginPanel.classList.add('hidden');
  registerPanel.classList.remove('hidden'); registerPanel.classList.add('active');
  toggleTitle.textContent = 'Quay lại!';
  toggleDesc.textContent = 'Đã có tài khoản? Đăng nhập để xem dự báo thời tiết của bạn.';
  toggleBtn.textContent = 'Đăng nhập';
  toggleIcon.textContent = '🌙';
  document.body.classList.add('night-mode');
}

function switchToLogin() {
  isRegister = false;
  registerPanel.classList.remove('active'); registerPanel.classList.add('hidden');
  loginPanel.classList.remove('hidden'); loginPanel.classList.add('active');
  toggleTitle.textContent = 'Xin chào!';
  toggleDesc.textContent = 'Chưa có tài khoản? Đăng ký để theo dõi thời tiết mọi lúc mọi nơi.';
  toggleBtn.textContent = 'Đăng ký';
  toggleIcon.textContent = '🌤️';
  document.body.classList.remove('night-mode');
}

toggleBtn.addEventListener('click', () => isRegister ? switchToLogin() : switchToRegister());

// ==========================================
// 4. THÔNG BÁO (TOAST) & HIỆU ỨNG MƯA
// ==========================================
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  const icon = t.querySelector('i');
  document.getElementById('toast-msg').textContent = msg;
  t.className = 'toast ' + type;
  const icons = { success: 'bx bx-check-circle', error: 'bx bx-x-circle', info: 'bx bx-info-circle' };
  icon.className = icons[type] || icons.info;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function triggerRain() {
  document.querySelectorAll('.drop').forEach(d => d.style.opacity = '1');
  setTimeout(() => document.querySelectorAll('.drop').forEach(d => d.style.opacity = '0'), 2500);
}

// ==========================================
// 5. CÁC HÀM BỔ TRỢ LOCALSTORAGE
// ==========================================
function getUsers() { try { return JSON.parse(localStorage.getItem('users')) || []; } catch { return []; } }
function saveUsers(u) { try { localStorage.setItem('users', JSON.stringify(u)); } catch (e) { console.error(e); } }

// ==========================================
// 5.1 REALTIME INPUT VALIDATION HELPERS
// ==========================================
const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createErrorElem(input) {
  let span = input.parentElement.querySelector('.field-error');
  if (!span) {
    span = document.createElement('span');
    span.className = 'field-error';
    span.style.cssText = 'color:#ff6b6b;font-size:12px;display:block;margin-top:6px;';
    input.parentElement.appendChild(span);
  }
  return span;
}

function showFieldError(input, msg) {
  const e = createErrorElem(input);
  e.textContent = msg;
  input.style.borderColor = '#ff6b6b';
}

function clearFieldError(input) {
  const e = input.parentElement.querySelector('.field-error');
  if (e) e.textContent = '';
  input.style.borderColor = '';
}

function validateRegName(showErrors = false) {
  const el = document.getElementById('reg-name');
  const v = el.value.trim();
  if (!v) {
    if (showErrors) showFieldError(el, 'Vui lòng nhập họ và tên');
    else clearFieldError(el);
    return false;
  }
  if (emailRx.test(v)) {
    if (showErrors) showFieldError(el, 'Họ và tên không được là địa chỉ email');
    else clearFieldError(el);
    return false;
  }
  clearFieldError(el); return true;
}

function validateRegEmail(showErrors = false) {
  const el = document.getElementById('reg-email');
  const v = el.value.trim();
  if (!v) {
    if (showErrors) showFieldError(el, 'Vui lòng nhập email');
    else clearFieldError(el);
    return false;
  }
  if (!emailRx.test(v)) { showFieldError(el, 'Email không hợp lệ'); return false; }
  if (!v.toLowerCase().endsWith('@gmail.com')) { showFieldError(el, 'Email phải là @gmail.com'); return false; }
  clearFieldError(el); return true;
}

function validateRegPass(showErrors = false) {
  const el = document.getElementById('reg-pass');
  const v = el.value;
  if (!v) {
    if (showErrors) showFieldError(el, 'Vui lòng nhập mật khẩu');
    else clearFieldError(el);
    return false;
  }
  if (v.length < 6) { showFieldError(el, 'Mật khẩu phải ít nhất 6 ký tự'); return false; }
  clearFieldError(el); return true;
}

function validateRegConfirm(showErrors = false) {
  const el = document.getElementById('reg-confirm');
  const pass = document.getElementById('reg-pass').value;
  const v = el.value;
  if (!v) {
    if (showErrors) showFieldError(el, 'Vui lòng xác nhận mật khẩu');
    else clearFieldError(el);
    return false;
  }
  if (v !== pass) { showFieldError(el, 'Mật khẩu xác nhận không khớp'); return false; }
  clearFieldError(el); return true;
}

function validateRegisterForm(showErrors = false) {
  const r1 = validateRegName(showErrors);
  const r2 = validateRegEmail(showErrors);
  const r3 = validateRegPass(showErrors);
  const r4 = validateRegConfirm(showErrors);
  return r1 && r2 && r3 && r4;
}

// login validators
function validateLoginEmail() {
  const el = document.getElementById('login-email');
  const v = el.value.trim();
  if (!v) { showFieldError(el, 'Vui lòng nhập email'); return false; }
  if (!emailRx.test(v)) { showFieldError(el, 'Email không hợp lệ'); return false; }
  if (!v.toLowerCase().endsWith('@gmail.com')) { showFieldError(el, 'Email phải là @gmail.com'); return false; }
  clearFieldError(el); return true;
}

function validateLoginPass() {
  const el = document.getElementById('login-pass');
  if (!el.value) { showFieldError(el, 'Vui lòng nhập mật khẩu'); return false; }
  clearFieldError(el); return true;
}

function validateLoginForm() {
  return validateLoginEmail() && validateLoginPass();
}

// wire events — chỉ xoá lỗi khi người dùng đang gõ, không hiện lỗi mới
['input'].forEach(ev => {
  document.getElementById('reg-name').addEventListener(ev, () => validateRegisterForm(false));
  document.getElementById('reg-email').addEventListener(ev, () => validateRegisterForm(false));
  document.getElementById('reg-pass').addEventListener(ev, () => { validateRegName(false); validateRegEmail(false); validateRegPass(false); validateRegConfirm(false); });
  document.getElementById('reg-confirm').addEventListener(ev, () => validateRegConfirm(false));

  document.getElementById('login-email').addEventListener(ev, () => { validateLoginEmail(); });
  document.getElementById('login-pass').addEventListener(ev, () => { validateLoginPass(); });
});

// ==========================================
// 6. XỬ LÝ LOGIC ĐĂNG KÝ THƯỜNG
// ==========================================
document.getElementById('reg-submit').addEventListener('click', () => {
  if (!validateRegisterForm(true)) { triggerRain(); return; }

  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-pass').value;

  let users = getUsers();
  if (users.find(u => u.fullname.toLowerCase() === name.toLowerCase())) { showToast('Tên này đã tồn tại!', 'error'); triggerRain(); return; }
  if (users.filter(u => u.email === email).length >= 5) { showToast('Email đã đạt giới hạn 5 tài khoản!', 'error'); triggerRain(); return; }

  users.push({ fullname: name, email, password: pass });
  saveUsers(users);
  showToast('Đăng ký thành công! Hãy đăng nhập.', 'success');
  document.getElementById('register-form').reset();
  setTimeout(switchToLogin, 1500);
});

// ==========================================
// 7. XỬ LÝ LOGIC ĐĂNG NHẬP THƯỜNG
// ==========================================
document.getElementById('login-submit').addEventListener('click', () => {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;

  if (!email) { showToast('Vui lòng nhập email!', 'error'); triggerRain(); return; }
  if (!pass) { showToast('Vui lòng nhập mật khẩu!', 'error'); triggerRain(); return; }

  if (!emailRx.test(email)) { showToast('Email không hợp lệ!', 'error'); triggerRain(); return; }
  if (!email.toLowerCase().endsWith('@gmail.com')) { showToast('Email phải là @gmail.com!', 'error'); triggerRain(); return; }

  const users = getUsers();
  if (users.length === 0) { showToast('Chưa có tài khoản! Hãy đăng ký.', 'info'); switchToRegister(); return; }

  const user = users.find(u => u.email === email && u.password === pass);
  if (!user) { showToast('Email hoặc mật khẩu không đúng!', 'error'); triggerRain(); document.getElementById('login-pass').value = ''; return; }

  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('currentUser', JSON.stringify(user));
  showToast(`Chào mừng ${user.fullname}! ☀️`, 'success');
  setTimeout(() => navigateToApp(), 1800);
});

// ==========================================
// HELPER: signIn với popup hoặc redirect tuỳ môi trường
// ==========================================
function signInSmart(provider) {
  if (isWebView()) {
    // WebView không hỗ trợ popup → dùng redirect
    signInWithRedirect(auth, provider);
  } else {
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        const userData = {
          fullname: user.displayName || user.email?.split('@')[0],
          email: user.email,
          photoURL: user.photoURL,
          uid: user.uid
        };
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify(userData));
        showToast(`Chào mừng ${userData.fullname}! ☀️`, 'success');
        setTimeout(() => navigateToApp(), 1800);
      })
      .catch((error) => {
        const errorCode = error.code;
        if (errorCode === 'auth/popup-closed-by-user') {
          showToast('Đăng nhập bị huỷ!', 'info');
        } else if (errorCode === 'auth/popup-blocked') {
          // Popup bị chặn → tự fallback sang redirect
          showToast('Popup bị chặn, đang chuyển hướng...', 'info');
          setTimeout(() => signInWithRedirect(auth, provider), 800);
        } else if (errorCode === 'auth/unauthorized-domain') {
          showToast('Domain chưa được thêm vào Firebase!', 'error');
        } else if (errorCode === 'auth/network-request-failed') {
          showToast('Lỗi mạng hoặc bị chặn kết nối!', 'error');
        } else if (errorCode === 'auth/account-exists-with-different-credential') {
          showToast('Email này đã được liên kết với tài khoản khác!', 'error');
        } else {
          showToast(error.message, 'error');
        }
        triggerRain();
      });
  }
}

// ==========================================
// 8. ĐĂNG NHẬP / ĐĂNG KÝ BẰNG GOOGLE
// ==========================================
for (let btn of document.getElementsByClassName("google-btn")) {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    signInSmart(googleProvider);
  });
}

// ==========================================
// 9. ĐĂNG NHẬP / ĐĂNG KÝ BẰNG FACEBOOK
// ==========================================
for (let btn of document.getElementsByClassName("facebook-btn")) {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    // Facebook app không cho phép signInWithPopup từ web khi chưa review
    // Hiển thị thông báo rõ ràng thay vì lỗi mờ
    showToast('Tính năng Facebook tạm thời chưa khả dụng!', 'info');
  });
}

// ==========================================
// 10. ĐĂNG NHẬP / ĐĂNG KÝ BẰNG GITHUB
// ==========================================
for (let btn of document.querySelectorAll(".socials a:nth-child(3)")) {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    signInSmart(githubProvider);
  });
}
