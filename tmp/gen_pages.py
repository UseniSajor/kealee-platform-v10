# Auto-generated page creator
# Reads content blocks from tmp/content.txt
import os

base = os.path.join(os.getcwd(), "apps", "os-pm", "app", "(dashboard)")

def W(rel, content):
    fp = os.path.join(base, *rel.split("/"))
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    with open(fp, "w", encoding="utf-8", newline="
") as f:
        f.write(content)
    print(f"Created: {rel} ({len(content)} chars)")

# Parse content blocks from content.txt
cpath = os.path.join(os.getcwd(), "tmp", "content.txt")
with open(cpath, "r", encoding="utf-8") as f:
    raw = f.read()

blocks = raw.split("===FILE===")
for block in blocks:
    block = block.strip()
    if not block:
        continue
    idx = block.index("
")
    rel = block[:idx].strip()
    content = block[idx+1:]
    W(rel, content)
