import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, addDoc, onSnapshot, collection, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase 전역 변수 설정 (캔버스 환경에서 주입됨)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const authToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let app, auth, db;
let userId;
let noiseChartInstance;

//추천 메시지
const aiMessages = [
    "혹시 지금 무슨 일이 있으신가요? 쿵쿵거리는 소리가 계속 들려서요.",
    "갑자기 큰 소리가 나서 놀랐어요. 괜찮으신지 걱정됩니다.",
    "늦은 시간인데 발소리가 유독 크게 들리네요. 혹시 가능하시다면 조금만 조심해주실 수 있을까요?",
    "오늘따라 소음이 좀 크게 들리는 것 같아요."
];

const aiReplyMessages = [
    "죄송합니다. 곧 조용히 하겠습니다.",
    "알려주셔서 감사합니다. 주의하겠습니다.",
    "불편을 드려 죄송해요. 아이들이 뛰어 놀아서 소리가 났나 봅니다. 바로 주의시키겠습니다!",
    "이사/정리 중이었습니다. 최대한 소음을 줄이겠습니다."
];

//앱 초기화 및 인증
const initializeFirebase = async () => {
    try {
        if (firebaseConfig && Object.keys(firebaseConfig).length > 0) {
            app = initializeApp(firebaseConfig);
            db = getFirestore(app);
            auth = getAuth(app);
            if (authToken) {
                await signInWithCustomToken(auth, authToken);
            } else {
                await signInAnonymously(auth);
            }
            userId = auth.currentUser.uid;
            document.getElementById('userId').textContent = userId;
            setupRealtimeListeners();
            console.log("Firebase initialized and user authenticated.");
        } else {
            // 로컬 모드: Firebase 미설정 시 임시 사용자 ID 생성 및 localStorage 사용
            db = null;
            userId = resolveInitialUserId();
            document.getElementById('userId').textContent = userId + ' (로컬)';
            loadLocalInbox();
        }
        createMessageButtons();
    } catch (error) {
        console.error("Firebase 초기화 또는 인증 실패:", error);
    }
};

// 실시간 데이터 리스너 설정
const setupRealtimeListeners = () => {
    // 소음 데이터 리스너 (하드웨어 연동 준비)
    if (!db) return; // 로컬 모드에서는 생략
    const noiseRef = collection(db, `artifacts/${appId}/public/data/noise_data`);
    const qNoise = query(noiseRef, where("userId", "==", userId));

    onSnapshot(qNoise, (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data());
        data.sort((a, b) => a.timestamp.toDate() - b.timestamp.toDate());
        updateNoiseChart(data);
        checkNoisePattern(data);
    });

    // 메시지 알림 리스너
    if (!db) return; // 로컬 모드에서는 생략
    const inboxRef = collection(db, `artifacts/${appId}/public/data/messages`);
    const qMessages = query(inboxRef, where("receiverId", "==", userId));

    onSnapshot(qMessages, (snapshot) => {
        snapshot.docChanges().forEach(change => {
            if (change.type === "added") {
                const message = change.doc.data();
                addMessageToInbox(message);
                showNotification(message);
            }
        });
    });
};

// 차트 업데이트 (하드웨어 연동 시 데이터 표시) -> 하드웨어 연동 후 구현예정
const updateNoiseChart = (data) => {
    const labels = data.map(d => new Date(d.timestamp.toDate()).toLocaleTimeString());
    const noiseValues = data.map(d => d.sound);
    
    if (noiseChartInstance) {
        noiseChartInstance.destroy();
    }

    const ctx = document.getElementById('noiseChart').getContext('2d');
    noiseChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '데시벨(dB)',
                data: noiseValues,
                borderColor: 'rgb(79, 70, 229)',
                backgroundColor: 'rgba(79, 70, 229, 0.2)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { display: true, title: { display: true, text: '시간' } },
                y: { display: true, title: { display: true, text: '소음 레벨 (dB)' } }
            }
        }
    });
};

// AI 패턴 분석 및 알림 (하드웨어 연동 시) -> 하드웨어 연동 후 구현 예정
const checkNoisePattern = (data) => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 22 || hour < 6) {
        const loudNoises = data.filter(d => d.sound > 60);
        if (loudNoises.length > 5) {
            document.getElementById('noiseAlerts').classList.remove('hidden');
            return;
        }
    }
    document.getElementById('noiseAlerts').classList.add('hidden');
};

// 메시지 전송 기능 -> AI 필터링 기능 추가 예정
const sendMessage = async (message, explicitReceiverId = null) => {
    const receiverId = explicitReceiverId ?? prompt("쪽지를 보낼 이웃의 아이디를 입력하세요:");
    if (!receiverId) { return; }
    if (receiverId === userId) {
         console.error("자신에게 메시지를 보낼 수 없습니다.");
         return;
    }
    
    try {
        if (db) {
            await addDoc(collection(db, `artifacts/${appId}/public/data/messages`), {
                senderId: userId,
                receiverId: receiverId,
                message: message,
                timestamp: serverTimestamp(),
            });
        } else {
            // 로컬 모드 전송: localStorage 큐에 저장 (receiverInbox)
            const payload = { senderId: userId, receiverId, message, timestamp: Date.now() };
            pushToLocalInbox(receiverId, payload);
        }
        document.getElementById('messageSentBox').classList.remove('hidden');
        setTimeout(() => { document.getElementById('messageSentBox').classList.add('hidden'); }, 5000);
    } catch (e) {
        console.error("메시지 전송 실패:", e);
    }
};

// 받은 메시지를 쪽지함에 추가
const addMessageToInbox = (message) => {
    const inbox = document.getElementById('inbox');
    document.getElementById('inboxPlaceholder').classList.add('hidden');
    
    const messageCard = document.createElement('div');
    messageCard.className = 'bg-gray-50 p-3 rounded-lg border border-gray-200';
    const shortSender = (message.senderId || '').toString();
    const senderLabel = shortSender ? `${shortSender.substring(0, 5)}...` : '이웃';
    messageCard.innerHTML = `
        <p class="text-sm text-gray-500 font-semibold">
            ${senderLabel}님에게서 쪽지 도착
        </p>
        <p class="text-base font-medium mt-1">${message.message}</p>
        <p class="text-xs text-gray-400 mt-2">${formatTimestamp(message.timestamp)}</p>
        <div class="mt-3 flex flex-wrap gap-2" aria-label="답장하기">
            ${aiReplyMessages.map(r => `
                <button class=\"reply-btn py-1 px-2 bg-amber-50 border border-amber-200 rounded text-amber-800 hover:bg-amber-100\" data-receiver=\"${message.senderId}\" data-msg=\"${r}\">${r}</button>
            `).join('')}
            <button class="reply-custom py-1 px-2 bg-gray-100 border border-gray-300 rounded text-gray-800 hover:bg-gray-200" data-receiver="${message.senderId}">자유 입력</button>
        </div>
    `;
    inbox.prepend(messageCard);

    // 답장 버튼 이벤트 연결
    messageCard.querySelectorAll('.reply-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const rcv = btn.getAttribute('data-receiver');
            const txt = btn.getAttribute('data-msg');
            sendMessage(txt, rcv);
        });
    });
    messageCard.querySelectorAll('.reply-custom').forEach(btn => {
        btn.addEventListener('click', () => {
            const rcv = btn.getAttribute('data-receiver');
            const txt = prompt('답장 내용을 입력하세요:');
            if (txt) sendMessage(txt, rcv);
        });
    });
};

// 새로운 메시지 알림 팝업 표시
const showNotification = (message) => {
    const notification = document.getElementById('messageNotification');
    const summary = message.message.length > 30 ? message.message.substring(0, 30) + "..." : message.message;
    document.getElementById('notificationText').textContent = `이웃이 보낸 쪽지: "${summary}"`;
    notification.classList.remove('hidden');
    setTimeout(() => { notification.classList.add('hidden'); }, 8000);
};

// AI 추천 메시지 버튼 생성
const createMessageButtons = () => {
    const container = document.getElementById('messageButtons');
    aiMessages.forEach(msg => {
        const button = document.createElement('button');
        button.className = 'py-2 px-4 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700 font-medium hover:bg-indigo-100 transition-colors text-left';
        button.textContent = msg;
        button.onclick = () => sendMessage(msg);
        container.appendChild(button);
    });
    const sendCustomBtn = document.getElementById('sendCustomBtn');
    const customReceiver = document.getElementById('customReceiver');
    const customMessage = document.getElementById('customMessage');
    if (sendCustomBtn) {
        sendCustomBtn.addEventListener('click', () => {
            const r = (customReceiver.value || '').trim();
            const m = (customMessage.value || '').trim();
            if (!r || !m) {
                alert('수신자와 메시지를 모두 입력하세요.');
                return;
            }
            sendMessage(m, r);
            customMessage.value = '';
        });
    }
};

// -------- 로컬 모드 유틸 --------
const getOrCreateLocalUserId = () => {
    const key = 'osondoson:userId';
    let id = localStorage.getItem(key);
    if (!id) {
        id = 'local-' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem(key, id);
    }
    return id;
};

const resolveInitialUserId = () => {
    const params = new URLSearchParams(location.search);
    const urlId = params.get('userId');
    if (urlId) {
        // URL 파라미터가 있으면 그 값을 사용하되, 다른 탭에 영향을 주지 않도록
        // localStorage에는 쓰지 않습니다.
        return urlId;
    }
    return getOrCreateLocalUserId();
};

const localInboxKey = (uid) => `osondoson:inbox:${uid}`;

const pushToLocalInbox = (receiverId, payload) => {
    const key = localInboxKey(receiverId);
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    arr.push(payload);
    localStorage.setItem(key, JSON.stringify(arr));
    if (receiverId === userId) {
        addMessageToInbox(payload);
        showNotification(payload);
    }
};

const loadLocalInbox = () => {
    const key = localInboxKey(userId);
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    arr.sort((a, b) => a.timestamp - b.timestamp);
    arr.forEach(addMessageToInbox);
};

// 창간 동기화: 다른 탭에서 메시지 수신 시 반영
window.addEventListener('storage', (e) => {
    if (e.key === localInboxKey(userId)) {
        const arr = JSON.parse(e.newValue || '[]');
        // 최신 메시지만 추가 표시
        const last = arr[arr.length - 1];
        if (last) {
            addMessageToInbox(last);
            showNotification(last);
        }
    }
});

// 아이디 변경 버튼 핸들러
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('changeIdBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const current = localStorage.getItem('osondoson:userId') || userId;
        const next = prompt('새 아이디를 입력하세요 (예: mapo_samsung_113_1602):', current);
        if (!next) return;
        localStorage.setItem('osondoson:userId', next);
        const u = new URL(location.href);
        u.searchParams.set('userId', next);
        location.href = u.toString();
    });
});

const formatTimestamp = (ts) => {
    if (!ts) return '';
    if (typeof ts === 'number') return new Date(ts).toLocaleString();
    if (ts.toDate) return new Date(ts.toDate()).toLocaleString();
    return new Date(ts).toLocaleString();
};

// 탭 전환 기능
const myNoiseTab = document.getElementById('myNoiseTab');
const neighborTab = document.getElementById('neighborTab');
const myNoiseSection = document.getElementById('myNoiseSection');
const neighborSection = document.getElementById('neighborSection');

myNoiseTab.addEventListener('click', () => {
    myNoiseSection.classList.remove('hidden');
    neighborSection.classList.add('hidden');
    myNoiseTab.classList.remove('bg-gray-200', 'text-gray-600');
    myNoiseTab.classList.add('bg-indigo-500', 'text-white');
    neighborTab.classList.remove('bg-indigo-500', 'text-white');
    neighborTab.classList.add('bg-gray-200', 'text-gray-600');
});

neighborTab.addEventListener('click', () => {
    myNoiseSection.classList.add('hidden');
    neighborSection.classList.remove('hidden');
    neighborTab.classList.remove('bg-gray-200', 'text-gray-600');
    neighborTab.classList.add('bg-indigo-500', 'text-white');
    myNoiseTab.classList.remove('bg-indigo-500', 'text-white');
    myNoiseTab.classList.add('bg-gray-200', 'text-gray-600');
});

window.onload = initializeFirebase;


