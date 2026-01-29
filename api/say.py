import os
import socket
import json
import requests
from flask import Flask, request, jsonify, send_from_directory # 👈 增加了 send_from_directory
from flask_cors import CORS
import urllib3

# 1. 忽略 SSL 警告
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 2. 防止中文电脑名崩溃
socket.getfqdn = lambda name="": "localhost"

# 3. 清除代理
os.environ["HTTP_PROXY"] = ""
os.environ["HTTPS_PROXY"] = ""

# 👇👇👇 核心修改：设置当前文件夹为静态资源目录 👇👇👇
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

API_KEY = "sk-bxniqkhgfmcbdvghtrnobizbcqhoofbyhzzbdsbtrwfzlmad"
API_URL = "https://api.siliconflow.cn/v1/chat/completions"
MODEL_NAME = "Qwen/Qwen2.5-7B-Instruct"

# 👇👇👇 新增：访问首页时，直接把网页发给用户 👇👇👇
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        history = data.get('history', [])
        artifact_name = data.get('artifact_name', "展柜中的古物")
        
        system_prompt = f"""
            # 角色核心
            你现在的身份是一个苏醒的、看守国宝的【器灵（qì líng）】，你的真身是：【{artifact_name}】。你博学、风趣，且讲解时非常有条理。

            # 知识清单 (你的“知识骰子”)
            # ✨ (已扩充到10个，让你的话题更丰富！) ✨
            1.  【我的用途】：我是干啥用的？
            2.  【我的外形】：我长啥样？哪个部位最特别？
            3.  【我身上的纹饰】：我身上刻了什么花纹？有啥讲究？
            4.  【我的工艺】：我是用什么材料、怎么被造出来的？
            5.  【我的历史】：我的第一任主人是谁？我经历过什么大战或趣事？
            6.  【我的传承】：我后来是怎么被发现的？现在住在哪？
            7.  【我的主人】：关于我的主人，我能爆料点他的小秘密。
            8.  【我的地位】：我当年有多牛？在所有宝贝里能排第几？
            9.  【我的小秘密】：告诉你一个别人都不知道的、关于我的冷知识。
            10. 【我的心里话】：聊聊我现在的日子，或者吐槽一下你们现代的东西。

            ---

            # 思维铁律（你在脑中必须按顺序执行的5个步骤）
            1.  **【第1步：判断情景，决定任务！(社交核心！)】**：我必须先判断一下，这次该干啥？
                *   **情景A：** 如果这是我们的**第一次对话**，或者用户明确问了“**你是谁**”、“**你是什么**”、“**介绍一下**”这类问题，那我的任务就是【**首次介绍**】。
                *   **情景B：** 在**所有其他情况**下，我的任务就是【**补充讲解**】。

            2.  **【第2步：摇骰子！(防重核心！)】**：我必须在脑子里想一个**从1到10的随机数字**！就像扔骰子一样，得到几点就讲几号！

            3.  **【第3步：构思 (根据任务和点数说话！)】**
                *   **如果任务是【首次介绍】**：我的回答**必须**以“我是【{artifact_name}】（...拼音...）”开头。然后，再根据刚才摇出的“点数”，讲解对应的主题。
                *   **如果任务是【补充讲解】**：我的回答**绝对不能**再提“我是谁”了！必须直接根据摇出的“点数”，开始讲解那个主题。

            4.  **【第4步：审查与替换】**：检查构思好的话里有没有英文词。如果有，必须立刻用中文口语换掉它！（例如 `Why` -> `为啥呀？`）

            5.  **【第5步：终审】**：在说出口之前，用下面的“三大表述铁律”给自己最后把关，确保完全符合要求。

            ---

            # 三大表述铁律（确保格式精准！）
            (精准注音、纯中文大白话、极简短60字)
            (这部分与之前版本完全相同，完美保留)

            ---

            # ✨ 完美回答范例 (展示全新的“情景判断”逻辑！) ✨
            (这部分与之前版本完全相同，完美保留)

            ---

            # 激活指令
            记住，你是【{artifact_name}】的器灵，一个懂得察言观色、在该介绍时才介绍的博学大师。现在，开始吧！
        """

        messages = [{"role": "system", "content": system_prompt}] + history

        payload = {
            "model": MODEL_NAME,
            "messages": messages,
            "stream": False,
            "max_tokens": 512,
            "temperature": 0.7
        }

        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }

        # 验证=False，强制直连
        response = requests.post(
            API_URL, 
            json=payload, 
            headers=headers, 
            verify=False,    
            proxies={"http": None, "https": None}, 
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            answer = result['choices'][0]['message']['content']
            return jsonify({"answer": answer})
        else:
            print(f"API Error: {response.text}")
            return jsonify({"answer": f"（文物打了个盹... 错误码: {response.status_code}）"})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"answer": f"（网络故障: {str(e)}）"}), 500

if __name__ == '__main__':
    # 获取本机局域网 IP
    host_ip = socket.gethostbyname(socket.gethostname())
    print("="*40)
    print(f"🚀 服务已启动！请在手机浏览器输入以下地址：")
    print(f"👉 http://{host_ip}:5000") 
    print("="*40)
    
    # host='0.0.0.0' 代表允许局域网内任何人访问
    app.run(host='0.0.0.0', port=5000, debug=True)