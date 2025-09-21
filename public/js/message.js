// import Filter from 'badwords-ko'; // 임시로 주석 처리

document.addEventListener('DOMContentLoaded', () => {
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

    const userIdSpan = document.getElementById('userId');
    const recipientIdInput = document.getElementById('recipientIdInput');
    const messageButtonsContainer = document.getElementById('messageButtons');
    const customMessageTextarea = document.getElementById('customMessage');
    const sendCustomBtn = document.getElementById('sendCustomBtn');
    const messageSentBox = document.getElementById('messageSentBox');
    const inbox = document.getElementById('inbox');
    const inboxPlaceholder = document.getElementById('inboxPlaceholder');
    const notificationPopup = document.getElementById('messageNotification');
    const notificationText = document.getElementById('notificationText');
    // const filter = new Filter(); // 임시로 주석 처리
    const replyModal = document.getElementById('replyModal');
    const modalTextarea = document.getElementById('modalTextarea');
    const replyToLabel = document.getElementById('replyTo');
    const sendModalBtn = document.getElementById('sendModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');

    // ▼▼▼ [추가된 부분] AI 제안 모달 관련 DOM 요소 ▼▼▼
    const aiSuggestionModal = document.getElementById('aiSuggestionModal');
    const closeAiModalBtn = document.getElementById('closeAiModalBtn');
    const originalUserMessage = document.getElementById('originalUserMessage');
    const suggestedAiMessage = document.getElementById('suggestedAiMessage');
    const editOriginalBtn = document.getElementById('editOriginalBtn');
    const sendSuggestedBtn = document.getElementById('sendSuggestedBtn');
    // ▲▲▲ [추가된 부분] AI 제안 모달 관련 DOM 요소 ▲▲▲

    let currentUserId = null;
    let replyTarget = null;

    function initialize(){
        // 로그인 상태 확인
        const name = sessionStorage.getItem("osondoson_user_name");
        const unit = sessionStorage.getItem("osondoson_user_unit");
        
        console.log('🔍 로그인 상태 확인:', { name, unit });
        
        if(!name || !unit){
            console.log('❌ 로그인 정보 없음 - 로그인 페이지로 이동');
            // 로그인 안 한 상태면 로그인 화면으로 강제 이동
            window.location.href = "/html/login.html";
            return;
        }

        const params = new URLSearchParams(window.location.search);
        currentUserId = params.get('userId') || unit; // sessionStorage의 unit을 기본값으로 사용
        
        console.log('🔍 URL 파라미터:', { 
            urlParams: Object.fromEntries(params.entries()),
            currentUserId,
            unit 
        });
        
        if(!currentUserId){
            console.log('❌ 사용자 ID 없음');
            document.body.innerHTML = '<div style="padding:2rem;text-align:center"><h2 style="color:#d32f2f">잘못된 접근입니다.</h2><p>로그인 후 접근하세요.</p></div>';
            return;
        }

        console.log('✅ 로그인 성공 - 사용자 ID:', currentUserId);
        userIdSpan.textContent = currentUserId;
        createMessageButtons();
        setupEventListeners();
        loadMessages();
    }

    // ▼▼▼ [수정된 부분] 이벤트 리스너 설정 함수 ▼▼▼
    function setupEventListeners(){
        sendCustomBtn.addEventListener('click', async () => {
            const recipientId = recipientIdInput.value.trim();
            const message = customMessageTextarea.value.trim();
            if (!recipientId) { alert('받는 이웃의 아이디를 입력해주세요.'); return; }
            if (!message) { alert('메시지를 입력하세요.'); return; }

            // ▼▼▼ 욕설 필터링 및 AI 제안 로직으로 교체 ▼▼▼
            // 모든 직접 입력 메시지를 AI로 순화
            if (true) { // filter.isProfane(message)) {
                sendCustomBtn.disabled = true;
                sendCustomBtn.textContent = 'AI가 부드러운 표현을 찾고 있어요...';

                try {
                    // 백엔드 서버(/api/refine)에 순화 요청
                    const response = await fetch('http://127.0.0.1:5000/api/refine', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: message }),
                    });

                    if (!response.ok) throw new Error('AI 서버 응답 실패');

                    const data = await response.json();
                    showAiSuggestionModal(message, data.refinedMessage, recipientId);

                } catch (error) {
                    console.error("AI 제안 생성 실패:", error);
                    alert("AI 제안을 가져오는 데 실패했습니다. 직접 메시지를 수정해주세요.");
                } finally {
                    sendCustomBtn.disabled = false;
                    sendCustomBtn.textContent = '직접 입력한 메시지 보내기';
                }

            } else {
                sendMessage(message, recipientId);
                customMessageTextarea.value = '';
            }
            // ▲▲▲ 욕설 필터링 및 AI 제안 로직으로 교체 ▲▲▲
        });

        // --- 나머지 이벤트 리스너들 ---
        window.addEventListener('storage', (e) => {
            if(!currentUserId) return;
            if(e.key === getInboxKey(currentUserId)) loadMessages();
        });

        closeModalBtn.addEventListener('click', hideReplyModal);
        cancelModalBtn.addEventListener('click', hideReplyModal);
        sendModalBtn.addEventListener('click', () => {
            const text = modalTextarea.value.trim();
            if(!text) { alert('메시지를 입력하세요.'); return; }
            if(!replyTarget){ alert('대상이 없습니다.'); hideReplyModal(); return; }
            sendMessage(text, replyTarget);
            hideReplyModal();
        });
        replyModal.addEventListener('click', (ev)=>{ if(ev.target===replyModal) hideReplyModal(); });

        // ▼▼▼ [추가된 부분] AI 제안 모달 이벤트 리스너 ▼▼▼
        closeAiModalBtn.addEventListener('click', hideAiSuggestionModal);
        editOriginalBtn.addEventListener('click', hideAiSuggestionModal);
        aiSuggestionModal.addEventListener('click', (ev) => { if(ev.target === aiSuggestionModal) hideAiSuggestionModal(); });
        // ▲▲▲ [추가된 부분] AI 제안 모달 이벤트 리스너 ▲▲▲
    }

    // ... (createMessageButtons, sendMessage 등 다른 함수들은 그대로) ...
    function createMessageButtons(){
        messageButtonsContainer.innerHTML = '';
        aiMessages.forEach(msg => {
            const btn = document.createElement('button');
            btn.className = 'preset-btn';
            btn.type = 'button';
            btn.textContent = msg;
            btn.addEventListener('click', () => {
                const recipientId = recipientIdInput.value.trim();
                if(!recipientId){ alert('받는 이웃의 아이디를 먼저 입력해주세요.'); return; }
                sendMessage(msg, recipientId);
            });
            messageButtonsContainer.appendChild(btn);
        });
    }
    
    function sendMessage(messageText, recipientId){
        if(!recipientId) return;
        if(recipientId === currentUserId){ alert('자기 자신에게는 메시지를 보낼 수 없습니다.'); return; }
        const payload = { senderId: currentUserId, receiverId: recipientId, message: messageText, timestamp: Date.now() };
        pushToLocalInbox(recipientId, payload);
        showSentFeedback();
    }
    
    function showSentFeedback(){
        messageSentBox.classList.remove('hidden');
        setTimeout(()=> messageSentBox.classList.add('hidden'), 2200);
    }
    
    function addMessageToInbox(message){
        const placeholder = document.getElementById('inboxPlaceholder');
        if (placeholder) placeholder.style.display = 'none';
        const card = document.createElement('article');
        card.className = 'message-card';
        const header = document.createElement('div');
        header.className = 'header';
        const headerText = document.createElement('span');
        headerText.textContent = `${message.senderId}님에게서 쪽지 도착`;
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '삭제';
        deleteBtn.setAttribute('aria-label', '메시지 삭제');
        deleteBtn.dataset.timestamp = message.timestamp;
        deleteBtn.addEventListener('click', handleDeleteMessage);
        header.append(headerText, deleteBtn);
        const content = document.createElement('div'); content.className='content'; content.textContent = message.message;
        const meta = document.createElement('div'); meta.className='meta'; meta.textContent = formatTimestamp(message.timestamp);
        const actions = document.createElement('div'); actions.className='reply-actions';
        aiReplyMessages.forEach(rep => {
            const b = document.createElement('button'); b.className='quick-reply'; b.type='button'; b.textContent = rep;
            b.addEventListener('click', () => sendMessage(rep, message.senderId));
            actions.appendChild(b);
        });
        const custom = document.createElement('button'); custom.className='quick-reply custom'; custom.type='button'; custom.textContent = '자유 입력';
        custom.addEventListener('click', () => showReplyModal(message.senderId));
        actions.appendChild(custom);
        card.append(header, content, meta, actions);
        inbox.prepend(card);
    }
    
    function handleDeleteMessage(event) {
        if (!confirm('이 메시지를 정말 삭제하시겠습니까?')) return;
        const timestampToDelete = event.target.dataset.timestamp;
        const key = getInboxKey(currentUserId);
        let messages = JSON.parse(localStorage.getItem(key) || '[]');
        messages = messages.filter(msg => String(msg.timestamp) !== timestampToDelete);
        localStorage.setItem(key, JSON.stringify(messages));
        loadMessages();
    }
    
    function showReplyModal(targetId){
        replyTarget = targetId;
        replyToLabel.textContent = targetId;
        modalTextarea.value = '';
        replyModal.classList.remove('hidden');
        replyModal.setAttribute('aria-hidden', 'false');
        modalTextarea.focus();
    }
    
    function hideReplyModal(){
        replyTarget = null;
        replyModal.classList.add('hidden');
        replyModal.setAttribute('aria-hidden', 'true');
        modalTextarea.value = '';
    }
    
    function showNotification(message){
        const summary = message.message.length > 40 ? message.message.slice(0,40) + '...' : message.message;
        notificationText.textContent = `"${summary}"`;
        notificationPopup.classList.add('visible');
        setTimeout(()=> notificationPopup.classList.remove('visible'), 3500);
    }
    
    const getInboxKey = userId => `osondoson_inbox_${userId}`;
    
    function pushToLocalInbox(receiverId, payload){
        const key = getInboxKey(receiverId);
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        arr.push(payload);
        localStorage.setItem(key, JSON.stringify(arr));
        if(receiverId === currentUserId) loadMessages();
    }
    
    function loadMessages(){
        const key = getInboxKey(currentUserId);
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        arr.sort((a,b)=> a.timestamp - b.timestamp);
        inbox.innerHTML = '';
        if(arr.length === 0){
            inbox.innerHTML = '<p id="inboxPlaceholder">아직 도착한 쪽지가 없어요.</p>';
        } else {
            arr.forEach(addMessageToInbox);
        }
    }
    
    function formatTimestamp(ts){ if(!ts) return ''; return new Date(ts).toLocaleString('ko-KR'); }


    // ▼▼▼ [추가된 부분] AI 제안 모달 제어 함수 ▼▼▼
    function showAiSuggestionModal(original, suggestion, recipientId) {
        originalUserMessage.textContent = original;
        suggestedAiMessage.textContent = suggestion;

        const sendSuggestedHandler = () => {
            sendMessage(suggestion, recipientId);
            customMessageTextarea.value = '';
            hideAiSuggestionModal();
        };
        
        // 간단하게 기존 이벤트 리스너 제거 후 새로 추가
        sendSuggestedBtn.onclick = sendSuggestedHandler;

        aiSuggestionModal.classList.remove('hidden');
        aiSuggestionModal.setAttribute('aria-hidden', 'false');
    }

    function hideAiSuggestionModal() {
        aiSuggestionModal.classList.add('hidden');
        aiSuggestionModal.setAttribute('aria-hidden', 'true');
    }
    // ▲▲▲ [추가된 부분] AI 제안 모달 제어 함수 ▲▲▲

    initialize();
});