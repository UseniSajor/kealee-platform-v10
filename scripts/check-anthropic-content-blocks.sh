#!/usr/bin/env bash
#
# Fails when source reads `content[0]` off an Anthropic response.
#
# On every current Claude model that this repo uses (claude-opus-5,
# claude-sonnet-5) extended thinking is ON BY DEFAULT, so response.content[0]
# is a THINKING block, not a text block. Code shaped like
#
#     const text = response.content[0].type === 'text' ? response.content[0].text : ''
#
# therefore evaluates to '' on every single call. It does not throw and the
# request returns HTTP 200, so the failure surfaces much later as a parse
# error — which is exactly how it stayed hidden here.
#
# Real cost of not having this check: the bug was found and fixed three
# separate times in one night, because each sweep only covered the directories
# someone had already thought to look in. It silently disabled DesignBot (and
# with it every customer concept delivery), ZoningBot, the spatial
# verification processor, capture vision, and several tools.
#
# The correct form finds the text block:
#
#     const text = response.content.find((b) => b.type === 'text')?.text ?? ''
#
# Tests that build their own message and assert on content[0] are legitimate
# and are excluded below.

set -uo pipefail
cd "$(dirname "$0")/.."

# Flag content[0] on anything that looks like an API response. This catches
# both shapes that bit us:
#
#   const text = response.content[0].type === 'text' ? response.content[0].text : ''
#   const block = message.content[0]          // then `if (block.type === 'text')`
#
# The second form is why an earlier, narrower version of this check reported
# clean while six services were still broken — the guard sat on the next line.
# Matching the receiver name instead of the access shape catches both.
HITS=$(grep -rnE "(response|message|msg|res|reply|completion|result)\??\.content\[0\]" \
        --include="*.ts" --include="*.tsx" \
        apps/ packages/ services/ 2>/dev/null \
      | grep -v node_modules \
      | grep -v "/\.next/" \
      | grep -v "\.d\.ts:" \
      | grep -vE "__tests__|\.test\.|\.spec\." \
      | grep -vE ":[0-9]+:[[:space:]]*(//|\*|/\*)" \
      || true)

if [ -n "$HITS" ]; then
  echo "ERROR: content[0] read as text on an Anthropic response."
  echo
  echo "$HITS" | sed 's/^/  /'
  echo
  echo "Thinking is on by default on claude-opus-5 / claude-sonnet-5, so"
  echo "content[0] is a thinking block and these silently produce ''."
  echo
  echo "Use instead:"
  echo "  const text = response.content.find((b) => b.type === 'text')?.text ?? ''"
  exit 1
fi

echo "OK: no content[0] text reads on Anthropic responses."
