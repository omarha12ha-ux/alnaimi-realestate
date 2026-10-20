import re

with open('/app/applet/recovered_unminified_app.ts', 'rb') as f:
    raw_bytes = f.read()

raw_text = raw_bytes.decode('utf-8', errors='ignore')

def js_unescape(text):
    # Unescape unicode escapes: \uXXXX or \u{XXXX}
    text = re.sub(r'\\u\{([0-9a-fA-F]+)\}', lambda m: chr(int(m.group(1), 16)), text)
    text = re.sub(r'\\u([0-9a-fA-F]{4})', lambda m: chr(int(m.group(1), 16)), text)
    # Unescape other common escapes
    text = text.replace('\\n', '\n')
    text = text.replace('\\t', '\t')
    text = text.replace('\\r', '\r')
    text = text.replace('\\"', '"')
    text = text.replace("\\'", "'")
    text = text.replace('\\\\', '\\')
    return text

unescaped_text = js_unescape(raw_text)

with open('/app/applet/src/App_recovered.tsx', 'w', encoding='utf-8') as out:
    out.write(unescaped_text)

print(f"Successfully wrote unescaped file to /app/applet/src/App_recovered.tsx")
