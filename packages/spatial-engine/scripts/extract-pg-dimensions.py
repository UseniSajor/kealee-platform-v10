import re, html, json, urllib.request, time

BASE = "https://online.encodeplus.com/regs/princegeorgescounty-md/doc-view.aspx?secid="
SECTIONS = {633:"27-4201 Rural and Agricultural",634:"27-4202 Residential",
            635:"27-4203 Nonresidential",636:"27-4204 Transit-Oriented/Activity Center",
            637:"27-4205 Other Base Zones",638:"27-4300 Planned Development"}

def fetch(secid):
    req = urllib.request.Request(BASE+str(secid), headers={'User-Agent':'KealeePlatform/1.0 (contact@kealee.com)'})
    return urllib.request.urlopen(req, timeout=60).read().decode('utf-8','ignore')

def clean(x):
    return html.unescape(re.sub(r'\s+',' ',re.sub(r'<[^>]+>','',x))).strip()

def cells(row):
    return [clean(c) for c in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', row, re.S)]

out = {}
for secid, label in SECTIONS.items():
    t = fetch(secid); time.sleep(1)
    # Zone headings look like "27-4202(a) Residential Estate (RE) Zone" — capture code in parens
    tables = [(m.start(), m.group(0)) for m in re.finditer(r'<table[^>]*>.*?</table>', t, re.S)]
    # Zone headings are inline text like "(b) Residential Estate (RE) Zone",
    # not <h> tags. Anchor on the lettered subsection marker so we only match the
    # heading, never the many prose repetitions of the same zone name.
    zones = []
    seen = set()
    # Zone code appears as "(RE) Zone" but tags may sit between the paren and
    # the word Zone, so tolerate markup. First occurrence is the heading.
    for m in re.finditer(r'\(([A-Z]{1,4}(?:-[A-Z0-9]{1,3}){0,3})\)(?:\s|<[^>]+>)*Zone', t):
        code = m.group(1)
        if code in seen: continue
        seen.add(code); zones.append((m.start(), code, code))
    entries = []
    for pos, tbl in tables:
        rows = [cells(r) for r in re.findall(r'<tr[^>]*>(.*?)</tr>', tbl, re.S)]
        rows = [r for r in rows if any(c for c in r)]
        if not rows or 'Intensity and Dimensional' not in ' '.join(rows[0]): continue
        zone = None
        for zpos, zcode, _ in zones:
            if zpos < pos: zone = zcode
        header = rows[1] if len(rows)>1 else []
        std = {}
        for r in rows[2:]:
            if not r or not r[0] or r[0].startswith('NOTES'): continue
            key = re.sub(r'^[❶❷❸❹❺\s]*','',r[0]).strip()
            std[key] = r[1:]
        notes = [' '.join(r) for r in rows if r and r[0].startswith('NOTES')]
        zname = next((n for p2,c,n in zones if c==zone), None)
        entries.append({'zone':zone,'zoneName':zname,'useColumns':header[1:] if header else [],
                        'standards':std,'notes':notes})
    out[str(secid)] = {'label':label,'entries':entries}
    print(f'secid {secid} ({label}): {len(entries)} dimensional tables, zones={[e["zone"] for e in entries]}')

json.dump(out, open('/tmp/pg_dimensions.json','w'), indent=1)
print('\nwrote /tmp/pg_dimensions.json')
