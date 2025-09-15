const userId = sessionStorage.getItem('osondoson_user_id');
if (!userId) {
    alert('로그인이 필요합니다.');
    window.location.href = 'login.html';
} else {
    const header = document.getElementById('main-header');
    header.innerHTML = `
        <a href="data_analysis.html" class="logo">오손도손</a>
        <div class="nav-items">
            <a href="data_analysis.html" class="nav-link">홈</a>
            <a href="settings.html" class="nav-link">설정</a>
        </div>
        <div class="user-section">
            <span><strong>${userId}</strong>님</span>
            <button class="logout-button">로그아웃</button>
        </div>
    `;
    const handleLogout = () => {
        sessionStorage.removeItem('osondoson_user_id');
        alert('로그아웃 되었습니다.');
        window.location.href = 'login.html';
    };
    header.querySelector('.logout-button').addEventListener('click', handleLogout);
    document.getElementById('logoutButtonFromMenu').addEventListener('click', handleLogout);
}

function toggleFaq() { 
    const faqSection = document.getElementById('faq-section');
    faqSection.style.display = (faqSection.style.display === 'none') ? 'block' : 'none'; 
}

function showOfficeContact() { 
    alert("관리사무소 연락처:\n031-123-4560"); 
}