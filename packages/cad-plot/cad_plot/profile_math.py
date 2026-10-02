"""Profile grade line evaluation — mirrors pglAt() in spatial-engine/src/site-plan/street-profile.ts."""


def pgl_at(pvis, s):
    for i in range(1, len(pvis) - 1):
        v = pvis[i]
        L = v.get('vcLengthFt') or 0
        if L > 0 and v['sta'] - L / 2 <= s <= v['sta'] + L / 2:
            g1 = (v.get('gradeInPct') or 0) / 100; g2 = (v.get('gradeOutPct') or 0) / 100
            x = s - (v['sta'] - L / 2)
            return v['elev'] - g1 * L / 2 + g1 * x + (g2 - g1) / (2 * L) * x * x
    i = 0
    while i < len(pvis) - 2 and pvis[i + 1]['sta'] < s:
        i += 1
    a, b = pvis[i], pvis[i + 1]
    return a['elev'] + (b['elev'] - a['elev']) * (s - a['sta']) / ((b['sta'] - a['sta']) or 1)
