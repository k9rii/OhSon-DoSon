//Firebase 초기화 (이 코드는 HTML 파일의 <head>에 있어야 합니다)
const db = firebase.firestore();

// 로그인 상태 확인 및 페이지 로딩
const userId = sessionStorage.getItem('osondoson_user_id');
if (!userId) {
    alert('로그인이 필요합니다.');
    window.location.href = 'login.html';
} else {
    // 헤더 렌더링
    renderHeader(userId);
    // Firestore에서 데이터 가져와서 차트 그리기 (임시 데이터 사용)
    fetchDataAndRenderChart(userId);
}

// Firestore에서 데이터 가져와 차트 그리는 함수
function fetchDataAndRenderChart(currentUserId) {
    // 이 부분은 Firebase 연동 시 실제 데이터 fetching 로직으로 교체됩니다.
    // 현재는 임시 데이터(mock data)로 차트를 그립니다.
    const labels = ['0시', '3시', '6시', '9시', '12시', '15시', '18시', '21시'];
    const data = [25, 28, 35, 40, 45, 42, 55, 60];
    createChart(labels, data);
    updateStats(); // 임시 통계 업데이트
}

// 기타 UI 렌더링 함수들
function renderHeader(currentUserId) {
    const header = document.getElementById('main-header');
    header.innerHTML = `
        <a href="data_analysis.html" class="logo">오손도손</a>
        <div class="nav-items">
            <a href="data_analysis.html" class="nav-link">홈</a>
            <a href="settings.html" class="nav-link">설정</a>
        </div>
        <div class="user-section">
            <span><strong>${currentUserId}</strong>님</span>
            <button class="logout-button">로그아웃</button>
        </div>
    `;
    header.querySelector('.logout-button').addEventListener('click', () => {
        sessionStorage.removeItem('osondoson_user_id');
        alert('로그아웃 되었습니다.');
        window.location.href = 'login.html';
    });
}

function createChart(labels, data) {
    const ctx = document.getElementById('noiseChart').getContext('2d');
    new Chart(ctx, { 
        type: 'line', 
        data: { 
            labels: labels, 
            datasets: [{ 
                label: '우리집 소음 레벨 (dB)', 
                data: data, 
                borderColor: '#3498db', 
                backgroundColor: 'rgba(52, 152, 219, 0.1)', 
                fill: true 
            }] 
        }, 
        options: { responsive: true, maintainAspectRatio: false } 
    });
}

function updateStats() {
    // 임시 통계 데이터
    document.getElementById('peak-time').textContent = `오후 8시-9시 경`;
    document.getElementById('warning-count').textContent = `5회`;
}