import os
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import urllib3

# 1. 忽略 SSL 警告
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 3. 清除代理
os.environ["HTTP_PROXY"] = ""
os.environ["HTTPS_PROXY"] = ""

app = Flask(__name__)
CORS(app)

API_KEY = "sk-bxniqkhgfmcbdvghtrnobizbcqhoofbyhzzbdsbtrwfzlmad"
API_URL = "https://api.siliconflow.cn/v1/chat/completions"
MODEL_NAME = "Qwen/Qwen2.5-7B-Instruct"

# ✨ 新增：为英文 prompt 创建一个独立的、翻译好的字符串
# (This is the new English version of your detailed instructions for the AI)
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
4.  **【Step 4: Final Language Mandate】**: My final answer **MUST BE ENTIRELY IN {language_name}**. This is the most important rule.

# Activation Command
Remember your role. Now, begin!
"""

# 这是一个语言代码到语言全称的【映射字典】
LANGUAGE_MAP = {
    'zh': 'Chinese (中文)',
    'en': 'English',
    'de': 'German (Deutsch)',
    'ja': 'Japanese (日本語)',
    'fr': 'French (Français)',
    'es': 'Spanish (Español)',
    # 您可以在这里无限添加更多语言
}

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
        
        # 2. 从映射字典中找到对应的语言全名
        language_name = LANGUAGE_MAP.get(lang_code, 'English') # 如果没找到，默认用英语

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

# ✨ 新增：一个根路由，用于测试服务器是否正常运行
@app.route('/')
def index():
    return "Backend server is running!"

if __name__ == '__main__':
    # 监听所有网络接口，方便在局域网内用手机访问
    app.run(host='0.0.0.0', port=5000, debug=True)
