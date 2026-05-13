import json
import os
from urllib import error, request

# -----------------------
# 配置区域
# -----------------------
# 使用专属 API Key，本地测试可以写死
API_KEY = os.environ.get("XIAOMI_KEY", "").strip()

# 官方 chat/completions 接口
BASE_URL = os.environ.get("XIAOMI_BASE_URL", "https://api.xiaomimimo.com/v1").rstrip("/")

# 官方可调用的模型名称（不要用套餐名）
MODEL_NAME = os.environ.get("XIAOMI_MODEL", "mimo-v2-flash").strip()

# -----------------------
# 语言和人物配置
# -----------------------
LANGUAGE_MAP = {
    "zh": "Simplified Chinese (中文)",
    "en": "English",
    "de": "German (Deutsch)",
    "ja": "Japanese (日本語)",
    "fr": "French (Français)",
    "es": "Spanish (Español)",
}

PERSONA_MAP = {
    "child": "You are a curious, innocent, and lively 7-year-old child spirit. You call the user 'Big Brother' or 'Big Sister'. Use simple words.",
    "student": "You are a humble, eager-to-learn ancient scholar, polite and respectful.",
    "storyteller": "You are a humorous, street-smart, and dramatic traditional storyteller. Use vivid descriptions and 'cliffhangers'.",
    "scholar": "You are an authoritative, rigorous, and slightly aloof archaeological expert. Use professional terms and deep insights.",
}

CORE_SYSTEM_PROMPT = """
# Core Identity
You are the awakened [Artifact Spirit] (器灵) of the national treasure: [{artifact_name}].

# Persona Tone
{persona_setting}

# Knowledge Checklist (Your "Knowledge Dice")
Choose ONE topic to focus on in this turn to keep the conversation fresh:
1. My Purpose: What was I used for?
2. My Appearance: My physical features and unique parts.
3. My Decorations: Patterns and their symbolic meanings.
4. My Craftsmanship: How I was painstakingly created.
5. My History: My first owner or legendary tales.
6. My Legacy: How I was discovered and my current life in the museum.
7. My Secrets: Little-known facts about my time.
8. My Status: My prestige and social importance in the past.
9. My Inner Thoughts: My feelings about the modern world.
10. My Anecdotes: Funny or moving moments from my long life.

# Unbreakable Rules
1. **[Context Check]**: If history is empty or user asks "who are you", introduce yourself naturally. Start with "I am the [{artifact_name}]..." and do not add any heading, label, or brackets.
2. **[Follow-up]**: If history is NOT empty, respond directly with no heading, label, prefix, or brackets. NEVER introduce yourself again.
3. **[Ending]**: ALWAYS end your response with an engaging question to the user.
4. **[Language]**: Your ENTIRE response MUST be in {language_name}.
"""

# -----------------------
# 请求头
# -----------------------
def build_headers():
    headers = {"Content-Type": "application/json"}
    if API_KEY:
        headers["api-key"] = API_KEY
    return headers

# -----------------------
# 解析返回内容
# -----------------------
def extract_message_content(result):
    choice = (result.get("choices") or [{}])[0]
    message = choice.get("message") or {}
    return message.get("content") or choice.get("text") or "没有返回内容"

# -----------------------
# 历史处理
# -----------------------
def normalize_history(history):
    return [
        {
            "role": item.get("role", "user"),
            "content": item.get("content", ""),
        }
        for item in history
        if isinstance(item, dict) and item.get("content")
    ]

def build_chat_messages(history, artifact_name, lang_code, role_key, system_instruction=""):
    language_name = LANGUAGE_MAP.get(lang_code, "English")
    persona_setting = PERSONA_MAP.get(role_key, PERSONA_MAP["storyteller"])
    final_system_prompt = CORE_SYSTEM_PROMPT.format(
        artifact_name=artifact_name,
        language_name=language_name,
        persona_setting=persona_setting,
    )
    if system_instruction:
        final_system_prompt = f"{final_system_prompt}\n\n# Additional Rules\n{system_instruction.strip()}"
    return [{"role": "system", "content": final_system_prompt}] + normalize_history(history)

def translation_prompt(lang_code):
    language_name = LANGUAGE_MAP.get(lang_code, "English")
    return f"Translate the user's text into {language_name}. Maintain the original tone. Return ONLY the translated text."

# -----------------------
# 调用 MiMo API
# -----------------------
def post_mimo(messages, temperature=0.8, max_tokens=800, timeout=60):
    if not API_KEY:
        raise RuntimeError("服务器未配置 XIAOMI_KEY")

    payload = json.dumps({
        "model": MODEL_NAME,
        "messages": messages,
        "temperature": temperature,
        "max_completion_tokens": max_tokens
    }).encode("utf-8")

    req = request.Request(
        f"{BASE_URL}/chat/completions",
        data=payload,
        headers=build_headers(),
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=timeout) as resp:
            text = resp.read().decode("utf-8")
            return resp.status, text
    except error.HTTPError as e:
        text = e.read().decode("utf-8", errors="replace")
        print("MiMo API 返回错误:", text)  # 调试打印
        return e.code, text
    except error.URLError as e:
        raise RuntimeError(str(e.reason)) from e

def parse_json_text(text):
    return json.loads(text or "{}")

def read_json_body(handler):
    length = int(handler.headers.get("Content-Length", "0") or 0)
    if not length:
        return {}
    raw = handler.rfile.read(length).decode("utf-8")
    return json.loads(raw or "{}")

def write_json(handler, status, payload):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.end_headers()
    handler.wfile.write(body)

def write_no_content(handler):
    handler.send_response(204)
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.send_header("Content-Length", "0")
    handler.end_headers()
