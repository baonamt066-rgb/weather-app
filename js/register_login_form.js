import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { GoogleAuthProvider, GithubAuthProvider, getAuth, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

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

function validateRegName() {
  const el = document.getElementById('reg-name');
  if (!el.value.trim()) { showFieldError(el, 'Vui lòng nhập họ và tên'); return false; }
  clearFieldError(el); return true;
}

function validateRegEmail() {
  const el = document.getElementById('reg-email');
  const v = el.value.trim();
  if (!emailRx.test(v)) { showFieldError(el, 'Email không hợp lệ'); return false; }
  if (!v.toLowerCase().endsWith('@gmail.com')) { showFieldError(el, 'Email phải là @gmail.com'); return false; }
  clearFieldError(el); return true;
}

function validateRegPass() {
  const el = document.getElementById('reg-pass');
  if (el.value.length < 6) { showFieldError(el, 'Mật khẩu phải ít nhất 6 ký tự'); return false; }
  clearFieldError(el); return true;
}

function validateRegConfirm() {
  const el = document.getElementById('reg-confirm');
  const pass = document.getElementById('reg-pass').value;
  if (el.value !== pass) { showFieldError(el, 'Mật khẩu xác nhận không khớp'); return false; }
  clearFieldError(el); return true;
}

function validateRegisterForm() {
  const ok = validateRegName() && validateRegEmail() && validateRegPass() && validateRegConfirm();
  const btn = document.getElementById('reg-submit');
  if (btn) btn.disabled = !ok;
  return ok;
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
  const ok = validateLoginEmail() && validateLoginPass();
  const btn = document.getElementById('login-submit');
  if (btn) btn.disabled = !ok;
  return ok;
}

// wire events
['input','blur'].forEach(ev => {
  document.getElementById('reg-name').addEventListener(ev, validateRegisterForm);
  document.getElementById('reg-email').addEventListener(ev, validateRegisterForm);
  document.getElementById('reg-pass').addEventListener(ev, () => { validateRegisterForm(); validateRegConfirm(); });
  document.getElementById('reg-confirm').addEventListener(ev, validateRegisterForm);

  document.getElementById('login-email').addEventListener(ev, validateLoginForm);
  document.getElementById('login-pass').addEventListener(ev, validateLoginForm);
});

// ==========================================
// 6. XỬ LÝ LOGIC ĐĂNG KÝ THƯỜNG
// ==========================================
document.getElementById('reg-submit').addEventListener('click', () => {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-pass').value;
  const confirm = document.getElementById('reg-confirm').value;

  if (!name) { showToast('Vui lòng nhập họ và tên!', 'error'); triggerRain(); return; }

  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRx.test(email)) { showToast('Email không hợp lệ!', 'error'); triggerRain(); return; }
  if (!email.toLowerCase().endsWith('@gmail.com')) { showToast('Email phải là @gmail.com!', 'error'); triggerRain(); return; }
  if (pass.length < 6) { showToast('Mật khẩu phải ít nhất 6 ký tự!', 'error'); triggerRain(); return; }
  if (pass !== confirm) { showToast('Mật khẩu xác nhận không khớp!', 'error'); triggerRain(); return; }

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

  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRx.test(email)) { showToast('Email không hợp lệ!', 'error'); triggerRain(); return; }
  if (!email.toLowerCase().endsWith('@gmail.com')) { showToast('Email phải là @gmail.com!', 'error'); triggerRain(); return; }

  const users = getUsers();
  if (users.length === 0) { showToast('Chưa có tài khoản! Hãy đăng ký.', 'info'); switchToRegister(); return; }

  const user = users.find(u => u.email === email && u.password === pass);
  if (!user) { showToast('Email hoặc mật khẩu không đúng!', 'error'); triggerRain(); document.getElementById('login-pass').value = ''; return; }

  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('currentUser', JSON.stringify(user));
  showToast(`Chào mừng ${user.fullname}! ☀️`, 'success');
  setTimeout(() => { window.location.href = 'spck.html'; }, 1800);
});

// ==========================================
// 8. ĐĂNG NHẬP / ĐĂNG KÝ BẰNG GOOGLE (FIREBASE)
// ==========================================
const googleButtons = document.getElementsByClassName("google-btn");

for (let btn of googleButtons) {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    signInWithPopup(auth, googleProvider)
      .then((result) => {
        const user = result.user;

        const userData = {
          fullname: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          uid: user.uid
        };
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify(userData));

        showToast(`Chào mừng ${user.displayName}! ☀️`, 'success');
        setTimeout(() => { window.location.href = 'spck.html'; }, 1800);
      })
      .catch((error) => {
        console.log("FULL ERROR:", error);

        const errorCode = error.code;
        const errorMessage = error.message;

        console.error("Error Code:", errorCode);
        console.error("Error Message:", errorMessage);

        if (errorCode === 'auth/popup-closed-by-user') {
          showToast('Đăng nhập bị huỷ!', 'info');
        } else if (errorCode === 'auth/popup-blocked') {
          showToast('Chrome đang chặn popup!', 'error');
        } else if (errorCode === 'auth/unauthorized-domain') {
          showToast('Domain chưa được thêm vào Firebase!', 'error');
        } else if (errorCode === 'auth/network-request-failed') {
          showToast('Lỗi mạng hoặc bị chặn kết nối!', 'error');
        } else {
          showToast(errorMessage, 'error');
        }

        triggerRain();
      });
  });
}

// ==========================================
// 9. ĐĂNG NHẬP / ĐĂNG KÝ BẰNG GITHUB (FIREBASE)
// ==========================================
const githubButtons = document.querySelectorAll(".socials a:nth-child(3)");

for (let btn of githubButtons) {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    signInWithPopup(auth, githubProvider)
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

        showToast(`Chào mừng ${userData.fullname}! 🚀`, 'success');
        setTimeout(() => { window.location.href = 'spck.html'; }, 1800);
      })
      .catch((error) => {
        console.log("GitHub Error:", error);

        const errorCode = error.code;
        const errorMessage = error.message;

        console.error("Error Code:", errorCode);
        console.error("Error Message:", errorMessage);

        if (errorCode === 'auth/popup-closed-by-user') {
          showToast('Đăng nhập bị huỷ!', 'info');
        } else if (errorCode === 'auth/popup-blocked') {
          showToast('Chrome đang chặn popup!', 'error');
        } else if (errorCode === 'auth/unauthorized-domain') {
          showToast('Domain chưa được thêm vào Firebase!', 'error');
        } else if (errorCode === 'auth/network-request-failed') {
          showToast('Lỗi mạng hoặc bị chặn kết nối!', 'error');
        } else if (errorCode === 'auth/account-exists-with-different-credential') {
          showToast('Email này đã được liên kết với tài khoản khác!', 'error');
        } else {
          showToast(errorMessage, 'error');
        }

        triggerRain();
      });
  });
}