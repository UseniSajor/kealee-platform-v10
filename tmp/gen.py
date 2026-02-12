import os

base = os.path.join(os.getcwd(), 'apps', 'os-pm', 'app', '(dashboard)')
tmp = os.path.join(os.getcwd(), 'tmp', 'pages')

def write_file(rel, content):
    fp = os.path.join(base, rel.replace('/', os.sep))
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    with open(fp, 'w', encoding='utf-8', newline='
') as f:
        f.write(content)
    print(f'Created: {rel} ({len(content)} chars)')

# Map of file number to destination path
FILE_MAP = {
    1: 'punch-list/page.tsx',
    2: 'punch-list/[id]/page.tsx',
    3: 'safety/page.tsx',
    4: 'safety/incidents/page.tsx',
    5: 'safety/toolbox-talks/page.tsx',
    6: 'meetings/page.tsx',
    7: 'meetings/[id]/page.tsx',
    8: 'meetings/new/page.tsx',
}

for num, rel in FILE_MAP.items():
    src = os.path.join(tmp, f'f{num}.tsx')
    if os.path.exists(src):
        with open(src, 'r', encoding='utf-8') as f:
            content = f.read()
        write_file(rel, content)
    else:
        print(f'MISSING: {src}')
