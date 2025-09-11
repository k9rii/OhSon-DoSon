// 앱 전체가 로드된 후 스크립트 실행
document.addEventListener('DOMContentLoaded', () => {

    // --- 설정 변수 ---
    // ✅ 고정 이웃(NEIGHBORS) 객체 삭제

    // 추천 메시지 목록
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

    // --- DOM 요소 가져오기 ---
    const userIdSpan = document.getElementById('userId');
    const recipientIdInput = document.getElementById('recipientIdInput'); // ✅ 받는 이웃 ID 입력란 추가
    const messageButtonsContainer = document.getElementById('messageButtons');
    const customMessageTextarea = document.getElementById('customMessage');
    const sendCustomBtn = document.getElementById('sendCustomBtn');
    const messageSentBox = document.getElementById('messageSentBox');
    const inbox = document.getElementById('inbox');
    const inboxPlaceholder = document.getElementById('inboxPlaceholder');
    const notificationPopup = document.getElementById('messageNotification');
    const notificationText = document.getElementById('notificationText');

    let currentUserId;
    // ✅ neighborId 변수 삭제

    // --- 핵심 기능 함수 ---

    /** 앱 초기화 함수 */
    function initialize() {
        const params = new URLSearchParams(window.location.search);
        currentUserId = params.get('userId');

        // ✅ 유효성 검사 로직 변경
        if (!currentUserId) {
            document.body.innerHTML = `<div class="text-center p-8">
                <h1 class="text-2xl font-bold text-red-600">잘못된 접근입니다.</h1>
                <p class="text-gray-600 mt-2">로그인 후 정상적인 경로로 접근해주세요.</p>
            </div>`;
            return;
        }

        // ✅ 상대방 ID 설정 로직 삭제
        
        updateUI();
        setupEventListeners();
        loadMessages();
    }

    /** UI를 현재 사용자에 맞게 업데이트 */
    function updateUI() {
        userIdSpan.textContent = currentUserId;
        // ✅ neighborHeader 내용 설정 로직 삭제 (HTML에서 고정)
        createMessageButtons();
    }
    
    /** 이벤트 리스너 설정 */
    function setupEventListeners() {
        // 직접 입력 메시지 전송 버튼
        sendCustomBtn.addEventListener('click', () => {
            const message = customMessageTextarea.value.trim();
            const recipientId = recipientIdInput.value.trim(); // ✅ 수신자 ID 가져오기

            if (!recipientId) {
                alert('받는 이웃의 아이디를 입력해주세요.');
                return;
            }
            if (!message) {
                alert('메시지를 입력하세요.');
                return;
            }
            
            sendMessage(message, recipientId); // ✅ sendMessage 함수에 recipientId 전달
            customMessageTextarea.value = ''; // 입력창 비우기
        });

        // 다른 탭/창에서 메시지 수신 시 실시간 업데이트
        window.addEventListener('storage', (e) => {
            if (e.key === getInboxKey(currentUserId)) {
                inbox.innerHTML = '';
                loadMessages();
            }
        });
    }

    /** 메시지 전송 처리 (수신자 ID를 파라미터로 받도록 수정) */
    function sendMessage(messageText, recipientId) {
        if (recipientId === currentUserId) {
            alert("자기 자신에게는 메시지를 보낼 수 없습니다.");
            return;
        }

        const messagePayload = {
            senderId: currentUserId,
            receiverId: recipientId, // ✅ 파라미터로 받은 recipientId 사용
            message: messageText,
            timestamp: Date.now()
        };

        pushToLocalInbox(recipientId, messagePayload);

        messageSentBox.classList.remove('hidden');
        setTimeout(() => messageSentBox.classList.add('hidden'), 3000);
    }
    
    /** 받은 메시지를 화면에 표시 */
    function addMessageToInbox(message) {
        inboxPlaceholder.classList.add('hidden');

        const messageCard = document.createElement('div');
        messageCard.className = 'bg-gray-50 p-3 rounded-lg border border-gray-200';
        
        messageCard.innerHTML = `
            <p class="text-sm text-gray-500 font-semibold">
                ${message.senderId}님에게서 쪽지 도착
            </p>
            <p class="text-base font-medium mt-1">${message.message}</p>
            <p class="text-xs text-gray-400 mt-2">${formatTimestamp(message.timestamp)}</p>
            <div class="mt-3 flex flex-wrap gap-2" aria-label="답장하기">
                ${aiReplyMessages.map(reply => `
                    <button class="reply-btn py-1 px-2 bg-amber-50 border border-amber-200 rounded text-amber-800 hover:bg-amber-100" data-msg="${reply}">${reply}</button>
                `).join('')}
                <button class="reply-custom py-1 px-2 bg-gray-100 border border-gray-300 rounded text-gray-800 hover:bg-gray-200">자유 입력</button>
            </div>
        `;
        inbox.prepend(messageCard);

        // ✅ 답장 버튼: 보낸 사람(message.senderId)에게 답장하도록 수정
        messageCard.querySelectorAll('.reply-btn').forEach(btn => {
            btn.addEventListener('click', () => sendMessage(btn.dataset.msg, message.senderId));
        });
        
        messageCard.querySelector('.reply-custom').addEventListener('click', () => {
            const replyText = prompt('답장 내용을 입력하세요:');
            if (replyText) sendMessage(replyText, message.senderId);
        });
    }

    /** AI 추천 메시지 버튼 동적 생성 */
    function createMessageButtons() {
        messageButtonsContainer.innerHTML = '';
        aiMessages.forEach(msg => {
            const button = document.createElement('button');
            button.className = 'py-2 px-4 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700 font-medium hover:bg-indigo-100 transition-colors text-left';
            button.textContent = msg;
            // ✅ 추천 메시지 클릭 시에도 수신자 ID를 확인하고 메시지 전송
            button.onclick = () => {
                const recipientId = recipientIdInput.value.trim();
                if (!recipientId) {
                    alert('받는 이웃의 아이디를 먼저 입력해주세요.');
                    return;
                }
                sendMessage(msg, recipientId);
            };
            messageButtonsContainer.appendChild(button);
        });
    }

    // --- (이하 나머지 코드는 이전과 동일) ---
    
    /** 새 메시지 알림 팝업 표시 */
    function showNotification(message) {
        const summary = message.message.length > 20 ? message.message.substring(0, 20) + "..." : message.message;
        notificationText.textContent = `"${summary}"`;
        
        notificationPopup.classList.remove('hidden', 'translate-x-full');
        setTimeout(() => {
            notificationPopup.classList.add('translate-x-full');
        }, 4000);
         setTimeout(() => {
            notificationPopup.classList.add('hidden');
        }, 4500);
    }

    const getInboxKey = (userId) => `osondoson_inbox_${userId}`;

    function pushToLocalInbox(receiverId, payload) {
        const key = getInboxKey(receiverId);
        const inboxData = JSON.parse(localStorage.getItem(key) || '[]');
        inboxData.push(payload);
        localStorage.setItem(key, JSON.stringify(inboxData));
    }

    function loadMessages() {
        const key = getInboxKey(currentUserId);
        const inboxData = JSON.parse(localStorage.getItem(key) || '[]');
        inboxData.sort((a, b) => a.timestamp - b.timestamp);
        
        if (inboxData.length === 0) {
            inboxPlaceholder.classList.remove('hidden');
        } else {
            const lastCount = parseInt(inbox.dataset.messageCount || '0');
            inbox.innerHTML = '';
            inboxData.forEach(addMessageToInbox);
            if (inboxData.length > lastCount && lastCount > 0) {
                showNotification(inboxData[inboxData.length - 1]);
            }
            inbox.dataset.messageCount = inboxData.length;
        }
    }
    
    const formatTimestamp = (ts) => {
        if (!ts) return '';
        return new Date(ts).toLocaleString('ko-KR');
    };

    initialize();
});