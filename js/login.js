import { loginUser, normalizePhone } from './auth_db.js';

document.addEventListener('DOMContentLoaded', () => {
  // prefill phone from signup redirect
  const url = new URL(window.location.href);
  const pre = url.searchParams.get('phone');
  if(pre){
    const input = document.getElementById('userIdInput');
    if(input) input.value = pre;
  }

  const form = document.getElementById('loginForm');
  const errEl = document.getElementById('loginError');
  form.addEventListener('submit', function(event) {
    event.preventDefault();
    const userId = document.getElementById('userIdInput').value;
    const password = document.getElementById('passwordInput').value;
    try{
      const user = loginUser(userId, password);
      sessionStorage.setItem('osondoson_user_id', normalizePhone(user.phone));
      sessionStorage.setItem('osondoson_user_name', user.name);
      sessionStorage.setItem('osondoson_user_unit', user.unit);
      window.location.href = 'home.html';
    }catch(err){
      if(errEl){
        errEl.textContent = err.message || '로그인에 실패했습니다.';
        errEl.style.display = 'block';
      } else {
        alert(err.message || '로그인에 실패했습니다.');
      }
    }
  });
});