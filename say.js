<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI文物探索</title>
    <link rel="stylesheet" href="say.css?v=20260513-1">

    <!-- 第二个界面：与模型对话 -->
     
    <!-- [依赖项]: Three.js 及相关模型解析库 -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r132/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.132.2/examples/js/loaders/GLTFLoader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.132.2/examples/js/controls/OrbitControls.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/meshoptimizer@0.17.0/meshopt_decoder.js"></script>
</head>
<body>
    <div id="app">

        <!-- ========================================== -->
        <!-- [分区 1]: 顶部状态与工具栏 -->
        <!-- ========================================== -->
        <header class="app-header">
            <div class="title-row">
                <h1>🏛️文物秘语</h1>
            </div>

            <div class="top-row">
                <select id="lang-select" class="secondary-btn">
                    <option value="zh">中文</option>
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                    <option value="ja">日本語</option>
                </select>

                <!-- 动态更新: 当前加载的文物名称 -->
                <input type="text" id="artifact-name" value="皿方罍" readonly>

                <button id="blind-box-btn" class="primary-btn blind-box-btn" onclick="window.location.href='wawa.html?lang=' + (localStorage.getItem('app_language') || 'zh')">
                    请君启藏
                </button>
            </div>
        </header>

        <!-- ========================================== -->
        <!-- [分区 2]: 核心业务 - 3D渲染区 -->
        <!-- ========================================== -->
        <!-- [重点]: Three.js 实例和 <canvas> 标签需挂载至此容器 -->
        <div id="canvas-container">
            <div id="loading-overlay">文物出库中...</div>
        </div>

        <!-- ========================================== -->
        <!-- [分区 3]: 核心业务 - AI对话交互区 -->
        <!-- ========================================== -->
        <div class="chat-panel">
            
            <!-- [重点]: 用户输入端 (对接发送逻辑) -->
            <div class="input-area">
                <input type="text" id="user-input" placeholder="请在此输入您的对话...">
                <button id="send-btn" class="primary-btn">发送</button>
            </div>

            <!-- [重点]: LLM 响应输出端 (DOM 节点动态插入位置) -->
            <div id="chat-history">
                <div class="message system-msg" id="dynamic-greeting">文物之灵苏醒中...</div>
            </div>

            <!-- 操作控制栏 -->
            <div class="controls-bar">
                <div class="action-buttons">
                    <button id="undo-btn" class="secondary-btn">↩️ 撤回</button>
                    <button id="retry-btn" class="secondary-btn">🔄 重试</button>
                    <button id="clear-btn" class="secondary-btn">🗑️ 清空</button>
                    <button id="save-btn" class="secondary-btn">💾 保存</button>
                </div>
            </div>

            <!-- 隐藏的批量操作栏 -->
            <div id="selection-controls" class="controls-bar" style="display: none !important;">
                <p id="selection-counter">已选中 0 组对话</p>
                <div class="action-buttons">
                    <button id="cancel-selection-btn" class="secondary-btn">❌ 取消</button>
                    <button id="delete-selected-btn" class="primary-btn" style="background: #a33;">🗑️ 删除</button>
                </div>
            </div>
        </div>

    </div>

    <!-- ========================================== -->
    <!-- [分区 4]: 全局模态框 -->
    <!-- ========================================== -->
    <div id="clear-modal" class="modal">
        <div class="modal-content">
            <h3>⚠️ 警告：记忆消除</h3>
            <p>您即将清空与文物的对话记录。</p>
            <input type="text" id="verify-input" placeholder="在此输入确认文字...">
            <div class="modal-buttons">
                <button id="cancel-clear" class="secondary-btn">取消</button>
                <button id="confirm-clear" class="primary-btn" style="background: #a33;">强制执行</button>
            </div>
        </div>
    </div>

    <!-- ========================================== -->
    <!-- [分区 5]: UI 交互脚本 -->
    <!-- ========================================== -->
    <script>
        /**
         * [重点]: 响应式布局自适应
         * 处理移动端/PC端下文物名称输入框(#artifact-name)的节点转移
         */
        function adjustArtifactNamePosition() {
            const artifactName = document.getElementById('artifact-name');
            const topRow = document.querySelector('.top-row'); 
            const controlsBar = document.querySelector('.controls-bar'); 
            
            if (!artifactName || !topRow || !controlsBar) return;

            if (window.innerWidth > 768) {
                // PC: 插入到底部控制栏
                if (artifactName.parentNode !== controlsBar) {
                    controlsBar.insertBefore(artifactName, controlsBar.firstChild);
                }
            } else {
                // Mobile: 插入到顶部导航栏
                if (artifactName.parentNode !== topRow) {
                    const blindBoxBtn = document.getElementById('blind-box-btn');
                    topRow.insertBefore(artifactName, blindBoxBtn);
                }
            }
        }

        window.addEventListener('DOMContentLoaded', adjustArtifactNamePosition);
        window.addEventListener('resize', adjustArtifactNamePosition);

        // 语言选择器
        const langSelect = document.getElementById('lang-select');
        if (langSelect) {
            langSelect.addEventListener('change', (e) => {
                const selectedLang = e.target.value;
                localStorage.setItem('app_language', selectedLang);
            });
        }

        // 初始化语言设置
        const initialLang = localStorage.getItem('app_language') || 'zh';
        if (langSelect) {
            langSelect.value = initialLang;
        }
    </script>

    <script src="say.js?v=20260513-1"></script>

    <!-- ========================================== -->
    <!-- [分区 6]: 3D 模型加载与渲染脚本 -->
    <!-- ========================================== -->
</body>
</html>
