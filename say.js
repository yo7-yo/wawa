
/*！！！！第二个（AI对话）界面的交互涉及*/

/* ========================================== */
/* [分区 1]: 角色与全局数据配置 */
/* ========================================== */
function getPersonaFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('role') || 'scholar'; 
}
window.currentAiPersona = getPersonaFromURL();
let currentLang = 'zh';
function setupInputListeners() {
    const nameInput = document.getElementById('mascotNameInput');
    const mascotPage = document.getElementById('mascotPage');
    const wrap = document.getElementById("mascotCanvasWrap");

    if (nameInput) {
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);

        nameInput.addEventListener('focus', () => {
            if (isMobileDevice) {
                // 1. 触发内部挤压逻辑
                mascotPage.classList.add('input-focused');
                
                // 2. 立即通知 Three.js 画布尺寸变了，否则模型会拉伸变形
                setTimeout(() => {
                    if (renderer && camera) {
                        const newWidth = wrap.clientWidth;
                        const newHeight = wrap.clientHeight;
                        camera.aspect = newWidth / newHeight;
                        camera.updateProjectionMatrix();
                        renderer.setSize(newWidth, newHeight);
                    }
                }, 300);
            }
        });

        nameInput.addEventListener('blur', () => {
            if (isMobileDevice) {
                mascotPage.classList.remove('input-focused');
                
                // 恢复画布尺寸
                setTimeout(() => {
                    if (renderer && camera) {
                        camera.aspect = wrap.clientWidth / wrap.clientHeight;
                        camera.updateProjectionMatrix();
                        renderer.setSize(wrap.clientWidth, wrap.clientHeight);
                    }
                }, 300);
            }
        });
    }
}
// 翻译大字典
const translations = {
    'zh': {
        pageTitle: 'AI文物探索', headerTitle: '🏛️文物秘语', loadingArtifact: '文物出库中...', inputPlaceholder: '请在此输入您的对话...',
        sendButton: '发送', initialMessage: '有兴趣和我一起聊聊天吗,我定知无不言、言无不尽...', undoButton: '↩️ 撤回',
        retryButton: '🔄 重试', clearButton: '🗑️ 清空', saveButton: '💾 保存', clearModalTitle: '⚠️ 警告：记忆消除',
        clearModalPrompt: '您即将清空与文物的对话记录。', clearModalInstruction: '为了确认您的操作，请输入：',
        clearModalConfirmText: '确认清空', modalCancel: '取消', modalConfirm: '强制执行', thinking: '思考中...', 
        langToggle: 'Switch to English', connectionError: '连接断开 (请检查 server.py)'
    },
    'en': {
        pageTitle: 'AI Artifact Explorer', headerTitle: 'Artifact Secrets', loadingArtifact: 'Loading artifact...',
        inputPlaceholder: 'Type your message here...', sendButton: 'Send', initialMessage: 'Would you like to have a chat with me? I will tell you everything I know...',
        undoButton: '↩️ Undo', retryButton: '🔄 Retry', clearButton: '🗑️ Clear', saveButton: '💾 Save',
        clearModalTitle: '⚠️ WARNING: Memory Wipe', clearModalPrompt: 'You are about to clear the conversation history with the artifact.',
        clearModalInstruction: 'To confirm this action, please type:', clearModalConfirmText: 'Confirm Clear', modalCancel: 'Cancel',
        modalConfirm: 'Execute', langToggle: '切换为中文', thinking: 'Thinking...', connectionError: 'Connection lost (please check server.py)'
    },
    'de': { 
        pageTitle: 'KI Artefakt-Explorer', headerTitle: 'Artefakt-Geheimnisse', loadingArtifact: 'Artefakt wird geladen...',
        inputPlaceholder: 'Nachricht hier eingeben...', sendButton: 'Senden', initialMessage: 'Möchtest du mit mir plaudern? Ich werde dir alles erzählen, was ich weiß...',
        undoButton: '↩️ Rückgängig', retryButton: '🔄 Wiederholen', clearButton: '🗑️ Leeren', saveButton: '💾 Speichern',
        clearModalTitle: '⚠️ WARNUNG: Gedächtnis löschen', clearModalPrompt: 'Du bist dabei, den Gesprächsverlauf mit dem Artefakt zu löschen.',
        clearModalInstruction: 'Zur Bestätigung bitte eingeben:', clearModalConfirmText: 'Löschen bestätigen', modalCancel: 'Abbrechen',
        modalConfirm: 'Endgültig löschen', langToggle: 'zu Chinesisch wechseln', thinking: 'Denkt nach...', connectionError: 'Verbindung unterbrochen (bitte server.py prüfen)'
    },
    'ja': { 
        pageTitle: 'AIアーティファクト探索', headerTitle: 'アーティファクトの秘密', loadingArtifact: 'アーティファクトを読み込み中...',
        inputPlaceholder: 'ここにメッセージを入力...', sendButton: '送信', initialMessage: '私とチャットしませんか？知っていることは何でもお話しします...',
        undoButton: '↩️ 元に戻す', retryButton: '🔄 再試行', clearButton: '🗑️ クリア', saveButton: '💾 保存',
        clearModalTitle: '⚠️ 警告：記憶消去', clearModalPrompt: 'アーティファクトとの対話履歴を消去しようとしています。',
        clearModalInstruction: 'この操作を確定するには、次のように入力してください：', clearModalConfirmText: '消去を確定',
        modalCancel: 'キャンセル', modalConfirm: '実行', langToggle: '中国語に切り替え', thinking: '考え中...', connectionError: '接続が切れました (server.py を確認してください)'
    }
};

/* ========================================== */
/* [分区 2]: UI 语言与渲染管理 */
/* ========================================== */
function updateLanguage(lang) {
    const elementsToTranslate = document.querySelectorAll('[data-lang-zh]');
    elementsToTranslate.forEach(element => {
        const attributeName = `data-lang-${lang}`;
        const translatedText = element.getAttribute(attributeName);
        if (translatedText) element.innerText = translatedText;
    });
}

function updateUIText(lang) {
    if (!translations[lang]) return;
    const t = translations[lang];

    document.title = t.pageTitle;
    document.querySelector('header h1').innerText = t.headerTitle;
    document.getElementById('loading-overlay').innerText = t.loadingArtifact;
    document.getElementById('user-input').placeholder = t.inputPlaceholder;
    document.getElementById('send-btn').innerText = t.sendButton;
    document.getElementById('undo-btn').innerText = t.undoButton;
    document.getElementById('retry-btn').innerText = t.retryButton;
    document.getElementById('clear-btn').innerText = t.clearButton;
    document.getElementById('save-btn').innerText = t.saveButton;
    
    document.querySelector('#clear-modal h3').innerText = t.clearModalTitle;
    const modalPs = document.querySelectorAll('#clear-modal p');
    modalPs[0].innerText = t.clearModalPrompt;
    modalPs[1].innerHTML = `${t.clearModalInstruction}<br><span class="highlight-text">${t.clearModalConfirmText}</span>`;
    document.getElementById('cancel-clear').innerText = t.modalCancel;
    document.getElementById('confirm-clear').innerText = t.modalConfirm;

    const initialMsgEl = document.querySelector('.system-msg');
    if (initialMsgEl && chatHistory.length === 0) initialMsgEl.innerText = t.initialMessage;
    
    currentLang = lang;
    localStorage.setItem('app_language', lang);
    updateLanguage(lang);
}

// 核心对话数据
let scene, camera, renderer, controls, model;
let chatHistory = []; 
let isInSelectionMode = false;
let selectedMessages = new Set();
let longPressTimer = null;
const LONG_PRESS_DURATION = 500; 

/* ========================================== */
/* 🎯【核心重点 1】: 3D 舞台加载与渲染 */
/* ========================================== */
function init3D() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 5);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.autoRotate = true; controls.autoRotateSpeed = 6.0;

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffedd0, 1.5);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);
}

function animate() {
    requestAnimationFrame(animate);
    if (controls.update()) renderer.render(scene, camera);
}

function loadModel(modelPath) {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.style.display = 'block';
    const loader = new THREE.GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    if (model) scene.remove(model);
    loader.load(
        modelPath,
        function (gltf) {
            model = gltf.scene;
            model.scale.set(3, 3, 3);
            model.position.y = 0.2;
            scene.add(model);
            loadingOverlay.style.display = 'none';
        },
        undefined, 
        function (error) { console.error('模型加载失败:', error); loadingOverlay.innerText = '模型加载失败，请检查文件路径。'; }
    );
}

/* ========================================== */
/* 🎯【核心重点 2】: 聊天交互与请求大模型 */
/* ========================================== */
function renderChat() {
    const historyDiv = document.getElementById('chat-history');
    historyDiv.innerHTML = ''; 
    document.body.classList.toggle('selection-active', isInSelectionMode);

    if (chatHistory.length === 0) {
        historyDiv.innerHTML = `<div class="message system-msg">${translations[currentLang].initialMessage}</div>`;
        return;
    }

    chatHistory.forEach((msg, index) => {
        const div = document.createElement('div');
        div.className = `message ${msg.role === 'user' ? 'user' : 'ai'}`;
        if (selectedMessages.has(index)) div.classList.add('selected');

        div.innerHTML = msg.role === 'user' ? msg.content : `<strong>${document.getElementById('artifact-name').value}:</strong><br>${msg.content}`;
        
        // 绑定各种事件处理批量删除
        div.addEventListener('click', () => { if (isInSelectionMode) toggleMessageSelection(index); });
        div.addEventListener('contextmenu', (e) => { e.preventDefault(); toggleMessageSelection(index); });
        div.addEventListener('mousedown', () => {
            clearTimeout(longPressTimer);
            longPressTimer = setTimeout(() => toggleMessageSelection(index), LONG_PRESS_DURATION);
        });
        const clearLongPress = () => clearTimeout(longPressTimer);
        div.addEventListener('mouseup', clearLongPress);
        div.addEventListener('mouseleave', clearLongPress);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn'; deleteBtn.innerHTML = '🗑️';
        deleteBtn.onclick = (e) => { e.stopPropagation(); deleteTurn(index); };
        div.appendChild(deleteBtn);

        historyDiv.appendChild(div);
    });
    historyDiv.scrollTop = historyDiv.scrollHeight;
}

async function sendChat(overrideText = null) {
    const input = document.getElementById('user-input');
    const text = overrideText || input.value.trim();
    if (!text) return;

    if (!overrideText) {
        input.value = '';
        chatHistory.push({ role: "user", content: text });
        saveHistoryToLocal(); renderChat();
    }
    
    const historyDiv = document.getElementById('chat-history');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai'; loadingDiv.id = 'temp-loading';
    loadingDiv.innerText = translations[currentLang].thinking;
    historyDiv.appendChild(loadingDiv);
    historyDiv.scrollTop = historyDiv.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                history: chatHistory,
                artifact_name: document.getElementById('artifact-name').value,
                language: currentLang
            })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || data.answer || `HTTP ${response.status}`);

        const aiText = data.answer;
        document.getElementById('temp-loading').remove();
        chatHistory.push({ role: "assistant", content: aiText });
        saveHistoryToLocal(); renderChat(); speak(aiText);

    } catch (error) {
        console.error('Chat error:', error);
        const loadingElement = document.getElementById('temp-loading');
        if (loadingElement) loadingElement.innerText = error?.message || translations[currentLang].connectionError;
    }
}

async function translateChatHistory(targetLang) {
    if (chatHistory.length === 0) return;
    const historyDiv = document.getElementById('chat-history');
    const translatingDiv = document.createElement('div');
    translatingDiv.className = 'message system-msg'; translatingDiv.id = 'translating-msg';
    translatingDiv.innerText = `翻译中... (Translating to ${translations[targetLang]?.headerTitle || targetLang})`;
    historyDiv.appendChild(translatingDiv);
    historyDiv.scrollTop = historyDiv.scrollHeight;

    try {
        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: chatHistory, target_lang: targetLang })
        });
        const rawText = await response.text();
        let data = {};
        try { data = rawText ? JSON.parse(rawText) : {}; } catch { throw new Error(rawText || `HTTP ${response.status}`); }
        if (!response.ok) throw new Error(data.detail || data.error || rawText || `HTTP ${response.status}`);

        const translatingMsg = document.getElementById('translating-msg');
        if (translatingMsg) translatingMsg.remove();
        if (data.translated_messages && data.translated_messages.length > 0) {
            chatHistory = data.translated_messages;
            saveHistoryToLocal(); renderChat();
        }
    } catch (error) {
        console.error('Translation error:', error);
        const translatingMsg = document.getElementById('translating-msg');
        if (translatingMsg) translatingMsg.innerText = '翻译失败，保持原语言。';
    }
}

/* ========================================== */
/* [分区 3]: 对话框附加操作逻辑 (撤回、清空、长按、保存、语音) */
/* ========================================== */
function updateSelectionUI() {
    const selectionControls = document.getElementById('selection-controls');
    const controlsBar = document.querySelector('.controls-bar');
    const selectionCounter = document.getElementById('selection-counter');

    if (isInSelectionMode) {
        selectionControls.style.display = 'flex'; controlsBar.style.display = 'none';
        selectionCounter.textContent = `已选中 ${selectedMessages.size} 条消息`; 
    } else {
        selectionControls.style.display = 'none'; controlsBar.style.display = 'flex';
    }
}

function toggleMessageSelection(index) {
    if (!isInSelectionMode) { isInSelectionMode = true; updateSelectionUI(); }
    const historyDiv = document.getElementById('chat-history');
    const messageDiv = historyDiv.querySelectorAll('.message')[index];

    if (selectedMessages.has(index)) {
        selectedMessages.delete(index);
        if (messageDiv) messageDiv.classList.remove('selected');
    } else {
        selectedMessages.add(index);
        if (messageDiv) messageDiv.classList.add('selected');
    }
    if (selectedMessages.size === 0) isInSelectionMode = false;
    updateSelectionUI();
}

function deleteSelectedMessages() {
    if (selectedMessages.size === 0) return;
    if (!confirm(`确定要永久删除选中的 ${selectedMessages.size} 条消息吗？`)) return;
    chatHistory = chatHistory.filter((_, index) => !selectedMessages.has(index));
    isInSelectionMode = false; selectedMessages.clear(); 
    updateSelectionUI(); saveHistoryToLocal(); renderChat();
}

function cancelSelection() {
    isInSelectionMode = false; selectedMessages.clear();
    document.querySelectorAll('#chat-history .message.selected').forEach(el => el.classList.remove('selected'));
    updateSelectionUI();
}

function deleteTurn(index) {
    if (!confirm("确定要删除这条消息吗？记录将无法恢复。")) return;
    chatHistory.splice(index, 1); saveHistoryToLocal(); renderChat();
}

function speak(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const speechLangMap = { zh: 'zh-CN', en: 'en-US', de: 'de-DE', ja: 'ja-JP' };
    utterance.lang = speechLangMap[currentLang] || 'en-US';
    utterance.rate = 1.0; window.speechSynthesis.speak(utterance);
}

function undoLast() {
    if (chatHistory.length >= 2) { chatHistory.pop(); chatHistory.pop(); } 
    else if (chatHistory.length === 1) { chatHistory.pop(); }
    saveHistoryToLocal(); renderChat();
}

function clearAll() { chatHistory = []; saveHistoryToLocal(); renderChat(); }

function retryLast() {
    if (chatHistory.length === 0) return;
    const lastMsg = chatHistory[chatHistory.length - 1];
    let userMsg;
    if (lastMsg.role === 'assistant') { chatHistory.pop(); userMsg = chatHistory.pop(); } 
    else if (lastMsg.role === 'user') { userMsg = chatHistory.pop(); }

    if (userMsg) {
        chatHistory.push(userMsg); saveHistoryToLocal(); renderChat(); 
        sendChat(userMsg.content); 
    }
}

function showClearModal() {
    const modal = document.getElementById('clear-modal');
    const input = document.getElementById('verify-input');
    modal.style.display = 'flex'; input.value = ''; input.focus();
}

function verifyAndClear() {
    const input = document.getElementById('verify-input').value;
    const confirmText = translations[currentLang].clearModalConfirmText;
    if (input === confirmText) { clearAll(); closeClearModal(); } 
    else { alert(`${translations[currentLang].modalConfirm}失败！请输入：${confirmText}`); }
}

function closeClearModal() { document.getElementById('clear-modal').style.display = 'none'; }

function saveChatHistory() {
    if (chatHistory.length === 0) { alert("还没有聊天记录，无法保存哦！"); return; }
    const artifactName = document.getElementById('artifact-name').value;
    const time = new Date().toLocaleString();
    let content = `🏛️ 博物馆奇妙夜 · 对话存档\n文物身份：${artifactName}\n存档时间：${time}\n------------------------------------\n\n`;
    chatHistory.forEach(msg => {
        const roleName = msg.role === 'user' ? '【我】' : `【${artifactName}】`;
        content += `${roleName}：\n${msg.content}\n\n`;
    });
    content += `------------------------------------\n(由 AI 数字博物馆生成)\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${artifactName}_对话记录_${Date.now()}.txt`;
    a.style.display = 'none'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

function saveHistoryToLocal() { try { localStorage.setItem('museumChatHistory', JSON.stringify(chatHistory)); } catch (e) { console.error("保存失败。", e); } }
function loadHistoryFromLocal() { try { const saved = localStorage.getItem('museumChatHistory'); if (saved) chatHistory = JSON.parse(saved); } catch (e) { chatHistory = []; } }

/* ========================================== */
/* 🎯【系统入口】: 页面加载后的统一调度 */
/* ========================================== */
document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化欢迎语
    const greetings = {
        child: "哇！你终于来看我啦！我肚子里装了好多好玩的故事，你想先听哪一个呀？",
        student: "阁下有礼了。相见即是缘，咱们一同探讨探讨这器物背后的奥秘如何？",
        storyteller: "惊堂木一拍，咱们话接上回！这位看官，您想听点宫廷秘闻呢，还是江湖传说？",
        scholar: "您好。此器历经沧桑。若有关于其形制、纹饰或年代断代的学术探讨，但问无妨。"
    };
    const greetingMsg = document.getElementById('dynamic-greeting');
    if (greetingMsg) greetingMsg.innerText = greetings[window.currentAiPersona];

    // 2. 初始化 3D
    if (typeof init3D === 'function') { init3D(); loadModel('2.glb'); animate(); }

    // 3. 加载历史对话
    loadHistoryFromLocal(); renderChat(); 

    // 4. 处理语言切换
    const langSelect = document.getElementById('lang-select');
    const savedLang = localStorage.getItem('app_language') || 'zh'; 
    if (savedLang && langSelect.querySelector(`[value=${savedLang}]`)) {
        langSelect.value = savedLang; updateUIText(savedLang);
    }
    langSelect.addEventListener('change', () => {
        const newLang = langSelect.value;
        localStorage.setItem('app_language', newLang); updateUIText(newLang);
        chatHistory.length > 0 ? translateChatHistory(newLang) : renderChat(); 
    });

    // 5. 绑定基础按键事件
    document.getElementById('send-btn').addEventListener('click', () => sendChat());
    document.getElementById('user-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChat(); });
    document.getElementById('undo-btn').addEventListener('click', undoLast);
    document.getElementById('retry-btn').addEventListener('click', retryLast);
    document.getElementById('save-btn').addEventListener('click', saveChatHistory);
    document.getElementById('clear-btn').addEventListener('click', showClearModal);
    document.getElementById('confirm-clear').addEventListener('click', verifyAndClear);
    document.getElementById('cancel-clear').addEventListener('click', closeClearModal);
    document.getElementById('delete-selected-btn').addEventListener('click', deleteSelectedMessages); // 新增批量删除绑定

    // 6. 长按呼出批量选择逻辑
    const chatPanel = document.getElementById('chat-history');
    const selectionControls = document.getElementById('selection-controls');

    chatPanel.addEventListener('touchstart', () => {
        longPressTimer = setTimeout(() => {
            selectionControls.style.setProperty('display', 'flex', 'important');
            if (navigator.vibrate) navigator.vibrate(50);
        }, 800); 
    });
    chatPanel.addEventListener('touchend', () => clearTimeout(longPressTimer));
    chatPanel.addEventListener('touchmove', () => clearTimeout(longPressTimer));
    document.getElementById('cancel-selection-btn').addEventListener('click', cancelSelection);
});

// 悬浮信息小圆球弹窗逻辑
const infoBtn = document.getElementById('infoBtn');
const infoModal = document.getElementById('infoModal');
const closeInfo = document.getElementById('closeInfo');

if (infoBtn) infoBtn.onclick = (e) => { e.stopPropagation(); if (infoModal) infoModal.style.display = 'flex'; };
if (closeInfo && infoModal) closeInfo.onclick = () => { infoModal.style.display = 'none'; };
if (infoModal) infoModal.onclick = (e) => { if (e.target === infoModal) infoModal.style.display = 'none'; };