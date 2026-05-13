from http.server import BaseHTTPRequestHandler

try:
    from api._mimo import BASE_URL, MODEL_NAME, API_KEY, build_chat_messages, extract_message_content, parse_json_text, post_mimo, read_json_body, write_json, write_no_content
except ImportError:
    from _mimo import BASE_URL, MODEL_NAME, API_KEY, build_chat_messages, extract_message_content, parse_json_text, post_mimo, read_json_body, write_json, write_no_content


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        write_no_content(self)

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"Server is running. Use POST /api/chat")

    def do_POST(self):
        if not API_KEY:
            write_json(self, 500, {"answer": "服务器未配置 XIAOMI_KEY"})
            return
    
        try:
            data = read_json_body(self)
        except Exception:
            write_json(self, 400, {"answer": "无效的 JSON 请求体"})
            return

        history = data.get("history", [])
        artifact_name = data.get("artifact_name", "Ancient Bronze Vessel")
        lang_code = data.get("language", "en")
        role_key = data.get("role", "storyteller")

        try:
            messages = build_chat_messages(history, artifact_name, lang_code, role_key)
            status, text = post_mimo(messages, temperature=0.8, max_tokens=800, timeout=60)
        except Exception as e:
            write_json(self, 500, {"answer": f"请求小米 API 失败: {str(e)}"})
            return

        if 200 <= status < 300:
            try:
                payload = parse_json_text(text)
                answer = extract_message_content(payload)
            except Exception:
                answer = text or "没有返回内容"
            write_json(self, 200, {"answer": answer})
            return

        write_json(self, 500, {
            "answer": f"小米 API 响应异常: {status}",
            "detail": text,
            "base_url": BASE_URL,
            "model": MODEL_NAME,
        })
if __name__ == "__main__":
    from http.server import HTTPServer
    server = HTTPServer(("localhost", 8000), handler)
    print("Server running at http://localhost:8000")
    server.serve_forever()
