from http.server import BaseHTTPRequestHandler

from api._mimo import API_KEY, extract_message_content, parse_json_text, post_mimo, read_json_body, translation_prompt, write_json, write_no_content


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        write_no_content(self)

    def do_POST(self):
        if not API_KEY:
            write_json(self, 500, {"error": "服务器未配置 XIAOMI_KEY"})
            return

        try:
            data = read_json_body(self)
        except Exception:
            write_json(self, 400, {"error": "无效的 JSON 请求体"})
            return

        target_lang = data.get("target_lang", "en")
        messages = data.get("messages", [])
        text_to_translate = data.get("text", "")

        if messages:
            translated_messages = []
            for item in messages:
                if not isinstance(item, dict):
                    continue

                original_text = item.get("content", "")
                if not original_text:
                    continue

                payload_messages = [
                    {"role": "system", "content": translation_prompt(target_lang)},
                    {"role": "user", "content": original_text},
                ]

                try:
                    status, text = post_mimo(payload_messages, temperature=0.2, max_tokens=800, timeout=30)
                except Exception as e:
                    write_json(self, 500, {"error": f"请求小米 API 失败: {str(e)}"})
                    return

                if not 200 <= status < 300:
                    write_json(self, 500, {"error": "翻译失败", "detail": text})
                    return

                translated_messages.append({
                    "role": item.get("role", "user"),
                    "content": extract_message_content(parse_json_text(text)).strip(),
                })

            write_json(self, 200, {"translated_messages": translated_messages})
            return

        payload_messages = [
            {"role": "system", "content": translation_prompt(target_lang)},
            {"role": "user", "content": text_to_translate},
        ]

        try:
            status, text = post_mimo(payload_messages, temperature=0.2, max_tokens=800, timeout=30)
        except Exception as e:
            write_json(self, 500, {"error": f"请求小米 API 失败: {str(e)}"})
            return

        if 200 <= status < 300:
            write_json(self, 200, {"translated_text": extract_message_content(parse_json_text(text)).strip()})
            return

        write_json(self, 500, {"error": "翻译失败", "detail": text})
