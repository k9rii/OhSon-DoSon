document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); 
    const userId = document.getElementById('userIdInput').value;
    const password = document.getElementById('passwordInput').value;

    if (userId && password) {
        sessionStorage.setItem('osondoson_user_id', userId);
        window.location.href = 'data_analysis.html'; 
    } else {
        alert("아이디, 비밀번호를 모두 입력해주세요.");
    }
});