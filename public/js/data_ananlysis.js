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
async function fetchDataAndRenderChart(currentUserId) {
    try {
        console.log('Firestore에서 데이터 로딩 중...');
        
        // Firestore에서 24시간 데이터 가져오기
        const docRef = db.collection('metrics').doc('noise24h');
        const doc = await docRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            const values = data.values || [];
            
            if (values.length === 24) {
                // 24시간 데이터가 있는 경우
                const labels = Array.from({length: 24}, (_, i) => `${i}시`);
                createChart(labels, values);
                updateStats(values);
                console.log('Firestore 데이터 로딩 성공:', values);
            } else {
                // 데이터가 부족한 경우 기본 데이터 사용
                console.log('Firestore 데이터가 부족함, 기본 데이터 사용');
                useDefaultData();
            }
        } else {
            // 문서가 없는 경우 기본 데이터 사용
            console.log('Firestore 문서가 없음, 기본 데이터 사용');
            useDefaultData();
        }
    } catch (error) {
        console.error('Firestore 데이터 로딩 실패:', error);
        // 에러 발생 시 기본 데이터 사용
        useDefaultData();
    }
}

// 기본 데이터 사용 함수
function useDefaultData() {
    const labels = ['0시', '3시', '6시', '9시', '12시', '15시', '18시', '21시'];
    const data = [25, 28, 35, 40, 45, 42, 55, 60];
    createChart(labels, data);
    updateStats(data);
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

function updateStats(data) {
    if (!data || data.length === 0) {
        // 기본값
        document.getElementById('peak-time').textContent = `오후 8시-9시 경`;
        document.getElementById('warning-count').textContent = `5회`;
        return;
    }
    
    // 실제 데이터에서 통계 계산
    const maxValue = Math.max(...data);
    const maxIndex = data.indexOf(maxValue);
    const peakTime = `${maxIndex}시`;
    
    // 55dB 이상을 주의 단계로 간주
    const warningCount = data.filter(value => value >= 55).length;
    
    document.getElementById('peak-time').textContent = peakTime;
    document.getElementById('warning-count').textContent = `${warningCount}회`;
}