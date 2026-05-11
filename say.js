
/*！！！！第二个（AI对话）界面的交互涉及*/

// === 从 URL 获取角色参数 ===
function getPersonaFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('role') || 'scholar'; // 没拿到参数默认给“学者”
}

window.currentAiPersona = getPersonaFromURL();

document.addEventListener('DOMContentLoaded', () => {
    const greetingMsg = document.getElementById('dynamic-greeting');
    
    // 设置对应的专属欢迎语
    const greetings = {
        child: "哇！你终于来看我啦！我肚子里装了好多好玩的故事，你想先听哪一个呀？",
        student: "阁下有礼了。相见即是缘，咱们一同探讨探讨这器物背后的奥秘如何？",
        storyteller: "惊堂木一拍，咱们话接上回！这位看官，您想听点宫廷秘闻呢，还是江湖传说？",
        scholar: "您好。此器历经沧桑。若有关于其形制、纹饰或年代断代的学术探讨，但问无妨。"
    };

    if (greetingMsg) {
        greetingMsg.innerText = greetings[window.currentAiPersona];
    }
    
    console.log("当前唤醒角色：", window.currentAiPersona);
});

/**
 * 博物馆奇妙夜 - 交互逻辑核心
 */

let currentLang = 'zh';

// ✨ 新增：UI 文本翻译字典
const translations = {
    'zh': {
        pageTitle: 'AI文物探索',
        headerTitle: '🏛️文物秘语',
        loadingArtifact: '文物出库中...',
        inputPlaceholder: '请在此输入您的对话...',
        sendButton: '发送',
        initialMessage: '有兴趣和我一起聊聊天吗,我定知无不言、言无不尽...',
        undoButton: '↩️ 撤回',
        retryButton: '🔄 重试',
        clearButton: '🗑️ 清空',
        saveButton: '💾 保存',
        clearModalTitle: '⚠️ 警告：记忆消除',
        clearModalPrompt: '您即将清空与文物的对话记录。',
        clearModalInstruction: '为了确认您的操作，请输入：',
        clearModalConfirmText: '确认清空',
        modalCancel: '取消',
        modalConfirm: '强制执行',
        thinking: '思考中...', 
        langToggle: 'Switch to English',
        connectionError: '连接断开 (请检查 server.py)'
    },
    'en': {
        pageTitle: 'AI Artifact Explorer',
        headerTitle: 'Artifact Secrets',
        loadingArtifact: 'Loading artifact...',
        inputPlaceholder: 'Type your message here...',
        sendButton: 'Send',
        initialMessage: 'Would you like to have a chat with me? I will tell you everything I know...',
        undoButton: '↩️ Undo',
        retryButton: '🔄 Retry',
        clearButton: '🗑️ Clear',
        saveButton: '💾 Save',
        clearModalTitle: '⚠️ WARNING: Memory Wipe',
        clearModalPrompt: 'You are about to clear the conversation history with the artifact.',
        clearModalInstruction: 'To confirm this action, please type:',
        clearModalConfirmText: 'Confirm Clear',
        modalCancel: 'Cancel',
        modalConfirm: 'Execute',
        langToggle: '切换为中文',
        thinking: 'Thinking...',
        connectionError: 'Connection lost (please check server.py)'
    },
    'de': { // ✨ 新增：德语 (完整版)
        pageTitle: 'KI Artefakt-Explorer',
        headerTitle: 'Artefakt-Geheimnisse',
        loadingArtifact: 'Artefakt wird geladen...',
        inputPlaceholder: 'Nachricht hier eingeben...',
        sendButton: 'Senden',
        initialMessage: 'Möchtest du mit mir plaudern? Ich werde dir alles erzählen, was ich weiß...',
        undoButton: '↩️ Rückgängig',
        retryButton: '🔄 Wiederholen',
        clearButton: '🗑️ Leeren',
        saveButton: '💾 Speichern',
        clearModalTitle: '⚠️ WARNUNG: Gedächtnis löschen',
        clearModalPrompt: 'Du bist dabei, den Gesprächsverlauf mit dem Artefakt zu löschen.',
        clearModalInstruction: 'Zur Bestätigung bitte eingeben:',
        clearModalConfirmText: 'Löschen bestätigen',
        modalCancel: 'Abbrechen',
        modalConfirm: 'Endgültig löschen',
        langToggle: 'zu Chinesisch wechseln',
        thinking: 'Denkt nach...', // ✨ 新增
        connectionError: 'Verbindung unterbrochen (bitte server.py prüfen)'
    },
    'ja': { // ✨ 新増：日語 (完整版)
        pageTitle: 'AIアーティファクト探索',
        headerTitle: 'アーティファクトの秘密',
        loadingArtifact: 'アーティファクトを読み込み中...',
        inputPlaceholder: 'ここにメッセージを入力...',
        sendButton: '送信',
        initialMessage: '私とチャットしませんか？知っていることは何でもお話しします...',
        undoButton: '↩️ 元に戻す',
        retryButton: '🔄 再試行',
        clearButton: '🗑️ クリア',
        saveButton: '💾 保存',
        clearModalTitle: '⚠️ 警告：記憶消去',
        clearModalPrompt: 'アーティファクトとの対話履歴を消去しようとしています。',
        clearModalInstruction: 'この操作を確定するには、次のように入力してください：',
        clearModalConfirmText: '消去を確定',
        modalCancel: 'キャンセル',
        modalConfirm: '実行',
        langToggle: '中国語に切り替え',
        thinking: '考え中...', 
        connectionError: '接続が切れました (server.py を確認してください)'
    }
};
function updateLanguage(lang) {
    // 查找页面上所有包含 "data-lang-zh" 属性的元素
    // 我们使用 'zh' 作为基准，假设所有可翻译元素都至少有中文版
    const elementsToTranslate = document.querySelectorAll('[data-lang-zh]');

    elementsToTranslate.forEach(element => {
        // 构建当前语言对应的 data 属性名，例如 "data-lang-en"
        const attributeName = `data-lang-${lang}`;
        
        // 从元素的 data 属性中获取翻译文本
        const translatedText = element.getAttribute(attributeName);

        if (translatedText) {
            // 如果找到了翻译，则更新元素的显示文本
            element.innerText = translatedText;
        }
    });
}

// ✨ 新增：根据语言更新所有 UI 文本的函数
function updateUIText(lang) {
    if (!translations[lang]) return;

    const t = translations[lang];

    // 更新页面标题
    document.title = t.pageTitle;

    // 更新 Header
    document.querySelector('header h1').innerText = t.headerTitle;

    // 更新 Loading 提示
    document.getElementById('loading-overlay').innerText = t.loadingArtifact;

    // 更新输入框和发送按钮
    document.getElementById('user-input').placeholder = t.inputPlaceholder;
    document.getElementById('send-btn').innerText = t.sendButton;

    // 更新底部控制栏按钮
    document.getElementById('undo-btn').innerText = t.undoButton;
    document.getElementById('retry-btn').innerText = t.retryButton;
    document.getElementById('clear-btn').innerText = t.clearButton;
    document.getElementById('save-btn').innerText = t.saveButton;
    
    // 更新清空确认弹窗
    document.querySelector('#clear-modal h3').innerText = t.clearModalTitle;
    const modalPs = document.querySelectorAll('#clear-modal p');
    modalPs[0].innerText = t.clearModalPrompt;
    modalPs[1].innerHTML = `${t.clearModalInstruction}<br><span class="highlight-text">${t.clearModalConfirmText}</span>`;
    document.getElementById('cancel-clear').innerText = t.modalCancel;
    document.getElementById('confirm-clear').innerText = t.modalConfirm;

    // 更新聊天历史中的初始消息（如果存在）
    const initialMsgEl = document.querySelector('.system-msg');
    if (initialMsgEl && chatHistory.length === 0) {
        initialMsgEl.innerText = t.initialMessage;
    }
    
    // 更新全局语言状态
    currentLang = lang;
    // (可选) 保存用户偏好到浏览器
    localStorage.setItem('app_language', lang);
    updateLanguage(lang);
}

let scene, camera, renderer, controls, model;

// 核心：在前端维护对话历史 [{role: 'user', content: '...'}, ...]
let chatHistory = []; 

// 批量删除模式的状态变量
let isInSelectionMode = false;
let selectedMessages = new Set(); // 存储被选中的“单个”消息的索引
let longPressTimer = null;
const LONG_PRESS_DURATION = 500; // 500ms 定义为长按

// ================= 3D 渲染部分 =================
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
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 6.0;

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffedd0, 1.5);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);
}

function animate() {
    requestAnimationFrame(animate);
    const cameraHasMoved = controls.update();
    if (cameraHasMoved) {
        renderer.render(scene, camera);
    }
}

function loadModel(modelPath) {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.style.display = 'block';
    const loader = new THREE.GLTFLoader();

    //loader.setMeshoptDecoder(MeshoptDecoder);

    if (model) {
        scene.remove(model);
    }

    loader.load(
        modelPath,
        function (gltf) {
            model = gltf.scene;
            model.scale.set(4, 4, 4);
            model.position.y = -1.2;
            scene.add(model);
            loadingOverlay.style.display = 'none';
        },
        undefined, 
        function (error) {
            console.error('模型加载失败:', error);
            loadingOverlay.innerText = '模型加载失败，请检查文件路径。';
        }
    );
}

// ================ 聊天交互逻辑 (核心修改) =================

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
        
        // --- FIXED --- 在重绘时，正确地为已选中的消息加上 'selected' 类
        if (selectedMessages.has(index)) {
            div.classList.add('selected');
        }

        div.innerHTML = msg.role === 'user' ? msg.content : `<strong>${document.getElementById('artifact-name').value}:</strong><br>${msg.content}`;
        
        // --- 绑定事件 ---
        div.addEventListener('click', () => {
            if (isInSelectionMode) {
                toggleMessageSelection(index);
            }
        });

        div.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            toggleMessageSelection(index);
        });

        div.addEventListener('mousedown', () => {
            clearTimeout(longPressTimer);
            longPressTimer = setTimeout(() => {
                toggleMessageSelection(index);
            }, LONG_PRESS_DURATION);
        });

        const clearLongPress = () => clearTimeout(longPressTimer);
        div.addEventListener('mouseup', clearLongPress);
        div.addEventListener('mouseleave', clearLongPress);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteTurn(index);
        };
        div.appendChild(deleteBtn);

        historyDiv.appendChild(div);
    });
    
    historyDiv.scrollTop = historyDiv.scrollHeight;
}

// --- 批量删除相关函数 ---

function updateSelectionUI() {
    const selectionControls = document.getElementById('selection-controls');
    const controlsBar = document.querySelector('.controls-bar');
    const selectionCounter = document.getElementById('selection-counter');

    if (isInSelectionMode) {
        selectionControls.style.display = 'flex';
        controlsBar.style.display = 'none';
        selectionCounter.textContent = `已选中 ${selectedMessages.size} 条消息`; 
    } else {
        selectionControls.style.display = 'none';
        controlsBar.style.display = 'flex';
        // 退出选择模式时，selectedMessages 应该已经被清空了
    }
}


// --- MODIFIED --- 这是最核心的修改，实现点击不重刷
function toggleMessageSelection(index) {
    // 如果是第一次点击，则进入选择模式并更新UI
    if (!isInSelectionMode) {
        isInSelectionMode = true;
        updateSelectionUI();
    }
    
    // 获取对应的DOM元素
    const historyDiv = document.getElementById('chat-history');
    const allMessages = historyDiv.querySelectorAll('.message');
    const messageDiv = allMessages[index];

    // 更新数据和UI
    if (selectedMessages.has(index)) {
        selectedMessages.delete(index);
        if (messageDiv) messageDiv.classList.remove('selected');
    } else {
        selectedMessages.add(index);
        if (messageDiv) messageDiv.classList.add('selected');
    }
    
    // 如果没有选中的了，就退出选择模式
    if (selectedMessages.size === 0) {
        isInSelectionMode = false;
    }

    // 再次调用以更新计数器 或 隐藏/显示控制栏
    updateSelectionUI();
}


function deleteSelectedMessages() {
    if (selectedMessages.size === 0) return;
    if (!confirm(`确定要永久删除选中的 ${selectedMessages.size} 条消息吗？`)) {
        return;
    }

    // 从 chatHistory 数组中过滤掉被选中的项
    chatHistory = chatHistory.filter((_, index) => !selectedMessages.has(index));
    
    // 重置状态
    isInSelectionMode = false;
    selectedMessages.clear(); 
    
    // 更新UI（隐藏选择控件）
    updateSelectionUI();
    // 保存
    saveHistoryToLocal();
    // 因为数据变了，所以这里必须重绘
    renderChat();
}

// --- MODIFIED --- “取消”按钮也不再重刷界面
function cancelSelection() {
    isInSelectionMode = false;
    
    // 清除数据
    selectedMessages.clear();
    
    // 只移除视觉样式，不重绘
    document.querySelectorAll('#chat-history .message.selected').forEach(el => {
        el.classList.remove('selected');
    });

    // 更新UI（隐藏选择控件）
    updateSelectionUI();
}

// --- 核心功能函数 ---

function deleteTurn(index) {
    if (!confirm("确定要删除这条消息吗？记录将无法恢复。")) {
        return;
    }
    chatHistory.splice(index, 1); 
    saveHistoryToLocal();
    renderChat();
}

async function sendChat(overrideText = null) {
    const input = document.getElementById('user-input');
    const text = overrideText || input.value.trim();
    if (!text) return;

    if (!overrideText) {
        input.value = '';
        chatHistory.push({ role: "user", content: text });
        saveHistoryToLocal();
        renderChat();
    }
    
    const artifactName = document.getElementById('artifact-name').value;
    const historyDiv = document.getElementById('chat-history');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai';
    loadingDiv.id = 'temp-loading';

    // ✨ 修改：从翻译字典中获取“思考中”的文本
    loadingDiv.innerText = translations[currentLang].thinking;

    historyDiv.appendChild(loadingDiv);
    historyDiv.scrollTop = historyDiv.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                history: chatHistory,
                artifact_name: artifactName,
                language: currentLang
            })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.detail || data.answer || `HTTP ${response.status}`);
        }

        const aiText = data.answer;
        document.getElementById('temp-loading').remove();
        chatHistory.push({ role: "assistant", content: aiText });
        saveHistoryToLocal();
        renderChat();
        speak(aiText);

    } catch (error) {
        console.error('Chat error:', error);
        const loadingElement = document.getElementById('temp-loading');
        if (loadingElement) {
            loadingElement.innerText = error?.message || translations[currentLang].connectionError;
        }
    }
}
// ✨ 新增：翻译对话历史的函数
async function translateChatHistory(targetLang) {
    if (chatHistory.length === 0) {
        return; // 如果没有对话，无需翻译
    }

    // 显示翻译中的提示
    const historyDiv = document.getElementById('chat-history');
    const originalHTML = historyDiv.innerHTML;
    const translatingDiv = document.createElement('div');
    translatingDiv.className = 'message system-msg';
    translatingDiv.id = 'translating-msg';
    translatingDiv.innerText = `翻译中... (Translating to ${translations[targetLang]?.headerTitle || targetLang})`;
    historyDiv.appendChild(translatingDiv);
    historyDiv.scrollTop = historyDiv.scrollHeight;

    try {
        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: chatHistory,
                target_lang: targetLang
            })
        });

        const rawText = await response.text();
        let data = {};
        try {
            data = rawText ? JSON.parse(rawText) : {};
        } catch {
            throw new Error(rawText || `HTTP ${response.status}`);
        }

        if (!response.ok) {
            throw new Error(data.detail || data.error || rawText || `HTTP ${response.status}`);
        }

        // 移除翻译提示
        const translatingMsg = document.getElementById('translating-msg');
        if (translatingMsg) translatingMsg.remove();

        // 更新 chatHistory 为翻译后的版本
        if (data.translated_messages && data.translated_messages.length > 0) {
            chatHistory = data.translated_messages;
            saveHistoryToLocal();
            renderChat();
        }
    } catch (error) {
        console.error('Translation error:', error);
        const translatingMsg = document.getElementById('translating-msg');
        if (translatingMsg) {
            translatingMsg.innerText = '翻译失败，保持原语言。';
        }
    }
}
function speak(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const speechLangMap = {
        zh: 'zh-CN',
        en: 'en-US',
        de: 'de-DE',
        ja: 'ja-JP'
    };
    utterance.lang = speechLangMap[currentLang] || 'en-US';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
}

function undoLast() {
    if (chatHistory.length >= 2) {
        chatHistory.pop(); 
        chatHistory.pop();
    } else if (chatHistory.length === 1) {
        chatHistory.pop();
    }
    saveHistoryToLocal();
    renderChat();
}

function clearAll() {
    chatHistory = [];
    saveHistoryToLocal();
    renderChat();
}

function retryLast() {
    if (chatHistory.length === 0) return;
    const lastMsg = chatHistory[chatHistory.length - 1];
    
    let userMsg;
    if (lastMsg.role === 'assistant') {
        chatHistory.pop(); // remove assistant message
        userMsg = chatHistory.pop(); // remove user message
    } else if (lastMsg.role === 'user') {
        userMsg = chatHistory.pop();
    }

    if (userMsg) {
        // 将用户消息放回历史记录，以便 sendChat 正确发送
        chatHistory.push(userMsg);
        saveHistoryToLocal();
        renderChat(); // 刷新界面，显示正在重试的消息
        sendChat(userMsg.content); // 使用 overrideText 模式发送
    }
}


// --- 安全清空逻辑 ---
function showClearModal() {
    const modal = document.getElementById('clear-modal');
    const input = document.getElementById('verify-input');
    modal.style.display = 'flex';
    input.value = '';
    input.focus();
}

function verifyAndClear() {
    const input = document.getElementById('verify-input').value;
    const confirmText = translations[currentLang].clearModalConfirmText;
    if (input === confirmText) {
        clearAll();
        closeClearModal();
    } else {
        alert(`${translations[currentLang].modalConfirm}失败！请输入：${confirmText}`);
    }
}

function closeClearModal() {
    document.getElementById('clear-modal').style.display = 'none';
}

// --- 保存聊天记录 ---
function saveChatHistory() {
    if (chatHistory.length === 0) {
        alert("还没有聊天记录，无法保存哦！");
        return;
    }
    const artifactName = document.getElementById('artifact-name').value;
    const time = new Date().toLocaleString();
    let content = `🏛️ 博物馆奇妙夜 · 对话存档\n`;
    content += `文物身份：${artifactName}\n`;
    content += `存档时间：${time}\n`;
    content += `------------------------------------\n\n`;
    chatHistory.forEach(msg => {
        const roleName = msg.role === 'user' ? '【我】' : `【${artifactName}】`;
        content += `${roleName}：\n${msg.content}\n\n`;
    });
    content += `------------------------------------\n(由 AI 数字博物馆生成)\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifactName}_对话记录_${Date.now()}.txt`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// --- 本地存储功能 ---
function saveHistoryToLocal() {
    try {
        localStorage.setItem('museumChatHistory', JSON.stringify(chatHistory));
    } catch (e) {
        console.error("无法保存对话记录到浏览器。", e);
    }
}

function loadHistoryFromLocal() {
    try {
        const savedHistory = localStorage.getItem('museumChatHistory');
        if (savedHistory) {
            chatHistory = JSON.parse(savedHistory);
        }
    } catch (e) {
        console.error("无法从浏览器加载对话记录。", e);
        chatHistory = [];
    }
}

// 全局变量
window.currentAiPersona = 'scholar'; 

// ================= 合并后的初始化 =================
document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化 3D 环境
    if (typeof init3D === 'function') {
        init3D(); 
        loadModel('2.glb');
        animate();
    }

    // 2. 处理 URL 传来的角色设定
    const params = new URLSearchParams(window.location.search);
    window.currentAiPersona = params.get('role') || 'scholar';
    
    const greetings = {
        child: "哇！你终于来看我啦！我肚子里装了好多好玩的故事，你想先听哪一个呀？",
        student: "阁下有礼了。相见即是缘，咱们一同探讨探讨这器物背后的奥秘如何？",
        storyteller: "惊堂木一拍，咱们话接上回！这位看官，您想听点宫廷秘闻呢，还是江湖传说？",
        scholar: "您好。此器历经沧桑。若有关于其形制、纹饰或年代断代的学术探讨，但问无妨。"
    };
    const greetingMsg = document.getElementById('dynamic-greeting');
    if (greetingMsg) greetingMsg.innerText = greetings[window.currentAiPersona];

    // 3. 对话与历史记录加载
    loadHistoryFromLocal();
    renderChat(); 

    // 4. 语言选择逻辑 (已完美修复)
    const langSelect = document.getElementById('lang-select');
    
    // 1. 读取时统一使用 'app_language'，和其它页面保持一致
    const savedLang = localStorage.getItem('app_language') || 'zh'; 
    if (savedLang && langSelect.querySelector(`[value=${savedLang}]`)) {
        langSelect.value = savedLang;
        updateUIText(savedLang);
    }
    
    langSelect.addEventListener('change', () => {
        const newLang = langSelect.value;
        
        // 2. 写入时统一使用 'app_language'
        localStorage.setItem('app_language', newLang);
        updateUIText(newLang);
        
        // 3. 修复了变量名错误 (原本错写成了 chatHistoryData)
        chatHistory.length > 0 ? translateChatHistory(newLang) : renderChat(); 
    });

    // 5. 按钮事件绑定
    document.getElementById('send-btn').addEventListener('click', sendChat);
    document.getElementById('user-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChat(); });
    document.getElementById('undo-btn').addEventListener('click', undoLast);
    document.getElementById('retry-btn').addEventListener('click', retryLast);
    document.getElementById('save-btn').addEventListener('click', saveChatHistory);
    document.getElementById('clear-btn').addEventListener('click', showClearModal);
    document.getElementById('confirm-clear').addEventListener('click', verifyAndClear);
    document.getElementById('cancel-clear').addEventListener('click', closeClearModal);

    // 6. ★ 长按显示选择栏逻辑 ★
    const chatPanel = document.getElementById('chat-history');
    const selectionControls = document.getElementById('selection-controls');
    let longPressTimer;

    chatPanel.addEventListener('touchstart', () => {
        longPressTimer = setTimeout(() => {
            selectionControls.style.setProperty('display', 'flex', 'important');
            if (navigator.vibrate) navigator.vibrate(50); // 震动反馈
        }, 800); // 800毫秒判定为长按
    });

    chatPanel.addEventListener('touchend', () => clearTimeout(longPressTimer));
    chatPanel.addEventListener('touchmove', () => clearTimeout(longPressTimer));

    document.getElementById('cancel-selection-btn').addEventListener('click', () => {
        selectionControls.style.setProperty('display', 'none', 'important');
    });
});
// 获取元素
const infoBtn = document.getElementById('infoBtn');
const infoModal = document.getElementById('infoModal');
const closeInfo = document.getElementById('closeInfo');

// 点击小圆球打开弹窗
if (infoBtn) {
    infoBtn.onclick = (e) => {
        e.stopPropagation();
        if (infoModal) infoModal.style.display = 'flex';
    };
}

if (closeInfo && infoModal) {
    closeInfo.onclick = () => {
        infoModal.style.display = 'none';
    };
}

if (infoModal) {
    infoModal.onclick = (e) => {
        if (e.target === infoModal) {
            infoModal.style.display = 'none';
        }
    };
}
