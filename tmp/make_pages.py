import os

base = os.path.join(os.getcwd(), "apps", "os-pm", "app", "(dashboard)")

def W(rel, content):
    fp = os.path.join(base, *rel.split("/"))
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    with open(fp, "w", encoding="utf-8", newline="
") as f:
        f.write(content)
    print(f"Created: {rel} ({len(content)} chars)")

import base64

def WB(rel, b64):
    W(rel, base64.b64decode(b64).decode("utf-8"))

