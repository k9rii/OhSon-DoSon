import { signupUser, normalizePhone } from './auth_db.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signupForm');
  const errEl = document.getElementById('signupError');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errEl.style.display = 'none';
    try {
      const name = document.getElementById('nameInput').value.trim();
      const unit = document.getElementById('unitInput').value.trim();
      const phoneRaw = document.getElementById('phoneInput').value.trim();
      const password = document.getElementById('signupPasswordInput').value;
      if(!name || !unit || !phoneRaw || !password){
        throw new Error('모든 항목을 입력해 주세요.');
      }
      signupUser({ name, unit, phone: phoneRaw, password });
      // redirect to login with prefilled phone
      const phone = normalizePhone(phoneRaw);
      const params = new URLSearchParams({ phone });
      window.location.href = `login.html?${params.toString()}`;
    } catch (err) {
      errEl.textContent = err.message || '오류가 발생했습니다.';
      errEl.style.display = 'block';
    }
  });
});


