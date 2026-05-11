import os

# 读取原始文件
file_path = "wawa.html"
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 找到开始行号（"// 弹窗相关逻辑重写"所在的行）
start_line_index = None
for i, line in enumerate(lines):
    if '// 弹窗相关逻辑重写，加入了当前语言 currentLang 的判断' in line:
        start_line_index = i
        break

if start_line_index is None:
    print("ERROR: 未找到开始标记")
    exit(1)

# 找到结束行号（</script>所在的行）
end_line_index = None
for i in range(len(lines) - 1, -1, -1):
    if '</script>' in lines[i]:
        end_line_index = i
        break

if end_line_index is None:
    print("ERROR: 未找到结束标记")
    exit(1)

# 新的代码内容
new_code_lines = [
    "// 弹窗相关逻辑重写，加入了当前语言 currentLang 的判断\n",
    "const infoBtn = document.getElementById('infoBtn');\n",
    "const infoBtnAction = document.getElementById('infoBtnAction');\n",
    "const infoModal = document.getElementById('infoModal');\n",
    "const closeInfo = document.getElementById('closeInfo');\n",
    "const infoTextContent = document.getElementById('infoTextContent');\n",
    "\n",
    "function openInfoModal(e) {\n",
    "    e.stopPropagation();\n",
    "    if (controls) controls.enabled = false;\n",
    "    const langData = ARTIFACT_INFO[currentLang] || ARTIFACT_INFO[\"zh\"];\n",
    "    if (langData[selectedModelPath]) {\n",
    "        infoTextContent.innerHTML = langData[selectedModelPath];\n",
    "    } else {\n",
    "        const fallbackMsg = {\n",
    "            \"zh\": \"暂无该文物的详细信息。\",\n",
    "            \"en\": \"No detailed information available for this artifact.\",\n",
    "            \"ja\": \"この文化財の詳細情報はありません。\",\n",
    "            \"de\": \"Keine detaillierten Informationen für dieses Artefakt verfügbar.\"\n",
    "        };\n",
    "        const msg = fallbackMsg[currentLang] || fallbackMsg[\"zh\"];\n",
    "        infoTextContent.innerHTML = `<p style='text-align:center; margin-top: 20px;'>${msg}</p>`;\n",
    "    }\n",
    "    infoModal.style.display = 'flex';\n",
    "}\n",
    "\n",
    "if (infoBtn) infoBtn.onclick = openInfoModal;\n",
    "if (infoBtnAction) infoBtnAction.onclick = openInfoModal;\n",
    "\n",
    "if (closeInfo) {\n",
    "    closeInfo.onclick = () => {\n",
    "        infoModal.style.display = 'none';\n",
    "        if (controls) controls.enabled = true;\n",
    "    };\n",
    "}\n",
    "\n",
    "if (infoModal) {\n",
    "    infoModal.onclick = (e) => {\n",
    "        if (e.target === infoModal) {\n",
    "            infoModal.style.display = 'none';\n",
    "            if (controls) controls.enabled = true;\n",
    "        }\n",
    "    };\n",
    "}\n",
    "\n",
    "window.addEventListener('load', setupKeyboardAdjustments);\n",
]

# 重组文件
new_lines = lines[:start_line_index] + new_code_lines + ["\n"] + lines[end_line_index:]

# 写入文件
with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("✅ 替换成功！")
print(f"开始行：{start_line_index}, 结束行：{end_line_index}")
