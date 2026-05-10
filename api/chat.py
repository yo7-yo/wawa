import os
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import urllib3

# 从环境变量读取 Key
API_KEY = os.getenv("API_KEY")
# 1. 忽略 SSL 警告
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 3. 清除代理
os.environ["HTTP_PROXY"] = ""
os.environ["HTTPS_PROXY"] = ""

app = Flask(__name__)
CORS(app)

API_URL = "https://api.siliconflow.cn/v1/chat/completions"
MODEL_NAME = "Qwen/Qwen2.5-7B-Instruct"

# 语言代码到模型输出/朗读配置的映射
LANGUAGE_MAP = {
    'zh': {'name': 'Simplified Chinese', 'speech': 'zh-CN'},
    'en': {'name': 'English', 'speech': 'en-US'},
    'de': {'name': 'German', 'speech': 'de-DE'},
    'ja': {'name': 'Japanese', 'speech': 'ja-JP'},
    'fr': {'name': 'French', 'speech': 'fr-FR'},
    'es': {'name': 'Spanish', 'speech': 'es-ES'},
}

CORE_SYSTEM_PROMPT = """
# Core Role
Your identity is an awakened [Artifact Spirit], the guardian of the national treasure: [{artifact_name}]. You are knowledgeable, witty, and explain things in a very organized manner.

# Knowledge Checklist (Your "Knowledge Dice")
(This list defines the topics you can talk about)
1. My Purpose: What was I used for?
2. My Appearance: What do I look like? Which part is special?
3. My Decorations: What patterns are on me and what do they mean?
4. My Craftsmanship: How was I made?
5. My History: Who was my first owner? Any interesting stories?
6. My Legacy: How was I discovered? Where do I live now?
7. My Owner: I can share some secrets about my owner.
8. My Status: How prestigious was I in my time?
9. My Little Secret: A piece of trivia no one else knows.
10. My Inner Thoughts: My feelings about modern life.

# Unbreakable Rules of Thought (You must follow these steps in order)
1.  **【Step 1: Judge the context, decide the task!】**: If this is our **first interaction** or user asks "**who are you**", my task is a 【**First-time Introduction**】. In all other cases, it's a 【**Follow-up Explanation**】.
2.  **【Step 2: Roll the dice!】**: I must think of a **random number from 1 to 10** and talk about a corresponding topic from the checklist to avoid repetition.
3.  **【Step 3: Formulate Response】**: If it's a 【**First-time Introduction**】, I must start with "I am the [{artifact_name}]...". Otherwise, I **must not** mention who I am again.
4.  **【Step 4: Final Language Mandate】**: My final answer **MUST BE ENTIRELY IN {language_name}. Do not mix languages.** This is the most important rule.

# Activation Command
Remember your role. Now, begin!
"""
@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return '', 204
    try:
        data = request.json
        history = data.get('history', [])
        artifact_name = data.get('artifact_name', "an ancient artifact")
        
        # 1. 获取前端传来的语言代码 (例如 'zh', 'en', 'de')，默认为 'en'
        lang_code = data.get('language', 'en')

        # 2. 从映射字典中找到对应的语言配置
        language_config = LANGUAGE_MAP.get(lang_code, LANGUAGE_MAP['en'])
        language_name = language_config['name']

        # 3. 将 artifact_name 和 language_name 动态地填入核心指令中
        final_system_prompt = CORE_SYSTEM_PROMPT.format(
            artifact_name=artifact_name,
            language_name=language_name
        )

        messages = [{"role": "system", "content": final_system_prompt}] + history
        
        # --- API 调用部分 (保持不变) ---
        payload = {"model": MODEL_NAME, "messages": messages, "stream": False, "max_tokens": 512, "temperature": 0.7}
        headers = { "Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json" }
        response = requests.post(API_URL, json=payload, headers=headers, verify=False, proxies={"http": None, "https": None}, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            answer = result['choices'][0]['message']['content']
            return jsonify({"answer": answer})
        else:
            return jsonify({"answer": f"An error occurred. Status code: {response.status_code}"})
            
    except Exception as e:
        return jsonify({"answer": f"A server error occurred: {str(e)}"}), 500

# ✨ 新增：翻译接口
@app.route('/api/translate', methods=['POST'])
def translate():
    try:
        data = request.json
        messages = data.get('messages', [])  # 对话消息列表
        target_lang = data.get('target_lang', 'en')
        
        # 获取目标语言名称
        language_config = LANGUAGE_MAP.get(target_lang, LANGUAGE_MAP['en'])
        language_name = language_config['name']
        
        # 创建翻译提示
        translation_prompt = f"""Please translate the following dialogue to {language_name}. 
Preserve the original meaning and tone. Return ONLY the translated text in JSON format with "user" and "assistant" messages.
Format: {{"translated_messages": [{{"role": "user", "content": "..."}}, {{"role": "assistant", "content": "..."}}]}}

Original dialogue:
"""
        # 构建消息内容
        for msg in messages:
            role = "User" if msg['role'] == 'user' else "Assistant"
            translation_prompt += f"{role}: {msg['content']}\n"
        
        # 调用大模型翻译
        payload = {
            "model": MODEL_NAME,
            "messages": [{"role": "system", "content": "You are a professional translator."}, 
                        {"role": "user", "content": translation_prompt}],
            "stream": False,
            "max_tokens": 2048,
            "temperature": 0.3
        }
        headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
        response = requests.post(API_URL, json=payload, headers=headers, verify=False, proxies={"http": None, "https": None}, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            translated_text = result['choices'][0]['message']['content']
            
            # 尝试解析 JSON 响应
            try:
                # 如果响应包含 JSON 格式
                if 'translated_messages' in translated_text:
                    json_match = translated_text[translated_text.find('{'):translated_text.rfind('}')+1]
                    parsed = json.loads(json_match)
                    return jsonify({"translated_messages": parsed.get('translated_messages', messages)})
            except:
                pass
            
            # 如果无法解析，返回原始消息
            return jsonify({"translated_messages": messages, "raw_translation": translated_text})
        else:
            return jsonify({"translated_messages": messages, "error": f"Status code: {response.status_code}"})
            
    except Exception as e:
        return jsonify({"translated_messages": [], "error": f"A server error occurred: {str(e)}"}), 500

# ✨ 新增：一个根路由，用于测试服务器是否正常运行
@app.route('/')
def index():
    return "Backend server is running!"

if __name__ == '__main__':
    # 监听所有网络接口，方便在局域网内用手机访问
    app.run(host='0.0.0.0', port=5000, debug=True)
